import { describe, expect, it } from "vitest";

import {
  InsightValidationError,
  collectInputRefs,
  validateInsightOutput,
} from "../src/insights/validate";
import { REFS, evidence, makeInput, makeOutput } from "./fixtures";

const input = makeInput();

function run(outputJson: unknown): ReturnType<typeof validateInsightOutput> {
  return validateInsightOutput(JSON.stringify(outputJson), input);
}

describe("collectInputRefs", () => {
  it("collects every ref issued by the normalizer", () => {
    const refs = collectInputRefs(input);
    expect(refs.has(REFS.experience)).toBe(true);
    expect(refs.has(REFS.skill)).toBe(true);
    expect(refs.size).toBe(6);
  });
});

describe("stage: json", () => {
  it("rejects malformed JSON", () => {
    expect(() => validateInsightOutput("{ not json", input)).toThrowError(InsightValidationError);
    try {
      validateInsightOutput("{ not json", input);
    } catch (error) {
      expect((error as InsightValidationError).stage).toBe("json");
    }
  });

  it("rejects responses with no JSON object at all", () => {
    try {
      validateInsightOutput("I could not produce a report.", input);
      expect.unreachable();
    } catch (error) {
      expect((error as InsightValidationError).stage).toBe("json");
    }
  });

  it("extracts JSON wrapped in markdown fences", () => {
    const wrapped = "```json\n" + JSON.stringify(makeOutput()) + "\n```";
    const { output } = validateInsightOutput(wrapped, input);
    expect(output.strengthSignals.length).toBeGreaterThan(0);
  });
});

describe("stage: schema", () => {
  it("rejects structurally incomplete output", () => {
    const { executiveSummary: _dropped, ...incomplete } = makeOutput();
    try {
      run(incomplete);
      expect.unreachable();
    } catch (error) {
      expect((error as InsightValidationError).stage).toBe("schema");
      expect((error as Error).message).toContain("executiveSummary");
    }
  });

  it("rejects unknown confidence values instead of coercing", () => {
    const bad = makeOutput();
    (bad.executiveSummary as { confidence: string }).confidence = "very high";
    try {
      run(bad);
      expect.unreachable();
    } catch (error) {
      expect((error as InsightValidationError).stage).toBe("schema");
    }
  });

  it("rejects extra keys (strict objects)", () => {
    const bad = { ...makeOutput(), invented: true };
    expect(() => run(bad)).toThrowError(InsightValidationError);
  });
});

describe("stage: evidence", () => {
  it("drops unknown evidence refs and records a note", () => {
    const output = makeOutput();
    output.strengthSignals[0]!.evidence = evidence(REFS.experience, "experience:fabricated-job");
    const result = run(output);

    expect(result.output.strengthSignals[0]!.evidence).toHaveLength(1);
    expect(result.notes.some((note) => note.includes("fabricated-job"))).toBe(true);
  });

  it("removes a strength whose evidence is entirely unsupported", () => {
    const output = makeOutput();
    output.strengthSignals[1]!.evidence = evidence("project:does-not-exist");
    const result = run(output);

    expect(result.output.strengthSignals.map((signal) => signal.title)).toEqual([
      "Delivery Excellence",
    ]);
    expect(result.notes.some((note) => note.includes("Removed"))).toBe(true);
  });

  it("fails the run when every strength signal is unsupported", () => {
    const output = makeOutput();
    output.strengthSignals = output.strengthSignals.map((signal) => ({
      ...signal,
      evidence: evidence("skill:made-up"),
    }));

    try {
      run(output);
      expect.unreachable();
    } catch (error) {
      expect((error as InsightValidationError).stage).toBe("evidence");
    }
  });

  it("keeps blind spots without evidence but forces low confidence", () => {
    const output = makeOutput();
    output.blindSpots[0]!.evidence = [];
    output.blindSpots[0]!.confidence = "high";
    const result = run(output);

    expect(result.output.blindSpots).toHaveLength(1);
    expect(result.output.blindSpots[0]!.confidence).toBe("low");
  });

  it("removes trajectory stages without valid evidence and fails below 2 stages", () => {
    const output = makeOutput();
    output.careerTrajectory.stages[1]!.evidence = evidence("case-study:nope");

    try {
      run(output);
      expect.unreachable();
    } catch (error) {
      expect((error as InsightValidationError).stage).toBe("evidence");
      expect((error as Error).message).toContain("trajectory");
    }
  });
});

describe("confidence enforcement", () => {
  it("downgrades high confidence with a single supporting record", () => {
    const output = makeOutput();
    output.strengthSignals[1]!.confidence = "high"; // has exactly 1 evidence ref
    const result = run(output);

    expect(result.output.strengthSignals[1]!.confidence).toBe("medium");
    expect(result.notes.some((note) => note.includes("Downgraded"))).toBe(true);
  });

  it("forces low confidence when a statement loses all evidence", () => {
    const output = makeOutput();
    output.recruiterSimulation.recruiter.evidence = evidence("experience:gone");
    output.recruiterSimulation.recruiter.confidence = "high";
    const result = run(output);

    expect(result.output.recruiterSimulation.recruiter.confidence).toBe("low");
    expect(result.output.recruiterSimulation.recruiter.evidence).toHaveLength(0);
  });

  it("leaves justified confidence untouched", () => {
    const result = run(makeOutput());
    expect(result.output.strengthSignals[0]!.confidence).toBe("high"); // 2 refs
  });
});

describe("signal radar caps", () => {
  it("caps a score backed by one record at 40", () => {
    const output = makeOutput();
    output.signalRadar.technicalLeadership = { score: 90, evidence: evidence(REFS.experience) };
    const result = run(output);

    expect(result.output.signalRadar.technicalLeadership.score).toBe(40);
    expect(result.notes.some((note) => note.includes("Capped"))).toBe(true);
  });

  it("forces a score with no valid evidence to 0", () => {
    const output = makeOutput();
    output.signalRadar.devopsCloud = { score: 55, evidence: evidence("project:imaginary") };
    const result = run(output);

    expect(result.output.signalRadar.devopsCloud.score).toBe(0);
    expect(result.output.signalRadar.devopsCloud.evidence).toHaveLength(0);
  });

  it("caps two-record axes at 70 and leaves 3+ uncapped", () => {
    const output = makeOutput();
    output.signalRadar.frontendEngineering = {
      score: 95,
      evidence: evidence(REFS.project, REFS.skill),
    };
    output.signalRadar.systemDesign = {
      score: 88,
      evidence: evidence(REFS.caseStudy, REFS.project, REFS.experience),
    };
    const result = run(output);

    expect(result.output.signalRadar.frontendEngineering.score).toBe(70);
    expect(result.output.signalRadar.systemDesign.score).toBe(88);
  });
});

describe("clean output", () => {
  it("passes a fully supported report through without notes", () => {
    const result = run(makeOutput());
    expect(result.notes).toHaveLength(0);
    expect(result.output.groundedDataNotes).toHaveLength(1);
  });
});

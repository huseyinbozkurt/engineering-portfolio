import type {
  AiGeneratedLensRenameSuggestion,
  AiGeneratedStoryPart,
  AiGeneratedStoryPayload,
} from "@portfolio/db/schema";

const allowedKinds = new Set<AiGeneratedStoryPart["kind"]>([
  "principle",
  "decisionPattern",
  "experience",
  "project",
  "caseStudy",
  "skill",
  "tag",
]);

export function parseAiGeneratedStory(rawValue: string): AiGeneratedStoryPayload {
  const parsed = JSON.parse(extractJson(rawValue)) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("LLM response was not a JSON object.");
  }

  const rawParts = Array.isArray(parsed.parts) ? parsed.parts : [];
  const parts = rawParts
    .map((part, index) => normalizePart(part, index))
    .filter((part): part is AiGeneratedStoryPart => Boolean(part));

  if (parts.length === 0) {
    throw new Error("LLM response did not include any usable content parts.");
  }

  return {
    version: 1,
    title: stringValue(parsed.title) || "AI generated portfolio story",
    summary: stringValue(parsed.summary),
    lensRenameSuggestions: normalizeLensRenameSuggestions(parsed.lensRenameSuggestions),
    parts,
  };
}

function normalizePart(value: unknown, index: number): AiGeneratedStoryPart | null {
  if (!isRecord(value)) {
    return null;
  }

  const kind = stringValue(value.kind);

  if (!allowedKinds.has(kind as AiGeneratedStoryPart["kind"])) {
    return null;
  }

  const title = stringValue(value.title) || startCase(kind);
  const fields = isRecord(value.fields) ? value.fields : {};
  const relations = normalizeRelations(value.relations);

  return {
    id: stringValue(value.id) || `${kind}-${index + 1}`,
    kind: kind as AiGeneratedStoryPart["kind"],
    title,
    summary: stringValue(value.summary),
    fields,
    relations,
    deletedAt: null,
    appliedRecordId: null,
  };
}

function normalizeRelations(value: unknown): Record<string, string[] | string | null> {
  if (!isRecord(value)) {
    return {};
  }

  const relations: Record<string, string[] | string | null> = {};

  for (const [key, relationValue] of Object.entries(value)) {
    if (typeof relationValue === "string" || relationValue === null) {
      relations[key] = relationValue;
      continue;
    }

    if (Array.isArray(relationValue)) {
      relations[key] = relationValue.filter((item): item is string => typeof item === "string");
    }
  }

  return relations;
}

function normalizeLensRenameSuggestions(value: unknown): AiGeneratedLensRenameSuggestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): AiGeneratedLensRenameSuggestion[] => {
    if (!isRecord(item)) {
      return [];
    }

    const lensId = stringValue(item.lensId);
    const currentName = stringValue(item.currentName);
    const suggestedName = stringValue(item.suggestedName);
    const reason = stringValue(item.reason);

    if (!lensId || !currentName || !suggestedName || !reason) {
      return [];
    }

    return [{ lensId, currentName, suggestedName, reason }];
  });
}

function extractJson(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response did not contain JSON.");
  }

  return trimmed.slice(start, end + 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function startCase(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

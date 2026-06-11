import { describe, expect, it } from "vitest";

import { RESUME_MAX_BYTES, validateResumeFile } from "../src/resume";

const pdf = { name: "resume.pdf", type: "application/pdf", size: 120_000 };

describe("validateResumeFile", () => {
  it("accepts a normal PDF", () => {
    expect(validateResumeFile(pdf)).toEqual({ ok: true });
  });

  it("accepts Word documents", () => {
    expect(
      validateResumeFile({
        ...pdf,
        name: "resume.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }).ok,
    ).toBe(true);
  });

  it("rejects empty files", () => {
    expect(validateResumeFile({ ...pdf, size: 0 }).ok).toBe(false);
  });

  it("rejects oversized files", () => {
    const result = validateResumeFile({ ...pdf, size: RESUME_MAX_BYTES + 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("8 MB");
    }
  });

  it("rejects disallowed types", () => {
    expect(validateResumeFile({ ...pdf, name: "x.zip", type: "application/zip" }).ok).toBe(false);
    expect(validateResumeFile({ ...pdf, name: "x.html", type: "text/html" }).ok).toBe(false);
  });

  it("rejects missing or absurd names", () => {
    expect(validateResumeFile({ ...pdf, name: "  " }).ok).toBe(false);
    expect(validateResumeFile({ ...pdf, name: "x".repeat(300) }).ok).toBe(false);
  });
});

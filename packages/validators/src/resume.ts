/**
 * Resume upload validation, kept pure so the admin action and tests share the
 * exact same rules.
 */

export const RESUME_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export const RESUME_ALLOWED_TYPES: ReadonlyMap<string, string> = new Map([
  ["application/pdf", "PDF"],
  ["application/msword", "Word (.doc)"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Word (.docx)"],
]);

export interface ResumeFileCandidate {
  name: string;
  type: string;
  size: number;
}

export type ResumeValidation = { ok: true } | { ok: false; reason: string };

export function validateResumeFile(file: ResumeFileCandidate): ResumeValidation {
  if (!file.name.trim() || file.name.length > 255) {
    return { ok: false, reason: "The file needs a name shorter than 255 characters." };
  }

  if (file.size <= 0) {
    return { ok: false, reason: "The selected file is empty." };
  }

  if (file.size > RESUME_MAX_BYTES) {
    return {
      ok: false,
      reason: `The file is larger than ${Math.round(RESUME_MAX_BYTES / 1024 / 1024)} MB.`,
    };
  }

  if (!RESUME_ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      reason: "Only PDF or Word documents are accepted.",
    };
  }

  return { ok: true };
}

import { Download, FileText } from "lucide-react";

import type { ContactResumeMeta } from "@portfolio/db/resume";

import { deleteResumeAction, uploadResumeAction } from "@/app/actions";
import { ConfirmedForm } from "@/components/confirmed-form";
import { SubmitButton } from "@/components/form-controls";
import { formatDate } from "@/lib/format";

/**
 * Upload / replace / remove the resume file served from the public site's
 * /resume route. Lives outside the contact-profile form (file uploads are a
 * separate, immediate action — not part of the profile's explicit-save flow).
 */
export function ResumeManager({ resume }: { resume: ContactResumeMeta | null }) {
  return (
    <section className="ui-card p-6 shadow-card lg:p-7">
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-ink">Resume file</h2>
        <p className="mt-1 text-sm text-muted">
          Uploaded here, downloadable from the public contact page. When a file exists it takes
          precedence over the external resume URL below.
        </p>
      </header>

      {resume ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.02] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="ui-icon-tile">
              <FileText className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{resume.fileName}</p>
              <p className="text-xs text-muted">
                {formatFileSize(resume.fileSize)} · uploaded {formatDate(resume.uploadedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/resume" className="ui-btn-outline">
              <Download className="size-3.5" aria-hidden /> Download
            </a>
            <ConfirmedForm
              action={deleteResumeAction}
              confirmation={{
                title: "Remove the resume file?",
                description:
                  "The public contact page falls back to the external resume URL (if set) until a new file is uploaded.",
                confirmLabel: "Remove file",
                tone: "danger",
              }}
            >
              <button type="submit" className="ui-btn-danger">
                Remove
              </button>
            </ConfirmedForm>
          </div>
        </div>
      ) : (
        <p className="mb-5 rounded-xl border border-dashed border-line bg-white/[0.015] px-4 py-6 text-center text-sm text-muted">
          No resume uploaded yet. The public page currently uses the external resume URL, if set.
        </p>
      )}

      <ConfirmedForm action={uploadResumeAction} confirm="off" className="grid gap-3">
        <label className="ui-field">
          <span className="ui-label">
            {resume ? "Replace with a new file" : "Upload a resume"}
          </span>
          <input
            type="file"
            name="resume"
            required
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="w-full cursor-pointer rounded-xl border border-line bg-white/[0.03] px-3.5 py-2.5 text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-accent-400"
          />
          <span className="ui-hint">PDF or Word, up to 8 MB. Uploading replaces the current file.</span>
        </label>
        <div>
          <SubmitButton label="Upload resume" />
        </div>
      </ConfirmedForm>
    </section>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

import type { ReactNode } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";

import type { AiGeneratedStoryPart } from "@portfolio/db/schema";

import {
  restoreAiStoryPartAction,
  softDeleteAiStoryPartAction,
  updateAiStoryPartAction,
} from "@/app/ai-stories/actions";
import { ConfirmedForm } from "@/components/confirmed-form";
import { Field, TextArea } from "@/components/form-controls";
import { ModalPanel } from "@/components/modal-panel";

interface AiStoryPartCardProps {
  storyId: string;
  part: AiGeneratedStoryPart;
  disabled: boolean;
}

export function AiStoryPartCard({ storyId, part, disabled }: AiStoryPartCardProps) {
  const isDeleted = Boolean(part.deletedAt);

  return (
    <article
      className={
        isDeleted
          ? "rounded-lg border border-dashed border-amber-200/30 bg-amber-200/[0.04] p-4 opacity-65"
          : "rounded-lg border border-line bg-white/[0.03] p-4"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              {part.kind}
            </span>
            {isDeleted ? (
              <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-amber-100">
                Deleted
              </span>
            ) : null}
            {part.appliedRecordId ? (
              <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-teal-100">
                Applied
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-lg font-semibold text-ink">{part.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{part.summary || "No summary."}</p>
        </div>

        <div className="flex items-center gap-2">
          <ModalPanel
            triggerLabel={`Edit ${part.title}`}
            title={`Edit ${part.title}`}
            size="lg"
            triggerDisabled={disabled}
            triggerVariant="secondary"
            triggerContent={<Pencil className="size-4" aria-hidden="true" />}
          >
            <ConfirmedForm
              action={updateAiStoryPartAction}
              className="grid gap-4"
              confirmation={{
                title: "Save generated part?",
                description: "This updates the AI draft only. Published content is unchanged.",
                confirmLabel: "Save part",
              }}
            >
              <input type="hidden" name="storyId" value={storyId} />
              <input type="hidden" name="partId" value={part.id} />
              <Field label="Title" name="title" defaultValue={part.title} required />
              <TextArea
                label="Summary"
                name="summary"
                rows={3}
                defaultValue={part.summary}
              />
              <TextArea
                label="Fields JSON"
                name="fields"
                rows={12}
                defaultValue={JSON.stringify(part.fields, null, 2)}
                required
              />
              <TextArea
                label="Relationships JSON"
                name="relations"
                rows={8}
                defaultValue={JSON.stringify(part.relations ?? {}, null, 2)}
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-teal-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-100"
              >
                Save part
              </button>
            </ConfirmedForm>
          </ModalPanel>

          {isDeleted ? (
            <ConfirmedForm
              action={restoreAiStoryPartAction}
              confirmation={{
                title: "Recreate this part?",
                description: "This restores the soft-deleted generated part into the draft.",
                confirmLabel: "Recreate",
              }}
            >
              <input type="hidden" name="storyId" value={storyId} />
              <input type="hidden" name="partId" value={part.id} />
              <IconButton label={`Recreate ${part.title}`} disabled={disabled}>
                <RotateCcw className="size-4" aria-hidden="true" />
              </IconButton>
            </ConfirmedForm>
          ) : (
            <ConfirmedForm
              action={softDeleteAiStoryPartAction}
              confirmation={{
                title: "Soft delete this part?",
                description: "The part will stay visible in shadowed form and can be recreated.",
                confirmLabel: "Soft delete",
                tone: "danger",
              }}
            >
              <input type="hidden" name="storyId" value={storyId} />
              <input type="hidden" name="partId" value={part.id} />
              <IconButton label={`Soft delete ${part.title}`} danger>
                <Trash2 className="size-4" aria-hidden="true" />
              </IconButton>
            </ConfirmedForm>
          )}
        </div>
      </div>
    </article>
  );
}

function IconButton({
  label,
  danger = false,
  disabled = false,
  children,
}: {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      aria-label={label}
      disabled={disabled}
      title={label}
      className={
        danger
          ? "inline-flex size-9 items-center justify-center rounded-lg border border-rose-300/40 bg-rose-500/10 text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          : "inline-flex size-9 items-center justify-center rounded-lg border border-line bg-white/[0.04] text-ink transition hover:border-teal-300/50 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
      }
    >
      {children}
    </button>
  );
}

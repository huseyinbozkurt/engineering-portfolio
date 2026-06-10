"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef } from "react";

import {
  createAiStoryAction,
  type CreateAiStoryActionState,
} from "@/app/ai-stories/actions";

interface CreateWithAiModalProps {
  canCreate: boolean;
  disabledReason: string | null;
}

const initialState: CreateAiStoryActionState = {
  status: "idle",
  message: "",
  storyId: null,
};

export function CreateWithAiModal({ canCreate, disabledReason }: CreateWithAiModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [state, formAction, isPending] = useActionState(createAiStoryAction, initialState);

  useEffect(() => {
    if (!state.storyId) {
      return;
    }

    dialogRef.current?.close();
    router.push(`/ai-stories/${state.storyId}`);
  }, [router, state.storyId]);

  return (
    <>
      <button
        type="button"
        className="ui-btn-primary"
        disabled={!canCreate}
        title={!canCreate && disabledReason ? disabledReason : undefined}
        onClick={() => dialogRef.current?.showModal()}
      >
        <Sparkles className="size-4" aria-hidden="true" />
        Create with AI
      </button>

      <dialog
        ref={dialogRef}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="w-[min(calc(100vw-2rem),42rem)] max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-line-strong bg-surface p-0 text-ink shadow-pop outline-none backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex max-h-[calc(100vh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line bg-white/[0.02] px-5 py-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-ink">
                Create with AI
              </h2>
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-muted">
                Describe what you built, why it mattered, constraints, decisions, and outcomes.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-accent-400/50 hover:text-ink"
              onClick={() => dialogRef.current?.close()}
            >
              Close
            </button>
          </div>

          <form action={formAction} className="grid gap-4 overflow-y-auto px-5 py-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-ink">Story brief</span>
              <textarea
                className="min-h-56 rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-sm leading-6 outline-none transition placeholder:text-muted/70 focus:border-accent-400/60"
                name="sourceStory"
                placeholder="I built..., because..., the hard parts were..., I decided..., the result was..."
                required
              />
            </label>

            {state.message ? (
              <p
                className={
                  state.status === "error"
                    ? "rounded-lg border border-danger-300/30 bg-danger-500/10 px-3 py-2 text-sm text-danger-100"
                    : "rounded-lg border border-success-400/30 bg-success-400/10 px-3 py-2 text-sm text-success-100"
                }
                role="status"
              >
                {state.message}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={() => dialogRef.current?.close()}
              >
                Cancel
              </button>
              <button type="submit" className="ui-btn-primary disabled:cursor-wait" disabled={isPending}>
                <Sparkles className="size-4" aria-hidden="true" />
                {isPending ? "Generating..." : "Generate story"}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {!canCreate && disabledReason ? (
        <p className="basis-full text-xs text-warning-200">{disabledReason}</p>
      ) : null}
    </>
  );
}

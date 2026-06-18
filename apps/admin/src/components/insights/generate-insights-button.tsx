"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { generateAiInsightsAction, type AiInsightsActionState } from "@/app/ai-insights/actions";

const EMPTY_STATE: AiInsightsActionState = {
  status: "idle",
  message: "",
  report: null,
  taskId: null,
};

interface GenerateInsightsButtonProps {
  /** Disabled with an explanation when no provider is online or a run is active. */
  disabledReason: string | null;
}

export function GenerateInsightsButton({ disabledReason }: GenerateInsightsButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(
    null,
  );

  const runGenerate = () => {
    startTransition(async () => {
      const formData = new FormData();
      const result = await generateAiInsightsAction(EMPTY_STATE, formData);
      setFeedback({
        kind: result.status === "error" ? "error" : "success",
        message: result.message,
      });
      if (result.taskId) {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        className="ui-btn-primary"
        disabled={Boolean(disabledReason) || isPending}
        title={disabledReason ?? undefined}
        onClick={() => {
          setFeedback(null);
          runGenerate();
        }}
      >
        <Sparkles className="size-4" aria-hidden />
        {isPending ? "Starting…" : "Generate insights"}
      </button>

      {disabledReason ? (
        <p className="max-w-xs text-right text-xs leading-5 text-muted">{disabledReason}</p>
      ) : null}
      {feedback?.kind === "error" ? (
        <p className="max-w-xs text-right text-xs leading-5 text-danger-200">{feedback.message}</p>
      ) : null}
      {feedback?.kind === "success" ? (
        <p className="max-w-xs text-right text-xs leading-5 text-success-200">{feedback.message}</p>
      ) : null}
    </div>
  );
}

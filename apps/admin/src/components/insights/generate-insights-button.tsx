"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { generateAiInsightsAction, type AiInsightsActionState } from "@/app/ai-insights/actions";

const initialState: AiInsightsActionState = {
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
  const [state, formAction, isPending] = useActionState(generateAiInsightsAction, initialState);

  useEffect(() => {
    if (state.taskId) {
      router.refresh();
    }
  }, [router, state.taskId]);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={formAction}>
        <button
          type="submit"
          className="ui-btn-primary"
          disabled={Boolean(disabledReason) || isPending}
          title={disabledReason ?? undefined}
        >
          <Sparkles className="size-4" aria-hidden />
          {isPending ? "Starting…" : "Generate insights"}
        </button>
      </form>
      {disabledReason ? (
        <p className="max-w-xs text-right text-xs leading-5 text-muted">{disabledReason}</p>
      ) : null}
      {state.status === "error" ? (
        <p className="max-w-xs text-right text-xs leading-5 text-danger-200">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="max-w-xs text-right text-xs leading-5 text-success-200">{state.message}</p>
      ) : null}
    </div>
  );
}

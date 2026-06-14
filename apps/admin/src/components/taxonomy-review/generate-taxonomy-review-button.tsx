"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import {
  generateTaxonomyReviewAction,
  type TaxonomyReviewActionState,
} from "@/app/taxonomy-review/actions";

const initialState: TaxonomyReviewActionState = {
  status: "idle",
  message: "",
  runId: null,
};

interface GenerateTaxonomyReviewButtonProps {
  disabledReason: string | null;
}

export function GenerateTaxonomyReviewButton({
  disabledReason,
}: GenerateTaxonomyReviewButtonProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    generateTaxonomyReviewAction,
    initialState,
  );

  useEffect(() => {
    if (state.runId) {
      router.refresh();
    }
  }, [router, state.runId]);

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
          {isPending ? "Starting..." : "Generate review"}
        </button>
      </form>
      {disabledReason ? (
        <p className="max-w-xs text-right text-xs leading-5 text-muted">{disabledReason}</p>
      ) : null}
      {state.status === "error" ? (
        <p className="max-w-xs text-right text-xs leading-5 text-danger-200">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="max-w-xs text-right text-xs leading-5 text-success-200">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

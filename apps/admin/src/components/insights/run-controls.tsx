"use client";

import { ConfirmedForm } from "@/components/confirmed-form";
import { useToast } from "@/components/toast/toast-provider";
import {
  cancelInsightRunAction,
  publishInsightRunAction,
  unpublishInsightRunAction,
} from "@/app/ai-insights/actions";

/**
 * Publish / unpublish / cancel controls for a run. Publishing is outward-facing
 * (it changes the live public page), so it keeps the explicit confirm dialog.
 */
export function PublishRunButton({ runId }: { runId: string }) {
  const { toast } = useToast();

  return (
    <ConfirmedForm
      action={publishInsightRunAction}
      confirm="always"
      confirmation={{
        title: "Publish this report?",
        description:
          "It becomes the live report on the public /ai-insights page, replacing any currently published run.",
        confirmLabel: "Publish report",
      }}
      onSuccess={() => toast({ title: "Report published", tone: "success" })}
    >
      <input type="hidden" name="id" value={runId} />
      <button type="submit" className="ui-btn-primary">
        Publish to public site
      </button>
    </ConfirmedForm>
  );
}

export function UnpublishRunButton({ runId }: { runId: string }) {
  const { toast } = useToast();

  return (
    <ConfirmedForm
      action={unpublishInsightRunAction}
      confirm="always"
      confirmation={{
        title: "Unpublish this report?",
        description:
          "The public /ai-insights page returns to its empty state until another run is published.",
        confirmLabel: "Unpublish",
        tone: "danger",
      }}
      onSuccess={() => toast({ title: "Report unpublished", tone: "info" })}
    >
      <input type="hidden" name="id" value={runId} />
      <button type="submit" className="ui-btn-danger">
        Unpublish
      </button>
    </ConfirmedForm>
  );
}

export function CancelRunButton({ runId }: { runId: string }) {
  const { toast } = useToast();

  return (
    <ConfirmedForm
      action={cancelInsightRunAction}
      confirm="always"
      confirmation={{
        title: "Cancel this run?",
        description:
          "The run is marked failed so a new one can start. Any in-flight provider result is discarded.",
        confirmLabel: "Cancel run",
        tone: "danger",
      }}
      onSuccess={() => toast({ title: "Run cancelled", tone: "info" })}
    >
      <input type="hidden" name="id" value={runId} />
      <button type="submit" className="ui-btn-danger">
        Cancel run
      </button>
    </ConfirmedForm>
  );
}

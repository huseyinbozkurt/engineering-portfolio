import { ArrowLeft, Archive, Send, Undo2 } from "lucide-react";
import Link from "next/link";

import type { FormAction } from "@/components/forms/types";
import { StatusBadge } from "@/components/status-badge";

interface PreviewActionsProps {
  id: string;
  status: string;
  editPath: string;
  previewPath: string;
  publishAction: FormAction;
  unpublishAction: FormAction;
  archiveAction: FormAction;
}

export function PreviewActions({
  id,
  status,
  editPath,
  previewPath,
  publishAction,
  unpublishAction,
  archiveAction,
}: PreviewActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href={editPath} className="ui-btn-secondary">
        <ArrowLeft className="size-4" aria-hidden />
        Back to Edit
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        {status === "published" ? (
          <form action={unpublishAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="redirectTo" value={previewPath} />
            <button type="submit" className="ui-btn-secondary">
              <Undo2 className="size-4" aria-hidden />
              Unpublish
            </button>
          </form>
        ) : (
          <form action={publishAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="redirectTo" value={previewPath} />
            <button type="submit" className="ui-btn-primary">
              <Send className="size-4" aria-hidden />
              Publish
            </button>
          </form>
        )}
        {status !== "archived" ? (
          <form action={archiveAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="redirectTo" value={previewPath} />
            <button type="submit" className="ui-btn-secondary">
              <Archive className="size-4" aria-hidden />
              Archive
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

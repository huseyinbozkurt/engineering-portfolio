import { Archive, Eye, Save, Send, Undo2 } from "lucide-react";
import Link from "next/link";

import type { FormAction } from "@/components/forms/types";

interface WorkflowActionsProps {
  id: string;
  status: string;
  editPath: string;
  previewPath: string;
  publishAction: FormAction;
  unpublishAction: FormAction;
  archiveAction: FormAction;
}

export function WorkflowActions({
  id,
  status,
  editPath,
  previewPath,
  publishAction,
  unpublishAction,
  archiveAction,
}: WorkflowActionsProps) {
  return (
    <>
      {status !== "draft" ? (
        <form action={unpublishAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="redirectTo" value={editPath} />
          <button type="submit" className="ui-btn-secondary">
            <Save className="size-4" aria-hidden />
            Save Draft
          </button>
        </form>
      ) : (
        <button type="button" className="ui-btn-secondary" disabled>
          <Save className="size-4" aria-hidden />
          Save Draft
        </button>
      )}
      <Link href={previewPath} className="ui-btn-secondary">
        <Eye className="size-4" aria-hidden />
        Preview
      </Link>
      {status === "published" ? (
        <form action={unpublishAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="redirectTo" value={editPath} />
          <button type="submit" className="ui-btn-secondary">
            <Undo2 className="size-4" aria-hidden />
            Unpublish
          </button>
        </form>
      ) : (
        <form action={publishAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="redirectTo" value={editPath} />
          <button type="submit" className="ui-btn-primary">
            <Send className="size-4" aria-hidden />
            Publish
          </button>
        </form>
      )}
      {status !== "archived" ? (
        <form action={archiveAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="redirectTo" value={editPath} />
          <button type="submit" className="ui-btn-secondary">
            <Archive className="size-4" aria-hidden />
            Archive
          </button>
        </form>
      ) : null}
    </>
  );
}

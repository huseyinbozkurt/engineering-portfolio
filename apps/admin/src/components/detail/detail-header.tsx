import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { FormAction } from "@/components/forms/types";

import { StatusControl } from "./status-control";

interface DetailHeaderProps {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  id: string;
  status: string;
  statusAction: FormAction;
  subtitle?: ReactNode;
  /** Public URL for "View on site"; omitted for content with no standalone page. */
  publicHref?: string | null;
  /** The gear/settings modal node. */
  settings: ReactNode;
  /** Optional edit affordance for header-level viewable fields (title, links…). */
  headerEdit?: ReactNode;
  /** Optional extra header content rendered below the title (e.g. link buttons). */
  children?: ReactNode;
}

export function DetailHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  id,
  status,
  statusAction,
  subtitle,
  publicHref,
  settings,
  headerEdit,
  children,
}: DetailHeaderProps) {
  return (
    <header className="border-b border-line pb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> {backLabel}
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">{eyebrow}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-ink">{title}</h1>
            {headerEdit}
          </div>
          {subtitle ? <div className="mt-2 text-sm text-muted">{subtitle}</div> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusControl action={statusAction} id={id} status={status} />
          {publicHref ? (
            <a
              href={publicHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]"
            >
              View on site <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
          {settings}
        </div>
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}

import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import type { FormAction } from "@/components/forms/types";

import { PrevNextNav, type SiblingLink } from "./prev-next-nav";
import { StatusControl } from "./status-control";

interface DetailHeaderProps {
  /** Retained for caller compatibility; the breadcrumb section crumb links back. */
  backHref?: string;
  backLabel?: string;
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
  /** Sibling records for previous / next navigation within the content type. */
  prev?: SiblingLink | undefined;
  next?: SiblingLink | undefined;
  /** Optional extra header content rendered below the title (e.g. link buttons). */
  children?: ReactNode;
}

export function DetailHeader({
  eyebrow,
  title,
  id,
  status,
  statusAction,
  subtitle,
  publicHref,
  settings,
  headerEdit,
  prev,
  next,
  children,
}: DetailHeaderProps) {
  return (
    <header className="border-b border-line pb-6">
      <div className="flex items-center justify-between gap-3">
        <Breadcrumbs current={title} />
        <PrevNextNav prev={prev} next={next} />
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-200/90">
            {eyebrow}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="ui-page-title">{title}</h1>
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/[0.02] px-3 py-2 text-sm font-medium text-ink transition hover:border-line-strong hover:bg-white/[0.06]"
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

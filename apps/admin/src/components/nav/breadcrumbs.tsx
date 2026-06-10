"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

import { GuardedLink } from "@/components/nav/guarded-link";
import { adminNavItems } from "@/lib/admin-nav";

interface Crumb {
  label: string;
  href?: string;
}

/** The deepest nav section matching the current path (e.g. "Projects"). */
function sectionCrumb(pathname: string): Crumb[] {
  const match = adminNavItems
    .filter(
      (item) =>
        item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ? [{ label: match.label, href: match.href }] : [];
}

/**
 * Breadcrumb trail rendered inside the shared page/detail headers, so every list
 * and detail route gets one without per-page wiring. The leading "Overview" crumb
 * is always prepended; detail pages pass the record title via `current`. Links go
 * through {@link GuardedLink} to respect unsaved-change protection.
 */
export function Breadcrumbs({
  current,
  className,
}: {
  current?: string | undefined;
  className?: string;
}) {
  const pathname = usePathname() ?? "/";
  const section = sectionCrumb(pathname);
  const crumbs: Crumb[] = current ? [...section, { label: current }] : section;
  const full: Crumb[] = [{ label: "Overview", href: "/" }, ...crumbs];

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
        {full.map((crumb, index) => {
          const isLast = index === full.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="size-3 text-muted/40" aria-hidden />
              ) : null}
              {crumb.href && !isLast ? (
                <GuardedLink
                  href={crumb.href}
                  className="rounded px-1 py-0.5 transition hover:text-ink"
                >
                  {crumb.label}
                </GuardedLink>
              ) : (
                <span
                  className={isLast ? "px-1 py-0.5 font-medium text-ink" : "px-1 py-0.5"}
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";

import { GuardedLink } from "@/components/nav/guarded-link";

export interface SiblingLink {
  href: string;
  label: string;
}

/**
 * Previous / next navigation between sibling records of the same content type,
 * shown in the detail header. Disabled (dimmed) when there is no neighbour in
 * that direction. Links honour the unsaved-change guard via {@link GuardedLink}.
 */
export function PrevNextNav({
  prev,
  next,
}: {
  prev?: SiblingLink | undefined;
  next?: SiblingLink | undefined;
}) {
  if (!prev && !next) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {prev ? (
        <GuardedLink
          href={prev.href}
          className="ui-btn-icon"
          aria-label={`Previous: ${prev.label}`}
          title={`Previous: ${prev.label}`}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </GuardedLink>
      ) : (
        <span className="ui-btn-icon cursor-not-allowed opacity-40" aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {next ? (
        <GuardedLink
          href={next.href}
          className="ui-btn-icon"
          aria-label={`Next: ${next.label}`}
          title={`Next: ${next.label}`}
        >
          <ChevronRight className="size-4" aria-hidden />
        </GuardedLink>
      ) : (
        <span className="ui-btn-icon cursor-not-allowed opacity-40" aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </div>
  );
}

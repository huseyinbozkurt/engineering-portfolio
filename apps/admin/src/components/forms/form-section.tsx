import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Titled card grouping related fields inside a full-page editor. Pure markup
 * (server-safe); pass `id` to make it an anchor target for section navs.
 */
export function FormSection({
  id,
  title,
  description,
  children,
}: {
  id?: string | undefined;
  title: string;
  description?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section id={id} className="ui-card scroll-mt-24 p-6 shadow-card lg:p-7">
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

/**
 * Collapsible group for secondary settings (SEO, ordering, relationships) built
 * on a native `<details>`, so it works without client JS and keeps every field in
 * the submitted FormData. Only put *optional* fields inside: a required control
 * hidden in a collapsed disclosure would block native validation invisibly.
 */
export function FormDisclosure({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string | undefined;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-line bg-white/[0.02]">
      <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="text-sm font-semibold text-ink">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-xs leading-5 text-muted">{description}</span>
          ) : null}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted transition duration-150 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="grid gap-4 border-t border-line p-5">{children}</div>
    </details>
  );
}

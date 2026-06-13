import type { ReactNode } from "react";
import Link from "next/link";

export function MetaPanel({ title, children }: { title: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  if (!hasChildren) {
    return null;
  }

  return (
    <section className="glass-panel rounded-lg p-4 gap-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
        {title}
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

export function MetaLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-muted transition hover:border-violet-300/50 hover:text-ink"
    >
      {label}
    </Link>
  );
}
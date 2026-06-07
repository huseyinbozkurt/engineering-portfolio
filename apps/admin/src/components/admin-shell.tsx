import Link from "next/link";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin-nav";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="border-b border-line bg-white/[0.03] px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-200 text-sm font-bold text-slate-950">
            P
          </span>
          <span className="text-base font-semibold text-ink">Portfolio Admin</span>
        </Link>
        <p className="mt-2 text-xs leading-5 text-muted">Private content operations.</p>
        <AdminNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

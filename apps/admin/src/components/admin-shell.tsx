import Link from "next/link";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin-nav";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[268px_1fr]">
      <aside className="border-b border-line bg-white/[0.015] px-4 py-5 backdrop-blur-sm lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:py-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.04]"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-200 to-teal-400 text-sm font-bold text-slate-950 shadow-sm shadow-teal-300/30">
            P
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-ink">Portfolio Admin</span>
            <span className="text-xs text-muted">Content operations</span>
          </span>
        </Link>
        <AdminNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

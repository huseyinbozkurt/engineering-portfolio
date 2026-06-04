import Link from "next/link";
import type { ReactNode } from "react";

import { adminNavItems } from "@/lib/admin-nav";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-line bg-white/[0.03] px-5 py-5 lg:border-b-0 lg:border-r lg:px-6">
        <Link href="/" className="block text-lg font-semibold text-ink">
          Portfolio Admin
        </Link>
        <p className="mt-2 text-sm leading-6 text-muted">Private content operations.</p>
        <nav className="mt-8 grid gap-1">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/7 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavGroups, adminNavItems } from "@/lib/admin-nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="mt-7 grid gap-6">
      {adminNavGroups.map((group) => {
        const items = adminNavItems.filter((item) => item.group === group);

        return (
          <div key={group} className="grid gap-0.5">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted/50">
              {group}
            </p>
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "group relative flex items-center gap-2.5 rounded-xl bg-teal-300/[0.12] px-3 py-2 text-sm font-medium text-ink"
                      : "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-white/[0.05] hover:text-ink"
                  }
                >
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-teal-300" />
                  ) : null}
                  <Icon
                    className={
                      active
                        ? "size-4 text-teal-200"
                        : "size-4 text-muted transition group-hover:text-ink"
                    }
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

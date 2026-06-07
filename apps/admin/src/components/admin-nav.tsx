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
    <nav className="mt-7 grid gap-5">
      {adminNavGroups.map((group) => {
        const items = adminNavItems.filter((item) => item.group === group);

        return (
          <div key={group} className="grid gap-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted/60">
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
                      ? "flex items-center gap-2.5 rounded-lg border border-teal-300/30 bg-teal-300/10 px-3 py-2 text-sm font-medium text-ink"
                      : "flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-muted transition hover:bg-white/7 hover:text-ink"
                  }
                >
                  <Icon className={active ? "size-4 text-teal-200" : "size-4 text-muted"} />
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

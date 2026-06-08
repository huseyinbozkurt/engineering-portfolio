"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems, siteConfig } from "@/lib/site";

export function Nav() {
  const pathname = usePathname();
  const initials = siteConfig.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[#050914]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-ink">
          <span className="flex size-9 items-center justify-center rounded-sm bg-gradient-to-br from-violet-400 via-sky-400 to-emerald-300 text-base font-black text-slate-950">
            {initials}
          </span>
          <span>{siteConfig.name}</span>
        </Link>
        <nav className="order-3 grid w-full grid-cols-2 gap-1 sm:grid-cols-3 md:order-none md:flex md:w-auto md:items-center">
          {navItems
            .filter((item) => item.href !== "/contact")
            .map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/7 hover:text-ink ${
                  isActive ? "text-violet-200" : "text-muted"
                }`}
              >
                {item.label}
                {isActive ? (
                  <span
                    className="absolute inset-x-3 -bottom-1 hidden h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent md:block"
                    aria-hidden
                  />
                ) : null}
              </Link>
              );
            })}
        </nav>
        <Link
          href="/contact"
          aria-current={pathname === "/contact" ? "page" : undefined}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition hover:border-violet-300 hover:bg-violet-400/10 ${
            pathname === "/contact"
              ? "border-violet-300 bg-violet-400/10 text-violet-100"
              : "border-violet-400/70 text-ink"
          }`}
        >
          Contact Me
        </Link>
      </div>
    </header>
  );
}

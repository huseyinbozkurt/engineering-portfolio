import Link from "next/link";

import { navItems, siteConfig } from "@/lib/site";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[#050607]/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-ink">
          {siteConfig.name}
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            item.href !== "/contact" && <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/7 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/contact"
          className="rounded-lg border border-line px-3 py-2 text-sm text-ink transition hover:border-teal-300/50 hover:bg-teal-300/10"
        >
          Contact
        </Link>
      </div>
    </header>
  );
}

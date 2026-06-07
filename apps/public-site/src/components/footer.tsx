import Link from "next/link";

import { navItems, siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[1fr_2fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold text-ink">{siteConfig.name}</p>
        </div>
        <nav className="grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

import Link from "next/link";

import { navItems, secondaryNavItems, siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[1fr_2fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold text-ink">{siteConfig.name}</p>
          {siteConfig.description ? (
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
              {siteConfig.description}
            </p>
          ) : null}
        </div>
        <nav className="grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-4">
          {[{ href: "/", label: "Home" }, ...navItems, ...secondaryNavItems].map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

import { getSiteSettings } from "@portfolio/db/queries";
import { siteImagePublicPath } from "@portfolio/db/site-images";

import { NavClient, type NavBrand } from "@/components/nav-client";
import { siteConfig } from "@/lib/site";

function clampLogoSize(value: number | null | undefined): number {
  if (!Number.isFinite(value)) {
    return 28;
  }

  return Math.min(96, Math.max(16, Math.round(value ?? 28)));
}

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "HB";
}

function plainBrandName(value: string): string {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^[\s-]*[-*]\s+/gm, "")
    .replace(/[`*_~>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function Nav() {
  const settings = await getSiteSettings();
  const brandName = settings?.brandName?.trim() || siteConfig.name;
  const plainName = plainBrandName(brandName) || siteConfig.name;
  const logoImageId = settings?.brandLogoImage ? settings.brandLogoImageId : null;
  const brand: NavBrand = {
    name: brandName,
    plainName,
    showName: settings?.showBrandName ?? true,
    logoUrl: logoImageId ? siteImagePublicPath(logoImageId) : null,
    logoSize: clampLogoSize(settings?.brandLogoSize),
    initials: getInitials(plainName),
  };

  return <NavClient brand={brand} />;
}

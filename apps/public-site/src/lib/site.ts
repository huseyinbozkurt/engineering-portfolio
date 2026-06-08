export const siteConfig = {
  name: "Huseyin Bozkurt",
  title: "Huseyin Bozkurt | Engineering Portfolio",
  description:
    "",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export const navItems = [
  { href: "/experience", label: "Experience" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/projects", label: "Projects" },
  { href: "/ai-insights", label: "AI Insights" },
  { href: "/about", label: "About" },
  { href: "/recognition", label: "Recognition" },
  { href: "/contact", label: "Contact" },
] as const;

export const secondaryNavItems = [
  { href: "/how-i-work", label: "Operating Principles" },
] as const;

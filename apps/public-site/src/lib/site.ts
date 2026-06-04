export const siteConfig = {
  name: "Huseyin Bozkurt",
  title: "Huseyin Bozkurt | Engineering Portfolio",
  description:
    "A professional engineering portfolio organized around lenses, operating principles, decisions, projects, experience, and case studies.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://huseyinbozkurt.dev",
};

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/projects", label: "Projects" },
  { href: "/how-i-work", label: "How I Work" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/contact", label: "Contact" },
] as const;

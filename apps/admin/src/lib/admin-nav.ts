import {
  Aperture,
  BookOpen,
  Briefcase,
  Compass,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Mail,
  Sparkles,
  Tag,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";

export type AdminNavGroup = "Workspace" | "Content" | "Inbox";

type IconComponent = ComponentType<{ className?: string }>;

export interface AdminNavItem {
  href: string;
  label: string;
  group: AdminNavGroup;
  icon: IconComponent;
}

export const adminNavGroups: AdminNavGroup[] = ["Workspace", "Content", "Inbox"];

export const adminNavItems: AdminNavItem[] = [
  { href: "/", label: "Overview", group: "Workspace", icon: LayoutDashboard },
  { href: "/ai-insights", label: "AI Insights", group: "Workspace", icon: Sparkles },
  { href: "/ai-stories", label: "AI Stories", group: "Workspace", icon: BookOpen },
  { href: "/tasks", label: "LLM Tasks", group: "Workspace", icon: ListChecks },
  { href: "/content/lenses", label: "Lenses", group: "Content", icon: Aperture },
  { href: "/content/principles", label: "Principles", group: "Content", icon: Compass },
  {
    href: "/content/decision-patterns",
    label: "Decision Patterns",
    group: "Content",
    icon: GitBranch,
  },
  { href: "/content/experiences", label: "Experience", group: "Content", icon: Briefcase },
  { href: "/content/projects", label: "Projects", group: "Content", icon: FolderKanban },
  { href: "/content/case-studies", label: "Case Studies", group: "Content", icon: FileText },
  { href: "/content/skills", label: "Skills", group: "Content", icon: Wrench },
  { href: "/content/tags", label: "Tags", group: "Content", icon: Tag },
  { href: "/content/contact-profile", label: "Contact Profile", group: "Content", icon: Mail },
  { href: "/content/contact-submissions", label: "Contact", group: "Inbox", icon: Mail },
];

import { NextResponse } from "next/server";

import { getAdminContentIndex } from "@portfolio/db/queries";

export const dynamic = "force-dynamic";

export interface SearchIndexItem {
  type: string;
  id: string;
  title: string;
  href: string;
}

/**
 * Compact record index for the command palette. Fetched lazily the first time the
 * palette opens (not on every page load), so record-level "jump to" search costs
 * nothing until used. Returns an empty list rather than erroring when the DB is
 * unavailable, so the palette's navigation commands still work.
 */
export async function GET() {
  try {
    const content = await getAdminContentIndex();

    const items: SearchIndexItem[] = [
      ...content.lenses.map((x) => ({
        type: "Lens",
        id: x.id,
        title: x.name,
        href: `/content/lenses/${x.id}`,
      })),
      ...content.principles.map((x) => ({
        type: "Principle",
        id: x.id,
        title: x.title,
        href: `/content/principles/${x.id}`,
      })),
      ...content.decisionPatterns.map((x) => ({
        type: "Decision Pattern",
        id: x.id,
        title: x.title,
        href: `/content/decision-patterns/${x.id}`,
      })),
      ...content.experiences.map((x) => ({
        type: "Experience",
        id: x.id,
        title: `${x.role} at ${x.company}`,
        href: `/content/experiences/${x.id}`,
      })),
      ...content.projects.map((x) => ({
        type: "Project",
        id: x.id,
        title: x.name,
        href: `/content/projects/${x.id}`,
      })),
      ...content.caseStudies.map((x) => ({
        type: "Case Study",
        id: x.id,
        title: x.title,
        href: `/content/case-studies/${x.id}`,
      })),
      ...content.skills.map((x) => ({
        type: "Skill",
        id: x.id,
        title: x.name,
        href: `/content/skills/${x.id}`,
      })),
      ...content.tags.map((x) => ({
        type: "Tag",
        id: x.id,
        title: x.name,
        href: `/content/tags/${x.id}`,
      })),
    ];

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] as SearchIndexItem[] });
  }
}

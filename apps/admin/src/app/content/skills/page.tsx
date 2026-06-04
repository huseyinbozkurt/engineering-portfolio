import { getSkills } from "@portfolio/db/queries";

import { bulkUpsertSkillsAction, createSkillAction } from "@/app/actions";
import { ContentList } from "@/components/content-list";
import { BulkTaxonomyForm } from "@/components/forms/bulk-taxonomy-form";
import { SkillForm } from "@/components/forms/skill-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const skills = await getSkills();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Skills"
        description="Skills and technologies can be related to experience, projects, and case studies."
        actions={
          <>
            <ModalPanel
              triggerLabel="Create skill"
              title="Create skill"
              description="Add a new skill and confirm before saving it."
              size="sm"
            >
              <SkillForm action={createSkillAction} title="Create skill" submitLabel="Create Skill" />
            </ModalPanel>
            <ModalPanel
              triggerLabel="Bulk edit"
              title="Bulk create or edit skills"
              description="Paste skill rows, then confirm before saving all changes."
              size="lg"
              triggerVariant="secondary"
            >
              <BulkTaxonomyForm
                action={bulkUpsertSkillsAction}
                title="Bulk create or edit skills"
                fieldGuide="One row per skill. Use: name | slug | category | status | summary | position. Existing slugs are updated; new slugs are created."
                defaultValue={serializeSkills(skills)}
                placeholder="TypeScript | typescript | Languages | published | Strongly typed JavaScript | 0"
                submitLabel="Save Skills In Bulk"
              />
            </ModalPanel>
          </>
        }
      />
      <ContentList
        title="Existing skills"
        emptyTitle="No skills yet"
        emptyDescription="Skills will appear here after real records are created."
        items={skills.map((skill) => ({
          id: skill.id,
          title: skill.name,
          description: skill.summary,
          meta: skill.slug,
          group: skill.category,
          status: skill.status,
          editHref: `/content/skills/${skill.id}`,
          ai: {
            contentQualityScore: skill.contentQualityScore,
            lastAiReviewAt: skill.lastAiReviewAt,
            aiSummary: skill.aiSummary,
          },
        }))}
      />
    </main>
  );
}

function serializeSkills(skills: Awaited<ReturnType<typeof getSkills>>): string {
  return skills
    .map((skill) =>
      [
        skill.name,
        skill.slug,
        skill.category ?? "",
        skill.status,
        sanitizeBulkField(skill.summary),
        String(skill.position),
      ].join(" | "),
    )
    .join("\n");
}

function sanitizeBulkField(value: string): string {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "/").trim();
}

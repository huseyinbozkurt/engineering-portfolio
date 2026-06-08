import { getSkills } from "@portfolio/db/queries";

import { bulkUpsertSkillsAction, createSkillAction } from "@/app/actions";
import { ContentList } from "@/components/content-list";
import { BulkSkillsForm } from "@/components/forms/bulk-skills-form";
import {
  SkillCategoryEditor,
  type SkillCategoryEditorData,
} from "@/components/forms/skill-category-editor";
import { SkillForm } from "@/components/forms/skill-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

type Skill = Awaited<ReturnType<typeof getSkills>>[number];

function toRow(skill: Skill) {
  return {
    key: skill.id,
    name: skill.name,
    slug: skill.slug,
    category: skill.category ?? "",
    status: skill.status,
    summary: skill.summary,
    position: String(skill.position),
  };
}

export default async function SkillsPage() {
  const skills = await getSkills();

  // Group skills by the same key ContentList uses ("Uncategorized" for blanks),
  // then build the per-category editor payload for each group header. Each pen
  // icon opens the bulk editor scoped to one category: existing skills are
  // editable and "Add skill" creates a new sub-skill under that category.
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    const name = skill.category?.trim() || "Uncategorized";
    groups.set(name, [...(groups.get(name) ?? []), skill]);
  }

  const groupActionData: Record<string, SkillCategoryEditorData> = {};
  for (const [groupName, groupSkills] of groups) {
    groupActionData[groupName] = {
      rows: groupSkills.map(toRow),
      defaultCategory: groupName === "Uncategorized" ? "" : groupName,
    };
  }

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
              description="Edit every skill in one place, then confirm before saving all changes."
              size="xl"
              triggerVariant="secondary"
            >
              <BulkSkillsForm
                action={bulkUpsertSkillsAction}
                submitLabel="Save Skills In Bulk"
                initialRows={skills.map(toRow)}
              />
            </ModalPanel>
          </>
        }
      />
      <ContentList
        title="Existing skills"
        emptyTitle="No skills yet"
        emptyDescription="Skills will appear here after real records are created."
        groupActionComponent={SkillCategoryEditor}
        groupActionData={groupActionData}
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

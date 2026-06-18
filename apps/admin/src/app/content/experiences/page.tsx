import { Plus } from "lucide-react";

import {
  getExperienceListRecords,
  getLenses,
  getPrinciples,
  getSkills,
  getTags,
} from "@portfolio/db/queries";

import {
  archiveExperienceAction,
  createExperienceDraftAction,
  deleteExperienceAction,
  duplicateExperienceAction,
  publishExperienceAction,
  runAllExperienceAiReviewsAction,
  unpublishExperienceAction,
} from "@/app/actions";
import { ExperienceEditorialList } from "@/components/experiences/experience-editorial-list";
import { LlmTaskAutoStarter } from "@/components/llm-task-auto-starter";
import { PageTitle } from "@/components/page-title";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";
import { getLlmConnectionStatuses } from "@/lib/llm-config";
import {
  compactText,
  experienceCompanyLabel,
  experienceRoleLabel,
  experienceTitleLabel,
  formatExperienceDateRange,
} from "@/lib/experience-display";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ExperiencesPage() {
  const [experiences, lenses, principles, skills, tags, llmStatuses] = await Promise.all([
    getExperienceListRecords(),
    getLenses(),
    getPrinciples(),
    getSkills(),
    getTags(),
    getLlmConnectionStatuses("contentReview"),
  ]);

  const lensNames = new Map(lenses.map((lens) => [lens.id, lens.name]));
  const principleNames = new Map(principles.map((principle) => [principle.id, principle.title]));
  const skillNames = new Map(skills.map((skill) => [skill.id, skill.name]));
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]));
  const hasActiveAiReview = experiences.some((experience) =>
    ["queued", "processing"].includes(experience.aiReviewStatus),
  );
  const hasQueuedAiReview = experiences.some((experience) => experience.aiReviewStatus === "queued");
  const usableLlmCount = llmStatuses.filter(
    (status) => status.status === "online" && Boolean(status.model),
  ).length;
  const aiReviewDisabledReason =
    llmStatuses.length === 0
      ? "No LLM provider is configured. Configure a reachable provider before running AI review."
      : usableLlmCount === 0
        ? "No LLM connection is online with a configured model. Check provider configuration before running AI review."
        : null;

  return (
    <main className="px-5 py-8 lg:px-8">
      <LlmTaskAutoStarter enabled={hasQueuedAiReview} />
      <TasksAutoRefresh enabled={hasActiveAiReview} />
      <PageTitle
        title="Experience"
        description="Draft, preview, publish, and archive professional experience as structured portfolio content."
        actions={
          <form action={createExperienceDraftAction}>
            <button type="submit" className="ui-btn-primary">
              <Plus className="size-4" aria-hidden /> New Experience
            </button>
          </form>
        }
      />
      <ExperienceEditorialList
        items={experiences.map((experience) => ({
          id: experience.id,
          role: experienceRoleLabel(experience),
          company: experienceCompanyLabel(experience),
          title: experienceTitleLabel(experience),
          status: experience.status,
          dateRange: formatExperienceDateRange(
            experience.startDate,
            experience.endDate,
            experience.isCurrent,
          ),
          location: experience.location ?? "",
          summary: compactText(experience.summary),
          skills: experience.skillIds.flatMap((id) => {
            const label = skillNames.get(id);
            return label ? [label] : [];
          }),
          tags: experience.tagIds.flatMap((id) => {
            const label = tagNames.get(id);
            return label ? [label] : [];
          }),
          metadata: [
            ...experience.lensIds.flatMap((id) => {
              const label = lensNames.get(id);
              return label ? [label] : [];
            }),
            ...experience.principleIds.flatMap((id) => {
              const label = principleNames.get(id);
              return label ? [label] : [];
            }),
          ],
          updatedLabel: `Updated ${formatDate(experience.updatedAt)}`,
          aiQualityScore: experience.contentQualityScore,
          aiSummary: experience.aiSummary,
          aiReviewedAt: experience.lastAiReviewAt,
          aiReviewStatus: experience.aiReviewStatus,
          aiReviewError: experience.aiReviewError,
          editHref: `/content/experiences/${experience.id}`,
          previewHref: `/content/experiences/${experience.id}/preview`,
        }))}
        publishAction={publishExperienceAction}
        unpublishAction={unpublishExperienceAction}
        archiveAction={archiveExperienceAction}
        duplicateAction={duplicateExperienceAction}
        deleteAction={deleteExperienceAction}
        runAllReviewAction={runAllExperienceAiReviewsAction}
        canRunAiReview={usableLlmCount > 0}
        aiReviewDisabledReason={aiReviewDisabledReason}
      />
    </main>
  );
}

import { Plus } from "lucide-react";

import {
  getAdminContentIndex,
  getCaseStudyListRecords,
} from "@portfolio/db/queries";

import {
  archiveCaseStudyAction,
  createCaseStudyDraftAction,
  deleteCaseStudyAction,
  duplicateCaseStudyAction,
  publishCaseStudyAction,
  runAllCaseStudyAiReviewsAction,
  unpublishCaseStudyAction,
} from "@/app/actions";
import { EditorialList } from "@/components/editorial/editorial-list";
import { LlmTaskAutoStarter } from "@/components/llm-task-auto-starter";
import { PageTitle } from "@/components/page-title";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";
import { caseStudyTitleLabel, compactText } from "@/lib/editorial-display";
import { formatDate } from "@/lib/format";
import { getLlmConnectionStatuses } from "@/lib/llm-config";

export const dynamic = "force-dynamic";

export default async function CaseStudiesPage() {
  const [caseStudies, content, llmStatuses] = await Promise.all([
    getCaseStudyListRecords(),
    getAdminContentIndex(),
    getLlmConnectionStatuses("contentReview"),
  ]);

  const experienceNames = new Map(
    content.experiences.map((experience) => [
      experience.id,
      `${experience.role || "Untitled role"} at ${experience.company || "Company not set"}`,
    ]),
  );
  const projectNames = new Map(content.projects.map((project) => [project.id, project.name]));
  const lensNames = new Map(content.lenses.map((lens) => [lens.id, lens.name]));
  const principleNames = new Map(content.principles.map((principle) => [principle.id, principle.title]));
  const skillNames = new Map(content.skills.map((skill) => [skill.id, skill.name]));
  const tagNames = new Map(content.tags.map((tag) => [tag.id, tag.name]));
  const hasActiveAiReview = caseStudies.some((caseStudy) =>
    ["queued", "processing"].includes(caseStudy.aiReviewStatus),
  );
  const hasQueuedAiReview = caseStudies.some((caseStudy) => caseStudy.aiReviewStatus === "queued");
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
        title="Case Studies"
        description="Draft, preview, publish, archive, and review case studies as structured editorial stories."
        actions={
          <form action={createCaseStudyDraftAction}>
            <button type="submit" className="ui-btn-primary">
              <Plus className="size-4" aria-hidden /> New Case Study
            </button>
          </form>
        }
      />
      <EditorialList
        title="Editorial queue"
        listPath="/content/case-studies"
        emptyTitle="No case study drafts yet"
        emptyDescription="Create a draft to start shaping a case study."
        runAllLabel="Run AI Review for All Case Studies"
        items={caseStudies.map((caseStudy) => {
          const relatedProjects = caseStudy.projectIds.flatMap((id) => {
            const label = projectNames.get(id);
            return label ? [`Project: ${label || "Untitled Project"}`] : [];
          });
          const relatedExperience = caseStudy.experienceIds.flatMap((id) => {
            const label = experienceNames.get(id);
            return label ? [`Experience: ${label}`] : [];
          });
          const storyMetadata = [
            caseStudy.problem.trim() ? `Problem: ${compactText(caseStudy.problem, 80)}` : "",
            caseStudy.outcome.trim() ? `Outcome: ${compactText(caseStudy.outcome, 80)}` : "",
          ].filter(Boolean);

          return {
            id: caseStudy.id,
            title: caseStudyTitleLabel(caseStudy),
            eyebrow: "Case Study",
            status: caseStudy.status,
            dateLabel: "",
            updatedLabel: `Updated ${formatDate(caseStudy.updatedAt)}`,
            summary: compactText(caseStudy.excerpt || caseStudy.problem || caseStudy.context),
            chips: [
              ...caseStudy.lensIds.flatMap((id) => {
                const label = lensNames.get(id);
                return label ? [label] : [];
              }),
              ...caseStudy.skillIds.flatMap((id) => {
                const label = skillNames.get(id);
                return label ? [label] : [];
              }),
              ...caseStudy.tagIds.flatMap((id) => {
                const label = tagNames.get(id);
                return label ? [label] : [];
              }),
            ],
            metadata: [
              ...storyMetadata,
              ...relatedProjects,
              ...relatedExperience,
              ...caseStudy.principleIds.flatMap((id) => {
                const label = principleNames.get(id);
                return label ? [label] : [];
              }),
            ],
            aiQualityScore: caseStudy.contentQualityScore,
            aiSummary: caseStudy.aiSummary,
            aiReviewedAt: caseStudy.lastAiReviewAt,
            aiReviewStatus: caseStudy.aiReviewStatus,
            aiReviewError: caseStudy.aiReviewError,
            editHref: `/content/case-studies/${caseStudy.id}`,
            previewHref: `/content/case-studies/${caseStudy.id}/preview`
          };
        })}
        runAllReviewAction={runAllCaseStudyAiReviewsAction}
        canRunAiReview={usableLlmCount > 0}
        aiReviewDisabledReason={aiReviewDisabledReason}
        publishAction={publishCaseStudyAction}
        unpublishAction={unpublishCaseStudyAction}
        archiveAction={archiveCaseStudyAction}
        duplicateAction={duplicateCaseStudyAction}
        deleteAction={deleteCaseStudyAction}
        contentType="case_study"
      />
    </main>
  );
}

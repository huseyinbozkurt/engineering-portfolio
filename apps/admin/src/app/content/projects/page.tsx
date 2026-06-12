import { Plus } from "lucide-react";

import {
  getAdminContentIndex,
  getProjectListRecords,
} from "@portfolio/db/queries";

import {
  archiveProjectAction,
  createProjectDraftAction,
  deleteProjectAction,
  duplicateProjectAction,
  publishProjectAction,
  runAllProjectAiReviewsAction,
  unpublishProjectAction,
} from "@/app/actions";
import { EditorialList } from "@/components/editorial/editorial-list";
import { LlmTaskAutoStarter } from "@/components/llm-task-auto-starter";
import { PageTitle } from "@/components/page-title";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";
import {
  compactText,
  formatProjectDateRange,
  projectTitleLabel,
  splitAdminListItems,
} from "@/lib/editorial-display";
import { formatDate } from "@/lib/format";
import { getLlmConnectionStatuses } from "@/lib/llm-config";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, content, llmStatuses] = await Promise.all([
    getProjectListRecords(),
    getAdminContentIndex(),
    getLlmConnectionStatuses(),
  ]);

  const experienceNames = new Map(
    content.experiences.map((experience) => [
      experience.id,
      `${experience.role || "Untitled role"} at ${experience.company || "Company not set"}`,
    ]),
  );
  const lensNames = new Map(content.lenses.map((lens) => [lens.id, lens.name]));
  const principleNames = new Map(content.principles.map((principle) => [principle.id, principle.title]));
  const skillNames = new Map(content.skills.map((skill) => [skill.id, skill.name]));
  const tagNames = new Map(content.tags.map((tag) => [tag.id, tag.name]));
  const hasActiveAiReview = projects.some((project) =>
    ["queued", "processing"].includes(project.aiReviewStatus),
  );
  const hasQueuedAiReview = projects.some((project) => project.aiReviewStatus === "queued");
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
        title="Projects"
        description="Draft, preview, publish, archive, and review portfolio projects as editorial content."
        actions={
          <form action={createProjectDraftAction}>
            <button type="submit" className="ui-btn-primary">
              <Plus className="size-4" aria-hidden /> New Project
            </button>
          </form>
        }
      />
      <EditorialList
        title="Editorial queue"
        listPath="/content/projects"
        emptyTitle="No project drafts yet"
        emptyDescription="Create a draft to start shaping a project entry."
        runAllLabel="Run AI Review for All Projects"
        items={projects.map((project) => {
          const stackChips = [
            project.developmentTechStack,
            project.qaTechStack,
            project.aiIntegrationTechStack,
            project.deploymentTechStack,
          ].flatMap(splitAdminListItems);
          const hasReleasedLink =
            project.releaseStatus === "released" && Boolean(project.demoUrl || project.url);
          const hasOpenSourceLink =
            project.sourceAvailability === "open-source" &&
            Boolean(project.repositoryUrl || project.githubUrl);
          const relationMetadata = [
            ...(project.experienceId && experienceNames.has(project.experienceId)
              ? [`Built during ${experienceNames.get(project.experienceId)}`]
              : []),
            ...project.lensIds.flatMap((id) => {
              const label = lensNames.get(id);
              return label ? [label] : [];
            }),
            ...project.principleIds.flatMap((id) => {
              const label = principleNames.get(id);
              return label ? [label] : [];
            }),
            ...(hasReleasedLink ? ["Released link"] : []),
            ...(hasOpenSourceLink ? ["Open source"] : []),
          ];

          return {
            id: project.id,
            title: projectTitleLabel(project),
            eyebrow: "Project",
            status: project.status,
            dateLabel: formatProjectDateRange(project.startDate, project.endDate),
            updatedLabel: `Updated ${formatDate(project.updatedAt)}`,
            summary: compactText(project.description),
            chips: [
              ...stackChips,
              ...project.skillIds.flatMap((id) => {
                const label = skillNames.get(id);
                return label ? [label] : [];
              }),
              ...project.tagIds.flatMap((id) => {
                const label = tagNames.get(id);
                return label ? [label] : [];
              }),
            ],
            metadata: relationMetadata,
            aiQualityScore: project.contentQualityScore,
            aiSummary: project.aiSummary,
            aiReviewedAt: project.lastAiReviewAt,
            aiReviewStatus: project.aiReviewStatus,
            aiReviewError: project.aiReviewError,
            editHref: `/content/projects/${project.id}`,
            previewHref: `/content/projects/${project.id}/preview`
          };
        })}
        runAllReviewAction={runAllProjectAiReviewsAction}
        canRunAiReview={usableLlmCount > 0}
        aiReviewDisabledReason={aiReviewDisabledReason}
        publishAction={publishProjectAction}
        unpublishAction={unpublishProjectAction}
        archiveAction={archiveProjectAction}
        duplicateAction={duplicateProjectAction}
        deleteAction={deleteProjectAction}
        contentType="project"
      />
    </main>
  );
}

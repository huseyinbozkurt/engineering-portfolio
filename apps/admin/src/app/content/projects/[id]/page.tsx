import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import {
  getAdminContentIndex,
  getProjectById,
  type ProjectEditRecord,
} from "@portfolio/db/queries";

import {
  archiveProjectAction,
  deleteProjectAction,
  patchProjectAction,
  publishProjectAction,
  runProjectAiReviewAction,
  setProjectStatusAction,
  unpublishProjectAction,
} from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { DetailHeader } from "@/components/detail/detail-header";
import { MetaSidebar } from "@/components/detail/meta-sidebar";
import { RichTextView } from "@/components/detail/rich-text-view";
import { SectionCard } from "@/components/detail/section-card";
import { SectionEditForm } from "@/components/detail/section-edit-form";
import { SettingsModal } from "@/components/detail/settings-modal";
import { AiReviewPanel } from "@/components/editorial/ai-review-panel";
import { WorkflowActions } from "@/components/editorial/workflow-actions";
import { Checkbox, CheckboxGroup, Field, SelectField, SeoFields } from "@/components/form-controls";
import {
  ProjectContributionsEditor,
  ProjectDecisionsEditor,
  ProjectEngineeringSignalsEditor,
  ProjectEvidenceEditor,
  ProjectMetricsEditor,
  ProjectOutcomesEditor,
  ProjectSignalsEditor,
  ProjectStringListEditor,
} from "@/components/forms/project-structured-editors";
import { RichTextField } from "@/components/forms/rich-text-field";
import { LlmTaskAutoStarter } from "@/components/llm-task-auto-starter";
import { ModalPanel } from "@/components/modal-panel";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";
import { toAiReviewDetails } from "@/lib/ai-review-details";
import { siblingLinks } from "@/lib/detail-nav";
import { formatProjectDateRange, projectTitleLabel } from "@/lib/editorial-display";
import { formatDate } from "@/lib/format";
import { getLlmConnectionStatuses } from "@/lib/llm-config";
import {
  contributionCategoryOptions,
  engineeringSignalLabels,
  evidenceSourceOptions,
  evidenceTypeOptions,
  normalizeEngineeringSignals,
  normalizeProjectSignals,
  optionLabel,
  outcomeTypeOptions,
  portfolioVisibilityOptions,
  projectConfidentialityOptions,
  projectLifecycleOptions,
  projectOwnershipOptions,
  projectRoleOptions,
  projectSignalLabels,
  projectTypeOptions,
  releaseStatusOptions,
  signalStrengthOptions,
  sourceAvailabilityOptions,
} from "@/lib/project-model";
import { publicHrefs } from "@/lib/public-site";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditPageProps) {
  const { id } = await params;
  const [project, content, llmStatuses] = await Promise.all([
    getProjectById(id),
    getAdminContentIndex(),
    getLlmConnectionStatuses(),
  ]);

  if (!project) {
    notFound();
  }

  const lensName = new Map(content.lenses.map((lens) => [lens.id, lens.name]));
  const principleName = new Map(content.principles.map((p) => [p.id, p.title]));
  const skillName = new Map(content.skills.map((s) => [s.id, s.name]));
  const tagName = new Map(content.tags.map((t) => [t.id, t.name]));
  const experience = content.experiences.find((item) => item.id === project.experienceId);

  const positionOptions = [
    { label: "— No related position —", value: "" },
    ...content.experiences.map((item) => ({
      label: `${item.role || "Untitled role"} at ${item.company || "Company not set"}`,
      value: item.id,
    })),
  ];
  const lensOptions = content.lenses.map((lens) => ({ id: lens.id, label: lens.name }));
  const principleOptions = content.principles.map((p) => ({ id: p.id, label: p.title }));
  const skillOptions = content.skills.map((s) => ({ id: s.id, label: s.name, category: s.category }));
  const tagOptions = content.tags.map((t) => ({ id: t.id, label: t.name, category: t.category }));
  const hasActiveAiReview = ["queued", "processing"].includes(project.aiReviewStatus);
  const usableLlmCount = llmStatuses.filter(
    (status) => status.status === "online" && Boolean(status.model),
  ).length;
  const aiReviewDisabledReason =
    llmStatuses.length === 0
      ? "No LLM provider is configured. Configure a reachable provider before running AI review."
      : usableLlmCount === 0
        ? "No LLM connection is online with a configured model. Check provider configuration before running AI review."
        : null;

  const siblings = siblingLinks(content.projects, project.id, (item) => ({
    href: `/content/projects/${item.id}`,
    label: projectTitleLabel(item),
  }));

  const stackBoxes = [
    { title: "Development Tech Stack", value: project.developmentTechStack },
    { title: "Q&A Tech Stack", value: project.qaTechStack },
    { title: "AI Integration Tech Stack", value: project.aiIntegrationTechStack },
    { title: "Deployment Tech Stack", value: project.deploymentTechStack },
  ].filter((box) => box.value.trim().length > 0);
  const architectureEmpty =
    project.architecture.trim().length === 0 && stackBoxes.length === 0;
  const engineeringSignals = normalizeEngineeringSignals(project.engineeringSignals);
  const projectSignals = normalizeProjectSignals(project.projectSignals);
  const narrativeEmpty =
    project.motivation.trim().length === 0 &&
    project.problem.trim().length === 0 &&
    project.constraints.length === 0 &&
    project.tradeOffs.length === 0 &&
    project.whatILearned.length === 0;
  const repositoryDemoEmpty =
    project.sourceAvailability === "closed-source" &&
    project.releaseStatus === "in-development" &&
    !project.repositoryUrl &&
    !project.demoUrl;
  const releasedProjectHref =
    project.releaseStatus === "released" ? project.demoUrl ?? project.url : null;
  const openSourceHref =
    project.sourceAvailability === "open-source"
      ? project.repositoryUrl ?? project.githubUrl
      : null;

  // Shown in the header only when at least one date is set.
  const projectDateRange = formatProjectDateRange(project.startDate, project.endDate);
  const editPath = `/content/projects/${project.id}`;
  const previewPath = `/content/projects/${project.id}/preview`;

  const metaGroups = [
    {
      title: "Position",
      items: experience
        ? [{ id: experience.id, label: `${experience.role} at ${experience.company}` }]
        : [],
    },
    {
      title: "Lenses",
      items: project.lensIds.flatMap((lid) =>
        lensName.has(lid) ? [{ id: lid, label: lensName.get(lid)! }] : [],
      ),
    },
    {
      title: "Skills",
      items: project.skillIds.flatMap((sid) =>
        skillName.has(sid) ? [{ id: sid, label: skillName.get(sid)! }] : [],
      ),
    },
    {
      title: "Operating principles",
      items: project.principleIds.flatMap((pid) =>
        principleName.has(pid) ? [{ id: pid, label: principleName.get(pid)! }] : [],
      ),
    },
    {
      title: "Focus areas",
      items: project.tagIds.flatMap((tid) =>
        tagName.has(tid) ? [{ id: tid, label: tagName.get(tid)! }] : [],
      ),
    },
  ];

  const settings = (
    <SettingsModal
      id={project.id}
      action={patchProjectAction}
      fields={[
        "slug",
        "startDate",
        "endDate",
        "position",
        "experienceId",
        "lensIds",
        "principleIds",
        "skillIds",
        "tagIds",
        "seoTitle",
        "seoDescription",
        "ogImage",
      ]}
    >
      <Field label="Slug" name="slug" required defaultValue={project.slug} />
      <Field
        label="Order (lower shows first)"
        name="position"
        type="number"
        defaultValue={String(project.position)}
      />
      <SelectField
        label="Related position"
        name="experienceId"
        options={positionOptions}
        defaultValue={project.experienceId ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Start date"
          name="startDate"
          type="date"
          defaultValue={project.startDate ?? undefined}
        />
        <Field
          label="End date"
          name="endDate"
          type="date"
          defaultValue={project.endDate ?? undefined}
        />
      </div>
      <CheckboxGroup
        label="Related lenses"
        name="lensIds"
        emptyLabel="No lenses available."
        options={lensOptions}
        selectedIds={project.lensIds}
      />
      <CheckboxGroup
        label="Related principles"
        name="principleIds"
        emptyLabel="No principles available."
        options={principleOptions}
        selectedIds={project.principleIds}
      />
      <CheckboxGroup
        label="Skills"
        name="skillIds"
        emptyLabel="No skills available."
        options={skillOptions}
        selectedIds={project.skillIds}
      />
      <CheckboxGroup
        label="Tags"
        name="tagIds"
        emptyLabel="No tags available."
        options={tagOptions}
        selectedIds={project.tagIds}
      />
      <SeoFields defaults={project} />
    </SettingsModal>
  );

  const headerEdit = (
    <ModalPanel
      title="Edit project header"
      description="Name shown at the top of the project page."
      triggerLabel="Edit header"
      size="md"
      triggerClassName="ui-btn-ghost"
      triggerContent={
        <>
          <Pencil className="size-3.5" /> Edit
        </>
      }
    >
      <SectionEditForm
        action={patchProjectAction}
        id={project.id}
        fields="name"
      >
        <Field label="Name" name="name" defaultValue={project.name} />
      </SectionEditForm>
    </ModalPanel>
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <LlmTaskAutoStarter enabled={project.aiReviewStatus === "queued"} />
      <TasksAutoRefresh enabled={hasActiveAiReview} />
      <DetailHeader
        backHref="/content/projects"
        backLabel="All projects"
        prev={siblings.prev}
        next={siblings.next}
        eyebrow="Project"
        title={projectTitleLabel(project)}
        id={project.id}
        status={project.status}
        statusAction={setProjectStatusAction}
        actions={
          <WorkflowActions
            id={project.id}
            status={project.status}
            editPath={editPath}
            previewPath={previewPath}
            publishAction={publishProjectAction}
            unpublishAction={unpublishProjectAction}
            archiveAction={archiveProjectAction}
          />
        }
        publicHref={
          project.status === "published" && project.portfolioVisibility === "public"
            ? publicHrefs.project(project.slug)
            : null
        }
        settings={settings}
        headerEdit={headerEdit}
        subtitle={
          experience || projectDateRange ? (
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
              {projectDateRange ? (
                <span className="text-accent-200">{projectDateRange}</span>
              ) : null}
              {experience ? (
                <span>
                  Built during{" "}
                  <span className="text-warning-200">
                    {experience.role} at {experience.company}
                  </span>
                </span>
              ) : null}
              <span className="text-muted/70">Updated {formatDate(project.updatedAt)}</span>
            </span>
          ) : (
            <span className="text-sm text-muted/70">Updated {formatDate(project.updatedAt)}</span>
          )
        }
      >
        {releasedProjectHref || openSourceHref ? (
          <div className="flex flex-wrap gap-3">
            {releasedProjectHref ? (
              <a
                href={releasedProjectHref}
                target="_blank"
                rel="noreferrer"
                className="ui-btn-primary"
              >
                Visit project ↗
              </a>
            ) : null}
            {openSourceHref ? (
              <a
                href={openSourceHref}
                target="_blank"
                rel="noreferrer"
                className="ui-btn-secondary"
              >
                View source ↗
              </a>
            ) : null}
          </div>
        ) : null}
      </DetailHeader>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 gap-6">
          <SectionCard
            title="Overview"
            id={project.id}
            action={patchProjectAction}
            fields={["description", "details"]}
            isEmpty={project.description.trim().length === 0 && project.details.trim().length === 0}
            addLabel="Add an overview"
            modalDescription="Edit the public summary and longer-form project detail."
            preview={
              <div className="grid gap-5">
                {project.description.trim().length > 0 ? (
                  <div>
                    <h3 className="ui-eyebrow mb-3">Summary</h3>
                    <RichTextView value={project.description} />
                  </div>
                ) : null}
                {project.details.trim().length > 0 ? (
                  <div>
                    <h3 className="ui-eyebrow mb-3">Details</h3>
                    <RichTextView value={project.details} />
                  </div>
                ) : null}
              </div>
            }
            formFields={
              <>
                <RichTextField
                  label="Summary"
                  name="description"
                  rows={6}
                  defaultValue={project.description}
                  hint="Short summary shown on project cards and at the top of the project page."
                />
                <RichTextField
                  label="Details"
                  name="details"
                  rows={12}
                  defaultValue={project.details}
                  hint="Long-form, in-depth content shown on the project detail page."
                />
              </>
            }
          />
          <SectionCard
            title="Classification"
            id={project.id}
            action={patchProjectAction}
            fields={[
              "portfolioVisibility",
              "featured",
              "projectType",
              "projectStatus",
              "projectRole",
              "confidentiality",
              "ownership",
              "teamSize",
              "durationMonths",
            ]}
            isEmpty={false}
            addLabel="Edit classification"
            modalDescription="Classify the project separately from its editorial draft/published status."
            eyebrow={
              "Editorial status controls workflow. Portfolio visibility controls whether a published project appears publicly."
            }
            preview={<ClassificationPreview project={project} />}
            formFields={
              <>
                <div className="rounded-xl border border-line bg-white/[0.02] p-4 text-sm leading-6 text-muted">
                  <p>
                    Editorial status controls whether this record is draft, published, or archived.
                    Project lifecycle status describes whether the underlying project is active,
                    completed, in maintenance, or similar.
                  </p>
                  <p className="mt-2">
                    Portfolio visibility controls whether a published project appears on the public
                    portfolio. Confidentiality describes how much sensitive detail the project can
                    safely disclose.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Portfolio visibility"
                    name="portfolioVisibility"
                    options={[...portfolioVisibilityOptions]}
                    defaultValue={project.portfolioVisibility}
                  />
                  <Checkbox label="Featured" name="featured" defaultChecked={project.featured} />
                  <SelectField
                    label="Project type"
                    name="projectType"
                    options={[...projectTypeOptions]}
                    defaultValue={project.projectType}
                  />
                  <SelectField
                    label="Lifecycle status"
                    name="projectStatus"
                    options={[...projectLifecycleOptions]}
                    defaultValue={project.projectStatus}
                  />
                  <SelectField
                    label="Role"
                    name="projectRole"
                    options={[...projectRoleOptions]}
                    defaultValue={project.projectRole}
                  />
                  <SelectField
                    label="Ownership"
                    name="ownership"
                    options={[...projectOwnershipOptions]}
                    defaultValue={project.ownership}
                  />
                  <SelectField
                    label="Confidentiality"
                    name="confidentiality"
                    options={[...projectConfidentialityOptions]}
                    defaultValue={project.confidentiality}
                  />
                  <Field
                    label="Team size"
                    name="teamSize"
                    type="number"
                    defaultValue={project.teamSize === null ? undefined : String(project.teamSize)}
                    hint="Leave empty when unknown or not useful."
                  />
                  <Field
                    label="Duration in months"
                    name="durationMonths"
                    type="number"
                    defaultValue={
                      project.durationMonths === null ? undefined : String(project.durationMonths)
                    }
                    hint="Leave empty when the work was open-ended."
                  />
                </div>
              </>
            }
          />
          <SectionCard
            title="Narrative"
            id={project.id}
            action={patchProjectAction}
            fields={["motivation", "problem", "constraints", "tradeOffs", "whatILearned"]}
            isEmpty={narrativeEmpty}
            addLabel="Add narrative"
            modalDescription="Capture why the project exists, what made it hard, and what changed your thinking."
            preview={
              <div className="grid gap-5">
                {project.motivation.trim().length > 0 ? (
                  <NarrativeBlock title="Motivation" value={project.motivation} />
                ) : null}
                {project.problem.trim().length > 0 ? (
                  <NarrativeBlock title="Problem" value={project.problem} />
                ) : null}
                <StringListPreview title="Constraints" items={project.constraints} />
                <StringListPreview title="Trade-offs" items={project.tradeOffs} />
                <StringListPreview title="What I Learned" items={project.whatILearned} />
              </div>
            }
            formFields={
              <>
                <RichTextField
                  label="Motivation"
                  name="motivation"
                  rows={6}
                  defaultValue={project.motivation}
                  hint="Why this project exists and what triggered the work."
                />
                <RichTextField
                  label="Problem"
                  name="problem"
                  rows={6}
                  defaultValue={project.problem}
                  hint="The challenge this project was meant to solve."
                />
                <ProjectStringListEditor
                  name="constraints"
                  label="Constraints"
                  defaultItems={project.constraints}
                  placeholder="Privacy requirement, cost limit, compatibility constraint..."
                  hint="Privacy, cost, time, compatibility, operational, or regulatory limits."
                  addLabel="Add constraint"
                />
                <ProjectStringListEditor
                  name="tradeOffs"
                  label="Trade-offs"
                  defaultItems={project.tradeOffs}
                  placeholder="Chose local processing over hosted inference to protect privacy."
                  hint="What you chose, and what you consciously did not choose."
                  addLabel="Add trade-off"
                />
                <ProjectStringListEditor
                  name="whatILearned"
                  label="What I learned"
                  defaultItems={project.whatILearned}
                  placeholder="Operational lesson, product lesson, engineering lesson..."
                  hint="Engineering, product, or operational lessons."
                  addLabel="Add lesson"
                />
              </>
            }
          />
          <SectionCard
            title="Contributions"
            id={project.id}
            action={patchProjectAction}
            fields="contributions"
            isEmpty={project.contributions.length === 0}
            addLabel="Add contributions"
            preview={<ContributionsPreview items={project.contributions} />}
            formFields={<ProjectContributionsEditor name="contributions" defaultItems={project.contributions} />}
          />
          <SectionCard
            title="Key Decisions"
            id={project.id}
            action={patchProjectAction}
            fields="decisions"
            isEmpty={project.decisions.length === 0}
            addLabel="Add key decisions"
            modalDescription="Use this to capture engineering judgment: what alternatives existed, what you selected, and why."
            preview={<DecisionsPreview items={project.decisions} />}
            formFields={<ProjectDecisionsEditor name="decisions" defaultItems={project.decisions} />}
            modalSize="xl"
          />
          <SectionCard
            title="Outcomes"
            id={project.id}
            action={patchProjectAction}
            fields="outcomes"
            isEmpty={project.outcomes.length === 0}
            addLabel="Add outcomes"
            preview={<OutcomesPreview items={project.outcomes} />}
            formFields={<ProjectOutcomesEditor name="outcomes" defaultItems={project.outcomes} />}
          />
          <SectionCard
            title="Metrics"
            id={project.id}
            action={patchProjectAction}
            fields="metrics"
            isEmpty={project.metrics.length === 0}
            addLabel="Add metrics"
            preview={<MetricsPreview items={project.metrics} />}
            formFields={<ProjectMetricsEditor name="metrics" defaultItems={project.metrics} />}
          />
          <SectionCard
            title="Architecture & Tech Stacks"
            id={project.id}
            action={patchProjectAction}
            fields={[
              "architecture",
              "developmentTechStack",
              "qaTechStack",
              "aiIntegrationTechStack",
              "deploymentTechStack",
            ]}
            isEmpty={architectureEmpty}
            addLabel="Add architecture"
            modalDescription="Preserve the existing architecture narrative and stack fields."
            preview={
              <div className="grid gap-4">
                {project.architecture.trim().length > 0 ? (
                  <div className="rounded-xl border border-line bg-white/[0.02] p-5">
                    <RichTextView value={project.architecture} />
                  </div>
                ) : null}
                {stackBoxes.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {stackBoxes.map((box) => (
                      <div
                        key={box.title}
                        className="rounded-xl border border-line bg-white/[0.02] p-5"
                      >
                        <h3 className="ui-eyebrow">{box.title}</h3>
                        <div className="mt-3">
                          <RichTextView value={box.value} dense />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            }
            formFields={
              <>
                <RichTextField
                  label="Architecture overview"
                  name="architecture"
                  rows={8}
                  defaultValue={project.architecture}
                  hint="Optional architecture narrative shown before the stack boxes."
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <RichTextField
                    label="Development Tech Stack"
                    name="developmentTechStack"
                    rows={6}
                    defaultValue={project.developmentTechStack}
                  />
                  <RichTextField
                    label="Q&A Tech Stack"
                    name="qaTechStack"
                    rows={6}
                    defaultValue={project.qaTechStack}
                  />
                  <RichTextField
                    label="AI Integration Tech Stack"
                    name="aiIntegrationTechStack"
                    rows={6}
                    defaultValue={project.aiIntegrationTechStack}
                  />
                  <RichTextField
                    label="Deployment Tech Stack"
                    name="deploymentTechStack"
                    rows={6}
                    defaultValue={project.deploymentTechStack}
                  />
                </div>
              </>
            }
          />
          <SectionCard
            title="Engineering Maturity"
            id={project.id}
            action={patchProjectAction}
            fields="engineeringSignals"
            isEmpty={false}
            addLabel="Edit engineering maturity"
            preview={<EngineeringSignalsPreview signals={engineeringSignals} />}
            formFields={
              <ProjectEngineeringSignalsEditor
                name="engineeringSignals"
                defaultValue={engineeringSignals}
              />
            }
          />
          <SectionCard
            title="Project Signals"
            id={project.id}
            action={patchProjectAction}
            fields="projectSignals"
            isEmpty={false}
            addLabel="Edit project signals"
            modalDescription="Self-assessed supporting signals. These help editorial prioritization; they are not proof by themselves."
            preview={<ProjectSignalsPreview signals={projectSignals} />}
            formFields={<ProjectSignalsEditor name="projectSignals" defaultValue={projectSignals} />}
          />
          <SectionCard
            title="Evidence"
            id={project.id}
            action={patchProjectAction}
            fields="evidence"
            isEmpty={project.evidence.length === 0}
            addLabel="Add evidence"
            preview={<EvidencePreview items={project.evidence} />}
            formFields={<ProjectEvidenceEditor name="evidence" defaultItems={project.evidence} />}
            modalSize="xl"
          />
          <SectionCard
            title="Source & Release"
            id={project.id}
            action={patchProjectAction}
            fields={[
              "sourceAvailability",
              "repositoryUrl",
              "releaseStatus",
              "demoUrl",
              "url",
              "githubUrl",
            ]}
            isEmpty={repositoryDemoEmpty && !project.url && !project.githubUrl}
            addLabel="Add source or release"
            modalDescription={
              "Source availability controls repository links. Release status controls demo and project links."
            }
            preview={<RepositoryDemoPreview project={project} />}
            formFields={
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Source availability"
                    name="sourceAvailability"
                    options={[...sourceAvailabilityOptions]}
                    defaultValue={project.sourceAvailability}
                    hint="Repository URLs are public only when source availability is open source."
                  />
                  <Field
                    label="Repository URL"
                    name="repositoryUrl"
                    type="url"
                    defaultValue={project.repositoryUrl ?? undefined}
                  />
                  <SelectField
                    label="Release status"
                    name="releaseStatus"
                    options={[...releaseStatusOptions]}
                    defaultValue={project.releaseStatus}
                    hint="Demo and project URLs are public only when release status is released."
                  />
                  <Field
                    label="Demo URL"
                    name="demoUrl"
                    type="url"
                    defaultValue={project.demoUrl ?? undefined}
                  />
                </div>
                <div className="grid gap-4 rounded-xl border border-line bg-white/[0.02] p-4 md:grid-cols-2">
                  <Field
                    label="Project URL"
                    name="url"
                    type="url"
                    defaultValue={project.url ?? undefined}
                    hint={
                      "Compatibility field for the project URL. Release status still controls public rendering."
                    }
                  />
                  <Field
                    label="Legacy GitHub URL"
                    name="githubUrl"
                    type="url"
                    defaultValue={project.githubUrl ?? undefined}
                    hint="Compatibility field. Source availability still controls public rendering."
                  />
                </div>
              </>
            }
          />
          <SectionCard
            title="Relationships"
            id={project.id}
            action={patchProjectAction}
            fields={["experienceId", "lensIds", "principleIds", "skillIds", "tagIds"]}
            isEmpty={metaGroups.every((group) => group.items.length === 0)}
            addLabel="Add relationships"
            preview={<RelationshipsPreview groups={metaGroups} />}
            formFields={
              <>
                <SelectField
                  label="Related position"
                  name="experienceId"
                  options={positionOptions}
                  defaultValue={project.experienceId ?? ""}
                />
                <CheckboxGroup
                  label="Related lenses"
                  name="lensIds"
                  emptyLabel="No lenses available."
                  options={lensOptions}
                  selectedIds={project.lensIds}
                />
                <CheckboxGroup
                  label="Related principles"
                  name="principleIds"
                  emptyLabel="No principles available."
                  options={principleOptions}
                  selectedIds={project.principleIds}
                />
                <CheckboxGroup
                  label="Skills"
                  name="skillIds"
                  emptyLabel="No skills available."
                  options={skillOptions}
                  selectedIds={project.skillIds}
                />
                <CheckboxGroup
                  label="Tags"
                  name="tagIds"
                  emptyLabel="No tags available."
                  options={tagOptions}
                  selectedIds={project.tagIds}
                />
              </>
            }
          />
          <SectionCard
            title="Publishing / Metadata"
            id={project.id}
            action={patchProjectAction}
            fields={[
              "slug",
              "startDate",
              "endDate",
              "position",
              "seoTitle",
              "seoDescription",
              "ogImage",
            ]}
            isEmpty={false}
            addLabel="Edit metadata"
            eyebrow="Draft, publish, unpublish, and archive actions stay in the page header."
            preview={
              <MetadataPreview
                slug={project.slug}
                position={project.position}
                dateRange={projectDateRange}
                seoTitle={project.seoTitle}
                seoDescription={project.seoDescription}
                ogImage={project.ogImage}
              />
            }
            formFields={
              <>
                <Field label="Slug" name="slug" required defaultValue={project.slug} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    label="Start date"
                    name="startDate"
                    type="date"
                    defaultValue={project.startDate ?? undefined}
                  />
                  <Field
                    label="End date"
                    name="endDate"
                    type="date"
                    defaultValue={project.endDate ?? undefined}
                  />
                  <Field
                    label="Order"
                    name="position"
                    type="number"
                    defaultValue={String(project.position)}
                    hint="Lower shows first."
                  />
                </div>
                <SeoFields defaults={project} />
              </>
            }
          />
        </div>

        <aside className="grid h-fit content-start gap-6">
          <AiReviewPanel
            id={project.id}
            redirectTo={editPath}
            action={runProjectAiReviewAction}
            status={project.aiReviewStatus}
            qualityScore={project.contentQualityScore}
            summary={project.aiSummary}
            details={toAiReviewDetails(project.aiSuggestions)}
            reviewedAt={project.lastAiReviewAt}
            error={project.aiReviewError}
            canRunReview={usableLlmCount > 0}
            disabledReason={aiReviewDisabledReason}
          />
          <MetaSidebar groups={metaGroups} />
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger-400/20 bg-danger-500/[0.04] p-5">
        <p className="text-sm text-muted">Permanently remove this project and its relationships.</p>
        <DeleteForm action={deleteProjectAction} id={project.id} label="Delete project" />
      </div>
    </main>
  );
}

function ClassificationPreview({ project }: { project: ProjectEditRecord }) {
  return (
    <DefinitionGrid
      items={[
        [
          "Portfolio visibility",
          optionLabel(portfolioVisibilityOptions, project.portfolioVisibility),
        ],
        ["Featured", project.featured ? "Yes" : "No"],
        ["Type", optionLabel(projectTypeOptions, project.projectType)],
        ["Lifecycle", optionLabel(projectLifecycleOptions, project.projectStatus)],
        ["Role", optionLabel(projectRoleOptions, project.projectRole)],
        ["Ownership", optionLabel(projectOwnershipOptions, project.ownership)],
        ["Confidentiality", optionLabel(projectConfidentialityOptions, project.confidentiality)],
        ["Team size", project.teamSize === null ? "Not set" : String(project.teamSize)],
        [
          "Duration",
          project.durationMonths === null ? "Not set" : `${project.durationMonths} months`,
        ],
      ]}
    />
  );
}

function NarrativeBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] p-5">
      <h3 className="ui-eyebrow mb-3">{title}</h3>
      <RichTextView value={value} dense />
    </div>
  );
}

function StringListPreview({ title, items }: { title: string; items: readonly string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="ui-eyebrow mb-3">{title}</h3>
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-sm leading-6 text-muted">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContributionsPreview({ items }: { items: ProjectEditRecord["contributions"] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item, index) => (
        <li key={`${item.category}-${index}`} className="rounded-xl border border-line bg-white/[0.02] p-4">
          <p className="ui-eyebrow">
            {optionLabel(contributionCategoryOptions, item.category)}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}

function DecisionsPreview({ items }: { items: ProjectEditRecord["decisions"] }) {
  return (
    <ul className="grid gap-4">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="rounded-xl border border-line bg-white/[0.02] p-4">
          <h3 className="font-semibold text-ink">{item.title}</h3>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-muted">
            {item.context ? <PreviewText label="Context" value={item.context} /> : null}
            {item.alternativesConsidered.length > 0 ? (
              <div>
                <p className="ui-eyebrow mb-2">Alternatives</p>
                <ul className="grid gap-1.5">
                  {item.alternativesConsidered.map((alternative, alternativeIndex) => (
                    <li key={alternativeIndex}>{alternative}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {item.selectedApproach ? (
              <PreviewText label="Selected approach" value={item.selectedApproach} />
            ) : null}
            {item.rationale ? <PreviewText label="Rationale" value={item.rationale} /> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function OutcomesPreview({ items }: { items: ProjectEditRecord["outcomes"] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item, index) => (
        <li key={`${item.type}-${index}`} className="rounded-xl border border-line bg-white/[0.02] p-4">
          <p className="ui-eyebrow">{optionLabel(outcomeTypeOptions, item.type)}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}

function MetricsPreview({ items }: { items: ProjectEditRecord["metrics"] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="rounded-xl border border-line bg-white/[0.02] p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {item.label}
          </dt>
          <dd className="mt-2 text-xl font-semibold text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EngineeringSignalsPreview({
  signals,
}: {
  signals: ReturnType<typeof normalizeEngineeringSignals>;
}) {
  const keys = Object.keys(engineeringSignalLabels) as Array<keyof typeof engineeringSignalLabels>;

  return (
    <DefinitionGrid
      items={keys.map((key) => [
        engineeringSignalLabels[key],
        optionLabel(signalStrengthOptions, signals[key]),
      ])}
    />
  );
}

function ProjectSignalsPreview({
  signals,
}: {
  signals: ReturnType<typeof normalizeProjectSignals>;
}) {
  const keys = Object.keys(projectSignalLabels) as Array<keyof typeof projectSignalLabels>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {keys.map((key) => (
        <div key={key} className="rounded-xl border border-line bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink">{projectSignalLabels[key]}</p>
            <span className="ui-chip tabular-nums">{signals[key]}/5</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-accent-400"
              style={{ width: `${(signals[key] / 5) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidencePreview({ items }: { items: ProjectEditRecord["evidence"] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item, index) => {
        const source = getAdminEvidenceSource(item);

        return (
          <li key={`${item.title}-${index}`} className="rounded-xl border border-line bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ui-chip">{optionLabel(evidenceTypeOptions, item.type)}</span>
              <span className="ui-chip">{optionLabel(evidenceSourceOptions, source)}</span>
              <span className="ui-chip">{item.visibility}</span>
            </div>
            <h3 className="mt-3 font-semibold text-ink">{item.title}</h3>
            {item.description ? (
              <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
            ) : null}
            {source === "external-url" && item.externalUrl ? (
              <ExternalLinkValue href={item.externalUrl} label={item.externalUrl} />
            ) : null}
            {source === "upload" ? <EvidenceAssetSummary item={item} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

function getAdminEvidenceSource(
  item: ProjectEditRecord["evidence"][number],
): "upload" | "external-url" {
  return item.source ?? (item.assetUrl || item.assetKey ? "upload" : "external-url");
}

function EvidenceAssetSummary({ item }: { item: ProjectEditRecord["evidence"][number] }) {
  const isImage = item.assetMimeType?.toLowerCase().startsWith("image/") ?? false;
  const isVideo = item.assetMimeType?.toLowerCase().startsWith("video/") ?? false;
  const previewUrl = item.assetKey
    ? `/api/project-evidence-assets/${item.assetKey}`
    : item.assetUrl;

  return (
    <div className="mt-4 grid gap-3">
      {previewUrl && isImage ? (
        <img
          src={previewUrl}
          alt=""
          className="max-h-64 w-full rounded-lg border border-line object-contain"
        />
      ) : null}
      {previewUrl && isVideo ? (
        <video
          src={previewUrl}
          controls
          className="max-h-72 w-full rounded-lg border border-line"
        />
      ) : null}
      <DefinitionGrid
        items={[
          ["Asset URL", item.assetUrl ?? "Not set"],
          ["Asset key", item.assetKey ?? "Not set"],
          ["MIME type", item.assetMimeType ?? "Not set"],
          [
            "Size",
            typeof item.assetSizeBytes === "number"
              ? `${item.assetSizeBytes.toLocaleString()} bytes`
              : "Not set",
          ],
        ]}
      />
    </div>
  );
}

function RepositoryDemoPreview({ project }: { project: ProjectEditRecord }) {
  return (
    <div className="grid gap-4">
      <DefinitionGrid
        items={[
          [
            "Source availability",
            optionLabel(sourceAvailabilityOptions, project.sourceAvailability),
          ],
          ["Repository URL", project.repositoryUrl ? project.repositoryUrl : "Not set"],
          ["Release status", optionLabel(releaseStatusOptions, project.releaseStatus)],
          ["Demo URL", project.demoUrl ? project.demoUrl : "Not set"],
        ]}
      />
      {project.url || project.githubUrl ? (
        <div className="rounded-xl border border-line bg-white/[0.02] p-4">
          <p className="ui-eyebrow mb-3">Legacy compatibility fields</p>
          <DefinitionGrid
            items={[
              ["Legacy URL", project.url ?? "Not set"],
              ["Legacy GitHub URL", project.githubUrl ?? "Not set"],
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}

function RelationshipsPreview({
  groups,
}: {
  groups: Array<{ title: string; items: Array<{ id: string; label: string }> }>;
}) {
  return (
    <div className="grid gap-4">
      {groups.map((group) =>
        group.items.length > 0 ? (
          <div key={group.title}>
            <h3 className="ui-eyebrow mb-2">{group.title}</h3>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li key={item.id} className="ui-chip">
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </div>
  );
}

function MetadataPreview({
  slug,
  position,
  dateRange,
  seoTitle,
  seoDescription,
  ogImage,
}: {
  slug: string;
  position: number;
  dateRange: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
}) {
  return (
    <DefinitionGrid
      items={[
        ["Slug", slug],
        ["Dates", dateRange || "Not set"],
        ["Order", String(position)],
        ["SEO title", seoTitle ?? "Not set"],
        ["SEO description", seoDescription ?? "Not set"],
        ["OG image", ogImage ?? "Not set"],
      ]}
    />
  );
}

function PreviewText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="ui-eyebrow mb-1.5">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function ExternalLinkValue({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-3 inline-flex max-w-full break-all text-sm text-accent-200 underline-offset-4 transition hover:underline"
    >
      {label}
    </a>
  );
}

function DefinitionGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-line bg-white/[0.02] p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {label}
          </dt>
          <dd className="mt-2 break-words text-sm leading-6 text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

import { notFound } from "next/navigation";

import {
  getAdminContentIndex,
  getCaseStudyListRecords,
  getProjectById,
} from "@portfolio/db/queries";

import {
  archiveProjectAction,
  publishProjectAction,
  unpublishProjectAction,
} from "@/app/actions";
import { RichTextView } from "@/components/detail/rich-text-view";
import { PreviewActions } from "@/components/editorial/preview-actions";
import {
  compactText,
  formatProjectDateRange,
  projectTitleLabel,
} from "@/lib/editorial-display";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

interface MetaItem {
  id: string;
  label: string;
}

interface StackBox {
  title: string;
  value: string;
}

export default async function ProjectPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const [project, content, caseStudies] = await Promise.all([
    getProjectById(id),
    getAdminContentIndex(),
    getCaseStudyListRecords(),
  ]);

  if (!project) {
    notFound();
  }

  const editPath = `/content/projects/${project.id}`;
  const previewPath = `/content/projects/${project.id}/preview`;
  const projectDateRange = formatProjectDateRange(project.startDate, project.endDate);
  const publishedExperience = content.experiences.find(
    (experience) => experience.id === project.experienceId && experience.status === "published",
  );
  const publishedLenses = new Map(
    content.lenses.filter((lens) => lens.status === "published").map((lens) => [lens.id, lens.name]),
  );
  const publishedPrinciples = new Map(
    content.principles
      .filter((principle) => principle.status === "published")
      .map((principle) => [principle.id, principle.title]),
  );
  const publishedSkills = new Map(
    content.skills.filter((skill) => skill.status === "published").map((skill) => [skill.id, skill.name]),
  );
  const publishedTags = new Map(
    content.tags.filter((tag) => tag.status === "published").map((tag) => [tag.id, tag.name]),
  );

  const stackBoxes: StackBox[] = [
    { title: "Development Tech Stack", value: project.developmentTechStack },
    { title: "Q&A Tech Stack", value: project.qaTechStack },
    { title: "AI Integration Tech Stack", value: project.aiIntegrationTechStack },
    { title: "Deployment Tech Stack", value: project.deploymentTechStack },
  ].filter((box) => box.value.trim().length > 0);
  const lenses = relationItems(project.lensIds, publishedLenses);
  const principles = relationItems(project.principleIds, publishedPrinciples);
  const skills = relationItems(project.skillIds, publishedSkills);
  const tags = relationItems(project.tagIds, publishedTags);
  const relatedCaseStudies = caseStudies.filter(
    (caseStudy) => caseStudy.status === "published" && caseStudy.projectIds.includes(project.id),
  );
  const hasDescription = project.description.trim().length > 0;
  const hasDetails = project.details.trim().length > 0;
  const hasArchitecture = project.architecture.trim().length > 0 || stackBoxes.length > 0;
  const hasMeta =
    Boolean(publishedExperience) ||
    lenses.length > 0 ||
    skills.length > 0 ||
    principles.length > 0 ||
    tags.length > 0;
  const hasLinks = Boolean(project.url || project.githubUrl);

  return (
    <main className="px-5 py-8 lg:px-8">
      <header className="mb-8 border-b border-line pb-6">
        <PreviewActions
          id={project.id}
          status={project.status}
          editPath={editPath}
          previewPath={previewPath}
          publishAction={publishProjectAction}
          unpublishAction={unpublishProjectAction}
          archiveAction={archiveProjectAction}
        />
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent-200/90">
          Project Preview
        </p>
      </header>

      <article className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            Project
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-ink md:text-6xl">
            {projectTitleLabel(project)}
          </h1>
          {projectDateRange ? (
            <p className="mt-3 text-sm font-medium text-violet-200">{projectDateRange}</p>
          ) : null}
          {publishedExperience ? (
            <p className="mt-3 text-sm text-muted">
              Built during{" "}
              <span className="text-violet-200">
                {publishedExperience.role} at {publishedExperience.company}
              </span>
            </p>
          ) : null}
          {hasLinks ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {project.url ? (
                <a href={project.url} target="_blank" rel="noreferrer" className="ui-btn-primary">
                  Visit project
                </a>
              ) : null}
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-btn-secondary"
                >
                  View source
                </a>
              ) : null}
            </div>
          ) : null}
        </header>

        {hasDescription || hasDetails || hasArchitecture || hasMeta ? (
          <div
            className={
              hasMeta ? "mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]" : "mt-10"
            }
          >
            <div className="grid min-w-0 gap-6">
              {hasDescription ? (
                <section className="ui-card rounded-lg p-6 shadow-card lg:p-8">
                  <h2 className="mb-5 text-2xl font-semibold text-ink">Overview</h2>
                  <RichTextView value={project.description} />
                </section>
              ) : null}
              {hasDetails ? (
                <section className="ui-card rounded-lg p-6 shadow-card lg:p-8">
                  <h2 className="mb-5 text-2xl font-semibold text-ink">Details</h2>
                  <RichTextView value={project.details} />
                </section>
              ) : null}
              {hasArchitecture ? (
                <section className="grid gap-4">
                  <h2 className="text-2xl font-semibold text-ink">Architecture</h2>
                  {project.architecture.trim().length > 0 ? (
                    <div className="ui-card rounded-lg p-6 shadow-card lg:p-8">
                      <RichTextView value={project.architecture} />
                    </div>
                  ) : null}
                  {stackBoxes.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {stackBoxes.map((box) => (
                        <section key={box.title} className="ui-card rounded-lg p-5 shadow-card">
                          <h3 className="ui-eyebrow">{box.title}</h3>
                          <div className="mt-4">
                            <RichTextView value={box.value} dense />
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>

            {hasMeta ? (
              <aside className="grid content-start gap-6">
                <MetaGroup
                  title="Position"
                  items={
                    publishedExperience
                      ? [
                          {
                            id: publishedExperience.id,
                            label: `${publishedExperience.role} at ${publishedExperience.company}`,
                          },
                        ]
                      : []
                  }
                />
                <MetaGroup title="Lenses" items={lenses} />
                <MetaGroup title="Skills" items={skills} />
                <MetaGroup title="Operating principles" items={principles} />
                <MetaGroup title="Focus areas" items={tags} />
              </aside>
            ) : null}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-line bg-white/[0.02] p-8 text-sm text-muted">
            This draft has no public body content yet.
          </div>
        )}
      </article>

      {relatedCaseStudies.length > 0 ? (
        <section className="mx-auto mt-14 max-w-7xl border-t border-line pt-10">
          <h2 className="text-2xl font-semibold text-ink">Case Story Highlights</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {relatedCaseStudies.map((caseStudy) => (
              <CaseStoryPreviewCard key={caseStudy.id} caseStudy={caseStudy} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function MetaGroup({ title, items }: { title: string; items: MetaItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.id}
            className="rounded-lg border border-line bg-white/5 px-3 py-1 text-xs text-muted"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function CaseStoryPreviewCard({
  caseStudy,
}: {
  caseStudy: {
    id: string;
    title: string;
    excerpt: string;
    problem: string;
    action: string;
    outcome: string;
  };
}) {
  const parts = [
    { label: "Problem", value: caseStudy.problem },
    { label: "What I Did", value: caseStudy.action },
    { label: "Outcome", value: caseStudy.outcome },
  ].filter((part) => part.value.trim().length > 0);

  return (
    <article className="ui-card rounded-lg p-5 shadow-card">
      <p className="ui-eyebrow">Case story</p>
      <h3 className="mt-3 text-xl font-semibold text-ink">
        {caseStudy.title || "Untitled Case Study"}
      </h3>
      {caseStudy.excerpt ? (
        <p className="mt-3 text-sm leading-6 text-muted">{caseStudy.excerpt}</p>
      ) : null}
      {parts.length > 0 ? (
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {parts.map((part, index) => (
            <li key={part.label} className="border-l border-line pl-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-violet-200">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink">
                  {part.label}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{compactText(part.value, 120)}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  );
}

function relationItems(ids: string[], labels: Map<string, string>): MetaItem[] {
  return ids.flatMap((id) => {
    const label = labels.get(id);
    return label ? [{ id, label }] : [];
  });
}

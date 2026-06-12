import { notFound } from "next/navigation";

import { getAdminContentIndex, getCaseStudyById } from "@portfolio/db/queries";

import {
  archiveCaseStudyAction,
  publishCaseStudyAction,
  unpublishCaseStudyAction,
} from "@/app/actions";
import { RichTextView } from "@/components/detail/rich-text-view";
import { PreviewActions } from "@/components/editorial/preview-actions";
import { caseStudyTitleLabel } from "@/lib/editorial-display";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

interface MetaItem {
  id: string;
  label: string;
}

interface CaseStudySection {
  title: string;
  value: string;
  accent: string;
}

export default async function CaseStudyPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const [caseStudy, content] = await Promise.all([
    getCaseStudyById(id),
    getAdminContentIndex(),
  ]);

  if (!caseStudy) {
    notFound();
  }

  const editPath = `/content/case-studies/${caseStudy.id}`;
  const previewPath = `/content/case-studies/${caseStudy.id}/preview`;
  const publishedLenses = new Map(
    content.lenses.filter((lens) => lens.status === "published").map((lens) => [lens.id, lens.name]),
  );
  const publishedPrinciples = new Map(
    content.principles
      .filter((principle) => principle.status === "published")
      .map((principle) => [principle.id, principle.title]),
  );
  const publishedExperiences = new Map(
    content.experiences
      .filter((experience) => experience.status === "published")
      .map((experience) => [
        experience.id,
        `${experience.role || "Untitled role"} at ${experience.company || "Company not set"}`,
      ]),
  );
  const publishedProjects = new Map(
    content.projects
      .filter((project) => project.status === "published")
      .map((project) => [project.id, project.name || "Untitled Project"]),
  );
  const publishedSkills = new Map(
    content.skills.filter((skill) => skill.status === "published").map((skill) => [skill.id, skill.name]),
  );
  const publishedTags = new Map(
    content.tags.filter((tag) => tag.status === "published").map((tag) => [tag.id, tag.name]),
  );

  const lenses = relationItems(caseStudy.lensIds, publishedLenses);
  const principles = relationItems(caseStudy.principleIds, publishedPrinciples);
  const experiences = relationItems(caseStudy.experienceIds, publishedExperiences);
  const projects = relationItems(caseStudy.projectIds, publishedProjects);
  const skills = relationItems(caseStudy.skillIds, publishedSkills);
  const tags = relationItems(caseStudy.tagIds, publishedTags);
  const sections: CaseStudySection[] = [
    { title: "Context", value: caseStudy.context, accent: "text-sky-200" },
    { title: "Problem", value: caseStudy.problem, accent: "text-rose-200" },
    { title: "Constraints", value: caseStudy.constraints, accent: "text-amber-200" },
    { title: "What I Did", value: caseStudy.action, accent: "text-violet-200" },
    { title: "Trade-offs", value: caseStudy.tradeoffs, accent: "text-amber-200" },
    { title: "Outcome", value: caseStudy.outcome, accent: "text-emerald-200" },
    { title: "What I Learned", value: caseStudy.learning, accent: "text-sky-200" },
  ].filter((section) => section.value.trim().length > 0);
  const hasSidebar =
    experiences.length > 0 ||
    projects.length > 0 ||
    skills.length > 0 ||
    tags.length > 0;

  return (
    <main className="px-5 py-8 lg:px-8">
      <header className="mb-8 border-b border-line pb-6">
        <PreviewActions
          id={caseStudy.id}
          status={caseStudy.status}
          editPath={editPath}
          previewPath={previewPath}
          publishAction={publishCaseStudyAction}
          unpublishAction={unpublishCaseStudyAction}
          archiveAction={archiveCaseStudyAction}
        />
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent-200/90">
          Case Study Preview
        </p>
      </header>

      <section className="border-b border-line pb-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            Case Study
          </p>
          <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-ink md:text-6xl">
            {caseStudyTitleLabel(caseStudy)}
          </h1>
          {caseStudy.excerpt ? (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{caseStudy.excerpt}</p>
          ) : null}
          {lenses.length > 0 || principles.length > 0 ? (
            <div className="mt-7 flex flex-wrap gap-2">
              {[...lenses, ...principles].map((item) => (
                <span key={item.id} className="ui-chip">
                  {item.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {sections.length > 0 || hasSidebar ? (
        <section className="mx-auto grid max-w-7xl gap-8 py-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:py-16">
          {sections.length > 0 ? (
            <div>
              <h2 className="mb-5 text-2xl font-semibold text-ink">Story Flow</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {sections.map((section, index) => (
                  <CaseStudySectionCard key={section.title} section={section} index={index} />
                ))}
              </div>
            </div>
          ) : null}

          {hasSidebar ? (
            <aside className="grid content-start gap-5">
              <MetaPanel title="Related Experience" items={experiences} />
              <MetaPanel title="Related Projects" items={projects} />
              <MetaPanel title="Skills" items={skills} />
              <MetaPanel title="Focus Areas" items={tags} />
            </aside>
          ) : null}
        </section>
      ) : (
        <div className="mx-auto mt-10 max-w-7xl rounded-2xl border border-dashed border-line bg-white/[0.02] p-8 text-sm text-muted">
          This draft has no public story content yet.
        </div>
      )}
    </main>
  );
}

function CaseStudySectionCard({
  section,
  index,
}: {
  section: CaseStudySection;
  index: number;
}) {
  return (
    <article className="ui-card rounded-lg p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
        <span className={`text-sm font-semibold ${section.accent}`}>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-4">
        <RichTextView value={section.value} dense />
      </div>
    </article>
  );
}

function MetaPanel({ title, items }: { title: string; items: MetaItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="ui-card rounded-lg p-4 shadow-card">
      <h2 className="ui-eyebrow">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item.id} className="ui-chip">
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function relationItems(ids: string[], labels: Map<string, string>): MetaItem[] {
  return ids.flatMap((id) => {
    const label = labels.get(id);
    return label ? [{ id, label }] : [];
  });
}

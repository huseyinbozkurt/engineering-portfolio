import { notFound } from "next/navigation";

import { getAdminContentIndex, getExperienceById } from "@portfolio/db/queries";

import {
  archiveExperienceAction,
  publishExperienceAction,
  unpublishExperienceAction,
} from "@/app/actions";
import { RichTextView } from "@/components/detail/rich-text-view";
import { PreviewActions } from "@/components/editorial/preview-actions";
import {
  experienceCompanyLabel,
  experienceRoleLabel,
  formatExperienceDateRange,
} from "@/lib/experience-display";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

interface MetaItem {
  id: string;
  label: string;
}

export default async function ExperiencePreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const [experience, content] = await Promise.all([
    getExperienceById(id),
    getAdminContentIndex(),
  ]);

  if (!experience) {
    notFound();
  }

  const editPath = `/content/experiences/${experience.id}`;
  const previewPath = `/content/experiences/${experience.id}/preview`;
  const dateRange = formatExperienceDateRange(
    experience.startDate,
    experience.endDate,
    experience.isCurrent,
  );
  const awardsRecognition = getAwardsRecognitionItems(experience.awards);

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

  const lenses = relationItems(experience.lensIds, publishedLenses);
  const principles = relationItems(experience.principleIds, publishedPrinciples);
  const skills = relationItems(experience.skillIds, publishedSkills);
  const tags = relationItems(experience.tagIds, publishedTags);
  const hasSummary = experience.summary.trim().length > 0;
  const hasDetails = experience.details.trim().length > 0;
  const hasMeta =
    lenses.length > 0 ||
    skills.length > 0 ||
    principles.length > 0 ||
    tags.length > 0;
  const hasSidebar = awardsRecognition.length > 0 || hasMeta;

  return (
    <main className="px-5 py-8 lg:px-8">
      <header className="mb-8 border-b border-line pb-6">
        <PreviewActions
          id={experience.id}
          status={experience.status}
          editPath={editPath}
          previewPath={previewPath}
          publishAction={publishExperienceAction}
          unpublishAction={unpublishExperienceAction}
          archiveAction={archiveExperienceAction}
        />
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent-200/90">
          Experience Preview
        </p>
      </header>

      <article className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-200">
            Experience
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-ink md:text-6xl">
            {experienceRoleLabel(experience)}
          </h1>
          <p className="mt-3 text-xl text-muted">{experienceCompanyLabel(experience)}</p>
          {dateRange || experience.location ? (
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {dateRange ? <span className="text-accent-200">{dateRange}</span> : null}
              {dateRange && experience.location ? (
                <span className="text-muted/50" aria-hidden>
                  /
                </span>
              ) : null}
              {experience.location ? <span className="text-muted">{experience.location}</span> : null}
            </div>
          ) : null}
          <p className="mt-3 text-xs text-muted/70">Updated {formatDate(experience.updatedAt)}</p>
        </header>

        {hasSummary || hasDetails || hasSidebar ? (
          <div
            className={
              hasSidebar ? "mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]" : "mt-10"
            }
          >
            <div className="grid min-w-0 gap-6">
              {hasSummary ? (
                <section className="ui-card rounded-lg p-6 shadow-card lg:p-8">
                  <h2 className="mb-5 text-2xl font-semibold text-ink">Summary</h2>
                  <RichTextView value={experience.summary} />
                </section>
              ) : null}
              {hasDetails ? (
                <section className="ui-card rounded-lg p-6 shadow-card lg:p-8">
                  <h2 className="mb-5 text-2xl font-semibold text-ink">Details</h2>
                  <RichTextView value={experience.details} />
                </section>
              ) : null}
            </div>

            {hasSidebar ? (
              <aside className="grid content-start gap-6">
                <AwardsRecognition items={awardsRecognition} />
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
    </main>
  );
}

function MetaGroup({ title, items }: { title: string; items: MetaItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-accent-200">
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

function AwardsRecognition({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="ui-card rounded-lg p-4 shadow-card">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-warning-200">
        Awards &amp; Recognition
      </h2>
      <ol className="mt-4 grid gap-3">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-xs font-semibold text-accent-200">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-muted">{item}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function relationItems(ids: string[], labels: Map<string, string>): MetaItem[] {
  return ids.flatMap((id) => {
    const label = labels.get(id);
    return label ? [{ id, label }] : [];
  });
}

function getAwardsRecognitionItems(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim().replace(/^(?:[-*]|\d+[.)])\s+/, ""))
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

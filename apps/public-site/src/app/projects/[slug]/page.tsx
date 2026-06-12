import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProjectBySlug, type ProjectRecord } from "@portfolio/db/queries";

import { CaseStoryCard } from "@/components/case-story-card";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";
import { formatDateRange } from "@/lib/format";
import {
  contributionCategoryLabels,
  evidenceTypeLabels,
  getEngineeringSignalEntries,
  getProjectSignalEntries,
  getProjectTechTags,
  getPublicEvidence,
  getSafeProjectLinks,
  getVisibleMetrics,
  outcomeTypeLabels,
  projectConfidentialityLabels,
  projectOwnershipLabels,
  projectRoleLabels,
  projectStatusLabels,
  projectTypeLabels,
} from "@/lib/project-display";
import { experienceHref, projectHref } from "@/lib/paths";
import { siteConfig } from "@/lib/site";

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getProjectBySlug(slug);

  if (!detail) {
    return {
      title: "Project",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    detail.project.seoDescription || detail.project.description || siteConfig.description;

  return {
    title: detail.project.seoTitle || detail.project.name,
    description,
    alternates: {
      canonical: projectHref(detail.project),
    },
    openGraph: {
      title: detail.project.name,
      description,
      url: projectHref(detail.project),
    },
    twitter: {
      card: "summary_large_image",
      title: detail.project.name,
      description,
    },
  };
}

interface ArchitectureStackBox {
  title: string;
  value: string;
}

interface MetaItem {
  id: string;
  label: string;
  href?: string;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const { slug } = await params;
  const detail = await getProjectBySlug(slug);

  if (!detail) {
    notFound();
  }

  const { project } = detail;
  const isNda = project.confidentiality === "nda";
  const projectName = getProjectName(project);
  const projectDateRange = formatDateRange(project.startDate, project.endDate, false);
  const { demoHref, repositoryHref } = getSafeProjectLinks(project, {
    includeRepository: !isNda,
  });
  const publicEvidence = getPublicEvidence(project);
  const metrics = getVisibleMetrics(project);
  const engineeringSignals = getEngineeringSignalEntries(project);
  const projectSignals = isNda ? [] : getProjectSignalEntries(project);
  const techTags = isNda ? [] : getProjectTechTags(project, 8);
  const constraints = isNda ? [] : cleanItems(project.constraints);
  const tradeOffs = isNda ? [] : cleanItems(project.tradeOffs);
  const lessons = isNda ? [] : cleanItems(project.whatILearned);
  const contributions = isNda
    ? []
    : project.contributions.filter((item) => item.description.trim().length > 0);
  const decisions = isNda
    ? []
    : project.decisions.filter((item) => decisionHasContent(item));
  const outcomes = isNda
    ? []
    : project.outcomes.filter((item) => item.description.trim().length > 0);
  const hasMotivation = !isNda && project.motivation.trim().length > 0;
  const hasProblem = !isNda && project.problem.trim().length > 0;
  const showFallbackOverview =
    !isNda && project.details.trim().length > 0 && !hasMotivation && !hasProblem;
  const architectureStackBoxes: ArchitectureStackBox[] = isNda
    ? []
    : [
        { title: "Development Tech Stack", value: project.developmentTechStack },
        { title: "Q&A Tech Stack", value: project.qaTechStack },
        { title: "AI Integration Tech Stack", value: project.aiIntegrationTechStack },
        { title: "Deployment Tech Stack", value: project.deploymentTechStack },
      ].filter((box) => box.value.trim().length > 0);
  const hasArchitecture =
    !isNda && (project.architecture.trim().length > 0 || architectureStackBoxes.length > 0);
  const relatedCaseStudies = isNda ? [] : detail.caseStudies;
  const relationshipGroups = [
    {
      title: "Lenses",
      items: detail.lenses.map((lens) => ({
        id: lens.id,
        label: lens.name,
        href: `/lenses/${lens.slug}`,
      })),
    },
    {
      title: "Skills",
      items: detail.skills.map((skill) => ({ id: skill.id, label: skill.name })),
    },
    {
      title: "Operating Principles",
      items: detail.principles.map((principle) => ({
        id: principle.id,
        label: principle.title,
      })),
    },
    {
      title: "Focus Areas",
      items: detail.tags.map((tag) => ({ id: tag.id, label: tag.name })),
    },
  ];
  const hasRelationshipContext = relationshipGroups.some((group) => group.items.length > 0);

  return (
    <>
      <section className="quiet-grid border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
          >
            <span aria-hidden>←</span> All projects
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            Project
          </p>
          <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-ink md:text-6xl">
            {projectName}
          </h1>
          {project.description ? (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{project.description}</p>
          ) : null}
          <div className="mt-7 flex flex-wrap gap-2">
            <StatusPill label={projectTypeLabels[project.projectType]} />
            <StatusPill label={projectStatusLabels[project.projectStatus]} />
            <StatusPill label={projectRoleLabels[project.projectRole]} />
            <StatusPill label={projectOwnershipLabels[project.ownership]} />
            {project.featured ? <StatusPill label="Featured" /> : null}
            {project.confidentiality !== "none" ? (
              <StatusPill label={projectConfidentialityLabels[project.confidentiality]} />
            ) : null}
            {projectDateRange ? <StatusPill label={projectDateRange} /> : null}
          </div>
          {demoHref || repositoryHref ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {demoHref ? <HeroAction href={demoHref} label="View Demo" variant="primary" /> : null}
              {repositoryHref ? (
                <HeroAction href={repositoryHref} label="View Source" variant="secondary" />
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <article className="mx-auto grid max-w-7xl gap-6 px-5 py-12 lg:px-8 lg:py-16">
        {isNda ? <ConfidentialNotice project={project} /> : null}
        {showFallbackOverview ? (
          <RichTextSection title="Project Overview" value={project.details} />
        ) : null}
        {hasMotivation ? <RichTextSection title="Motivation" value={project.motivation} /> : null}
        {hasProblem ? <RichTextSection title="Problem" value={project.problem} /> : null}
        {constraints.length > 0 ? <ListSection title="Constraints" items={constraints} /> : null}
        {contributions.length > 0 ? <ContributionsSection items={contributions} /> : null}
        {decisions.length > 0 ? <DecisionsSection items={decisions} /> : null}
        {tradeOffs.length > 0 ? <ListSection title="Trade-offs" items={tradeOffs} /> : null}
        {outcomes.length > 0 ? <OutcomesSection items={outcomes} /> : null}
        {metrics.length > 0 ? <MetricsSection items={metrics} /> : null}
        {engineeringSignals.length > 0 ? (
          <EngineeringMaturitySection entries={engineeringSignals} />
        ) : null}
        {projectSignals.length > 0 ? <ProjectSignalProfile entries={projectSignals} /> : null}
        {publicEvidence.length > 0 ? <EvidenceSection items={publicEvidence} /> : null}
        {hasArchitecture ? (
          <ArchitectureSection
            project={project}
            stackBoxes={architectureStackBoxes}
            tags={techTags}
          />
        ) : null}
      </article>

      {relatedCaseStudies.length > 0 ? (
        <section className="border-y border-line bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
            <SectionHeading
              title="Related Case Studies"
              description="Problem-to-outcome stories connected to this project."
            />
            <div className="grid gap-4 lg:grid-cols-2">
              {relatedCaseStudies.map((caseStudy) => (
                <CaseStoryCard key={caseStudy.id} caseStudy={caseStudy} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!isNda && (detail.experience || hasRelationshipContext) ? (
        <section className="mx-auto grid max-w-7xl gap-6 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8 lg:py-16">
          {detail.experience ? (
            <section className="glass-panel rounded-lg p-6 lg:p-8">
              <SectionTitle title="Related Experience" />
              <p className="mt-4 text-sm leading-6 text-muted">
                Built during{" "}
                <Link
                  href={experienceHref(detail.experience)}
                  className="text-violet-200 underline-offset-4 transition hover:underline"
                >
                  {detail.experience.role} at {detail.experience.company}
                </Link>
                .
              </p>
            </section>
          ) : (
            <div />
          )}

          {hasRelationshipContext ? (
            <aside className="grid content-start gap-5">
              {relationshipGroups.map((group) => (
                <MetaGroup key={group.title} title={group.title} items={group.items} />
              ))}
            </aside>
          ) : null}
        </section>
      ) : null}

      {lessons.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 pb-14 lg:px-8 lg:pb-20">
          <ListSection title="What I Learned" items={lessons} />
        </section>
      ) : null}
    </>
  );
}

function HeroAction({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? [
          "rounded-lg bg-gradient-to-r from-violet-500 to-sky-400 px-5 py-2.5",
          "text-sm font-semibold text-white transition hover:brightness-110",
        ].join(" ")
      : [
          "rounded-lg border border-violet-400/70 px-5 py-2.5",
          "text-sm font-semibold text-ink transition hover:border-violet-300",
          "hover:bg-violet-400/10",
        ].join(" ");

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label} ↗
    </a>
  );
}

function ConfidentialNotice({ project }: { project: ProjectRecord }) {
  return (
    <section className="glass-panel rounded-lg border-amber-300/20 bg-amber-300/[0.04] p-6 lg:p-8">
      <SectionTitle title="Confidential Project Notice" />
      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
        This project is published as a high-level record because it is marked{" "}
        {projectConfidentialityLabels[project.confidentiality].toLowerCase()}. Detailed
        constraints, decisions, trade-offs, architecture, and repository access are intentionally
        withheld from the public page.
      </p>
    </section>
  );
}

function RichTextSection({ title, value }: { title: string; value: string }) {
  if (!value.trim()) {
    return null;
  }

  return (
    <section className="glass-panel rounded-lg p-6 lg:p-8">
      <SectionTitle title={title} />
      <div className="mt-5">
        <RichText value={value} />
      </div>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel rounded-lg p-6 lg:p-8">
      <SectionTitle title={title} />
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="rounded-lg border border-line bg-white/[0.03] p-4 text-sm leading-7 text-muted"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ContributionsSection({ items }: { items: ProjectRecord["contributions"] }) {
  return (
    <section className="glass-panel rounded-lg p-6 lg:p-8">
      <SectionTitle title="Contributions" />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {items.map((item, index) => (
          <article
            key={`${item.category}-${index}`}
            className="rounded-lg border border-line bg-white/[0.03] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              {contributionCategoryLabels[item.category]}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DecisionsSection({ items }: { items: ProjectRecord["decisions"] }) {
  return (
    <section className="glass-panel rounded-lg p-6 lg:p-8">
      <SectionTitle
        title="Key Decisions"
        description="Where the project shows engineering judgment: alternatives, selected approach, and rationale."
      />
      <div className="mt-5 grid gap-4">
        {items.map((item, index) => (
          <article
            key={`${item.title}-${index}`}
            className="rounded-lg border border-violet-300/20 bg-violet-300/[0.045] p-5"
          >
            <h3 className="text-lg font-semibold text-ink">
              {item.title || `Decision ${index + 1}`}
            </h3>
            <div className="mt-4 grid gap-4 text-sm leading-7 text-muted">
              {item.context ? <DecisionPart label="Context" value={item.context} /> : null}
              {item.alternativesConsidered.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                    Alternatives Considered
                  </p>
                  <ul className="mt-2 grid gap-2">
                    {cleanItems(item.alternativesConsidered).map(
                      (alternative, alternativeIndex) => (
                        <li key={alternativeIndex}>{alternative}</li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}
              {item.selectedApproach ? (
                <DecisionPart label="Selected Approach" value={item.selectedApproach} />
              ) : null}
              {item.rationale ? <DecisionPart label="Rationale" value={item.rationale} /> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DecisionPart({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">{label}</p>
      <p className="mt-2">{value}</p>
    </div>
  );
}

function OutcomesSection({ items }: { items: ProjectRecord["outcomes"] }) {
  return (
    <section className="glass-panel rounded-lg p-6 lg:p-8">
      <SectionTitle title="Outcomes" />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {items.map((item, index) => (
          <article
            key={`${item.type}-${index}`}
            className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.045] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              {outcomeTypeLabels[item.type]}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricsSection({ items }: { items: ProjectRecord["metrics"] }) {
  return (
    <section className="glass-panel rounded-lg p-6 lg:p-8">
      <SectionTitle title="Metrics" />
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.055] p-5"
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              {item.label}
            </dt>
            <dd className="mt-3 text-2xl font-semibold text-ink">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function EngineeringMaturitySection({
  entries,
}: {
  entries: ReturnType<typeof getEngineeringSignalEntries>;
}) {
  return (
    <section className="glass-panel rounded-lg p-6 lg:p-8">
      <SectionTitle
        title="Engineering Maturity"
        description="Supporting delivery signals represented in this project."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <div key={entry.key} className="rounded-lg border border-line bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-ink">{entry.label}</p>
            <p className="mt-2 text-sm text-muted">{entry.valueLabel}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectSignalProfile({
  entries,
}: {
  entries: ReturnType<typeof getProjectSignalEntries>;
}) {
  return (
    <section className="glass-panel rounded-lg p-6 lg:p-8">
      <SectionTitle
        title="Project Signal Profile"
        description="Project signal indicators, not external validation."
      />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.key} className="rounded-lg border border-line bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">{entry.label}</p>
              <span className="text-sm font-semibold text-sky-200">{entry.value}/5</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-sky-300"
                style={{ width: `${(entry.value / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceSection({ items }: { items: ProjectRecord["evidence"] }) {
  return (
    <section className="glass-panel rounded-lg p-6 lg:p-8">
      <SectionTitle title="Proof / Evidence" />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {items.map((item, index) => {
          const content = (
            <article className="h-full rounded-lg border border-line bg-white/[0.03] p-4 transition hover:border-sky-300/35">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                {evidenceTypeLabels[item.type]}
              </p>
              <h3 className="mt-3 text-base font-semibold text-ink">{item.title}</h3>
              {item.description ? (
                <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
              ) : null}
              {item.url ? (
                <p className="mt-4 text-sm font-semibold text-sky-300">Open evidence ↗</p>
              ) : null}
            </article>
          );

          return item.url ? (
            <a key={`${item.title}-${index}`} href={item.url} target="_blank" rel="noreferrer">
              {content}
            </a>
          ) : (
            <div key={`${item.title}-${index}`}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}

function ArchitectureSection({
  project,
  stackBoxes,
  tags,
}: {
  project: ProjectRecord;
  stackBoxes: ArchitectureStackBox[];
  tags: string[];
}) {
  return (
    <section className="grid gap-4">
      <SectionTitle title="Architecture / Existing Stack Sections" />
      {project.architecture.trim().length > 0 ? (
        <section className="glass-panel rounded-lg p-6 lg:p-8">
          <RichText value={project.architecture} />
        </section>
      ) : null}
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-sky-300/15 bg-sky-300/[0.06] px-2.5 py-1.5 text-xs text-sky-100/90"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      {stackBoxes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stackBoxes.map((box) => (
            <ArchitectureStackCard key={box.title} box={box} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ArchitectureStackCard({ box }: { box: ArchitectureStackBox }) {
  return (
    <section className="glass-panel rounded-lg p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">
        {box.title}
      </h3>
      <div className="mt-4 [&_.rich-text]:gap-2 [&_.rich-text]:text-sm [&_.rich-text]:leading-6">
        <RichText value={box.value} />
      </div>
    </section>
  );
}

function MetaGroup({ title, items }: { title: string; items: MetaItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
        {title}
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) =>
          item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className={[
                "rounded-lg border border-white/10 bg-white/[0.045] px-3 py-1.5",
                "text-xs text-muted transition hover:border-violet-300/50 hover:text-ink",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ) : (
            <StatusPill key={item.id} label={item.label} />
          ),
        )}
      </div>
    </section>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string | undefined;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
    </div>
  );
}

function cleanItems(items: readonly string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function decisionHasContent(item: ProjectRecord["decisions"][number]): boolean {
  return Boolean(
    item.title.trim() ||
      item.context.trim() ||
      item.selectedApproach.trim() ||
      item.rationale.trim() ||
      cleanItems(item.alternativesConsidered).length > 0,
  );
}

function getProjectName(project: ProjectRecord): string {
  const name = project.name.trim();

  if (name) {
    return name;
  }

  return project.confidentiality === "nda" ? "Confidential Project" : "Project";
}

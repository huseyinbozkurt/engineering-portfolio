import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

import type {
  CaseStudyRecord,
  ExperienceRecord,
  PrincipleRecord,
  ProjectRecord,
} from "@portfolio/db/queries";

import {
  InteractiveTimeline,
  type InteractiveTimelineItem,
} from "@/components/interactive-timeline";
import {
  getProjectTechTags,
  getSafeProjectLinks,
  getVisibleMetrics,
  projectRoleLabels,
  projectStatusLabels,
  projectTypeLabels,
} from "@/lib/project-display";
import { type RecognitionItem } from "@/lib/portfolio-content";
import { formatDateRange } from "@/lib/format";
import { experienceHref, projectHref } from "@/lib/paths";

interface CTAButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | undefined;
  external?: boolean | undefined;
}

export function CTAButton({
  href,
  children,
  variant = "primary",
  external = false,
}: CTAButtonProps) {
  const className =
    variant === "primary"
      ? "inline-flex min-h-11 items-center justify-center rounded-lg bg-gradient-to-r from-violet-500 to-sky-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_44px_rgba(124,58,237,0.26)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
      : "inline-flex min-h-11 items-center justify-center rounded-lg border border-violet-400/70 bg-white/[0.025] px-5 py-3 text-sm font-semibold text-ink transition hover:border-violet-300 hover:bg-violet-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
        <span className="ml-2" aria-hidden>
          ↗
        </span>
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
      <span className="ml-2" aria-hidden>
        →
      </span>
    </Link>
  );
}

interface SectionHeaderProps {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  action?: {
    href: string;
    label: string;
  } | undefined;
}

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold text-ink md:text-3xl">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 transition hover:text-violet-200"
        >
          {action.label}
          <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
}

export function PrincipleCard({ principle, index }: { principle: PrincipleRecord; index: number }) {
  return (
    <article className="glass-panel group h-full rounded-lg p-5 transition hover:border-violet-300/45 hover:bg-white/[0.07]">
      <div className="flex size-10 items-center justify-center rounded-lg border border-violet-300/40 bg-violet-400/10 text-sm font-semibold text-violet-200">
        {String(index + 1).padStart(2, "0")}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink">{principle.title}</h3>
      {principle.summary ? (
        <p className="mt-3 text-sm leading-6 text-muted">{principle.summary}</p>
      ) : null}
    </article>
  );
}

export function Timeline({
  experiences,
  projects = [],
}: {
  experiences: ExperienceRecord[];
  projects?: ProjectRecord[];
}) {
  const items = getTimelineItems(experiences, projects);

  if (items.length === 0) {
    return null;
  }

  return <InteractiveTimeline items={items} />;
}

function getTimelineItems(
  experiences: ExperienceRecord[],
  projects: ProjectRecord[],
): InteractiveTimelineItem[] {
  const experiencesById = new Map(experiences.map((experience) => [experience.id, experience]));
  const experienceItems = experiences.map((experience) => {
    const dateRange = formatDateRange(
      experience.startDate,
      experience.endDate,
      experience.isCurrent,
    );

    return {
      id: `experience-${experience.id}`,
      kind: "experience" as const,
      name: experience.company,
      role: experience.role,
      dateRange,
      summary: compactText(experience.summary),
      tags: [],
      href: experienceHref(experience),
      sortTime: getDateTime(experience.startDate) ?? getDateTime(experience.endDate),
      sortPosition: experience.position,
      sortPriority: 0,
    };
  });
  const projectItems = projects.map((project) => {
    // Linked experience is used only for timeline ORDERING; the displayed range
    // is always the project's own dates — and only when they are actually set.
    // No "Present" or published-at placeholders for date-less projects.
    const projectDateRange = formatDateRange(project.startDate, project.endDate, false);

    return {
      id: `project-${project.id}`,
      kind: "project" as const,
      name: project.name,
      role: projectRoleLabels[project.projectRole],
      dateRange: projectDateRange,
      summary: compactText(project.description),
      tags: getProjectTags(project),
      href: projectHref(project),
      sortTime:
        // Prefer linked experience start date, then project's own dates, then published/created
        getDateTime(project.startDate) ??
        getDateTime(project.endDate) ??
        getDateTime(project.publishedAt) ??
        getDateTime(project.createdAt),
      sortPosition: project.position,
      sortPriority: 1,
    };
  });

  return [...experienceItems, ...projectItems]
    .sort((first, second) => {
      const firstTime = first.sortTime ?? Number.POSITIVE_INFINITY;
      const secondTime = second.sortTime ?? Number.POSITIVE_INFINITY;

      if (firstTime !== secondTime) {
        return firstTime - secondTime;
      }

      if (first.sortPosition !== second.sortPosition) {
        return first.sortPosition - second.sortPosition;
      }

      if (first.sortPriority !== second.sortPriority) {
        return first.sortPriority - second.sortPriority;
      }

      return first.name.localeCompare(second.name);
    })
    .map(({ sortTime: _sortTime, sortPosition: _sortPosition, sortPriority: _sortPriority, ...item }) => item);
}

function getProjectTags(project: ProjectRecord): string[] {
  return getProjectTechTags(project);
}

function compactText(value: string, maxLength = 180): string {
  const normalized = value
    .replace(/[`*_>#\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function getDateTime(value: Date | string | null): number | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  const time = date.getTime();

  return Number.isNaN(time) ? null : time;
}

interface CaseStudyCardProps {
  caseStudy: CaseStudyRecord;
  label?: string | undefined;
}

export function CaseStudyCard({ caseStudy, label }: CaseStudyCardProps) {
  const problem = getCaseStudyPart([
    ["Problem", caseStudy.problem],
    ["Context", caseStudy.context],
  ]);
  const impact = getCaseStudyPart([["Impact", caseStudy.outcome]]);
  const impactSignal = getImpactSignal(caseStudy.outcome);

  return (
    <Link
      href={`/case-studies/${caseStudy.slug}`}
      className="group block h-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
    >
      <article className="glass-panel relative isolate flex h-full min-h-72 flex-col overflow-hidden rounded-lg p-5 transition hover:border-violet-300/45 hover:bg-white/[0.07]">
        <span
          className="pointer-events-none absolute inset-x-8 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-violet-300/55 to-transparent opacity-0 transition group-hover:opacity-100"
          aria-hidden
        />
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-violet-300/35 bg-violet-400/10 text-violet-200 shadow-[0_16px_40px_rgba(124,58,237,0.16)]">
              <ImpactStoryIcon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              {label ? (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                  {label}
                </p>
              ) : null}
              <h3 className="mt-2 text-lg font-semibold leading-7 text-ink transition group-hover:text-violet-100">
                {caseStudy.title}
              </h3>
            </div>
          </div>
          {impactSignal ? (
            <span className="shrink-0 rounded-md border border-emerald-300/35 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
              {impactSignal}
            </span>
          ) : null}
        </div>

        {(problem || impact) ? (
          <div className="mt-5 grid flex-1 gap-4">
            {problem ? <CaseStudyPart part={problem} icon="problem" /> : null}
            {impact ? <CaseStudyPart part={impact} icon="impact" /> : null}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <span className="mt-5 inline-flex text-sm font-semibold text-violet-300">
          Read case study
          <span className="ml-2" aria-hidden>
            →
          </span>
        </span>
      </article>
    </Link>
  );
}

interface CaseStudyPartValue {
  label: string;
  value: string;
}

function CaseStudyPart({
  part,
  icon,
}: {
  part: CaseStudyPartValue;
  icon: "problem" | "impact";
}) {
  const Icon = icon === "impact" ? OutcomeIcon : ProblemIcon;
  const color =
    icon === "impact"
      ? "border-emerald-300/25 text-emerald-200"
      : "border-sky-300/25 text-sky-200";

  return (
    <div className="flex gap-3">
      <span
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-white/[0.035] ${color}`}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs font-semibold text-ink">{part.label}</p>
        <p className="mt-1 text-sm leading-6 text-muted">{compactText(part.value, 150)}</p>
      </div>
    </div>
  );
}

function getCaseStudyPart(candidates: Array<[CaseStudyPartValue["label"], string]>): CaseStudyPartValue | null {
  const match = candidates.find(([, value]) => value.trim().length > 0);

  if (!match) {
    return null;
  }

  const [partLabel, value] = match;

  return {
    label: partLabel,
    value,
  };
}

function getImpactSignal(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  const match = normalized.match(/(?:\b\d+(?:\.\d+)?\s?%[+\-]?|\b\d+(?:\.\d+)?x\b|\$\s?\d[\d,.]*[kmbKMB]?)/);

  return match?.[0]?.replace(/\s+/g, "") ?? "";
}

function ImpactStoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 3-3 3 2 5-6" />
      <path d="M18 8h-4" />
      <path d="M18 8v4" />
    </svg>
  );
}

function ProblemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3.5 21 19H3L12 3.5Z" />
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

function OutcomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M5 12.5 9.5 17 19 7" />
      <path d="M19 7v5" />
      <path d="M19 7h-5" />
    </svg>
  );
}

export function ProjectCard({ project, meta }: { project: ProjectRecord; meta: string }) {
  const metrics = getVisibleMetrics(project).slice(0, 2);
  const techTags = getProjectTechTags(project, 4);
  const { demoHref, repositoryHref } = getSafeProjectLinks(project);
  const classificationChips = [
    project.featured ? "Featured" : null,
    projectTypeLabels[project.projectType],
    projectStatusLabels[project.projectStatus],
    projectRoleLabels[project.projectRole],
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <article className="glass-panel flex h-full min-h-72 flex-col rounded-lg p-5 transition hover:border-sky-300/40 hover:bg-white/[0.07]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300">{meta}</p>
      <h3 className="mt-3 text-lg font-semibold text-ink">
        <Link href={projectHref(project)} className="transition hover:text-sky-100">
          {project.name}
        </Link>
      </h3>
      {classificationChips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {classificationChips.map((chip) => (
            <span
              key={chip}
              className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      {project.description ? (
        <p className="mt-4 flex-1 text-sm leading-6 text-muted">
          {compactText(project.description, 210)}
        </p>
      ) : (
        <div className="flex-1" />
      )}
      {metrics.length > 0 ? (
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          {metrics.map((metric) => (
            <div
              key={`${metric.label}-${metric.value}`}
              className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.06] p-3"
            >
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-emerald-200/80">
                {metric.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink">{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {techTags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {techTags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-sky-300/15 bg-sky-300/[0.06] px-2 py-1 text-xs text-sky-100/90"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href={projectHref(project)} className="inline-flex text-sm font-semibold text-sky-300">
          View project
          <span className="ml-2" aria-hidden>
            →
          </span>
        </Link>
        {demoHref ? (
          <a
            href={demoHref}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-muted transition hover:text-ink"
          >
            Demo ↗
          </a>
        ) : null}
        {repositoryHref ? (
          <a
            href={repositoryHref}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-muted transition hover:text-ink"
          >
            Source ↗
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function RecognitionCard({ item }: { item: RecognitionItem }) {
  return (
    <Link href={item.href} className="group block h-full">
      <article className="glass-panel flex h-full items-start gap-5 rounded-lg p-5 transition hover:border-amber-300/45 hover:bg-white/[0.07]">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-amber-300/40 bg-amber-300/10 text-lg text-amber-200">
          ★
        </div>
        <div>
          {item.date ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              {item.date}
            </p>
          ) : null}
          <h3 className="mt-2 text-lg font-semibold text-ink">{item.title}</h3>
          {item.detail ? <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p> : null}
          <p className="mt-3 text-sm text-muted">{item.source}</p>
        </div>
      </article>
    </Link>
  );
}

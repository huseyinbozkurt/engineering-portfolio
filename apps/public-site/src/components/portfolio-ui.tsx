import Link from "next/link";
import type { ReactNode } from "react";

import type {
  CaseStudyRecord,
  ExperienceRecord,
  PrincipleRecord,
  ProjectRecord,
} from "@portfolio/db/queries";

import { type DerivedMetric, type RecognitionItem } from "@/lib/portfolio-content";
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

export function MetricCard({ metric }: { metric: DerivedMetric }) {
  return (
    <article className="group relative flex min-h-32 flex-col justify-center border-line px-5 py-5 text-center md:border-l first:md:border-l-0">
      <div className="mx-auto mb-3 flex size-10 items-end justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-2 transition group-hover:border-violet-300/50">
        <span className="h-3 w-1.5 rounded-t bg-emerald-300" />
        <span className="h-5 w-1.5 rounded-t bg-sky-300" />
        <span className="h-7 w-1.5 rounded-t bg-violet-300" />
      </div>
      <p className="text-3xl font-semibold text-ink">{metric.value}</p>
      <p className="mt-2 text-sm leading-5 text-ink/85">{metric.label}</p>
      {metric.detail ? <p className="mt-1 text-xs leading-5 text-muted">{metric.detail}</p> : null}
    </article>
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

export function Timeline({ experiences }: { experiences: ExperienceRecord[] }) {
  if (experiences.length === 0) {
    return null;
  }

  const chronological = [...experiences].reverse();

  return (
    <ol className="relative grid gap-3 pt-2 md:grid-cols-3 md:gap-5 md:pt-6 lg:grid-cols-6">
      <li
        className="absolute bottom-5 left-5 top-5 w-px bg-line md:left-0 md:right-0 md:top-8 md:h-px md:w-auto"
        aria-hidden
      />
      {chronological.map((experience, index) => {
        const dateRange = formatDateRange(
          experience.startDate,
          experience.endDate,
          experience.isCurrent,
        );

        return (
          <li key={experience.id} className="relative">
            <Link
              href={experienceHref(experience)}
              className="group grid grid-cols-[auto_1fr] gap-4 rounded-lg p-3 transition hover:bg-white/[0.04] md:block"
            >
              <span className="relative z-10 mt-1 block size-4 rounded-full border border-slate-950 bg-gradient-to-br from-emerald-300 via-sky-400 to-violet-500 shadow-[0_0_0_4px_rgba(255,255,255,0.08)] md:mt-0" />
              <span className="block min-w-0">
                {dateRange ? (
                  <span className="block text-sm font-semibold text-violet-200 md:mt-5">
                    {dateRange}
                  </span>
                ) : null}
                <span className="mt-2 block text-sm font-semibold text-ink md:mt-3">
                  {experience.company}
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted">{experience.role}</span>
                {index === chronological.length - 1 && experience.isCurrent ? (
                  <span className="mt-3 inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                    Current
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudyRecord }) {
  const bars = getCaseStudySignalBars(caseStudy);

  return (
    <Link href={`/case-studies/${caseStudy.slug}`} className="group block h-full">
      <article className="glass-panel flex h-full min-h-64 flex-col rounded-lg p-5 transition hover:border-violet-300/45 hover:bg-white/[0.07]">
        <div className="mb-5 flex h-28 items-end overflow-hidden rounded-md border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(124,58,237,0.22)_52%,rgba(14,165,233,0.12))] p-3">
          <div className="grid w-full grid-cols-7 items-end gap-1">
            {bars.map((height, index) => (
              <span
                key={`${caseStudy.id}-${index}`}
                className="rounded-t bg-gradient-to-t from-emerald-400 to-violet-300"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <h3 className="mt-3 text-lg font-semibold text-ink transition group-hover:text-violet-100">
          {caseStudy.title}
        </h3>
        {caseStudy.excerpt ? (
          <p className="mt-3 flex-1 text-sm leading-6 text-muted">{caseStudy.excerpt}</p>
        ) : null}
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

function getCaseStudySignalBars(caseStudy: CaseStudyRecord): number[] {
  const values = [
    caseStudy.context,
    caseStudy.problem,
    caseStudy.constraints,
    caseStudy.action,
    caseStudy.tradeoffs,
    caseStudy.outcome,
    caseStudy.learning,
  ].map((value) => value.trim().length);
  const max = Math.max(...values, 1);

  return values.map((value) => Math.max(18, Math.round((value / max) * 92)));
}

export function ProjectCard({ project, meta }: { project: ProjectRecord; meta: string }) {
  return (
    <Link href={projectHref(project)} className="group block h-full">
      <article className="glass-panel flex h-full min-h-56 flex-col rounded-lg p-5 transition hover:border-sky-300/40 hover:bg-white/[0.07]">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300">{meta}</p>
        <h3 className="mt-3 text-lg font-semibold text-ink transition group-hover:text-sky-100">
          {project.name}
        </h3>
        {project.description ? (
          <p className="mt-3 flex-1 text-sm leading-6 text-muted">{project.description}</p>
        ) : null}
        <span className="mt-5 inline-flex text-sm font-semibold text-sky-300">
          View project
          <span className="ml-2" aria-hidden>
            →
          </span>
        </span>
      </article>
    </Link>
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

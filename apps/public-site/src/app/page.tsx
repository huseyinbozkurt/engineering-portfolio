import Link from "next/link";

import { ComingSoon } from "@/components/coming-soon";
import {
  CaseStudyCard,
  CTAButton,
  MetricCard,
  PrincipleCard,
  RecognitionCard,
  SectionHeader,
  Timeline,
} from "@/components/portfolio-ui";
import {
  getHeroHeadline,
  getHeroSummary,
  getImpactMetrics,
  getOperatingPrinciples,
  getRecognitionItems,
  getRoleLabel,
  getSkillCategoryChips,
} from "@/lib/portfolio-content";
import { getPublicSiteAvailability } from "@/lib/site-availability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const { content, shouldShowComingSoon } = await getPublicSiteAvailability();

  // RootLayout owns the global gate, but keep this fallback so the page stays
  // self-contained if rendered outside the normal app shell.
  if (shouldShowComingSoon) {
    return <ComingSoon />;
  }

  const settings = content.homepageSettings;
  const role = settings?.roleLabel?.trim() || getRoleLabel(content.experiences);
  const headline = settings?.headline?.trim() || getHeroHeadline(content) || role;
  const headlineHighlight = settings?.headlineHighlight?.trim() ?? "";
  const summary =
    settings?.summary?.trim() ||
    getHeroSummary({
      experiences: content.experiences,
    });
  const chips = getHomepageChips({
    selectedIds: settings?.featuredSkillIds ?? [],
    content,
  });
  const metrics =
    settings?.metricCards.length
      ? settings.metricCards.map((metric) => ({
          value: metric.value,
          label: metric.label,
          detail: metric.detail,
        }))
      : getImpactMetrics(content);
  const principles = selectByIds(content.principles, settings?.featuredPrincipleIds ?? []);
  const visiblePrinciples =
    principles.length > 0 ? principles : getOperatingPrinciples(content.principles);
  const caseStudies = selectByIds(content.caseStudies, settings?.featuredCaseStudyIds ?? []);
  const visibleCaseStudies =
    caseStudies.length > 0 ? caseStudies : content.caseStudies.slice(0, 3);
  const recognitionExperience = settings?.featuredRecognitionExperienceId
    ? content.experiences.filter(
        (experience) => experience.id === settings.featuredRecognitionExperienceId,
      )
    : content.experiences;
  const recognitionItems = getRecognitionItems(recognitionExperience);
  const primaryRecognition = recognitionItems[0];
  const location =
    settings?.codeLocationLabel?.trim() ||
    content.experiences.find((experience) => experience.location)?.location ||
    "";
  const codeFocusItems =
    settings?.codeFocusItems.length ? settings.codeFocusItems : chips;
  const codeRole = settings?.codeRoleLabel?.trim() || role;
  const codeMindset = settings?.codeMindsetLabel?.trim() || "";
  const codeExperience =
    settings?.codeExperienceLabel?.trim() ||
    metrics.find((metric) => metric.label === "Professional experience")?.value;
  const primaryCta = getConfiguredCta(settings?.primaryCtaLabel, settings?.primaryCtaHref);
  const secondaryCta = getConfiguredCta(settings?.secondaryCtaLabel, settings?.secondaryCtaHref);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="dot-field absolute right-0 top-14 hidden h-96 w-[30rem] opacity-55 lg:block" />
        <div className="quiet-grid mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="relative z-10">
            {role ? (
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                {role}
              </p>
            ) : null}
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">
              <HeadlineText headline={headline} highlight={headlineHighlight} />
            </h1>
            {summary ? <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{summary}</p> : null}

            {chips.length > 0 ? (
              <ul className="mt-7 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-ink/90"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryCta ? (
                <CTAButton href={primaryCta.href}>{primaryCta.label}</CTAButton>
              ) : null}
              {secondaryCta ? (
                <CTAButton href={secondaryCta.href} variant="secondary">
                  {secondaryCta.label}
                </CTAButton>
              ) : null}
            </div>
          </div>

          <div className="relative z-10 flex items-center lg:justify-end">
            <CodeProfile
              role={codeRole}
              location={location}
              focusItems={codeFocusItems}
              mindset={codeMindset}
              years={codeExperience}
            />
          </div>
        </div>
      </section>

      {metrics.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <div className="glass-panel grid overflow-hidden rounded-lg md:grid-cols-2 lg:grid-cols-5">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>
        </section>
      ) : null}

      {visiblePrinciples.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <SectionHeader
            title="How I Approach Engineering"
            action={{ href: "/how-i-work", label: "See all principles" }}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {visiblePrinciples.map((principle, index) => (
              <PrincipleCard key={principle.id} principle={principle} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      {content.experiences.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <SectionHeader
            title="Career Journey"
            action={{ href: "/experience", label: "View full timeline" }}
          />
          <Timeline experiences={content.experiences} />
        </section>
      ) : null}

      {visibleCaseStudies.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <SectionHeader
            title="Selected Impact Stories"
            action={{ href: "/case-studies", label: "View all case studies" }}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleCaseStudies.map((caseStudy) => (
              <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
            ))}
          </div>
        </section>
      ) : null}

      {primaryRecognition ? (
        <section className="mx-auto max-w-7xl px-5 pb-14 pt-6 lg:px-8 lg:pb-20">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch">
            <RecognitionCard item={primaryRecognition} />
            <Link
              href="/recognition"
              className="glass-panel inline-flex min-h-20 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-violet-200 transition hover:border-violet-300/45 hover:bg-violet-400/10"
            >
              View Recognition
              <span className="ml-2" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}

function HeadlineText({ headline, highlight }: { headline: string; highlight: string }) {
  const needle = highlight.trim();
  const index = needle ? headline.indexOf(needle) : -1;

  if (index === -1) {
    return <>{headline}</>;
  }

  return (
    <>
      {headline.slice(0, index)}
      <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
        {needle}
      </span>
      {headline.slice(index + needle.length)}
    </>
  );
}

function CodeProfile({
  role,
  location,
  focusItems,
  mindset,
  years,
}: {
  role: string;
  location: string;
  focusItems: string[];
  mindset: string;
  years: string | undefined;
}) {
  if (!role && !location && focusItems.length === 0 && !mindset && !years) {
    return null;
  }

  return (
    <div className="glass-panel w-full max-w-[28rem] rounded-lg p-5 font-mono text-xs leading-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6">
      <p className="text-violet-300">
        <span aria-hidden>{">"}</span> const engineer = {"{"}
      </p>
      {role ? (
        <p className="pl-4 text-sky-200">
          role: <span className="text-emerald-300">&quot;{role}&quot;</span>,
        </p>
      ) : null}
      {focusItems.length > 0 ? (
        <>
          <p className="pl-4 text-sky-200">focus: [</p>
          {focusItems.map((item) => (
            <p key={item} className="pl-8 text-emerald-300">
              &quot;{item}&quot;,
            </p>
          ))}
          <p className="pl-4 text-sky-200">],</p>
        </>
      ) : null}
      {mindset ? (
        <p className="pl-4 text-sky-200">
          mindset: <span className="text-emerald-300">&quot;{mindset}&quot;</span>,
        </p>
      ) : null}
      {location ? (
        <p className="pl-4 text-sky-200">
          location: <span className="text-emerald-300">&quot;{location}&quot;</span>,
        </p>
      ) : null}
      {years ? (
        <p className="pl-4 text-sky-200">
          experience: <span className="text-emerald-300">&quot;{years}&quot;</span>,
        </p>
      ) : null}
      <p className="text-violet-300">{"}"}</p>
      <p className="mt-5 text-ink/70">
        <span aria-hidden>{">_"}</span>
      </p>
    </div>
  );
}

function getHomepageChips({
  selectedIds,
  content,
}: {
  selectedIds: string[];
  content: Awaited<ReturnType<typeof getPublicSiteAvailability>>["content"];
}): string[] {
  const configured = selectByIds(content.skills, selectedIds).map((skill) => skill.name);

  if (configured.length > 0) {
    return configured;
  }

  return getSkillCategoryChips({
    skills: content.skills,
    lenses: content.lenses,
  });
}

function selectByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  if (ids.length === 0) {
    return [];
  }

  const byId = new Map(items.map((item) => [item.id, item]));

  return ids.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));
}

function getConfiguredCta(
  label: string | null | undefined,
  href: string | null | undefined,
): { label: string; href: string } | null {
  const normalizedLabel = label?.trim();
  const normalizedHref = href?.trim();

  if (!normalizedLabel || !normalizedHref) {
    return null;
  }

  return {
    label: normalizedLabel,
    href: normalizedHref,
  };
}

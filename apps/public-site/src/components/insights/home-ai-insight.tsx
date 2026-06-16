import {
  type HomePageContent,
  type SignalRadar,
} from "@portfolio/validators";

import { ConfidencePill } from "@/components/insights/insight-primitives";
import { CTAButton, SectionHeader } from "@/components/portfolio-ui";
import { InsightRadar } from "./insight-radar";

/**
 * Homepage "AI Portfolio Insight" section — a credibility-focused preview of the
 * latest published AI Insight report. Pure presentation: the page resolves and
 * passes `homePageContent`; when it is absent (older reports, no published run)
 * the section renders nothing. Reuses the site's section header, CTA button and
 * confidence pill so it shares one visual language.
 */
export function HomeAiInsight({
  content,
  signalRadar,
}: {
  content: HomePageContent | undefined;
  signalRadar: SignalRadar | undefined;
}) {
  if (!content) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <SectionHeader
        eyebrow={content.eyebrow}
        title={content.headline}
        description={content.summary}
      />

      {content.primarySignals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {content.primarySignals.slice(0, 3).map((signal) => (
            <article
              key={signal.title}
              className="glass-panel h-full w-full min-w-0 max-w-full rounded-lg p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="min-w-0 break-words text-base font-semibold text-ink">
                  {signal.title}
                </h3>
                <ConfidencePill confidence={signal.confidence} />
              </div>
              <p className="mt-3 break-words text-sm leading-7 text-muted">{signal.summary}</p>
            </article>
          ))}
        </div>
      ) : null}

      {content.proofPoints.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.proofPoints.slice(0, 4).map((proof) => (
            <article
              key={`${proof.label}-${proof.value}`}
              className="glass-panel w-full min-w-0 max-w-full rounded-lg p-5"
            >
              <p className="break-words text-3xl font-semibold tracking-normal text-ink md:text-4xl">
                {proof.value}
              </p>
              <h3 className="mt-3 break-words text-sm font-semibold uppercase tracking-[0.16em] text-violet-200">
                {proof.label}
              </h3>
              <p className="mt-3 break-words text-sm leading-6 text-muted">{proof.context}</p>
            </article>
          ))}
        </div>
      ) : null}

      {content.capabilitySnapshot.length > 0 ? (
        <div className="glass-panel mt-4 min-w-0 rounded-lg p-6 md:p-8">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            Capability snapshot
          </h3>
          <div className="mt-5 grid gap-x-8 gap-y-5">
            <InsightRadar content={content} />
          </div>
        </div>
      ) : null}

      <div className="mt-7">
        <CTAButton href={content.cta.href}>{content.cta.label}</CTAButton>
      </div>
    </section>
  );
}

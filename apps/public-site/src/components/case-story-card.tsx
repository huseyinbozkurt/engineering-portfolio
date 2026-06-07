import Link from "next/link";

import type { CaseStudyRecord } from "@portfolio/db/queries";

import { RichText } from "@/components/rich-text";

interface CaseStoryPart {
  label: string;
  value: string;
}

export function CaseStoryCard({ caseStudy }: { caseStudy: CaseStudyRecord }) {
  const parts = getCaseStoryParts(caseStudy);

  return (
    <article className="glass-panel h-full rounded-lg p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-amber-200">Case story</p>
      <h3 className="mt-3 text-xl font-semibold text-ink">
        <Link
          href={`/case-studies/${caseStudy.slug}`}
          className="underline-offset-4 transition hover:text-teal-200 hover:underline"
        >
          {caseStudy.title}
        </Link>
      </h3>
      {caseStudy.excerpt ? (
        <p className="mt-3 text-sm leading-6 text-muted">{caseStudy.excerpt}</p>
      ) : null}
      {parts.length > 0 ? (
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {parts.map((part, index) => (
            <li key={part.label} className="border-l border-line pl-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-teal-200">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink">
                  {part.label}
                </p>
              </div>
              <div className="mt-3 [&_.rich-text]:gap-2 [&_.rich-text]:text-sm [&_.rich-text]:leading-6">
                <RichText value={part.value} />
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      <Link
        href={`/case-studies/${caseStudy.slug}`}
        className="mt-5 inline-flex text-sm font-semibold text-teal-200 underline-offset-4 transition hover:underline"
      >
        View full case story ↗
      </Link>
    </article>
  );
}

function getCaseStoryParts(caseStudy: CaseStudyRecord): CaseStoryPart[] {
  return [
    { label: "Problem", value: caseStudy.problem },
    { label: "What I Did", value: caseStudy.action },
    { label: "Outcome", value: caseStudy.outcome },
  ].filter((part) => part.value.trim().length > 0);
}

import type { InsightConfidence } from "@portfolio/validators";

/**
 * Shared public-site insight primitives so the AI Insights page and the
 * homepage "AI Portfolio Insight" section render the same visual language
 * (no duplicate confidence-badge patterns).
 */

const confidencePillClasses: Record<InsightConfidence, string> = {
  high: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  medium: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  low: "border-line bg-white/[0.04] text-muted",
};

export function ConfidencePill({ confidence }: { confidence: InsightConfidence }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${confidencePillClasses[confidence]}`}
    >
      {confidence} confidence
    </span>
  );
}

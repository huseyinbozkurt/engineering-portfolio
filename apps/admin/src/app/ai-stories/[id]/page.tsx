import Link from "next/link";
import { CheckCircle2, Undo2 } from "lucide-react";
import { notFound } from "next/navigation";

import { getAiGeneratedStory, type AiGeneratedStoryRecord } from "@portfolio/db/ai-stories";

import { applyAiStoryAction, rollbackAiStoryAction } from "@/app/ai-stories/actions";
import { AiStoryPartCard } from "@/components/ai-story-part-card";
import { ConfirmedForm } from "@/components/confirmed-form";
import { EmptyPanel } from "@/components/empty-panel";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

interface AiStoryPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ applyError?: string | string[] }>;
}

export default async function AiStoryPage({ params, searchParams }: AiStoryPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const story = await getAiGeneratedStory(id);

  if (!story) {
    notFound();
  }

  const parts = story.generatedContent.parts;
  const lensRenameSuggestions = story.generatedContent.lensRenameSuggestions ?? [];
  const activePartCount = parts.filter((part) => !part.deletedAt).length;
  const deletedPartCount = parts.length - activePartCount;
  const appliedPartCount = parts.filter((part) => Boolean(part.appliedRecordId)).length;
  const isApplied = story.status === "applied";
  const hasApplyTarget = Boolean(story.targetId);
  const canApply = !isApplied && !hasApplyTarget && activePartCount > 0;
  const applyError = firstString(query?.applyError);

  return (
    <main className="px-5 py-8 lg:px-8">
      <Link href="/ai-stories" className="text-sm text-muted transition hover:text-ink">
        ← Back to AI stories
      </Link>
      <div className="mt-4">
        <PageTitle
          title={story.title}
          description="Edit the generated draft parts, soft-delete anything that should not publish, then apply the active parts together."
          actions={
            <>
              {isApplied ? (
                <ConfirmedForm
                  action={rollbackAiStoryAction}
                  confirmation={{
                    title: "Rollback applied AI story?",
                    description:
                      "This soft-deletes every generated part and moves the applied portfolio records back to draft.",
                    confirmLabel: "Rollback story",
                    tone: "danger",
                  }}
                >
                  <input type="hidden" name="storyId" value={story.id} />
                  <input type="hidden" name="redirectTo" value={`/ai-stories/${story.id}`} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200/40 bg-amber-200/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/20"
                  >
                    <Undo2 className="size-4" aria-hidden="true" />
                    Rollback
                  </button>
                </ConfirmedForm>
              ) : null}
              <ConfirmedForm
                action={applyAiStoryAction}
                confirmation={{
                  title: "Apply all active parts?",
                  description:
                    "This publishes every active generated part as structured portfolio content. Soft-deleted parts stay in the AI story and will not publish.",
                  confirmLabel: "Apply all",
                }}
              >
                <input type="hidden" name="storyId" value={story.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!canApply}
                  title={
                    isApplied || hasApplyTarget
                      ? "This AI story has already been applied."
                      : activePartCount === 0
                        ? "Restore at least one generated part before applying."
                        : undefined
                  }
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Apply all
                </button>
              </ConfirmedForm>
            </>
          }
        />
      </div>

      {applyError ? (
        <div
          className="mt-4 rounded-lg border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {applyError}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Status" value={story.status} />
        <MetricCard label="Active parts" value={String(activePartCount)} />
        <MetricCard label="Soft-deleted" value={String(deletedPartCount)} />
        <MetricCard label="Applied records" value={String(appliedPartCount)} />
      </section>

      <section className="mt-6 rounded-lg border border-line bg-white/[0.025] p-5">
        <h2 className="text-lg font-semibold text-ink">Original brief</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
          {story.sourcePrompt}
        </p>
      </section>

      {lensRenameSuggestions.length > 0 ? (
        <section className="mt-6 rounded-lg border border-amber-200/25 bg-amber-200/[0.04] p-5">
          <h2 className="text-lg font-semibold text-ink">Lens rename suggestions</h2>
          <div className="mt-4 grid gap-3">
            {lensRenameSuggestions.map((suggestion) => (
              <article
                key={`${suggestion.lensId}-${suggestion.suggestedName}`}
                className="rounded-lg border border-amber-200/20 bg-white/[0.025] p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-ink">{suggestion.currentName}</span>
                  <span className="text-muted">→</span>
                  <span className="font-semibold text-amber-100">
                    {suggestion.suggestedName}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{suggestion.reason}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-3">
        {parts.length === 0 ? (
          <EmptyPanel
            title="No generated parts"
            description="This AI story does not contain editable generated records."
          />
        ) : (
          sortedParts(story).map((part) => (
            <AiStoryPartCard
              key={part.id}
              storyId={story.id}
              part={part}
              disabled={isApplied}
            />
          ))
        )}
      </section>
    </main>
  );
}

function sortedParts(story: AiGeneratedStoryRecord) {
  return [...story.generatedContent.parts].sort((left, right) => {
    const leftDeleted = Boolean(left.deletedAt);
    const rightDeleted = Boolean(right.deletedAt);

    if (leftDeleted === rightDeleted) {
      return 0;
    }

    return leftDeleted ? 1 : -1;
  });
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.03] p-4">
      <p className="break-words text-2xl font-semibold capitalize text-ink">{value}</p>
      <p className="mt-2 text-sm text-muted">{label}</p>
    </div>
  );
}

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

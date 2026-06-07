import Link from "next/link";
import { Undo2 } from "lucide-react";

import { getAiGeneratedStories, type AiGeneratedStoryRecord } from "@portfolio/db/ai-stories";

import { rollbackAiStoryAction } from "@/app/ai-stories/actions";
import { ConfirmedForm } from "@/components/confirmed-form";
import { CreateWithAiModal } from "@/components/create-with-ai-modal";
import { EmptyPanel } from "@/components/empty-panel";
import { PageTitle } from "@/components/page-title";
import { getLlmConnectionStatuses } from "@/lib/llm-config";

export const dynamic = "force-dynamic";

export default async function AiStoriesPage() {
  const [storyResult, llmStatuses] = await Promise.all([
    readStories(),
    getLlmConnectionStatuses(),
  ]);
  const onlineLlmCount = llmStatuses.filter((status) => status.status === "online").length;
  const createWithAiDisabledReason =
    onlineLlmCount === 0
      ? "No LLM connection is online. Configure a reachable provider before creating AI stories."
      : null;
  const stories = storyResult.stories;
  const draftCount = stories.filter((story) => story.status === "draft").length;
  const appliedCount = stories.filter((story) => story.status === "applied").length;
  const deletedPartCount = stories.reduce(
    (total, story) =>
      total + story.generatedContent.parts.filter((part) => Boolean(part.deletedAt)).length,
    0,
  );

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="AI Stories"
        description="Review LLM-generated portfolio stories before they become published content. Draft parts can be edited, soft-deleted, recreated, and then applied together."
        actions={
          <CreateWithAiModal
            canCreate={onlineLlmCount > 0}
            disabledReason={createWithAiDisabledReason}
          />
        }
      />

      {storyResult.error ? (
        <EmptyPanel
          title="AI stories unavailable"
          description="The AI generated stories table could not be read. Apply the latest database migration, then reload this page."
        />
      ) : stories.length === 0 ? (
        <EmptyPanel
          title="No AI stories yet"
          description="Use Create with AI from the admin panel to generate structured draft content from a brief story."
        />
      ) : (
        <div className="grid gap-5">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Draft" value={draftCount} />
            <MetricCard label="Applied" value={appliedCount} />
            <MetricCard label="Soft-deleted parts" value={deletedPartCount} />
          </section>

          <section className="grid gap-3">
            {stories.map((story) => {
              const activePartCount = story.generatedContent.parts.filter(
                (part) => !part.deletedAt,
              ).length;
              const deletedParts = story.generatedContent.parts.length - activePartCount;

              return (
                <article
                  key={story.id}
                  className="rounded-lg border border-line bg-white/[0.025] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-ink">{story.title}</h2>
                        <StatusBadge status={story.status} />
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                        {story.generatedContent.summary || "No generated summary."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {story.status === "applied" ? (
                        <RollbackStoryForm storyId={story.id} redirectTo="/ai-stories" />
                      ) : null}
                      <Link
                        className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]"
                        href={`/ai-stories/${story.id}`}
                      >
                        Review story
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-5">
                    <Detail label="Provider" value={story.providerName ?? "Unknown"} />
                    <Detail label="Model" value={story.providerModel ?? "Unknown"} />
                    <Detail label="Active parts" value={String(activePartCount)} />
                    <Detail label="Deleted parts" value={String(deletedParts)} />
                    <Detail label="Created" value={formatDate(story.createdAt)} />
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      )}
    </main>
  );
}

function RollbackStoryForm({ storyId, redirectTo }: { storyId: string; redirectTo: string }) {
  return (
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
      <input type="hidden" name="storyId" value={storyId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg border border-amber-200/40 bg-amber-200/10 px-3 py-1.5 text-sm font-medium text-amber-100 transition hover:bg-amber-200/20"
      >
        <Undo2 className="size-4" aria-hidden="true" />
        Rollback
      </button>
    </ConfirmedForm>
  );
}

async function readStories(): Promise<{
  stories: AiGeneratedStoryRecord[];
  error: boolean;
}> {
  try {
    return { stories: await getAiGeneratedStories(), error: false };
  } catch {
    return { stories: [], error: true };
  }
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.03] p-5">
      <p className="text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-muted">{label}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.025] p-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: AiGeneratedStoryRecord["status"] }) {
  const className =
    status === "applied"
      ? "border-teal-300/30 bg-teal-300/10 text-teal-100"
      : status === "failed"
        ? "border-rose-300/30 bg-rose-500/10 text-rose-100"
        : "border-amber-200/30 bg-amber-200/10 text-amber-100";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}

function formatDate(value: Date): string {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

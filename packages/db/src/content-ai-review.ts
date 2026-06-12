import { eq } from "drizzle-orm";

import type { ExperienceAiReviewOutput } from "@portfolio/validators";

import { getDb } from "./client";
import type { AiReviewStatus, AiSuggestion } from "./schema";
import { aiReviewQualitySnapshots, caseStudies, experiences, projects } from "./schema";

export type AiReviewContentType = "experience" | "project" | "case_study";

export async function setContentAiReviewQueued(
  contentType: AiReviewContentType,
  id: string,
): Promise<void> {
  await updateContentAiReviewState(contentType, id, {
    aiReviewStatus: "queued",
    aiReviewError: null,
  });
}

export async function setContentAiReviewProcessing(
  contentType: AiReviewContentType,
  id: string,
): Promise<void> {
  await updateContentAiReviewState(contentType, id, {
    aiReviewStatus: "processing",
    aiReviewError: null,
  });
}

export async function saveContentAiReviewSuccess(
  contentType: AiReviewContentType,
  id: string,
  output: ExperienceAiReviewOutput,
): Promise<void> {
  const now = new Date();
  const values = {
    contentQualityScore: output.qualityScore,
    aiSummary: output.summary,
    aiSuggestions: toAiSuggestions(output),
    lastAiReviewAt: now,
    aiReviewStatus: "completed" as const,
    aiReviewError: null,
    updatedAt: now,
  };

  if (contentType === "experience") {
    const [record] = await getDb()
      .update(experiences)
      .set(values)
      .where(eq(experiences.id, id))
      .returning({ title: experiences.role, fallback: experiences.company });
    await insertAiReviewSnapshot(contentType, id, reviewTitle(record), output.qualityScore, now);
    return;
  }

  if (contentType === "project") {
    const [record] = await getDb()
      .update(projects)
      .set(values)
      .where(eq(projects.id, id))
      .returning({ title: projects.name });
    await insertAiReviewSnapshot(contentType, id, reviewTitle(record), output.qualityScore, now);
    return;
  }

  const [record] = await getDb()
    .update(caseStudies)
    .set(values)
    .where(eq(caseStudies.id, id))
    .returning({ title: caseStudies.title });
  await insertAiReviewSnapshot(contentType, id, reviewTitle(record), output.qualityScore, now);
}

export async function saveContentAiReviewFailure(
  contentType: AiReviewContentType,
  id: string,
  message: string,
): Promise<void> {
  await updateContentAiReviewState(contentType, id, {
    aiReviewStatus: "failed",
    aiReviewError: message,
  });
}

async function updateContentAiReviewState(
  contentType: AiReviewContentType,
  id: string,
  patch: {
    aiReviewStatus: AiReviewStatus;
    aiReviewError: string | null;
  },
): Promise<void> {
  const values = {
    ...patch,
    updatedAt: new Date(),
  };

  if (contentType === "experience") {
    await getDb().update(experiences).set(values).where(eq(experiences.id, id));
    return;
  }

  if (contentType === "project") {
    await getDb().update(projects).set(values).where(eq(projects.id, id));
    return;
  }

  await getDb().update(caseStudies).set(values).where(eq(caseStudies.id, id));
}

function toAiSuggestions(output: ExperienceAiReviewOutput): AiSuggestion[] {
  return [
    ...output.strengths.map((suggestion) => ({ field: "strengths", suggestion })),
    ...output.issues.map((suggestion) => ({ field: "issues", suggestion })),
    ...output.suggestions.map((suggestion) => ({ field: "suggestions", suggestion })),
  ];
}

async function insertAiReviewSnapshot(
  contentType: AiReviewContentType,
  id: string,
  title: string,
  qualityScore: number,
  reviewedAt: Date,
): Promise<void> {
  await getDb().insert(aiReviewQualitySnapshots).values({
    contentType,
    contentId: id,
    contentTitle: title,
    qualityScore,
    reviewedAt,
  });
}

function reviewTitle(record: { title?: string | null; fallback?: string | null } | undefined): string {
  const title = record?.title?.trim();
  const fallback = record?.fallback?.trim();

  return title || fallback || "Untitled record";
}

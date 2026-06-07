"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminContentIndex } from "@portfolio/db";
import {
  AiGeneratedStoryApplyError,
  applyAiGeneratedStory,
  createAiGeneratedStory,
  restoreAiGeneratedStoryPart,
  rollbackAiGeneratedStory,
  softDeleteAiGeneratedStoryPart,
  updateAiGeneratedStoryPart,
} from "@portfolio/db/ai-stories";

import { callInsightsLlm } from "@/lib/ai-insights/llm-client";
import { parseAiGeneratedStory } from "@/lib/ai-stories/parse";
import { buildAiStoryPrompt } from "@/lib/ai-stories/prompt";
import { getLlmConnectionStatuses } from "@/lib/llm-config";

export interface CreateAiStoryActionState {
  status: "idle" | "error" | "success";
  message: string;
  storyId: string | null;
}

export async function createAiStoryAction(
  _previousState: CreateAiStoryActionState,
  formData: FormData,
): Promise<CreateAiStoryActionState> {
  const sourceStory = text(formData, "sourceStory");

  if (sourceStory.length < 20) {
    return {
      status: "error",
      message: "Add a little more story context before generating content.",
      storyId: null,
    };
  }

  const statuses = await getLlmConnectionStatuses();
  const hasOnlineLlm = statuses.some((status) => status.status === "online");

  if (!hasOnlineLlm) {
    return {
      status: "error",
      message: "No LLM connection is online. Check provider configuration and try again.",
      storyId: null,
    };
  }

  try {
    const content = await getAdminContentIndex();
    const prompt = buildAiStoryPrompt(sourceStory, content);
    const response = await callInsightsLlm(prompt);
    const generatedContent = parseAiGeneratedStory(response.content);
    const storyId = await createAiGeneratedStory({
      title: generatedContent.title,
      sourcePrompt: sourceStory,
      providerName: response.provider.name,
      providerModel: response.provider.model,
      generatedContent,
      rawResponse: response.content,
      finishReason: response.finishReason,
    });

    revalidatePath("/");
    revalidatePath("/ai-stories");
    revalidatePath(`/ai-stories/${storyId}`);

    return {
      status: "success",
      message: "AI story generated. Opening the review page.",
      storyId,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "AI story generation failed.",
      storyId: null,
    };
  }
}

export async function updateAiStoryPartAction(formData: FormData): Promise<void> {
  const storyId = text(formData, "storyId");
  const partId = text(formData, "partId");

  await updateAiGeneratedStoryPart(storyId, partId, {
    title: text(formData, "title"),
    summary: text(formData, "summary"),
    fields: parseJsonRecord(text(formData, "fields"), "fields"),
    relations: parseJsonRecord(text(formData, "relations"), "relations") as Record<
      string,
      string[] | string | null
    >,
  });

  refreshStory(storyId);
  redirect(`/ai-stories/${storyId}`);
}

export async function softDeleteAiStoryPartAction(formData: FormData): Promise<void> {
  const storyId = text(formData, "storyId");
  await softDeleteAiGeneratedStoryPart(storyId, text(formData, "partId"));
  revalidateAiStoryAndContent(storyId);
  redirect(`/ai-stories/${storyId}`);
}

export async function restoreAiStoryPartAction(formData: FormData): Promise<void> {
  const storyId = text(formData, "storyId");
  await restoreAiGeneratedStoryPart(storyId, text(formData, "partId"));
  refreshStory(storyId);
  redirect(`/ai-stories/${storyId}`);
}

export async function applyAiStoryAction(formData: FormData): Promise<void> {
  const storyId = text(formData, "storyId");
  const storyPath = `/ai-stories/${storyId}`;

  try {
    await applyAiGeneratedStory(storyId);
  } catch (error) {
    refreshStory(storyId);
    redirect(`${storyPath}?applyError=${encodeURIComponent(applyErrorMessage(error))}`);
  }

  revalidateAiStoryAndContent(storyId);
  redirect(storyPath);
}

export async function rollbackAiStoryAction(formData: FormData): Promise<void> {
  const storyId = text(formData, "storyId");
  const redirectTo = text(formData, "redirectTo") || `/ai-stories/${storyId}`;

  await rollbackAiGeneratedStory(storyId);
  revalidateAiStoryAndContent(storyId);
  redirect(redirectTo);
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseJsonRecord(value: string, label: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value || "{}") as unknown;

    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Fall through to the consistent error below.
  }

  throw new Error(`AI story ${label} must be valid JSON object syntax.`);
}

function refreshStory(storyId: string): void {
  revalidatePath("/ai-stories");
  revalidatePath(`/ai-stories/${storyId}`);
}

function revalidateAiStoryAndContent(storyId: string): void {
  revalidatePath("/");
  refreshStory(storyId);
  revalidatePath("/content/lenses");
  revalidatePath("/content/principles");
  revalidatePath("/content/decision-patterns");
  revalidatePath("/content/experiences");
  revalidatePath("/content/projects");
  revalidatePath("/content/case-studies");
  revalidatePath("/content/skills");
  revalidatePath("/content/tags");
}

function applyErrorMessage(error: unknown): string {
  if (error instanceof AiGeneratedStoryApplyError) {
    return error.message;
  }

  return "AI story could not be applied. Review the generated fields and relationships, then try again.";
}

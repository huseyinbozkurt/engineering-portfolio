"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createLlmPromptVersion,
  deleteLlmPromptVersion,
  duplicateLlmPromptVersion,
  setLlmPromptVersionActive,
  updateLlmPromptVersion,
} from "@portfolio/db/llm-prompt-versions";
import { createPromptVersionSchema, updatePromptVersionSchema } from "@portfolio/validators";

export interface PromptVersionFormState {
  status: "idle" | "error";
  message: string;
}

function readPromptForm(formData: FormData) {
  return {
    workflow: String(formData.get("workflow") ?? ""),
    targetType: String(formData.get("targetType") ?? ""),
    version: String(formData.get("version") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    systemPrompt: String(formData.get("systemPrompt") ?? ""),
    userPromptTemplate: String(formData.get("userPromptTemplate") ?? ""),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createPromptVersionAction(
  _prev: PromptVersionFormState,
  formData: FormData,
): Promise<PromptVersionFormState> {
  const parsed = createPromptVersionSchema.safeParse(readPromptForm(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid prompt version." };
  }

  try {
    await createLlmPromptVersion(parsed.data);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not create the prompt version.",
    };
  }

  revalidatePath("/llm-settings/prompts");
  redirect("/llm-settings/prompts");
}

export async function updatePromptVersionAction(
  _prev: PromptVersionFormState,
  formData: FormData,
): Promise<PromptVersionFormState> {
  const parsed = updatePromptVersionSchema.safeParse({
    ...readPromptForm(formData),
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid prompt version." };
  }

  try {
    await updateLlmPromptVersion(parsed.data);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not update the prompt version.",
    };
  }

  revalidatePath("/llm-settings/prompts");
  redirect("/llm-settings/prompts");
}

export async function setPromptVersionActiveAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";
  if (id) {
    await setLlmPromptVersionActive(id, isActive);
    revalidatePath("/llm-settings/prompts");
  }
}

export async function duplicatePromptVersionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await duplicateLlmPromptVersion(id);
    revalidatePath("/llm-settings/prompts");
  }
}

export async function deletePromptVersionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteLlmPromptVersion(id);
    revalidatePath("/llm-settings/prompts");
  }
}

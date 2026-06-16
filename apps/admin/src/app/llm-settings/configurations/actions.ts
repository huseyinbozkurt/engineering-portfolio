"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createLlmConfiguration,
  deleteLlmConfiguration,
  duplicateLlmConfiguration,
  setLlmConfigurationActive,
  updateLlmConfiguration,
} from "@portfolio/db/llm-configurations";
import {
  createLlmConfigurationSchema,
  updateLlmConfigurationSchema,
} from "@portfolio/validators";

export interface LlmConfigurationFormState {
  status: "idle" | "error";
  message: string;
}

function readConfigForm(formData: FormData) {
  return {
    workflow: String(formData.get("workflow") ?? ""),
    provider: String(formData.get("provider") ?? ""),
    model: String(formData.get("model") ?? ""),
    visibleModelName: String(formData.get("visibleModelName") ?? ""),
    baseUrl: String(formData.get("baseUrl") ?? ""),
    temperature: String(formData.get("temperature") ?? ""),
    topP: String(formData.get("topP") ?? ""),
    maxTokens: String(formData.get("maxTokens") ?? ""),
    maxRetries: String(formData.get("maxRetries") ?? ""),
    timeoutMs: String(formData.get("timeoutMs") ?? ""),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createLlmConfigurationAction(
  _prev: LlmConfigurationFormState,
  formData: FormData,
): Promise<LlmConfigurationFormState> {
  const parsed = createLlmConfigurationSchema.safeParse(readConfigForm(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid configuration." };
  }

  try {
    await createLlmConfiguration(parsed.data);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not create the configuration.",
    };
  }

  revalidatePath("/llm-settings/configurations");
  redirect("/llm-settings/configurations");
}

export async function updateLlmConfigurationAction(
  _prev: LlmConfigurationFormState,
  formData: FormData,
): Promise<LlmConfigurationFormState> {
  const parsed = updateLlmConfigurationSchema.safeParse({
    ...readConfigForm(formData),
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid configuration." };
  }

  try {
    await updateLlmConfiguration(parsed.data);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not update the configuration.",
    };
  }

  revalidatePath("/llm-settings/configurations");
  redirect("/llm-settings/configurations");
}

export async function setLlmConfigurationActiveAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";
  if (id) {
    await setLlmConfigurationActive(id, isActive);
    revalidatePath("/llm-settings/configurations");
  }
}

export async function duplicateLlmConfigurationAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await duplicateLlmConfiguration(id);
    revalidatePath("/llm-settings/configurations");
  }
}

export async function deleteLlmConfigurationAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteLlmConfiguration(id);
    revalidatePath("/llm-settings/configurations");
  }
}

import { revalidatePath } from "next/cache";

import { updateLlmTask } from "@portfolio/db/llm-tasks";

import { callInsightsLlm } from "@/lib/ai-insights/llm-client";
import { parseAiInsightsReport } from "@/lib/ai-insights/parse";

interface RunAiInsightsTaskInput {
  taskId: string;
  prompt: {
    system: string;
    user: string;
  };
  startedAt: Date;
}

export async function runAiInsightsTask({
  taskId,
  prompt,
  startedAt,
}: RunAiInsightsTaskInput): Promise<void> {
  try {
    const result = await callInsightsLlm({
      ...prompt,
      onProviderSelected: async (provider) => {
        await updateLlmTask(taskId, {
          providerName: provider.name,
          providerModel: provider.model,
        });
      },
    });

    await updateLlmTask(taskId, {
      providerName: result.provider.name,
      providerModel: result.provider.model,
      rawResponse: result.content,
      finishReason: result.finishReason,
    });

    try {
      const report = parseAiInsightsReport(result.content, result.provider);
      const completedAt = new Date();

      await updateLlmTask(taskId, {
        status: "succeeded",
        rawResponse: result.content,
        parsedResponse: report,
        finishReason: result.finishReason,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      });
    } catch (parseError) {
      const completedAt = new Date();

      await updateLlmTask(taskId, {
        status: "failed",
        rawResponse: result.content,
        errorStage: "parse",
        finishReason: result.finishReason,
        errorMessage: parseErrorMessage(parseError, result.finishReason, result.content),
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      });
    }
  } catch (error) {
    const completedAt = new Date();

    await updateLlmTask(taskId, {
      status: "failed",
      errorStage: "request",
      errorMessage: errorMessage(error),
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
    });
  } finally {
    revalidatePath("/ai-insights");
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${taskId}`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The LLM analysis failed. Check provider configuration and try again.";
}

function parseErrorMessage(
  error: unknown,
  finishReason: string | null,
  content: string,
): string {
  const message = errorMessage(error);

  const stoppedForLength =
    finishReason && ["length", "max_tokens", "model_length"].includes(finishReason);

  if (stoppedForLength) {
    return `${message} The provider stopped with finish reason "${finishReason}", so the JSON was likely truncated. Increase LLM_ANALYSIS_MAX_TOKENS or use a model with a larger output limit.`;
  }

  if (looksTruncatedJson(content)) {
    return `${message} The raw response does not end like complete JSON, so it was likely truncated. Increase LLM_ANALYSIS_MAX_TOKENS or use a model with a larger output limit.`;
  }

  return message;
}

function looksTruncatedJson(content: string): boolean {
  const trimmed = content.trim();

  if (!trimmed) {
    return false;
  }

  return !trimmed.endsWith("}") && !trimmed.endsWith("]");
}

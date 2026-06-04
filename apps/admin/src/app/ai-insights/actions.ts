"use server";

import { revalidatePath } from "next/cache";

import { createLlmTask, getActiveLlmTask } from "@portfolio/db/llm-tasks";

import { buildAiInsightsPrompt } from "@/lib/ai-insights/prompt";
import { getPortfolioInsightSnapshot } from "@/lib/ai-insights/data";
import { runAiInsightsTask } from "@/lib/ai-insights/task-runner";
import type { AiInsightsActionState } from "@/lib/ai-insights/types";

const taskType = "ai_insights";

export async function generateAiInsightsAction(
  _previousState: AiInsightsActionState,
  _formData: FormData,
): Promise<AiInsightsActionState> {
  const snapshot = await getPortfolioInsightSnapshot();

  if (snapshot.isEmpty) {
    return {
      status: "error",
      message: "Add portfolio records before generating AI insights.",
      report: null,
      taskId: null,
    };
  }

  const activeTask = await getActiveTask();

  if (activeTask) {
    return {
      status: "error",
      message: "An AI Insights task is already running. Wait for it to finish before starting another.",
      report: null,
      taskId: activeTask.id,
    };
  }

  const prompt = buildAiInsightsPrompt(snapshot);
  const startedAt = new Date();
  const task = await createTaskLog(prompt, startedAt);

  if (!task) {
    const latestActiveTask = await getActiveTask();

    if (latestActiveTask) {
      return {
        status: "error",
        message:
          "An AI Insights task is already running. Wait for it to finish before starting another.",
        report: null,
        taskId: latestActiveTask.id,
      };
    }

    return {
      status: "error",
      message:
        "Could not create an LLM task log. Apply the database migration before running AI Insights.",
      report: null,
      taskId: null,
    };
  }

  setTimeout(() => {
    void runAiInsightsTask({ taskId: task.id, prompt, startedAt });
  }, 0);

  revalidatePath("/ai-insights");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${task.id}`);

  return {
    status: "success",
    message: "AI Insights task started in the background. You can keep using the admin while it runs.",
    report: null,
    taskId: task.id,
  };
}

async function createTaskLog(
  prompt: { system: string; user: string },
  startedAt: Date,
): Promise<{ id: string } | null> {
  try {
    return await createLlmTask({
      taskType,
      title: "AI Insights report",
      status: "running",
      promptSystem: prompt.system,
      promptUser: prompt.user,
      startedAt,
    });
  } catch {
    return null;
  }
}

async function getActiveTask(): Promise<{ id: string } | null> {
  try {
    return await getActiveLlmTask(taskType);
  } catch {
    return null;
  }
}

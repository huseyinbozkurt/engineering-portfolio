import { getLlmConfigurations } from "@portfolio/db/llm-configurations";
import type { LlmWorkflow } from "@portfolio/validators";

export interface LlmConnectionStatus {
  id: string;
  name: string;
  provider: string;
  model: string | null;
  baseUrl: string;
  status: "online" | "offline";
  message: string;
  checkedAt: Date;
}

/** Admin reports only DB configuration state; provider probing belongs to workflows. */
export async function getLlmConnectionStatuses(
  workflow?: LlmWorkflow,
): Promise<LlmConnectionStatus[]> {
  const configurations = await getLlmConfigurations();
  return configurations
    .filter((configuration) => !workflow || configuration.workflow === workflow)
    .map((configuration) => ({
    id: configuration.id,
    name: configuration.visibleModelName || configuration.model,
    provider: configuration.provider,
    model: configuration.model,
    baseUrl: configuration.baseUrl || "Provider default",
    status: configuration.isActive ? "online" : "offline",
    message: configuration.isActive ? "Active DB configuration" : "Inactive DB configuration",
    checkedAt: configuration.updatedAt,
    }));
}

export async function hasOnlineLlmConnection(workflow?: LlmWorkflow): Promise<boolean> {
  return (await getLlmConnectionStatuses(workflow)).some(
    (configuration) => configuration.status === "online",
  );
}

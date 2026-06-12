import { NextResponse } from "next/server";

import { hasOnlineLlmConnection } from "@portfolio/llm";
import { startQueuedLlmTaskProcessing } from "@portfolio/llm/task-runner";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await hasOnlineLlmConnection())) {
    return NextResponse.json({
      started: false,
      reason: "no_online_llm",
    });
  }

  const started = startQueuedLlmTaskProcessing();

  return NextResponse.json({
    started,
    reason: started ? "started" : "already_running",
  });
}

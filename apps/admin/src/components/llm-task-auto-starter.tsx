"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface LlmTaskAutoStarterProps {
  enabled: boolean;
}

export function LlmTaskAutoStarter({ enabled }: LlmTaskAutoStarterProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let inFlight = false;

    async function startTasks() {
      if (inFlight) {
        return;
      }

      inFlight = true;

      try {
        const response = await fetch("/api/llm-tasks/start", {
          method: "POST",
          cache: "no-store",
        });
        const result = (await response.json()) as {
          started?: boolean;
          reason?: string;
        };

        if (!cancelled && (result.started || result.reason === "already_running")) {
          router.refresh();
        }
      } catch {
        // Keep the page usable if the autostart check fails; the next poll can retry.
      } finally {
        inFlight = false;
      }
    }

    void startTasks();
    const interval = window.setInterval(() => {
      void startTasks();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, router]);

  return null;
}

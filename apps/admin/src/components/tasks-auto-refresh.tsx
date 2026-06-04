"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface TasksAutoRefreshProps {
  enabled: boolean;
}

export function TasksAutoRefresh({ enabled }: TasksAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [enabled, router]);

  return null;
}

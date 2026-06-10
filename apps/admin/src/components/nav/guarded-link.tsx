"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useDirtyState } from "@/components/providers/dirty-state";

/**
 * Drop-in replacement for `next/link` that respects the app-level unsaved-changes
 * guard: if a tracked form is dirty, the user is asked to confirm before the
 * soft navigation proceeds. When nothing is dirty it behaves exactly like `Link`,
 * so it's safe to use for all chrome navigation (sidebar, breadcrumbs, back).
 */
export function GuardedLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const { confirmDiscard } = useDirtyState();

  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !confirmDiscard()) {
          event.preventDefault();
        }
      }}
    />
  );
}

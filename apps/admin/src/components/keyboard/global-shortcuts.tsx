"use client";

import { useEffect } from "react";

import { useChromeState } from "@/components/providers/chrome-state";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Global keyboard shortcuts mounted once in the shell. ⌘/Ctrl-K toggles the
 * command palette (works even while typing); `/` focuses a list's search box and
 * `?` opens the shortcut cheatsheet (only when not already typing). ⌘/Ctrl-S is
 * handled inside {@link SaveBar} so it targets the active editor's form.
 */
export function GlobalShortcuts() {
  const { paletteOpen, openPalette, closePalette, openShortcuts } = useChromeState();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (paletteOpen) {
          closePalette();
        } else {
          openPalette();
        }
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === "/") {
        const search = document.querySelector<HTMLInputElement>('input[type="search"]');
        if (search) {
          event.preventDefault();
          search.focus();
        }
      } else if (event.key === "?") {
        event.preventDefault();
        openShortcuts();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paletteOpen, openPalette, closePalette, openShortcuts]);

  return null;
}

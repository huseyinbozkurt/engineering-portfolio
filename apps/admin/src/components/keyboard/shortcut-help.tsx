"use client";

import { useEffect, useRef } from "react";

import { useChromeState } from "@/components/providers/chrome-state";

function modKey(): string {
  if (typeof navigator === "undefined") {
    return "Ctrl";
  }
  return /Mac|iP(hone|ad|od)/.test(navigator.platform) ? "⌘" : "Ctrl";
}

/**
 * Keyboard-shortcut cheatsheet, opened with `?` or from the command palette.
 * Controlled by {@link useChromeState} and rendered as a native modal dialog.
 */
export function ShortcutHelp() {
  const { shortcutsOpen, closeShortcuts } = useChromeState();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (shortcutsOpen && !dialog.open) {
      dialog.showModal();
    } else if (!shortcutsOpen && dialog.open) {
      dialog.close();
    }
  }, [shortcutsOpen]);

  const mod = modKey();
  const shortcuts: Array<{ keys: string[]; label: string }> = [
    { keys: [mod, "K"], label: "Open command palette" },
    { keys: ["/"], label: "Focus the list search" },
    { keys: [mod, "S"], label: "Save the current editor" },
    { keys: ["?"], label: "Show this cheatsheet" },
    { keys: ["Esc"], label: "Close dialogs & palette" },
  ];

  return (
    <dialog
      ref={dialogRef}
      onClose={closeShortcuts}
      aria-label="Keyboard shortcuts"
      className="mx-auto my-auto w-[min(calc(100vw-2rem),28rem)] rounded-2xl border border-line-strong bg-surface p-0 text-ink shadow-pop outline-none backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 className="text-base font-semibold text-ink">Keyboard shortcuts</h2>
        <ul className="mt-4 grid gap-1">
          {shortcuts.map((shortcut) => (
            <li
              key={shortcut.label}
              className="flex items-center justify-between gap-4 rounded-lg px-2 py-2 text-sm"
            >
              <span className="text-muted">{shortcut.label}</span>
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex min-w-[1.6rem] items-center justify-center rounded-md border border-line bg-white/[0.05] px-1.5 py-0.5 text-xs font-medium text-ink"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-end">
          <button type="button" className="ui-btn-secondary" onClick={closeShortcuts}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

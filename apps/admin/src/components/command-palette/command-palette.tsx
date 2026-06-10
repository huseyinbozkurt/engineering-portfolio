"use client";

import { CornerDownLeft, ExternalLink, Keyboard, PanelLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { useChromeState } from "@/components/providers/chrome-state";
import { useDirtyState } from "@/components/providers/dirty-state";
import { adminNavItems } from "@/lib/admin-nav";

interface SearchIndexItem {
  type: string;
  id: string;
  title: string;
  href: string;
}

interface PaletteCommand {
  key: string;
  label: string;
  hint?: string;
  group: string;
  icon?: ComponentType<{ className?: string }>;
  href?: string;
  perform?: () => void;
}

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Global command palette (⌘K / Ctrl-K). Built on a native `<dialog>` for free
 * focus-trapping and Esc handling. Filters across navigation destinations, a
 * lazily-loaded record index, and chrome actions; selecting a destination
 * respects the unsaved-changes guard.
 */
export function CommandPalette() {
  const router = useRouter();
  const { paletteOpen, closePalette, toggleSidebar, openShortcuts } = useChromeState();
  const { confirmDiscard } = useDirtyState();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [records, setRecords] = useState<SearchIndexItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Sync the controlled open state with the native dialog, and lazy-load records.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (paletteOpen && !dialog.open) {
      setQuery("");
      setActive(0);
      dialog.showModal();
      if (!loaded) {
        setLoaded(true);
        fetch("/api/search-index")
          .then((response) => response.json())
          .then((data: { items?: SearchIndexItem[] }) => setRecords(data.items ?? []))
          .catch(() => setRecords([]));
      }
    } else if (!paletteOpen && dialog.open) {
      dialog.close();
    }
  }, [paletteOpen, loaded]);

  useEffect(() => {
    if (paletteOpen) {
      // Focus after the dialog paints.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [paletteOpen]);

  const allCommands = useMemo<PaletteCommand[]>(() => {
    const nav: PaletteCommand[] = adminNavItems.map((item) => ({
      key: `nav:${item.href}`,
      label: item.label,
      hint: item.group,
      group: "Go to",
      icon: item.icon,
      href: item.href,
    }));

    const recordCommands: PaletteCommand[] = records.map((record) => ({
      key: `rec:${record.id}`,
      label: record.title,
      hint: record.type,
      group: "Records",
      href: record.href,
    }));

    const actions: PaletteCommand[] = [
      {
        key: "act:sidebar",
        label: "Toggle sidebar",
        group: "Actions",
        icon: PanelLeft,
        perform: toggleSidebar,
      },
      {
        key: "act:shortcuts",
        label: "Keyboard shortcuts",
        group: "Actions",
        icon: Keyboard,
        perform: openShortcuts,
      },
      {
        key: "act:public",
        label: "View public site",
        group: "Actions",
        icon: ExternalLink,
        perform: () => window.open(PUBLIC_SITE_URL, "_blank", "noopener,noreferrer"),
      },
    ];

    return [...nav, ...recordCommands, ...actions];
  }, [records, toggleSidebar, openShortcuts]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      // Default view stays tidy: hide the (potentially long) record list.
      return allCommands.filter((command) => command.group !== "Records");
    }
    return allCommands.filter((command) =>
      `${command.label} ${command.hint ?? ""}`.toLowerCase().includes(needle),
    );
  }, [allCommands, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    itemRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = useCallback(
    (command: PaletteCommand | undefined) => {
      if (!command) {
        return;
      }
      if (command.href) {
        if (!confirmDiscard()) {
          return;
        }
        closePalette();
        router.push(command.href);
        return;
      }
      closePalette();
      command.perform?.();
    },
    [closePalette, confirmDiscard, router],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (filtered.length === 0) {
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((index) => (index + 1) % filtered.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((index) => (index - 1 + filtered.length) % filtered.length);
      } else if (event.key === "Enter") {
        event.preventDefault();
        run(filtered[active]);
      }
    },
    [active, filtered, run],
  );

  let lastGroup = "";

  return (
    <dialog
      ref={dialogRef}
      onClose={closePalette}
      aria-label="Command palette"
      className="mx-auto mb-auto mt-[12vh] w-[min(calc(100vw-2rem),40rem)] rounded-2xl border border-line-strong bg-surface/95 p-0 text-ink shadow-pop outline-none backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, records, actions…"
            aria-label="Search commands"
            className="w-full bg-transparent py-3.5 text-sm text-ink outline-none placeholder:text-muted/60"
          />
        </div>
        <ul className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">No matches.</li>
          ) : (
            filtered.map((command, index) => {
              const showGroup = command.group !== lastGroup;
              lastGroup = command.group;
              const Icon = command.icon;
              const isActive = index === active;
              return (
                <li key={command.key}>
                  {showGroup ? (
                    <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted/50 first:pt-1">
                      {command.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    onMouseMove={() => setActive(index)}
                    onClick={() => run(command)}
                    aria-selected={isActive}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      isActive ? "bg-accent-400/[0.14] text-ink" : "text-muted hover:text-ink"
                    }`}
                  >
                    {Icon ? (
                      <Icon
                        className={`size-4 shrink-0 ${isActive ? "text-accent-200" : "text-muted"}`}
                      />
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate">{command.label}</span>
                    {command.hint ? (
                      <span className="shrink-0 rounded-md border border-line bg-white/[0.03] px-1.5 py-0.5 text-[11px] text-muted">
                        {command.hint}
                      </span>
                    ) : null}
                    {isActive ? (
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted/70" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </dialog>
  );
}

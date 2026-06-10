"use client";

import { PanelLeft, Search } from "lucide-react";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin-nav";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { GlobalShortcuts } from "@/components/keyboard/global-shortcuts";
import { ShortcutHelp } from "@/components/keyboard/shortcut-help";
import { GuardedLink } from "@/components/nav/guarded-link";
import { ChromeStateProvider, useChromeState } from "@/components/providers/chrome-state";
import { DirtyStateProvider } from "@/components/providers/dirty-state";
import { FlashToaster } from "@/components/toast/flash-toaster";
import { ToastProvider } from "@/components/toast/toast-provider";
import type { FlashMessage } from "@/lib/flash-shared";

function PaletteTrigger() {
  const { sidebarCollapsed, openPalette } = useChromeState();

  if (sidebarCollapsed) {
    return (
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search (⌘K)"
        title="Search (⌘K)"
        className="flex w-full items-center justify-center rounded-xl border border-line bg-white/[0.02] p-2.5 text-muted transition hover:border-line-strong hover:text-ink"
      >
        <Search className="size-4" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openPalette}
      className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-white/[0.02] px-3 py-2 text-sm text-muted transition hover:border-line-strong hover:text-ink"
    >
      <Search className="size-4" aria-hidden />
      <span className="flex-1 text-left">Search…</span>
      <kbd className="rounded-md border border-line bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-medium text-muted">
        ⌘K
      </kbd>
    </button>
  );
}

function AdminSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useChromeState();

  return (
    <aside
      className={`border-b border-line bg-white/[0.015] py-5 backdrop-blur-sm lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:py-6 ${
        sidebarCollapsed ? "px-2.5" : "px-4"
      }`}
    >
      <div
        className={`flex items-center gap-2 ${sidebarCollapsed ? "flex-col" : "justify-between"}`}
      >
        <GuardedLink
          href="/"
          className={`flex items-center rounded-xl transition hover:bg-white/[0.04] ${
            sidebarCollapsed ? "p-1.5" : "gap-2.5 px-2 py-1.5"
          }`}
          title="Portfolio Admin"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-indigo-500 text-sm font-bold text-white shadow-sm shadow-accent-500/40">
            P
          </span>
          {sidebarCollapsed ? null : (
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-ink">Portfolio Admin</span>
              <span className="text-xs text-muted">Content operations</span>
            </span>
          )}
        </GuardedLink>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden size-8 items-center justify-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-ink lg:flex"
        >
          <PanelLeft className="size-4" aria-hidden />
        </button>
      </div>

      <div className={sidebarCollapsed ? "mt-5" : "mt-5"}>
        <PaletteTrigger />
      </div>

      <div className="lg:flex-1 lg:overflow-y-auto">
        <AdminNav />
      </div>
    </aside>
  );
}

function ShellLayout({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useChromeState();

  return (
    <div
      className={`min-h-screen lg:grid ${
        sidebarCollapsed ? "lg:grid-cols-[68px_1fr]" : "lg:grid-cols-[268px_1fr]"
      }`}
    >
      <AdminSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * Client shell: mounts the app-wide providers (toasts, unsaved-change guard,
 * chrome UI state), the collapsible sidebar + content grid, and the global chrome
 * overlays (command palette, shortcut help, keyboard handler, flash toaster).
 */
export function AdminShellClient({
  flash,
  children,
}: {
  flash: FlashMessage | null;
  children: ReactNode;
}) {
  return (
    <ToastProvider>
      <DirtyStateProvider>
        <ChromeStateProvider>
          <ShellLayout>{children}</ShellLayout>
          <CommandPalette />
          <ShortcutHelp />
          <GlobalShortcuts />
          <FlashToaster flash={flash} />
        </ChromeStateProvider>
      </DirtyStateProvider>
    </ToastProvider>
  );
}

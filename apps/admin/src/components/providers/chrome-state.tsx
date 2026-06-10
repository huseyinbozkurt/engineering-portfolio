"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ChromeStateValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  shortcutsOpen: boolean;
  openShortcuts: () => void;
  closeShortcuts: () => void;
}

const ChromeStateContext = createContext<ChromeStateValue | null>(null);

const SIDEBAR_KEY = "admin:sidebar-collapsed";

/**
 * Shared chrome UI state: sidebar collapse (persisted to localStorage) and the
 * open/close state of the command palette and the keyboard-shortcut cheatsheet.
 * Centralizing it lets the shell, sidebar, global shortcut handler, and palette
 * coordinate without prop drilling or ad-hoc DOM events.
 */
export function ChromeStateProvider({ children }: { children: ReactNode }) {
  // Start expanded to match server render, then hydrate the persisted value.
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_KEY) === "1") {
        setSidebarCollapsedState(true);
      }
    } catch {
      // localStorage unavailable — keep the default.
    }
  }, []);

  const setSidebarCollapsed = useCallback((value: boolean) => {
    setSidebarCollapsedState(value);
    try {
      window.localStorage.setItem(SIDEBAR_KEY, value ? "1" : "0");
    } catch {
      // Ignore persistence failures.
    }
  }, []);

  const toggleSidebar = useCallback(
    () => setSidebarCollapsed(!sidebarCollapsed),
    [sidebarCollapsed, setSidebarCollapsed],
  );

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      paletteOpen,
      openPalette,
      closePalette,
      shortcutsOpen,
      openShortcuts,
      closeShortcuts,
    }),
    [
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      paletteOpen,
      openPalette,
      closePalette,
      shortcutsOpen,
      openShortcuts,
      closeShortcuts,
    ],
  );

  return <ChromeStateContext.Provider value={value}>{children}</ChromeStateContext.Provider>;
}

export function useChromeState(): ChromeStateValue {
  const context = useContext(ChromeStateContext);
  if (!context) {
    throw new Error("useChromeState must be used within a ChromeStateProvider");
  }
  return context;
}

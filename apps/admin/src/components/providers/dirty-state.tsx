"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface DirtyStateValue {
  isDirty: boolean;
  /** Register (or clear) a form's unsaved state under a stable key. */
  setDirty: (key: string, dirty: boolean) => void;
  /** Returns true if it's safe to leave — when clean, or the user confirms. */
  confirmDiscard: () => boolean;
}

const fallback: DirtyStateValue = {
  isDirty: false,
  setDirty: () => {},
  confirmDiscard: () => true,
};

const DirtyStateContext = createContext<DirtyStateValue | null>(null);

const DISCARD_MESSAGE = "You have unsaved changes. Leave this page without saving?";

/**
 * App-level registry of unsaved editor state. A single power user edits one thing
 * at a time, so any number of registered keys collapses to one "dirty" flag that
 * drives the `beforeunload` guard (hard navigation / tab close) and the in-app
 * navigation guard used by {@link GuardedLink}. Forms register via
 * {@link useDirtyState} (see ConfirmedForm's `trackDirty`).
 */
export function DirtyStateProvider({ children }: { children: ReactNode }) {
  const keys = useRef(new Set<string>());
  const [isDirty, setIsDirty] = useState(false);

  const setDirty = useCallback((key: string, dirty: boolean) => {
    const set = keys.current;
    const had = set.has(key);
    if (dirty) {
      set.add(key);
    } else {
      set.delete(key);
    }
    if (had !== set.has(key)) {
      setIsDirty(set.size > 0);
    }
  }, []);

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const confirmDiscard = useCallback(() => {
    if (keys.current.size === 0) {
      return true;
    }
    return window.confirm(DISCARD_MESSAGE);
  }, []);

  const value = useMemo(
    () => ({ isDirty, setDirty, confirmDiscard }),
    [isDirty, setDirty, confirmDiscard],
  );

  return <DirtyStateContext.Provider value={value}>{children}</DirtyStateContext.Provider>;
}

export function useDirtyState(): DirtyStateValue {
  return useContext(DirtyStateContext) ?? fallback;
}

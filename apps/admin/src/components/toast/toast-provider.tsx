"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "success" | "error" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Auto-dismiss delay in ms. `0` keeps it until dismissed. Defaults by tone. */
  duration?: number;
}

interface ToastRecord extends Required<Omit<ToastOptions, "duration">> {
  id: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneConfig: Record<
  ToastTone,
  { icon: typeof CheckCircle2; iconClass: string; ring: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-success-300",
    ring: "border-success-400/30",
  },
  error: { icon: XCircle, iconClass: "text-danger-300", ring: "border-danger-400/40" },
  info: { icon: Info, iconClass: "text-accent-200", ring: "border-accent-400/30" },
};

/**
 * App-wide toast notifications. Mounted once near the root of the admin shell so
 * any client component can call `useToast().toast({ … })` for non-intrusive
 * success / error / info feedback. Server-action results that survive a redirect
 * are surfaced separately via the flash cookie + {@link FlashToaster}.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idRef = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description = "", tone = "success", duration }: ToastOptions) => {
      const id = (idRef.current += 1);
      setToasts((current) => [...current, { id, title, description, tone }]);

      const ttl = duration ?? (tone === "error" ? 7000 : 4000);
      if (ttl > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), ttl),
        );
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 px-4 py-5 sm:items-end sm:px-6"
      >
        {toasts.map((item) => {
          const config = toneConfig[item.tone];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              role={item.tone === "error" ? "alert" : "status"}
              className={`ui-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border ${config.ring} bg-surface/95 p-3.5 shadow-pop backdrop-blur-sm`}
            >
              <Icon className={`mt-0.5 size-4 shrink-0 ${config.iconClass}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-xs leading-5 text-muted">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-white/[0.06] hover:text-ink"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Access the toast dispatcher. Falls back to a no-op when rendered outside a
 * provider (e.g. isolated tests) so callers never need a null check.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  return context ?? { toast: () => {} };
}

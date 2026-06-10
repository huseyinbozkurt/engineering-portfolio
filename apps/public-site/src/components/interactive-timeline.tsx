"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FocusEvent, type ReactElement, type SVGProps } from "react";

export interface InteractiveTimelineItem {
  id: string;
  kind: "experience" | "project";
  name: string;
  role: string;
  dateRange: string;
  summary: string;
  tags: string[];
  href: string;
}

const itemStyles = {
  experience: {
    icon: "border-sky-300/70 bg-sky-400/15 text-sky-200 shadow-[0_0_0_5px_rgba(96,165,250,0.12)]",
    glow: "from-sky-400/16 via-violet-400/12 to-transparent",
    ring: "focus-visible:ring-sky-300",
    link: "text-sky-300 hover:text-sky-200 focus-visible:ring-sky-300",
  },
  project: {
    icon: "border-emerald-300/70 bg-emerald-400/15 text-emerald-200 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]",
    glow: "from-emerald-400/16 via-sky-400/12 to-transparent",
    ring: "focus-visible:ring-emerald-300",
    link: "text-emerald-300 hover:text-emerald-200 focus-visible:ring-emerald-300",
  },
} satisfies Record<
  InteractiveTimelineItem["kind"],
  Record<"icon" | "glow" | "ring" | "link", string>
>;

const legendItems = {
  experience: {
    label: "Professional Experience",
    Icon: BriefcaseIcon,
  },
  project: {
    label: "Personal Projects",
    Icon: CodeIcon,
  },
} satisfies Record<
  InteractiveTimelineItem["kind"],
  {
    label: string;
    Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  }
>;

export function InteractiveTimeline({ items }: { items: InteractiveTimelineItem[] }) {
  const [activeTimelineItemId, setActiveTimelineItemId] = useState<string | null>(null);
  const [isHoverCapable, setIsHoverCapable] = useState(true);
  const [isDesktopLayout, setIsDesktopLayout] = useState(true);
  const lastPointerTypeRef = useRef<string | null>(null);
  const ignoreNextFocusRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateInteractionMode = () => {
      const desktopLayout = window.innerWidth >= 768;

      setIsDesktopLayout(desktopLayout);
      setIsHoverCapable(mediaQuery.matches && desktopLayout);
    };

    updateInteractionMode();
    mediaQuery.addEventListener("change", updateInteractionMode);
    window.addEventListener("resize", updateInteractionMode);

    return () => {
      mediaQuery.removeEventListener("change", updateInteractionMode);
      window.removeEventListener("resize", updateInteractionMode);
    };
  }, []);

  useEffect(() => {
    if (!activeTimelineItemId) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = getElementFromEventTarget(event.target);
      const timelineItem = target?.closest<HTMLElement>("[data-timeline-id]");

      if (timelineItem?.dataset.timelineId === activeTimelineItemId) {
        return;
      }

      setActiveTimelineItemId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveTimelineItemId(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTimelineItemId]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="relative" data-timeline>
      <ol className="relative grid gap-0 md:grid-flow-col md:auto-cols-[minmax(8rem,1fr)]">
        {items.map((item) => {
          const styles = itemStyles[item.kind];
          const { Icon, label } = legendItems[item.kind];
          const overviewId = `${item.id}-overview`;
          const isActive = activeTimelineItemId === item.id;

          return (
            <li
              key={item.id}
              data-timeline-item={item.kind}
              data-timeline-id={item.id}
              className={`group relative py-1 md:py-0 ${isActive ? "z-50" : "z-10"}`}
              onMouseEnter={() => {
                if (isHoverCapable) {
                  setActiveTimelineItemId(item.id);
                }
              }}
              onMouseLeave={(event) => {
                if (isHoverCapable) {
                  if (hasFocusedDescendant(event.currentTarget)) {
                    return;
                  }

                  setActiveTimelineItemId((current) => (current === item.id ? null : current));
                }
              }}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse" && isHoverCapable) {
                  setActiveTimelineItemId(item.id);
                }
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse" && isHoverCapable) {
                  if (hasFocusedDescendant(event.currentTarget)) {
                    return;
                  }

                  setActiveTimelineItemId((current) => (current === item.id ? null : current));
                }
              }}
              onFocusCapture={() => {
                if (!isDesktopLayout || ignoreNextFocusRef.current) {
                  return;
                }

                setActiveTimelineItemId(item.id);
              }}
              onBlurCapture={(event) => {
                closeWhenFocusLeavesItem(event, item.id, setActiveTimelineItemId);
              }}
            >
              <button
                type="button"
                aria-controls={overviewId}
                aria-expanded={isActive}
                onPointerDown={(event) => {
                  lastPointerTypeRef.current = event.pointerType;

                  if (isDirectTouchPointer(event.pointerType)) {
                    ignoreNextFocusRef.current = true;
                    window.setTimeout(() => {
                      ignoreNextFocusRef.current = false;
                    }, 0);
                  }
                }}
                onFocus={() => {
                  if (!isDesktopLayout || ignoreNextFocusRef.current) {
                    return;
                  }

                  setActiveTimelineItemId(item.id);
                }}
                onClick={() => {
                  const pointerType = lastPointerTypeRef.current;
                  lastPointerTypeRef.current = null;

                  if (isDesktopLayout && !isDirectTouchPointer(pointerType)) {
                    setActiveTimelineItemId(item.id);
                    return;
                  }

                  setActiveTimelineItemId((current) => (current === item.id ? null : item.id));
                }}
                className={`grid w-full cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)] gap-3 rounded-lg text-left transition focus:outline-none focus-visible:ring-2 md:block md:px-0 ${styles.ring}`}
              >
                <span className="relative flex min-h-32 justify-center md:min-h-0 md:w-full md:items-center">
                  <span
                    aria-hidden
                    data-timeline-axis
                    className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line md:inset-x-0 md:inset-y-auto md:top-1/2 md:h-px md:w-auto md:translate-x-0 md:-translate-y-1/2"
                  />
                  <span
                    data-timeline-icon
                    className={`relative z-10 mt-1 flex size-10 items-center justify-center rounded-full border backdrop-blur ${styles.icon} md:mt-0`}
                  >
                    <Icon className="size-5" aria-hidden />
                    <span className="sr-only">{label}</span>
                  </span>
                </span>

                <span className="block min-w-0 rounded-lg px-1 pb-5 pt-1 transition group-hover:bg-white/[0.035] md:mt-3 md:px-3 md:pb-3 md:pt-2 md:text-center">
                  {item.dateRange ? (
                    <span className="block text-xs font-semibold text-violet-200">
                      {item.dateRange}
                    </span>
                  ) : null}
                  <span className="mt-3 block text-sm font-semibold text-ink transition group-hover:text-violet-100">
                    {item.name}
                  </span>
                  {item.role ? (
                    <span className="mt-1 block text-sm leading-5 text-muted">{item.role}</span>
                  ) : null}
                </span>
              </button>

              <TimelineOverview id={overviewId} item={item} styles={styles} isActive={isActive} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TimelineOverview({
  id,
  item,
  styles,
  isActive,
}: {
  id: string;
  item: InteractiveTimelineItem;
  styles: (typeof itemStyles)[InteractiveTimelineItem["kind"]];
  isActive: boolean;
}) {
  return (
    <div
      id={id}
      data-timeline-overview
      aria-hidden={!isActive}
      className={`pointer-events-none absolute left-11 right-0 top-full z-40 mt-2 rounded-lg border border-white/14 bg-[#07111f]/95 p-4 opacity-0 shadow-[0_22px_70px_rgba(0,0,0,0.46)] backdrop-blur-xl transition duration-200 md:left-1/2 md:right-auto md:top-14 md:mt-0 md:w-80 md:-translate-x-1/2 md:scale-95 ${
        isActive ? "opacity-100 md:pointer-events-auto md:scale-100" : ""
      }`}
    >
      <span
        className={`pointer-events-none absolute inset-0 -z-10 rounded-lg bg-gradient-to-br ${styles.glow}`}
        aria-hidden
      />
      {item.dateRange ? (
        <p className="text-xs font-semibold text-violet-200">{item.dateRange}</p>
      ) : null}
      <h3 className="mt-3 text-base font-semibold text-ink">{item.name}</h3>
      {item.role ? <p className="mt-1 text-sm leading-5 text-muted">{item.role}</p> : null}
      {item.summary ? (
        <p className="mt-4 text-sm leading-6 text-muted">{item.summary}</p>
      ) : null}
      {item.tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <li
              key={`${item.id}-${tag}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-ink/85"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      <Link
        href={item.href}
        tabIndex={isActive ? undefined : -1}
        className={`mt-5 inline-flex rounded-sm text-sm font-semibold transition focus:outline-none focus-visible:ring-2 ${
          isActive ? "pointer-events-auto" : "pointer-events-none"
        } ${styles.link}`}
      >
        View details
        <span className="ml-2" aria-hidden>
          →
        </span>
      </Link>
    </div>
  );
}

function closeWhenFocusLeavesItem(
  event: FocusEvent<HTMLElement>,
  itemId: string,
  setActiveTimelineItemId: (updater: (current: string | null) => string | null) => void,
) {
  const nextFocusedElement = event.relatedTarget;

  if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
    return;
  }

  setActiveTimelineItemId((current) => (current === itemId ? null : current));
}

function getElementFromEventTarget(target: EventTarget | null): Element | null {
  if (target instanceof Element) {
    return target;
  }

  if (target instanceof Node) {
    return target.parentElement;
  }

  return null;
}

function isDirectTouchPointer(pointerType: string | null): boolean {
  return pointerType === "touch" || pointerType === "pen";
}

function hasFocusedDescendant(element: HTMLElement): boolean {
  const focusedElement = document.activeElement;

  return focusedElement instanceof Node && element.contains(focusedElement);
}

function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      <path d="M4.5 8.5h15v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9Z" />
      <path d="M4.5 12.5h15" />
      <path d="M10 12.5v1h4v-1" />
    </svg>
  );
}

function CodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
      <path d="m8.5 8-4 4 4 4" />
      <path d="m15.5 8 4 4-4 4" />
      <path d="m13 6-2 12" />
    </svg>
  );
}

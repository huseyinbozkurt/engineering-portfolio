"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { navItems } from "@/lib/site";

export interface NavBrand {
  name: string;
  plainName: string;
  showName: boolean;
  logoUrl: string | null;
  logoSize: number;
  initials: string;
}

function InlineBrandMarkdown({ value }: { value: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <>{children}</>,
        a: ({ children }) => <span>{children}</span>,
        img: () => null,
        blockquote: ({ children }) => <span>{children}</span>,
        code: ({ children }) => (
          <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.9em]">
            {children}
          </code>
        ),
        h1: ({ children }) => <span>{children}</span>,
        h2: ({ children }) => <span>{children}</span>,
        h3: ({ children }) => <span>{children}</span>,
        ul: ({ children }) => <span>{children}</span>,
        ol: ({ children }) => <span>{children}</span>,
        li: ({ children }) => <span>{children}</span>,
      }}
    >
      {value}
    </ReactMarkdown>
  );
}

export function NavClient({ brand }: { brand: NavBrand }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[#050914]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-ink"
        >
          <span
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-violet-400 via-sky-400 to-emerald-300 text-xs font-black text-slate-950"
            style={{ width: brand.logoSize, height: brand.logoSize }}
            aria-hidden
          >
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              brand.initials
            )}
          </span>
          {brand.showName ? (
            <span className="max-w-[min(52vw,16rem)] truncate [&_em]:text-ink/85 [&_strong]:text-white">
              <InlineBrandMarkdown value={brand.name} />
            </span>
          ) : (
            <span className="sr-only">{brand.plainName}</span>
          )}
        </Link>
        <nav className="order-3 grid w-full grid-cols-2 gap-1 sm:grid-cols-3 md:order-none md:flex md:w-auto md:items-center">
          {navItems
            .filter((item) => item.href !== "/contact")
            .map((item) => {
              const isActive = pathname.startsWith(item.href);
              const isAiInsights = item.href === "/ai-insights";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/7 hover:text-ink ${
                    isActive ? "text-violet-200" : "text-muted"
                  } ${isAiInsights ? "ainav" : ""}`}
                >
                  {isAiInsights ? (
                    <>
                      <span aria-hidden className="ainav__robot hidden md:block">
                        <span className="ainav__orbit">
                          <RobotIllustration />
                        </span>
                      </span>
                      <span className="ainav__label">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                  {isActive ? (
                    <span
                      className="absolute inset-x-3 -bottom-1 hidden h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent md:block"
                      aria-hidden
                    />
                  ) : null}
                </Link>
              );
            })}
        </nav>
        <Link
          href="/contact"
          aria-current={pathname === "/contact" ? "page" : undefined}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition hover:border-violet-300 hover:bg-violet-400/10 ${
            pathname === "/contact"
              ? "border-violet-300 bg-violet-400/10 text-violet-100"
              : "border-violet-400/70 text-ink"
          }`}
        >
          Contact Me
        </Link>
      </div>
    </header>
  );
}

function RobotIllustration() {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ainav__svg"
      aria-hidden="true"
    >
      <g className="ainav__antenna">
        <line
          x1="14"
          y1="6.4"
          x2="14"
          y2="3"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="14" cy="2.3" r="1.7" fill="#c4b5fd" />
      </g>
      <rect
        x="3.5"
        y="6"
        width="21"
        height="16.5"
        rx="5.5"
        fill="#191331"
        stroke="#8b7ad8"
        strokeWidth="1.2"
      />
      <rect x="1.3" y="11" width="2.6" height="5.6" rx="1.3" fill="#8b7ad8" />
      <rect x="24.1" y="11" width="2.6" height="5.6" rx="1.3" fill="#8b7ad8" />
      <rect x="6" y="8.9" width="16" height="10.7" rx="3.4" fill="#0b0817" />
      <g fill="#c4b5fd">
        <rect className="ainav__eye" x="9" y="11.6" width="2.9" height="5" rx="1.45" />
        <rect className="ainav__eye" x="16.1" y="11.6" width="2.9" height="5" rx="1.45" />
      </g>
      <path
        d="M11 18.1c1.9 1.2 4.1 1.2 6 0"
        stroke="#6f63b8"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

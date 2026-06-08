import { siteConfig } from "@/lib/site";

// Rendered as the only public surface when the database is empty or unreachable.
// Secret values and app routing should be fixed before exposing other pages.
export function ComingSoon() {
  return (
    <section className="quiet-grid flex min-h-screen items-center justify-center px-5 py-24 lg:px-8">
      <div className="glass-panel w-full max-w-2xl rounded-lg p-8 text-center shadow-glow sm:p-12">
        <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-violet-400 via-sky-300 to-emerald-300" />
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-violet-200">
          {siteConfig.name}
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-ink md:text-6xl">Coming soon</h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted md:text-lg md:leading-8">
          This engineering portfolio is being prepared. Lenses, operating principles,
          projects, and case studies will appear here as soon as they are published.
        </p>
      </div>
    </section>
  );
}

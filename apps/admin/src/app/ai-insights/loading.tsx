export default function AiInsightsLoading() {
  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
      <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-white/10" />

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-lg border border-line bg-white/[0.03] p-5">
            <div className="h-8 w-16 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-3 w-28 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
        {[0, 1].map((item) => (
          <div key={item} className="rounded-lg border border-line bg-white/[0.03] p-5">
            <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
            <div className="mt-4 grid gap-3">
              <div className="h-12 animate-pulse rounded bg-white/10" />
              <div className="h-12 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

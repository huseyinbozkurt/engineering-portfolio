export default function ExperiencesLoading() {
  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="mb-8 grid gap-3">
        <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-white/10" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="grid gap-5">
        {[0, 1, 2].map((item) => (
          <div key={item} className="ml-10 rounded-lg border border-line bg-white/[0.02] p-5">
            <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-7 w-72 animate-pulse rounded-lg bg-white/10" />
            <div className="mt-3 h-4 w-52 animate-pulse rounded-full bg-white/10" />
            <div className="mt-5 h-16 w-full animate-pulse rounded-xl bg-white/10" />
          </div>
        ))}
      </div>
    </main>
  );
}

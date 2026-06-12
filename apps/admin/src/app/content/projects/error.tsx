"use client";

import { RotateCcw } from "lucide-react";

export default function ProjectsError({ reset }: { reset: () => void }) {
  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="rounded-2xl border border-danger-400/30 bg-danger-500/[0.04] p-8">
        <h1 className="text-lg font-semibold text-ink">Projects could not load</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          The admin could not read the projects workspace. Try again after the connection settles.
        </p>
        <button type="button" onClick={reset} className="ui-btn-secondary mt-5">
          <RotateCcw className="size-4" aria-hidden />
          Retry
        </button>
      </div>
    </main>
  );
}

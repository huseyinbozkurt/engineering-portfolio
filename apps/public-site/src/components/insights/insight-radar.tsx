import {
  type HomePageContent,
  type SignalRadar,
} from "@portfolio/validators";

export function InsightRadar({
  content,
  signalRadar,
}: {
  content: HomePageContent | undefined;
  signalRadar: SignalRadar | undefined;
}) {
  if (!content) {
    return null;
  }

  return (
    <>

      {content.capabilitySnapshot.length > 0 ? (
        <>
          <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {content.capabilitySnapshot.map((capability) => {
              return (
                <div key={`${capability.radarKey ?? capability.label}-${capability.label}`} className="min-w-0">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 break-words font-medium text-ink">
                      {capability.label}
                    </span>
                    {capability.score !== null ? (
                      <span className="shrink-0 tabular-nums text-muted">{capability.score}/100</span>
                    ) : null}
                  </div>
                  {capability.score !== null ? (
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                      role="progressbar"
                      aria-valuenow={capability.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={capability.label}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
                        style={{ width: `${Math.max(capability.score!, 2)}%` }}
                      />
                    </div>
                  ) : null}
                  <p className="mt-2 break-words text-xs leading-5 text-muted">{capability.summary}</p>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}

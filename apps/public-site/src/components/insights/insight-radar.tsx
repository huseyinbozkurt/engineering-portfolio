export interface RadarAxis {
  label: string;
  score: number;
  /** True when validation found no supporting evidence for this axis. */
  insufficient: boolean;
}

function radarPoint(index: number, total: number, center: number, distance: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: center + Math.cos(angle) * distance,
    y: center + Math.sin(angle) * distance,
  };
}

/**
 * Signal radar rendered from validated scores only. Axes the validation marked
 * as evidence-less render at zero and are listed as "insufficient data" beside
 * the chart instead of pretending a signal exists.
 */
export function InsightRadar({ axes }: { axes: RadarAxis[] }) {
  const size = 280;
  const center = size / 2;
  const radius = 88;
  const rings = [0.25, 0.5, 0.75, 1];

  const points = axes.map((axis, index) =>
    radarPoint(index, axes.length, center, radius * (axis.score / 100)),
  );
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");
  const insufficient = axes.filter((axis) => axis.insufficient);

  return (
    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="mx-auto w-full max-w-80">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Signal radar chart">
          {rings.map((ring) => (
            <polygon
              key={ring}
              points={axes
                .map((_, index) => radarPoint(index, axes.length, center, radius * ring))
                .map((point) => `${point.x},${point.y}`)
                .join(" ")}
              fill="none"
              stroke="rgba(167,139,250,0.22)"
              strokeWidth="1"
            />
          ))}
          {axes.map((axis, index) => {
            const outer = radarPoint(index, axes.length, center, radius);
            const label = radarPoint(index, axes.length, center, radius + 32);

            return (
              <g key={axis.label}>
                <line
                  x1={center}
                  y1={center}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="rgba(167,139,250,0.18)"
                />
                <text
                  x={label.x}
                  y={label.y}
                  fill="#f6f7f9"
                  fontSize="11"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {axis.label}
                </text>
                <text
                  x={label.x}
                  y={label.y + 13}
                  fill="#c4b5fd"
                  fontSize="10"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {axis.insufficient ? "n/a" : axis.score}
                </text>
              </g>
            );
          })}
          <polygon points={polygon} fill="rgba(139,92,246,0.32)" stroke="#a78bfa" strokeWidth="2" />
          {points.map((point, index) => (
            <circle
              key={`${axes[index]?.label ?? index}-point`}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="#c4b5fd"
            />
          ))}
        </svg>
      </div>

      <div className="grid gap-3">
        {axes.map((axis) => (
          <div key={axis.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-ink/90">{axis.label}</span>
              <span className="tabular-nums text-muted">
                {axis.insufficient ? "Insufficient data" : `${axis.score}/100`}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-sky-300"
                style={{ width: `${Math.max(axis.score, 2)}%` }}
              />
            </div>
          </div>
        ))}
        {insufficient.length > 0 ? (
          <p className="mt-1 text-xs leading-5 text-muted">
            {insufficient.map((axis) => axis.label).join(", ")}:{" "}
            {insufficient.length === 1 ? "axis" : "axes"} without enough supporting records — shown
            as zero rather than estimated.
          </p>
        ) : null}
      </div>
    </div>
  );
}

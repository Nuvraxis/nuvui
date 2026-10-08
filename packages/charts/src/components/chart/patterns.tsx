import type { ChartPattern, ResolvedSeries } from "./config";

// One tile of each pattern. The tile is 8 by 8, drawn in the series' color
// over a wash of the same color, so a patterned bar still reads as that
// color from a distance.
function Tile({ pattern, color }: { pattern: ChartPattern; color: string }) {
  const line = { stroke: color, strokeWidth: 2 };
  switch (pattern) {
    case "diagonal":
    case "reverse-diagonal":
    case "vertical":
      return <line x1="4" y1="0" x2="4" y2="8" {...line} />;
    case "horizontal":
      return <line x1="0" y1="4" x2="8" y2="4" {...line} />;
    case "dots":
      return <circle cx="4" cy="4" r="1.75" fill={color} />;
    case "cross":
      return (
        <path d="M1 1l6 6M7 1l-6 6" fill="none" {...line} strokeWidth={1.5} />
      );
    case "grid":
      return <path d="M4 0v8M0 4h8" fill="none" {...line} strokeWidth={1.5} />;
    default:
      return null;
  }
}

const turns: Partial<Record<ChartPattern, string>> = {
  diagonal: "rotate(45)",
  "reverse-diagonal": "rotate(-45)",
};

// The patterns are in an svg of their own and not in the chart's, so that
// the legend and the tooltip, which are HTML, can use them too. It has no
// size, and isn't display: none, because some browsers don't draw a pattern
// that's inside something that isn't displayed.
export function Patterns({ series }: { series: ResolvedSeries[] }) {
  const drawn = series.filter((entry) => entry.patternId);
  if (drawn.length === 0) return null;

  return (
    <svg
      className="nuv-chart__patterns"
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
    >
      <defs>
        {drawn.map((entry) => {
          const color = `var(--chart-${entry.name})`;
          return (
            <pattern
              key={entry.key}
              id={entry.patternId}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform={turns[entry.pattern]}
            >
              <rect width="8" height="8" fill={color} opacity="0.3" />
              <Tile pattern={entry.pattern} color={color} />
            </pattern>
          );
        })}
      </defs>
    </svg>
  );
}

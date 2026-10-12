import { HoloCard } from "@nuvui/react";
import type { CSSProperties } from "react";

// A steeper tilt, square corners, and a foil of one color where the
// default has the theme's four.
const look = {
  "--nuv-holo-card-tilt": "14deg",
  "--nuv-holo-card-radius": "var(--radius-sm)",
  "--nuv-holo-card-foil":
    "linear-gradient(115deg, transparent 30%, var(--color-warning) 50%, transparent 70%)",
  inlineSize: "100%",
  maxInlineSize: 340,
} as CSSProperties;

export default function Example() {
  return (
    <HoloCard style={look}>
      <div
        style={{
          display: "grid",
          gap: 8,
          padding: 24,
          border: "1px solid var(--color-border)",
          borderRadius: "inherit",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-surface-foreground)",
        }}
      >
        <span
          style={{
            color: "var(--color-muted-foreground)",
            fontSize: "var(--text-sm)",
          }}
        >
          Sales kickoff 2027
        </span>
        <strong style={{ fontSize: "var(--text-xl)" }}>Speaker</strong>
        <span>Tom Becker, Finance</span>
      </div>
    </HoloCard>
  );
}

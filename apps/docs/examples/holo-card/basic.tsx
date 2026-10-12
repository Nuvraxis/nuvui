import { HoloCard } from "@nuvui/react";
import type { CSSProperties } from "react";

// The face's colors are the card's, so the glare and the texture lie on
// the face and the words float over them.
const face = {
  "--nuv-holo-card-bg": "var(--color-primary)",
  "--nuv-holo-card-fg": "var(--color-primary-foreground)",
  inlineSize: "100%",
  maxInlineSize: 340,
} as CSSProperties;

export default function Example() {
  return (
    <HoloCard style={face}>
      <div style={{ display: "grid", gap: 24, padding: 24 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: "var(--text-sm)" }}>Northwind Rewards</span>
          <strong style={{ fontSize: "var(--text-xl)" }}>Gold member</strong>
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span>Sajan</span>
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            4821 0093 5567
          </span>
        </div>
      </div>
    </HoloCard>
  );
}

import { HoloCard } from "@nuvui/react";

export default function Example() {
  return (
    <HoloCard style={{ inlineSize: "100%", maxInlineSize: 340 }}>
      <div
        style={{
          display: "grid",
          gap: 24,
          padding: 24,
          backgroundColor: "var(--color-primary)",
          color: "var(--color-primary-foreground)",
        }}
      >
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

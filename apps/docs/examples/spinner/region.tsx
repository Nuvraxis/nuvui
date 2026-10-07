import { Spinner } from "@nuvui/react";

export default function Example() {
  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        color: "var(--color-muted-foreground)",
        fontSize: 14,
      }}
    >
      <Spinner size="sm" label="" />
      Fetching the last 30 days of orders
    </div>
  );
}

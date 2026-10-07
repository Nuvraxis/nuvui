import { ScrollArea } from "@nuvui/react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Example() {
  return (
    <ScrollArea
      orientation="horizontal"
      aria-label="Months"
      style={{ width: "100%", maxWidth: 360 }}
    >
      <div style={{ display: "flex", gap: 12, paddingBlockEnd: 16 }}>
        {months.map((month) => (
          <div
            key={month}
            style={{
              flex: "none",
              width: 120,
              padding: 16,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              fontSize: 14,
            }}
          >
            {month}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

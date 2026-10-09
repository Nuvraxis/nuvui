import { formatNumber, Progress } from "@nuvui/react";

const used = 37.4;
const total = 50;

export default function Example() {
  const unit = { options: { style: "unit", unit: "gigabyte" } } as const;

  return (
    <div style={{ display: "grid", gap: "0.5rem", width: "16rem" }}>
      <Progress
        value={(used / total) * 100}
        aria-label={`Storage: ${formatNumber(used, unit)} of ${formatNumber(total, unit)} used`}
      />
      <span>
        {formatNumber(used, unit)} of {formatNumber(total, unit)}
      </span>
    </div>
  );
}

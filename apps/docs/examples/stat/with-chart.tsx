import {
  FormattedNumber,
  Stat,
  StatChart,
  StatDescription,
  StatLabel,
  StatValue,
  Trend,
} from "@nuvui/react";

const weeks = [31, 34, 33, 38, 41, 39, 44, 47, 46, 52, 55, 61];

// The line, in a box 110 wide and 40 high, with the first week at the left.
const points = weeks
  .map((value, index) => `${index * 10},${40 - ((value - 30) / 32) * 40}`)
  .join(" ");

export default function Example() {
  return (
    <Stat style={{ inlineSize: "16rem" }}>
      <StatLabel>Active teams</StatLabel>
      <StatValue>
        <FormattedNumber value={61} />
      </StatValue>
      <StatDescription>
        <Trend value={0.109} /> in twelve weeks
      </StatDescription>
      {/* The number and the trend already say it, so the picture is hidden
          from screen readers. */}
      <StatChart>
        <svg
          aria-hidden="true"
          viewBox="0 0 110 40"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          fill="none"
          stroke="var(--color-chart-1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points={points} vectorEffect="non-scaling-stroke" />
        </svg>
      </StatChart>
    </Stat>
  );
}

import { Trend } from "@nuvui/react";

export default function Example() {
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto",
        gap: "0.5rem 2rem",
        margin: 0,
      }}
    >
      <dt>Revenue</dt>
      <dd style={{ margin: 0 }}>
        <Trend value={0.082} />
      </dd>
      <dt>Failed payments</dt>
      <dd style={{ margin: 0 }}>
        <Trend value={-0.31} good="down" />
      </dd>
      <dt>Time to first reply</dt>
      <dd style={{ margin: 0 }}>
        <Trend value={0.15} good="down" />
      </dd>
    </dl>
  );
}

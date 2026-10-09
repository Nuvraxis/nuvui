import { Trend } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Trend value={12}>12 more seats</Trend>
      <Trend value={-3} good="down">
        3 fewer open tickets
      </Trend>
      <Trend value={1.8} format={{ format: "decimal" }} />
    </>
  );
}

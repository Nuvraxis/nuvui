import { Trend } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Trend variant="outline" value={0.125} />
      <Trend variant="outline" value={-0.04} />
      <Trend variant="outline" value={0} />
    </>
  );
}

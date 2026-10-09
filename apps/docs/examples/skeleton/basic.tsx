import { Skeleton } from "@nuvui/react";

export default function Example() {
  return (
    <div
      aria-busy="true"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        width: "100%",
        maxWidth: 320,
      }}
    >
      <Skeleton shape="circle" />
      <div style={{ flex: 1 }}>
        <Skeleton shape="text" style={{ width: "60%" }} />
        <Skeleton shape="text" />
      </div>
    </div>
  );
}

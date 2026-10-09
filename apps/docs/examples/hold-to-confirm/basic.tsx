"use client";

import { HoldToConfirm } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [deleted, setDeleted] = useState(0);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <HoldToConfirm onConfirm={() => setDeleted(deleted + 1)}>
        Hold to delete
      </HoldToConfirm>
      <p role="status" style={{ margin: 0 }}>
        Deleted {deleted} {deleted === 1 ? "time" : "times"}
      </p>
    </div>
  );
}

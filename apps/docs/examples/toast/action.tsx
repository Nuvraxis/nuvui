"use client";

import { Button, toast } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [deleted, setDeleted] = useState(false);

  function remove() {
    setDeleted(true);
    toast("report.pdf deleted", {
      // Long enough to read it and get to the button.
      duration: 10000,
      action: {
        label: "Undo",
        altText: "Restore it from the trash",
        onClick: () => setDeleted(false),
      },
    });
  }

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <p style={{ margin: 0 }}>
        {deleted ? "The file is in the trash." : "report.pdf"}
      </p>
      <Button intent="danger" disabled={deleted} onClick={remove}>
        Delete file
      </Button>
    </div>
  );
}

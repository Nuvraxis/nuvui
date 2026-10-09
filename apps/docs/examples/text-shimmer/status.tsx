"use client";

import { Button, TextShimmer } from "@nuvui/react";
import { useEffect, useState } from "react";

export default function Example() {
  const [waiting, setWaiting] = useState(false);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      setWaiting(false);
      setAnswer("Revenue rose 12% over last quarter.");
    }, 3000);
    return () => clearTimeout(timer);
  }, [waiting]);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <Button
        intent="secondary"
        disabled={waiting}
        onClick={() => {
          setAnswer("");
          setWaiting(true);
        }}
      >
        Summarize the quarter
      </Button>
      {/* In the page from the start, so a screen reader hears each change. */}
      <p role="status" style={{ margin: 0, minBlockSize: "1.5em" }}>
        {waiting ? <TextShimmer>Reading the report</TextShimmer> : answer}
      </p>
    </div>
  );
}

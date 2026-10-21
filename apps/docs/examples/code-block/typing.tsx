"use client";

import { CodeBlock } from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useState } from "react";

const code = `import { Button } from "@nuvui/react";

export function Save() {
  return <Button>Save changes</Button>;
}`;

export default function Example() {
  const [run, setRun] = useState(0);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <CodeBlock key={run} code={code} language="tsx" typing />
      <Button
        intent="secondary"
        style={{ justifySelf: "start" }}
        onClick={() => setRun((now) => now + 1)}
      >
        Type again
      </Button>
    </div>
  );
}

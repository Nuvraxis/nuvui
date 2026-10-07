"use client";

import { Button, VisuallyHidden } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function VisuallyHiddenPlayground() {
  const [text, setText] = useState("Delete the invoice");
  const [hidden, setHidden] = useState(true);

  const code = hidden
    ? `<Button intent="secondary">
  <TrashIcon />
  <VisuallyHidden>${text}</VisuallyHidden>
</Button>`
    : `<Button intent="secondary">
  <TrashIcon />
  ${text}
</Button>`;

  const icon = (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5" />
    </svg>
  );

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="children" value={text} onChange={setText} />
          <CheckboxControl
            label="inside VisuallyHidden"
            checked={hidden}
            onChange={setHidden}
          />
        </>
      }
    >
      <Button intent="secondary">
        {icon}
        {hidden ? <VisuallyHidden>{text}</VisuallyHidden> : text}
      </Button>
    </Playground>
  );
}

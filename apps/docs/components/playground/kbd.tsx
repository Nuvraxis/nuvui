"use client";

import { Kbd } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl, TextControl } from "./controls";

const sizes = ["12px", "16px", "24px"] as const;
type Size = (typeof sizes)[number];

export function KbdPlayground() {
  const [label, setLabel] = useState("Esc");
  const [size, setSize] = useState<Size>("16px");

  const code = `<Kbd>${label}</Kbd>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="children" value={label} onChange={setLabel} />
          <SelectControl
            label="font size of the text around it"
            value={size}
            options={sizes}
            onChange={setSize}
          />
        </>
      }
    >
      <p style={{ margin: 0, fontSize: size }}>
        Press <Kbd>{label}</Kbd> to close.
      </p>
    </Playground>
  );
}

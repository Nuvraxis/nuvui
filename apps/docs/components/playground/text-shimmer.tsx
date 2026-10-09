"use client";

import { TextShimmer } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function TextShimmerPlayground() {
  const [text, setText] = useState("Thinking");
  const [active, setActive] = useState(true);

  const code = `<TextShimmer${active ? "" : " active={false}"}>${text}</TextShimmer>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="children" value={text} onChange={setText} />
          <CheckboxControl
            label="active"
            checked={active}
            onChange={setActive}
          />
        </>
      }
    >
      <TextShimmer active={active}>{text}</TextShimmer>
    </Playground>
  );
}

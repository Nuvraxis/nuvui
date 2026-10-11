"use client";

import { Resizable, ResizableHandle, ResizablePanel } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const orientations = ["horizontal", "vertical"] as const;

export function ResizablePlayground() {
  const [orientation, setOrientation] =
    useState<(typeof orientations)[number]>("horizontal");
  const [withGrip, setWithGrip] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const code = `<Resizable${
    orientation === "vertical" ? ' orientation="vertical"' : ""
  }${disabled ? " disabled" : ""}>
  <ResizablePanel defaultSize="40%" minSize="20%">One</ResizablePanel>
  <ResizableHandle${withGrip ? " withGrip" : ""} />
  <ResizablePanel minSize="20%">Two</ResizablePanel>
</Resizable>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="orientation"
            value={orientation}
            options={orientations}
            onChange={setOrientation}
          />
          <CheckboxControl
            label="withGrip"
            checked={withGrip}
            onChange={setWithGrip}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <div
        style={{
          inlineSize: "100%",
          blockSize: 240,
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <Resizable
          // The panels keep their sizes. Starting again when the way they
          // lie changes puts them back to what the code says.
          key={orientation}
          orientation={orientation}
          disabled={disabled}
        >
          <ResizablePanel
            defaultSize="40%"
            minSize="20%"
            style={{ padding: 16 }}
          >
            One
          </ResizablePanel>
          <ResizableHandle withGrip={withGrip} />
          <ResizablePanel minSize="20%" style={{ padding: 16 }}>
            Two
          </ResizablePanel>
        </Resizable>
      </div>
    </Playground>
  );
}

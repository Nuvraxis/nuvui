"use client";

import {
  Button,
  Resizable,
  ResizableHandle,
  ResizablePanel,
  useResizablePanelRef,
} from "@nuvui/react";
import { useState } from "react";

const pane = { padding: 16 };

export default function Example() {
  const panel = useResizablePanelRef();
  const [folded, setFolded] = useState(false);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <div>
        <Button
          size="sm"
          intent="secondary"
          aria-expanded={!folded}
          aria-controls="resizable-example-nav"
          onClick={() =>
            folded ? panel.current?.expand() : panel.current?.collapse()
          }
        >
          {folded ? "Show navigation" : "Hide navigation"}
        </Button>
      </div>
      <div
        style={{
          blockSize: 220,
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <Resizable>
          <ResizablePanel
            id="resizable-example-nav"
            panelRef={panel}
            collapsible
            defaultSize="30%"
            minSize="20%"
            onResize={(size) => setFolded(size.asPercentage === 0)}
            style={pane}
          >
            Navigation
          </ResizablePanel>
          <ResizableHandle aria-label="Resize navigation" />
          <ResizablePanel minSize="40%" style={pane}>
            Page
          </ResizablePanel>
        </Resizable>
      </div>
    </div>
  );
}

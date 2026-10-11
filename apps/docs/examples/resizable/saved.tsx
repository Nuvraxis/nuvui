"use client";

import {
  Resizable,
  ResizableHandle,
  ResizablePanel,
  useResizableLayout,
} from "@nuvui/react";

const pane = { padding: 16 };

export default function Example() {
  // Kept in the browser's own storage, under this name.
  const { defaultLayout, onLayoutChanged } = useResizableLayout({
    id: "docs-resizable-saved",
  });

  return (
    <div
      style={{
        inlineSize: "100%",
        blockSize: 220,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <Resizable
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
      >
        <ResizablePanel id="list" minSize="20%" style={pane}>
          List
        </ResizablePanel>
        <ResizableHandle withGrip aria-label="Resize list" />
        <ResizablePanel id="detail" minSize="20%" style={pane}>
          Detail
        </ResizablePanel>
      </Resizable>
    </div>
  );
}

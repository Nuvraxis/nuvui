import { Resizable, ResizableHandle, ResizablePanel } from "@nuvui/react";

const pane = { padding: 16 };

export default function Example() {
  return (
    <div
      style={{
        inlineSize: "100%",
        blockSize: 280,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <Resizable orientation="vertical">
        <ResizablePanel defaultSize="60%" minSize="25%" style={pane}>
          Query
        </ResizablePanel>
        <ResizableHandle aria-label="Resize query" />
        <ResizablePanel minSize="25%" style={pane}>
          Results
        </ResizablePanel>
      </Resizable>
    </div>
  );
}

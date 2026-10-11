import { Resizable, ResizableHandle, ResizablePanel } from "@nuvui/react";

const pane = { padding: 16 };

export default function Example() {
  return (
    <div
      style={{
        inlineSize: "100%",
        blockSize: 300,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <Resizable>
        <ResizablePanel defaultSize="30%" minSize="15%" style={pane}>
          Files
        </ResizablePanel>
        <ResizableHandle aria-label="Resize files" />
        <ResizablePanel minSize="30%">
          <Resizable orientation="vertical">
            <ResizablePanel defaultSize="65%" minSize="20%" style={pane}>
              Editor
            </ResizablePanel>
            <ResizableHandle aria-label="Resize editor" />
            <ResizablePanel minSize="20%" style={pane}>
              Terminal
            </ResizablePanel>
          </Resizable>
        </ResizablePanel>
      </Resizable>
    </div>
  );
}

import { Resizable, ResizableHandle, ResizablePanel } from "@nuvui/react";

const pane = { padding: 16 };

export default function Example() {
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
      <Resizable>
        <ResizablePanel defaultSize="35%" minSize="20%" style={pane}>
          Folders
        </ResizablePanel>
        <ResizableHandle withGrip aria-label="Resize folders" />
        <ResizablePanel minSize="30%" style={pane}>
          Messages
        </ResizablePanel>
      </Resizable>
    </div>
  );
}

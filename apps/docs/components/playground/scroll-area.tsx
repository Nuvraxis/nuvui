"use client";

import { ScrollArea, type ScrollAreaProps } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Orientation = NonNullable<ScrollAreaProps["orientation"]>;
type Type = NonNullable<ScrollAreaProps["type"]>;

const orientations = Object.keys({
  vertical: true,
  horizontal: true,
  both: true,
} satisfies Record<Orientation, true>) as Orientation[];

const types = Object.keys({
  auto: true,
  always: true,
  scroll: true,
  hover: true,
} satisfies Record<Type, true>) as Type[];

// How many cells each orientation gets, so that there's something to scroll
// to that way and nothing cut off the other way.
const grids: Record<Orientation, [columns: number, rows: number]> = {
  vertical: [1, 20],
  horizontal: [8, 3],
  both: [8, 12],
};

export function ScrollAreaPlayground() {
  const [orientation, setOrientation] = useState<Orientation>("vertical");
  const [type, setType] = useState<Type>("auto");
  const [columns, rows] = grids[orientation];

  const props = [
    'aria-label="Cells"',
    orientation !== "vertical" && `orientation="${orientation}"`,
    type !== "auto" && `type="${type}"`,
    "style={{ height: 160 }}",
  ].filter(Boolean);
  const code = `<ScrollArea ${props.join(" ")}>
  <Cells />
</ScrollArea>`;

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
          <SelectControl
            label="type"
            value={type}
            options={types}
            onChange={setType}
          />
        </>
      }
    >
      <ScrollArea
        // The scrollbars are set up when the area mounts.
        key={orientation}
        aria-label="Cells"
        orientation={orientation}
        type={type}
        style={{
          width: "100%",
          maxWidth: 260,
          height: 160,
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              columns === 1 ? "1fr" : `repeat(${columns}, 6.5rem)`,
            gap: 12,
            padding: 16,
            fontSize: 14,
          }}
        >
          {Array.from({ length: columns * rows }, (_, index) => index + 1).map(
            (cell) => (
              <span key={cell}>Cell {cell}</span>
            ),
          )}
        </div>
      </ScrollArea>
    </Playground>
  );
}

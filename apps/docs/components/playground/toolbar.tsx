"use client";

import {
  Toolbar,
  ToolbarButton,
  type ToolbarProps,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Orientation = NonNullable<ToolbarProps["orientation"]>;

const orientations = Object.keys({
  horizontal: true,
  vertical: true,
} satisfies Record<Orientation, true>) as Orientation[];

const kinds = ["multiple", "single"] as const;
type Kind = (typeof kinds)[number];

export function ToolbarPlayground() {
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [kind, setKind] = useState<Kind>("multiple");
  const [loop, setLoop] = useState(true);

  const props = [
    'aria-label="Formatting"',
    orientation !== "horizontal" && `orientation="${orientation}"`,
    !loop && "loop={false}",
  ].filter(Boolean);
  const code = `<Toolbar ${props.join(" ")}>
  <ToolbarToggleGroup type="${kind}" aria-label="Text style">
    <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
    <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
  </ToolbarToggleGroup>
  <ToolbarSeparator />
  <ToolbarButton>Share</ToolbarButton>
</Toolbar>`;

  const items = (
    <>
      <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
      <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
    </>
  );

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
            label="type of the toggle group"
            value={kind}
            options={kinds}
            onChange={setKind}
          />
          <CheckboxControl label="loop" checked={loop} onChange={setLoop} />
        </>
      }
    >
      <Toolbar aria-label="Formatting" orientation={orientation} loop={loop}>
        {kind === "multiple" ? (
          <ToolbarToggleGroup type="multiple" aria-label="Text style">
            {items}
          </ToolbarToggleGroup>
        ) : (
          <ToolbarToggleGroup type="single" aria-label="Text style">
            {items}
          </ToolbarToggleGroup>
        )}
        <ToolbarSeparator />
        <ToolbarButton>Share</ToolbarButton>
      </Toolbar>
    </Playground>
  );
}

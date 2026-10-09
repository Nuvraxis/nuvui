"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupOwnProps,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Variant = NonNullable<ToggleGroupOwnProps["variant"]>;
type Size = NonNullable<ToggleGroupOwnProps["size"]>;

const variants = Object.keys({
  outline: true,
  ghost: true,
} satisfies Record<Variant, true>) as Variant[];

const sizes = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Size, true>) as Size[];

const types = ["single", "multiple"] as const;
const orientations = ["horizontal", "vertical"] as const;

export function ToggleGroupPlayground() {
  const [type, setType] = useState<(typeof types)[number]>("single");
  const [variant, setVariant] = useState<Variant>("outline");
  const [size, setSize] = useState<Size>("md");
  const [orientation, setOrientation] =
    useState<(typeof orientations)[number]>("horizontal");
  const [disabled, setDisabled] = useState(false);

  const props = [
    `type="${type}"`,
    variant !== "outline" && `variant="${variant}"`,
    size !== "md" && `size="${size}"`,
    orientation !== "horizontal" && `orientation="${orientation}"`,
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<ToggleGroup ${props.join(" ")} aria-label="Text style">
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  ...
</ToggleGroup>`;

  const shared = {
    "aria-label": "Text style",
    variant,
    size,
    orientation,
    disabled,
  };
  const items = (
    <>
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
    </>
  );

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="type"
            value={type}
            options={types}
            onChange={setType}
          />
          <SelectControl
            label="variant"
            value={variant}
            options={variants}
            onChange={setVariant}
          />
          <SelectControl
            label="size"
            value={size}
            options={sizes}
            onChange={setSize}
          />
          <SelectControl
            label="orientation"
            value={orientation}
            options={orientations}
            onChange={setOrientation}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      {/* The two types hold different kinds of value, so each is a group
          of its own. */}
      {type === "single" ? (
        <ToggleGroup key="single" type="single" {...shared}>
          {items}
        </ToggleGroup>
      ) : (
        <ToggleGroup key="multiple" type="multiple" {...shared}>
          {items}
        </ToggleGroup>
      )}
    </Playground>
  );
}

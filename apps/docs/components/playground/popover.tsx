"use client";

import {
  Button,
  Popover,
  PopoverContent,
  type PopoverContentProps,
  PopoverTrigger,
} from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Side = NonNullable<PopoverContentProps["side"]>;
type Align = NonNullable<PopoverContentProps["align"]>;

const sides = Object.keys({
  top: true,
  right: true,
  bottom: true,
  left: true,
} satisfies Record<Side, true>) as Side[];

const aligns = Object.keys({
  start: true,
  center: true,
  end: true,
} satisfies Record<Align, true>) as Align[];

export function PopoverPlayground() {
  const [side, setSide] = useState<Side>("bottom");
  const [align, setAlign] = useState<Align>("center");

  const props = [
    side !== "bottom" && `side="${side}"`,
    align !== "center" && `align="${align}"`,
  ].filter(Boolean);
  const code = `<PopoverContent aria-label="Share this page"${props.map((prop) => ` ${prop}`).join("")}>
  ...
</PopoverContent>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="side"
            value={side}
            options={sides}
            onChange={setSide}
          />
          <SelectControl
            label="align"
            value={align}
            options={aligns}
            onChange={setAlign}
          />
        </>
      }
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button intent="secondary">Open with these props</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Share this page" side={side} align={align}>
          Anyone with the link can view this page.
        </PopoverContent>
      </Popover>
    </Playground>
  );
}

"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  type DropdownMenuContentProps,
  DropdownMenuItem,
  type DropdownMenuItemProps,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Side = NonNullable<DropdownMenuContentProps["side"]>;
type Align = NonNullable<DropdownMenuContentProps["align"]>;
type Intent = NonNullable<DropdownMenuItemProps["intent"]>;

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

const intents = Object.keys({
  default: true,
  danger: true,
} satisfies Record<Intent, true>) as Intent[];

export function DropdownMenuPlayground() {
  const [side, setSide] = useState<Side>("bottom");
  const [align, setAlign] = useState<Align>("start");
  const [intent, setIntent] = useState<Intent>("danger");

  const props = [
    side !== "bottom" && `side="${side}"`,
    align !== "start" && `align="${align}"`,
  ].filter(Boolean);
  const item = intent === "default" ? "" : ` intent="${intent}"`;
  const code = `<DropdownMenuContent${props.map((prop) => ` ${prop}`).join("")}>
  <DropdownMenuItem>Rename</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem${item}>Delete</DropdownMenuItem>
</DropdownMenuContent>`;

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
          <SelectControl
            label="intent"
            value={intent}
            options={intents}
            onChange={setIntent}
          />
        </>
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button intent="secondary">Open with these props</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={side} align={align}>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem intent={intent}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Playground>
  );
}

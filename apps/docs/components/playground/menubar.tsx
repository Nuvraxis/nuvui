"use client";

import {
  Menubar,
  MenubarContent,
  type MenubarContentProps,
  MenubarItem,
  MenubarMenu,
  type MenubarProps,
  MenubarTrigger,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Direction = NonNullable<MenubarProps["dir"]>;
type Align = NonNullable<MenubarContentProps["align"]>;

const directions = Object.keys({
  ltr: true,
  rtl: true,
} satisfies Record<Direction, true>) as Direction[];

const aligns = Object.keys({
  start: true,
  center: true,
  end: true,
} satisfies Record<Align, true>) as Align[];

export function MenubarPlayground() {
  const [dir, setDir] = useState<Direction>("ltr");
  const [align, setAlign] = useState<Align>("start");
  const [loop, setLoop] = useState(true);

  const root = [
    dir !== "ltr" && `dir="${dir}"`,
    !loop && "loop={false}",
  ].filter(Boolean);
  const content = align === "start" ? "" : ` align="${align}"`;
  const code = `<Menubar${root.map((prop) => ` ${prop}`).join("")}>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent${content}>...</MenubarContent>
  </MenubarMenu>
  ...
</Menubar>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="dir"
            value={dir}
            options={directions}
            onChange={setDir}
          />
          <SelectControl
            label="align"
            value={align}
            options={aligns}
            onChange={setAlign}
          />
          <CheckboxControl label="loop" checked={loop} onChange={setLoop} />
        </>
      }
    >
      <Menubar dir={dir} loop={loop} aria-label="Document">
        {["File", "Edit", "View"].map((name) => (
          <MenubarMenu key={name}>
            <MenubarTrigger>{name}</MenubarTrigger>
            <MenubarContent align={align}>
              <MenubarItem>First {name.toLowerCase()} action</MenubarItem>
              <MenubarItem>Second {name.toLowerCase()} action</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        ))}
      </Menubar>
    </Playground>
  );
}

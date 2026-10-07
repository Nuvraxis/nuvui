"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  type NavigationMenuProps,
  NavigationMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Align = NonNullable<NavigationMenuProps["align"]>;

const aligns = Object.keys({
  start: true,
  center: true,
  end: true,
} satisfies Record<Align, true>) as Align[];

// As text, because a select works in strings.
const delays = ["0", "200", "600"] as const;

export function NavigationMenuPlayground() {
  const [align, setAlign] = useState<Align>("start");
  const [delay, setDelay] = useState<(typeof delays)[number]>("200");

  const props = [
    align !== "start" && `align="${align}"`,
    delay !== "200" && `delayDuration={${delay}}`,
  ].filter(Boolean);
  const code = `<NavigationMenu${props.map((prop) => ` ${prop}`).join("")}>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
      <NavigationMenuContent>...</NavigationMenuContent>
    </NavigationMenuItem>
    ...
  </NavigationMenuList>
</NavigationMenu>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="align"
            value={align}
            options={aligns}
            onChange={setAlign}
          />
          <SelectControl
            label="delayDuration"
            value={delay}
            options={delays}
            onChange={setDelay}
          />
        </>
      }
    >
      <NavigationMenu
        align={align}
        delayDuration={Number(delay)}
        aria-label="Playground"
      >
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/docs/theming">
                Theming
              </NavigationMenuLink>
              <NavigationMenuLink href="/docs/forms">Forms</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/docs">
              Getting started
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/docs/changelog">
              Changelog
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </Playground>
  );
}

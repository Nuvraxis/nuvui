"use client";

import {
  Button,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  type SheetContentProps,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Side = NonNullable<SheetContentProps["side"]>;
type Size = NonNullable<SheetContentProps["size"]>;

const sides = Object.keys({
  start: true,
  end: true,
  top: true,
  bottom: true,
} satisfies Record<Side, true>) as Side[];

const sizes = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Size, true>) as Size[];

export function SheetPlayground() {
  const [side, setSide] = useState<Side>("end");
  const [size, setSize] = useState<Size>("md");
  const [showCloseButton, setShowCloseButton] = useState(true);

  const props = [
    side !== "end" && `side="${side}"`,
    size !== "md" && `size="${size}"`,
    !showCloseButton && "showCloseButton={false}",
  ].filter(Boolean);
  const code = `<SheetContent${props.map((prop) => ` ${prop}`).join("")}>
  ...
</SheetContent>`;

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
            label="size"
            value={size}
            options={sizes}
            onChange={setSize}
          />
          <CheckboxControl
            label="showCloseButton"
            checked={showCloseButton}
            onChange={setShowCloseButton}
          />
        </>
      }
    >
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open with these props</Button>
        </SheetTrigger>
        <SheetContent side={side} size={size} showCloseButton={showCloseButton}>
          <SheetHeader>
            <SheetTitle>Order 10248</SheetTitle>
            <SheetDescription>Placed on 3 October by Ada.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p style={{ margin: 0 }}>
              Three items, paid by card. Both parcels have been delivered.
            </p>
          </SheetBody>
          <SheetFooter>
            <SheetClose asChild>
              <Button>Done</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Playground>
  );
}

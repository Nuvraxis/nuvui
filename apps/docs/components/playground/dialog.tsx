"use client";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Size = NonNullable<DialogContentProps["size"]>;

const sizes = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Size, true>) as Size[];

export function DialogPlayground() {
  const [size, setSize] = useState<Size>("md");
  const [showCloseButton, setShowCloseButton] = useState(true);
  const [closeLabel, setCloseLabel] = useState("Close");

  const props = [
    size !== "md" && `size="${size}"`,
    !showCloseButton && "showCloseButton={false}",
    showCloseButton && closeLabel !== "Close" && `closeLabel="${closeLabel}"`,
  ].filter(Boolean);
  const code = `<DialogContent${props.map((prop) => ` ${prop}`).join("")}>
  ...
</DialogContent>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="size"
            value={size}
            options={sizes}
            onChange={setSize}
          />
          <TextControl
            label="closeLabel"
            value={closeLabel}
            onChange={setCloseLabel}
          />
          <CheckboxControl
            label="showCloseButton"
            checked={showCloseButton}
            onChange={setShowCloseButton}
          />
        </>
      }
    >
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open with these props</Button>
        </DialogTrigger>
        <DialogContent
          size={size}
          showCloseButton={showCloseButton}
          closeLabel={closeLabel}
        >
          <DialogTitle>Delete this project?</DialogTitle>
          <DialogDescription>
            The project and its 12 files will be removed. This can't be undone.
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button intent="secondary">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button intent="danger">Delete project</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Playground>
  );
}

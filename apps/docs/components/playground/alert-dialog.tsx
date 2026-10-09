"use client";

import {
  AlertDialog,
  AlertDialogAction,
  type AlertDialogActionProps,
  AlertDialogCancel,
  AlertDialogContent,
  type AlertDialogContentProps,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl, TextControl } from "./controls";

type Size = NonNullable<AlertDialogContentProps["size"]>;
type Intent = NonNullable<AlertDialogActionProps["intent"]>;

const sizes = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Size, true>) as Size[];

const intents = Object.keys({
  primary: true,
  secondary: true,
  ghost: true,
  danger: true,
} satisfies Record<Intent, true>) as Intent[];

export function AlertDialogPlayground() {
  const [size, setSize] = useState<Size>("md");
  const [intent, setIntent] = useState<Intent>("danger");
  const [action, setAction] = useState("Delete project");

  const content = size === "md" ? "" : ` size="${size}"`;
  const button = intent === "primary" ? "" : ` intent="${intent}"`;
  const code = `<AlertDialogContent${content}>
  ...
  <AlertDialogFooter>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <AlertDialogAction${button}>${action}</AlertDialogAction>
  </AlertDialogFooter>
</AlertDialogContent>`;

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
          <SelectControl
            label="intent"
            value={intent}
            options={intents}
            onChange={setIntent}
          />
          <TextControl label="children" value={action} onChange={setAction} />
        </>
      }
    >
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Open with these props</Button>
        </AlertDialogTrigger>
        <AlertDialogContent size={size}>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            The project and its 12 files will be removed. This can't be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction intent={intent}>{action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Playground>
  );
}

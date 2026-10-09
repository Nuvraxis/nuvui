"use client";

import {
  ActionBar,
  type ActionBarProps,
  ActionBarSelection,
  Button,
} from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

// "fixed" is left out here: it would leave this box for the bottom of the
// window.
type Position = Exclude<NonNullable<ActionBarProps["position"]>, "fixed">;

const positions = Object.keys({
  static: true,
  sticky: true,
} satisfies Record<Position, true>) as Position[];

const counts = ["0", "1", "3", "12"] as const;

export function ActionBarPlayground() {
  const [count, setCount] = useState<(typeof counts)[number]>("3");
  const [position, setPosition] = useState<Position>("static");

  const code = `<ActionBar open={${count} > 0} position="${position}" aria-label="Selected messages">
  <ActionBarSelection>${count} selected</ActionBarSelection>
  <Button intent="secondary" size="sm">Archive</Button>
  <Button intent="danger" size="sm">Delete</Button>
</ActionBar>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="selected"
            value={count}
            options={counts}
            onChange={setCount}
          />
          <SelectControl
            label="position"
            value={position}
            options={positions}
            onChange={setPosition}
          />
        </>
      }
    >
      <ActionBar
        open={Number(count) > 0}
        position={position}
        aria-label="Selected messages"
      >
        <ActionBarSelection>{count} selected</ActionBarSelection>
        <Button intent="secondary" size="sm">
          Archive
        </Button>
        <Button intent="danger" size="sm">
          Delete
        </Button>
      </ActionBar>
    </Playground>
  );
}

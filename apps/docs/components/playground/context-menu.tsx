"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  type ContextMenuItemProps,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Intent = NonNullable<ContextMenuItemProps["intent"]>;

const intents = Object.keys({
  neutral: true,
  danger: true,
} satisfies Record<Intent, true>) as Intent[];

export function ContextMenuPlayground() {
  const [intent, setIntent] = useState<Intent>("danger");
  const [disabled, setDisabled] = useState(false);
  const [itemDisabled, setItemDisabled] = useState(false);

  const trigger = disabled ? " disabled" : "";
  const first = itemDisabled ? " disabled" : "";
  const last = intent === "neutral" ? "" : ` intent="${intent}"`;
  const code = `<ContextMenu>
  <ContextMenuTrigger${trigger}>...</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem${first}>Rename</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem${last}>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="intent"
            value={intent}
            options={intents}
            onChange={setIntent}
          />
          <CheckboxControl
            label="disabled (trigger)"
            checked={disabled}
            onChange={setDisabled}
          />
          <CheckboxControl
            label="disabled (first item)"
            checked={itemDisabled}
            onChange={setItemDisabled}
          />
        </>
      }
    >
      <ContextMenu>
        <ContextMenuTrigger
          disabled={disabled}
          style={{
            display: "grid",
            placeItems: "center",
            inlineSize: "min(100%, 18rem)",
            blockSize: "7rem",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-lg)",
            fontSize: 14,
          }}
        >
          Right-click, or press and hold
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="Actions">
          <ContextMenuItem disabled={itemDisabled}>Rename</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem intent={intent}>Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Playground>
  );
}

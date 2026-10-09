"use client";

import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  type ItemProps,
  ItemTitle,
} from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Variant = NonNullable<ItemProps["variant"]>;
type Size = NonNullable<ItemProps["size"]>;

const variants = Object.keys({
  plain: true,
  outline: true,
  muted: true,
} satisfies Record<Variant, true>) as Variant[];

const sizes = Object.keys({
  md: true,
  sm: true,
} satisfies Record<Size, true>) as Size[];

export function ItemPlayground() {
  const [variant, setVariant] = useState<Variant>("outline");
  const [size, setSize] = useState<Size>("md");
  const [title, setTitle] = useState("Two-step sign-in");
  const [actions, setActions] = useState(true);

  const props = [
    variant !== "plain" && `variant="${variant}"`,
    size !== "md" && `size="${size}"`,
  ].filter(Boolean);
  const code = `<Item${props.map((prop) => ` ${prop}`).join("")}>
  <ItemContent>
    <ItemTitle>${title}</ItemTitle>
    <ItemDescription>A code from your phone as well as your password.</ItemDescription>
  </ItemContent>${
    actions
      ? `
  <ItemActions>
    <Button intent="secondary" size="sm">Set up</Button>
  </ItemActions>`
      : ""
  }
</Item>`;

  return (
    <Playground
      code={code}
      controls={
        <>
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
          <TextControl label="ItemTitle" value={title} onChange={setTitle} />
          <CheckboxControl
            label="ItemActions"
            checked={actions}
            onChange={setActions}
          />
        </>
      }
    >
      <Item variant={variant} size={size} style={{ maxInlineSize: "28rem" }}>
        <ItemContent>
          <ItemTitle>{title}</ItemTitle>
          <ItemDescription>
            A code from your phone as well as your password.
          </ItemDescription>
        </ItemContent>
        {actions ? (
          <ItemActions>
            <Button intent="secondary" size="sm">
              Set up
            </Button>
          </ItemActions>
        ) : null}
      </Item>
    </Playground>
  );
}

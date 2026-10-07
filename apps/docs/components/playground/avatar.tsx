"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarProps,
} from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Size = NonNullable<AvatarProps["size"]>;
type Shape = NonNullable<AvatarProps["shape"]>;

const sizes = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Size, true>) as Size[];

const shapes = Object.keys({
  circle: true,
  square: true,
} satisfies Record<Shape, true>) as Shape[];

const picture =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23314158'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%23e2e8f0'/%3E%3Cpath d='M12 80a28 28 0 0 1 56 0z' fill='%23e2e8f0'/%3E%3C/svg%3E";

export function AvatarPlayground() {
  const [size, setSize] = useState<Size>("md");
  const [shape, setShape] = useState<Shape>("circle");
  const [image, setImage] = useState(true);
  const [initials, setInitials] = useState("AL");

  const props = [
    size !== "md" && `size="${size}"`,
    shape !== "circle" && `shape="${shape}"`,
  ].filter(Boolean);
  const code = `<Avatar${props.map((prop) => ` ${prop}`).join("")}>${
    image
      ? `
  <AvatarImage src="/ada.jpg" alt="Ada Lovelace" />`
      : ""
  }
  <AvatarFallback>${initials}</AvatarFallback>
</Avatar>`;

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
            label="shape"
            value={shape}
            options={shapes}
            onChange={setShape}
          />
          <TextControl
            label="fallback"
            value={initials}
            onChange={setInitials}
          />
          <CheckboxControl
            label="with a picture"
            checked={image}
            onChange={setImage}
          />
        </>
      }
    >
      <Avatar size={size} shape={shape}>
        {image ? <AvatarImage src={picture} alt="Ada Lovelace" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </Playground>
  );
}

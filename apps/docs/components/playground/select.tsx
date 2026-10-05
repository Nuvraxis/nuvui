"use client";

import {
  Select,
  SelectContent,
  type SelectContentProps,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Position = NonNullable<SelectContentProps["position"]>;

const positions = Object.keys({
  popper: true,
  "item-aligned": true,
} satisfies Record<Position, true>) as Position[];

export function SelectPlayground() {
  const [position, setPosition] = useState<Position>("popper");
  const [placeholder, setPlaceholder] = useState("Pick a fruit");
  const [disabled, setDisabled] = useState(false);

  const content = position === "popper" ? "" : ` position="${position}"`;
  const code = `<Select${disabled ? " disabled" : ""}>
  <SelectTrigger aria-label="Fruit">
    <SelectValue placeholder="${placeholder}" />
  </SelectTrigger>
  <SelectContent${content}>
    ...
  </SelectContent>
</Select>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="position"
            value={position}
            options={positions}
            onChange={setPosition}
          />
          <TextControl
            label="placeholder"
            value={placeholder}
            onChange={setPlaceholder}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <Select disabled={disabled}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position={position}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
    </Playground>
  );
}

"use client";

import {
  Button,
  Tooltip,
  TooltipContent,
  type TooltipContentProps,
  TooltipTrigger,
} from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Side = NonNullable<TooltipContentProps["side"]>;

const sides = Object.keys({
  top: true,
  right: true,
  bottom: true,
  left: true,
} satisfies Record<Side, true>) as Side[];

export function TooltipPlayground() {
  const [side, setSide] = useState<Side>("top");
  const [showArrow, setShowArrow] = useState(true);
  const [text, setText] = useState("Takes the project out of your list");

  const props = [
    side !== "top" && `side="${side}"`,
    !showArrow && "showArrow={false}",
  ].filter(Boolean);
  const code = `<TooltipContent${props.map((prop) => ` ${prop}`).join("")}>${text}</TooltipContent>`;

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
          <TextControl label="children" value={text} onChange={setText} />
          <CheckboxControl
            label="showArrow"
            checked={showArrow}
            onChange={setShowArrow}
          />
        </>
      }
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button intent="secondary">Hover or focus me</Button>
        </TooltipTrigger>
        <TooltipContent side={side} showArrow={showArrow}>
          {text}
        </TooltipContent>
      </Tooltip>
    </Playground>
  );
}

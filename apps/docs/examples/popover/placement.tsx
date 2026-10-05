import { Button, Popover, PopoverContent, PopoverTrigger } from "@nuvui/react";

const sides = ["top", "right", "bottom", "left"] as const;

export default function Example() {
  return (
    <>
      {sides.map((side) => (
        <Popover key={side}>
          <PopoverTrigger asChild>
            <Button intent="secondary">{side}</Button>
          </PopoverTrigger>
          <PopoverContent
            side={side}
            aria-label={`Opens on the ${side}`}
            style={{ inlineSize: "auto" }}
          >
            Opens on the {side}, if there's room.
          </PopoverContent>
        </Popover>
      ))}
    </>
  );
}

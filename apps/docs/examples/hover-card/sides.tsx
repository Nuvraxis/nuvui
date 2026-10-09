import { HoverCard, HoverCardContent, HoverCardTrigger } from "@nuvui/react";

const sides = ["top", "right", "bottom", "left"] as const;

export default function Example() {
  return (
    <>
      {sides.map((side) => (
        <HoverCard key={side}>
          <HoverCardTrigger
            href="/docs"
            style={{ fontSize: 14, textDecoration: "underline" }}
          >
            {side}
          </HoverCardTrigger>
          <HoverCardContent side={side}>
            Asked to open on the {side}. It moves to another side when there
            isn't room on this one.
          </HoverCardContent>
        </HoverCard>
      ))}
    </>
  );
}

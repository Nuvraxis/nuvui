import { HoverCard, HoverCardContent, HoverCardTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <p style={{ margin: 0, fontSize: 14 }}>
      Reviewed by{" "}
      <HoverCard>
        <HoverCardTrigger href="/docs" style={{ textDecoration: "underline" }}>
          Ada Lovelace
        </HoverCardTrigger>
        <HoverCardContent>
          <strong>Ada Lovelace</strong>
          <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
            Staff engineer, Payments. Joined in March 2021.
          </p>
        </HoverCardContent>
      </HoverCard>{" "}
      on 3 October.
    </p>
  );
}

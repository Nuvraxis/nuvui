import { HoverCard, HoverCardContent, HoverCardTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger
        href="/docs/theming"
        style={{ fontSize: 14, textDecoration: "underline" }}
      >
        Theming guide
      </HoverCardTrigger>
      <HoverCardContent>
        <strong>Theming</strong>
        <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
          Presets, density, and how to change a token for one section of a page.
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}

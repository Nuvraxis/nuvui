import { GlyphBackground } from "@nuvui/backgrounds/glyph-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <GlyphBackground
      scrim="soft"
      className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">Webhooks for every event</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Signed, retried, and logged where you can read them.
        </p>
        <Button>Add an endpoint</Button>
      </div>
    </GlyphBackground>
  );
}

import { FireworksBackground } from "@nuvui/backgrounds/fireworks-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <FireworksBackground
      scrim="soft"
      className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">Your store is live</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Share the link, and the first orders will show here.
        </p>
        <Button>Copy the link</Button>
      </div>
    </FireworksBackground>
  );
}

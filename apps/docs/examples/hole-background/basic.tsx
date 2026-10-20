import { HoleBackground } from "@nuvui/backgrounds/hole-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <HoleBackground
      scrim="soft"
      className="grid min-h-96 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">Something new is coming</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Join the waiting list and be the first to try it.
        </p>
        <Button>Join the list</Button>
      </div>
    </HoleBackground>
  );
}

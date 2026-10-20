import { StarsBackground } from "@nuvui/backgrounds/stars-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <StarsBackground
      scrim="soft"
      className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">
          Every report your team asks for
        </h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Built from the data you already have, and kept up to date.
        </p>
        <Button>Start a free trial</Button>
      </div>
    </StarsBackground>
  );
}

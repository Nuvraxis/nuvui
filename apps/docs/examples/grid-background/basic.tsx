import { GridBackground } from "@nuvui/backgrounds/grid-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <GridBackground className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center">
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">An API for every invoice</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Create, send and settle them from your own code.
        </p>
        <Button>Read the reference</Button>
      </div>
    </GridBackground>
  );
}

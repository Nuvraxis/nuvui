import { GradientBackground } from "@nuvui/backgrounds/gradient-background";
import { Button } from "@nuvui/react";

// No "use client": it's drawn in CSS, so a server component can render it.
export default function Example() {
  return (
    <GradientBackground className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center">
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">Close the books in a day</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Reconcile every account before the month is out.
        </p>
        <Button>See how</Button>
      </div>
    </GradientBackground>
  );
}

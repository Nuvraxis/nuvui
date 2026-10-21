import { TopographyBackground } from "@nuvui/backgrounds/topography-background";
import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <TopographyBackground
      scrim="soft"
      className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-md justify-items-center gap-4">
        <h2 className="m-0 text-3xl font-semibold">Know every route</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          Plan deliveries around the ground they cross.
        </p>
        <Button>Plan a route</Button>
      </div>
    </TopographyBackground>
  );
}

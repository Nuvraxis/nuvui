import { HexagonBackground } from "@nuvui/backgrounds/hexagon-background";
import { Button } from "@nuvui/react";

// An empty state, quiet enough to sit inside an app.
export default function Example() {
  return (
    <HexagonBackground
      scrim="soft"
      className="grid min-h-80 w-full place-items-center rounded-lg p-8 text-center"
    >
      <div className="grid max-w-sm justify-items-center gap-4">
        <h2 className="m-0 text-2xl font-semibold">No projects yet</h2>
        <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
          A project holds its tasks, files and the people working on it.
        </p>
        <Button>New project</Button>
      </div>
    </HexagonBackground>
  );
}

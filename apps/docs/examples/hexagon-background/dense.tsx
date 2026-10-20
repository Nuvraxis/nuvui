import { HexagonBackground } from "@nuvui/backgrounds/hexagon-background";

// Smaller hexagons, lit in the success color.
export default function Example() {
  return (
    <HexagonBackground
      density={3}
      className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-hexagon-background-glow:var(--color-success)]"
    >
      <p className="m-0 text-2xl font-semibold">All systems running</p>
    </HexagonBackground>
  );
}

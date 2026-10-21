import { TopographyBackground } from "@nuvui/backgrounds/topography-background";

// Fewer lines, in the primary color, moving at half the pace.
export default function Example() {
  return (
    <TopographyBackground
      density={0.5}
      speed={0.5}
      className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-topography-background-color:var(--color-primary)]"
    >
      <p className="m-0 text-2xl font-semibold">Field survey, week 12</p>
    </TopographyBackground>
  );
}

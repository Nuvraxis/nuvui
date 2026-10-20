import { HoleBackground } from "@nuvui/backgrounds/hole-background";

// More motes, in the warning color, around a slower tunnel.
export default function Example() {
  return (
    <HoleBackground
      density={2}
      speed={0.5}
      className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-hole-background-glow:var(--color-warning)]"
    >
      <p className="m-0 text-2xl font-semibold">Launch in 3 days</p>
    </HoleBackground>
  );
}

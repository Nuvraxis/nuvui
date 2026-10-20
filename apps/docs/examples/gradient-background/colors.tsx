import { GradientBackground } from "@nuvui/backgrounds/gradient-background";

// Three colors of your own, more of them, and slower.
export default function Example() {
  return (
    <GradientBackground className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-gradient-background-color-1:var(--color-primary)] [--nuv-gradient-background-color-2:var(--color-chart-6)] [--nuv-gradient-background-color-3:var(--color-chart-5)] [--nuv-gradient-background-duration:60s] [--nuv-gradient-background-opacity:0.5]">
      <p className="m-0 text-2xl font-semibold">Welcome back, Ana</p>
    </GradientBackground>
  );
}

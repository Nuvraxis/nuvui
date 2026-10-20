import { GlyphBackground } from "@nuvui/backgrounds/glyph-background";

// Characters of your own, larger, lit in another color.
export default function Example() {
  return (
    <GlyphBackground
      glyphs="+-×÷="
      density={0.6}
      className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-glyph-background-glow:var(--color-chart-3)]"
    >
      <p className="m-0 text-2xl font-semibold">Budget calculator</p>
    </GlyphBackground>
  );
}

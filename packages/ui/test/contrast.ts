// WCAG contrast between two CSS colors. axe covers text, but it has no rule
// for non-text contrast such as a focus ring against its background.

type Rgb = [red: number, green: number, blue: number];

// Painting one pixel lets the browser do the conversion, so any color syntax
// it understands works here, oklch included.
function toRgb(color: string): Rgb {
  if (!CSS.supports("color", color)) {
    throw new Error(`"${color}" isn't a color this browser can parse`);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("2D canvas isn't available");

  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
  return [red, green, blue];
}

function luminance(rgb: Rgb): number {
  const [red, green, blue] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrast(first: string, second: string): number {
  const a = luminance(toRgb(first));
  const b = luminance(toRgb(second));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

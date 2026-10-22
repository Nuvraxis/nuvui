/** A color as red, green and blue from 0 to 1, in sRGB. */
export type Rgb = [red: number, green: number, blue: number];

/** The colors the scene takes from the theme. */
export interface SceneTheme {
  /** An STL's color, which has none of its own. */
  model: Rgb;
  /** The light from below, as if off the floor. */
  ground: Rgb;
}

let painter: CanvasRenderingContext2D | null | undefined;

/**
 * A CSS color as sRGB numbers, whatever it's written in: a variable, a
 * mix, `oklch()`. The browser draws it on a pixel and the pixel is read.
 */
export function rgbOf(color: string, fallback: Rgb): Rgb {
  if (painter === undefined) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    painter = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!painter || !color) return fallback;
  painter.clearRect(0, 0, 1, 1);
  painter.fillStyle = "#000";
  painter.fillStyle = color;
  painter.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = painter.getImageData(0, 0, 1, 1).data;
  return [red / 255, green / 255, blue / 255];
}

/**
 * Reads the scene's colors where the viewer is. A color is read through
 * an element's own `color`, which the browser works out from any
 * variable. It's set from script, which a Content Security Policy allows
 * where it doesn't allow a style attribute.
 */
export function readTheme(element: HTMLElement): SceneTheme {
  const read = (property: string, token: string, fallback: Rgb) => {
    element.style.color = `var(${property}, var(${token}))`;
    const value = getComputedStyle(element).color;
    element.style.color = "";
    return rgbOf(value, fallback);
  };
  return {
    model: read(
      "--nuv-model-viewer-model",
      "--color-primary",
      [0.4, 0.45, 0.9],
    ),
    ground: read("--nuv-model-viewer-ground", "--color-muted", [0.5, 0.5, 0.5]),
  };
}

export const sameTheme = (one: SceneTheme, other: SceneTheme) =>
  one.model.join() === other.model.join() &&
  one.ground.join() === other.ground.join();

/** Whether the browser can draw WebGL at all. */
export function canDrawWebgl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) return false;
    // Given back at once: a page has only so many.
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

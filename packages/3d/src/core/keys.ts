export type KeyAction =
  | { type: "turn"; right: number; up: number }
  | { type: "zoom"; factor: number }
  | { type: "reset" };

// Degrees for one press, and a larger step with Shift.
const step = 15;
const bigStep = 45;
const zoomStep = 0.8;

/**
 * What a key does to the model, or null for a key it leaves alone. The
 * arrows turn it the way they point, whichever way the page reads: the
 * model isn't text, and its left is the screen's left.
 */
export function keyAction(
  key: string,
  shift = false,
  modified = false,
): KeyAction | null {
  // Ctrl, Alt and ⌘ with a key are the browser's and the system's.
  if (modified) return null;
  const by = shift ? bigStep : step;
  switch (key) {
    case "ArrowLeft":
      return { type: "turn", right: -by, up: 0 };
    case "ArrowRight":
      return { type: "turn", right: by, up: 0 };
    case "ArrowUp":
      return { type: "turn", right: 0, up: by };
    case "ArrowDown":
      return { type: "turn", right: 0, up: -by };
    case "+":
    case "=":
      return { type: "zoom", factor: zoomStep };
    case "-":
    case "_":
      return { type: "zoom", factor: 1 / zoomStep };
    case "Home":
      return { type: "reset" };
    default:
      return null;
  }
}

/** How much nearer, or further, one press of a zoom button goes. */
export const zoomInFactor = zoomStep;
export const zoomOutFactor = 1 / zoomStep;

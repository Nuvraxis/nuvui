import { onFrame } from "./loop";

/** A point on the background, in CSS pixels from its top left corner. */
export interface Point {
  x: number;
  y: number;
}

/** What a scene reads from the theme where the background is. */
export interface Theme {
  /** A color, from a custom property such as `--color-primary`. */
  color: (property: string) => string;
  /** A custom property's value as it's written, such as a font's name. */
  value: (property: string) => string;
}

/** The size the canvas is drawn at. */
export interface Size {
  width: number;
  height: number;
  /** Device pixels for each CSS pixel, at most 2. */
  ratio: number;
  /** Whether the page reads right to left where the background is. */
  rtl: boolean;
}

/**
 * What a canvas background draws. The mount decides when: it sizes the
 * canvas, runs the frames while the background can be seen, and stops
 * them for reduced motion, forced colors, a hidden tab or `paused`.
 */
export interface Scene {
  /** Reads its colors. Called first, and again when the theme changes. */
  theme(theme: Theme): void;
  /** Lays itself out for a new size. Called before the first frame. */
  resize(size: Size): void;
  /** Moves on by `seconds`. */
  step(seconds: number): void;
  draw(context: CanvasRenderingContext2D): void;
  /**
   * Moves on to a frame that looks finished. It's what's drawn first, and
   * all that's drawn for anyone who asked for less motion.
   */
  settle(): void;
  /** The pointer is over the background, or `null` once it's left. */
  point?(point: Point | null): void;
  /** A press on the background, but not on a control laid over it. */
  press?(point: Point): void;
}

export interface MountOptions {
  paused: boolean;
  interactive: boolean;
}

export interface Mounted {
  update(options: MountOptions): void;
  destroy(): void;
}

// A long gap between frames, such as after the tab was in the background,
// is taken as one ordinary frame and not as a leap ahead.
const longestStep = 1 / 20;

// A press on one of these is meant for it, not for the background.
const controls =
  "a, button, input, select, textarea, label, summary, [role='button'], [contenteditable], [tabindex]";

/**
 * Draws `scene` on `canvas`, which covers `root`. The pointer is followed
 * on `root`, so it's followed over what's laid on the background too, and
 * nothing is laid over that content to catch it.
 */
export function mountScene(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  scene: Scene,
  initial: MountOptions,
): Mounted {
  const context = canvas.getContext("2d");
  if (!context) return { update() {}, destroy() {} };

  let options = initial;
  let size: Size | null = null;
  let inView = true;
  let settled = false;
  let last = 0;
  let stopFrames: (() => void) | null = null;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const forced = matchMedia("(forced-colors: active)");
  const dark = matchMedia("(prefers-color-scheme: dark)");
  const still = () => reduced.matches;
  const hidden = () => forced.matches || document.visibilityState === "hidden";

  function readTheme() {
    const style = getComputedStyle(root);
    // A color is read through the canvas's own `color`, which the browser
    // works out from any variable, mix or keyword. The canvas draws with
    // what comes back. It's set from script, which a Content Security
    // Policy allows where it doesn't allow a style attribute.
    const color = (property: string) => {
      canvas.style.color = `var(${property})`;
      const value = getComputedStyle(canvas).color;
      canvas.style.color = "";
      return value;
    };
    const value = (property: string) => style.getPropertyValue(property).trim();
    scene.theme({ color, value });
  }

  function paint() {
    if (!size) return;
    context?.setTransform(1, 0, 0, 1, 0, 0);
    context?.clearRect(0, 0, canvas.width, canvas.height);
    if (forced.matches) return;
    context?.setTransform(size.ratio, 0, 0, size.ratio, 0, 0);
    if (context) scene.draw(context);
  }

  function tick(now: number) {
    const seconds = last === 0 ? 0 : Math.min((now - last) / 1000, longestStep);
    last = now;
    scene.step(seconds);
    paint();
  }

  // Frames run only while there's something to see move.
  function schedule() {
    const run =
      size !== null && inView && !options.paused && !still() && !hidden();
    if (run && !stopFrames) {
      last = 0;
      stopFrames = onFrame(tick);
    } else if (!run && stopFrames) {
      stopFrames();
      stopFrames = null;
    }
  }

  function measure() {
    const width = root.clientWidth;
    const height = root.clientHeight;
    if (width === 0 || height === 0) {
      size = null;
      schedule();
      return;
    }
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rtl = getComputedStyle(root).direction === "rtl";
    if (
      size &&
      size.width === width &&
      size.height === height &&
      size.ratio === ratio &&
      size.rtl === rtl
    ) {
      return;
    }
    size = { width, height, ratio, rtl };
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    scene.resize(size);
    if (!settled || still()) {
      scene.settle();
      settled = true;
    }
    paint();
    schedule();
  }

  const resizes = new ResizeObserver(measure);
  resizes.observe(root);

  const views = new IntersectionObserver((entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    schedule();
  });
  views.observe(root);

  // A theme is a class or an attribute on the page or on something around
  // the background. A change anywhere else is let go at once.
  let themeFrame = 0;
  const retheme = () => {
    if (themeFrame !== 0) return;
    themeFrame = requestAnimationFrame(() => {
      themeFrame = 0;
      readTheme();
      // A new direction is a new size to lay out for. Anything else is the
      // same scene in new colors.
      measure();
      paint();
    });
  };
  const themes = new MutationObserver((records) => {
    if (records.some((record) => record.target.contains(root))) retheme();
  });
  themes.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: ["class", "data-theme", "dir"],
  });

  const onMotion = () => {
    if (still()) {
      scene.settle();
      paint();
    }
    schedule();
  };
  const onVisibility = () => schedule();
  const onForced = () => {
    paint();
    schedule();
  };
  reduced.addEventListener("change", onMotion);
  forced.addEventListener("change", onForced);
  dark.addEventListener("change", retheme);
  document.addEventListener("visibilitychange", onVisibility);

  const answers = () => options.interactive && !still() && !forced.matches;
  const pointOf = (event: PointerEvent): Point => {
    const box = canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };
  const onMove = (event: PointerEvent) => {
    if (answers()) scene.point?.(pointOf(event));
  };
  const onLeave = () => scene.point?.(null);
  const onDown = (event: PointerEvent) => {
    if (!answers() || !event.isPrimary) return;
    const target = event.target as Element | null;
    if (target?.closest(controls) && target !== root) return;
    scene.press?.(pointOf(event));
    // A press shows even while the frames are stopped by `paused`.
    if (options.paused) {
      scene.step(0);
      paint();
    }
  };
  const listen = { passive: true } as const;
  root.addEventListener("pointermove", onMove, listen);
  root.addEventListener("pointerdown", onDown, listen);
  root.addEventListener("pointerleave", onLeave, listen);
  root.addEventListener("pointercancel", onLeave, listen);

  readTheme();
  measure();

  return {
    update(next) {
      options = next;
      if (!options.interactive) scene.point?.(null);
      schedule();
    },
    destroy() {
      stopFrames?.();
      stopFrames = null;
      cancelAnimationFrame(themeFrame);
      resizes.disconnect();
      views.disconnect();
      themes.disconnect();
      reduced.removeEventListener("change", onMotion);
      forced.removeEventListener("change", onForced);
      dark.removeEventListener("change", retheme);
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointercancel", onLeave);
    },
  };
}

export interface ConfettiOptions {
  /**
   * How many pieces are thrown. At most 150.
   * @default 80
   */
  count?: number;
  /**
   * The pieces' colors, as any CSS color, or a variable such as
   * `var(--color-primary)`, read where the target is. Without them the
   * pieces take the theme's chart colors.
   */
  colors?: string[];
}

// One piece of paper, where it is in the page, so it stays with the page
// when it scrolls.
interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  round: boolean;
  color: string;
  angle: number;
  spin: number;
  // The piece turns over as it falls, which is drawn as its height
  // growing and shrinking.
  flip: number;
  flipSpeed: number;
  sway: number;
  age: number;
  life: number;
  burst: Burst;
  // Where on the target it came to rest, from the target's left edge.
  landed: number | null;
}

interface Burst {
  target: Element;
  left: number;
  done: () => void;
}

interface Layer {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pieces: Piece[];
  frame: number;
  last: number;
}

const most = 150;
// However many bursts there are at once, no more than this is drawn.
const mostAtOnce = 300;
const gravity = 1300;
// How much of its speed a piece loses to the air, per second. It's what
// gives a piece of paper its slow fall.
const drag = 3;
const fade = 0.6;

let layer: Layer | null = null;

const between = (low: number, high: number) =>
  low + Math.random() * (high - low);

const matches = (query: string) =>
  typeof window.matchMedia === "function" && window.matchMedia(query).matches;

// The colors a canvas can draw with, from those given. A color the canvas
// doesn't understand leaves its fill as it was, which is how it's found.
function drawable(colors: string[], context: CanvasRenderingContext2D) {
  return colors.filter((color) => {
    context.fillStyle = "#010203";
    context.fillStyle = color;
    return context.fillStyle !== "#010203" || color.trim() === "#010203";
  });
}

// A color given as a variable, as it is on the target. A canvas takes a
// color and not a variable.
function resolve(colors: string[], target: Element): string[] {
  const style = getComputedStyle(target);
  return colors.map((color) => {
    const variable = /^var\(\s*(--[\w-]+)\s*\)$/.exec(color.trim());
    return variable?.[1] ? style.getPropertyValue(variable[1]).trim() : color;
  });
}

// The theme's chart colors, as they are on the target, so a theme set on
// a part of the page colors what's thrown from it. With no theme there,
// the target's own text color.
function themeColors(target: Element): string[] {
  const style = getComputedStyle(target);
  const colors: string[] = [];
  for (let index = 1; index <= 12; index++) {
    const color = style.getPropertyValue(`--color-chart-${index}`).trim();
    if (!color) break;
    colors.push(color);
  }
  return colors.length > 0 ? colors : [style.color];
}

function open(): Layer | null {
  if (layer) return layer;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;
  canvas.className = "nuv-confetti";
  canvas.setAttribute("aria-hidden", "true");
  // What it needs to be out of the way is set here, so it is even without
  // the stylesheet: over the page, the size of the window, and never in
  // the way of a press.
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    inlineSize: "100%",
    blockSize: "100%",
    pointerEvents: "none",
  });
  document.body.append(canvas);
  layer = { canvas, context, pieces: [], frame: 0, last: 0 };
  layer.frame = requestAnimationFrame(tick);
  return layer;
}

function close() {
  if (!layer) return;
  cancelAnimationFrame(layer.frame);
  layer.canvas.remove();
  layer = null;
}

function tick(now: number) {
  if (!layer) return;
  const { canvas, context, pieces } = layer;
  // A tab that was hidden comes back with a long gap, which would throw
  // every piece at once to where it would be by now.
  const seconds = layer.last === 0 ? 0 : Math.min(now - layer.last, 34) / 1000;
  layer.last = now;

  const ratio = window.devicePixelRatio || 1;
  const width = Math.round(window.innerWidth * ratio);
  const height = Math.round(window.innerHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  // Each target's top edge, where pieces can land, once a frame.
  const edges = new Map<Burst, DOMRect | null>();
  const edgeOf = (burst: Burst) => {
    if (!edges.has(burst)) {
      const box = burst.target.isConnected
        ? burst.target.getBoundingClientRect()
        : null;
      edges.set(burst, box && box.width > 0 ? box : null);
    }
    return edges.get(burst) ?? null;
  };

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const bottom = scrollY + window.innerHeight + 40;
  const air = Math.exp(-drag * seconds);

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);

  const left: Piece[] = [];
  for (const piece of pieces) {
    piece.age += seconds;
    const edge = edgeOf(piece.burst);

    if (piece.landed !== null) {
      // A piece on the target goes where the target goes, and falls again
      // if the target does.
      if (edge) {
        piece.x = edge.left + scrollX + piece.landed;
        piece.y = edge.top + scrollY - piece.height / 2;
      } else {
        piece.landed = null;
      }
    } else {
      const above = piece.y;
      piece.vy = (piece.vy + gravity * seconds) * air;
      piece.vx *= air;
      piece.x +=
        (piece.vx + Math.sin(piece.age * 4 + piece.sway) * 30) * seconds;
      piece.y += piece.vy * seconds;
      piece.angle += piece.spin * seconds;
      piece.flip += piece.flipSpeed * seconds;

      // Coming down past the target's top edge, over the target: it lands.
      if (edge && piece.vy > 0) {
        const top = edge.top + scrollY;
        const offset = piece.x - (edge.left + scrollX);
        if (
          above < top &&
          piece.y >= top &&
          offset >= 0 &&
          offset <= edge.width
        ) {
          piece.landed = offset;
          piece.y = top - piece.height / 2;
          piece.vx = 0;
          piece.vy = 0;
        }
      }
    }

    if (piece.age >= piece.life || piece.y > bottom) {
      piece.burst.left -= 1;
      if (piece.burst.left === 0) piece.burst.done();
      continue;
    }
    left.push(piece);

    const opacity = Math.min(1, (piece.life - piece.age) / fade);
    // On the target a piece lies flat.
    const tall = piece.landed === null ? Math.cos(piece.flip) : 0.35;
    context.globalAlpha = opacity;
    context.fillStyle = piece.color;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.translate(piece.x - scrollX, piece.y - scrollY);
    context.rotate(piece.landed === null ? piece.angle : 0);
    context.scale(1, tall);
    if (piece.round) {
      context.beginPath();
      context.arc(0, 0, piece.width / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(
        -piece.width / 2,
        -piece.height / 2,
        piece.width,
        piece.height,
      );
    }
  }
  context.globalAlpha = 1;
  layer.pieces = left;

  if (left.length === 0) close();
  else layer.frame = requestAnimationFrame(tick);
}

/**
 * Throws confetti up from an element. The pieces fall back, and those
 * that come down on the element rest on it a moment before they fade.
 * It's decoration: hidden from screen readers, never in the way of a
 * press, and not thrown at all for anyone who asked for less motion or
 * where the browser forces its own colors.
 *
 * Returns a promise that settles when the last of the pieces is gone.
 */
export function burstConfetti(
  target: Element,
  { count = 80, colors }: ConfettiOptions = {},
): Promise<void> {
  if (
    typeof window === "undefined" ||
    matches("(prefers-reduced-motion: reduce)") ||
    matches("(forced-colors: active)")
  ) {
    return Promise.resolve();
  }
  const box = target.getBoundingClientRect();
  const pieces = Math.max(0, Math.min(Math.round(count), most));
  if (pieces === 0 || box.width === 0) return Promise.resolve();

  const current = open();
  if (!current) return Promise.resolve();
  const ink = getComputedStyle(target).color;
  const palette = drawable(
    colors ? resolve(colors, target) : themeColors(target),
    current.context,
  );

  return new Promise((resolve) => {
    const burst: Burst = { target, left: pieces, done: resolve };
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    for (let index = 0; index < pieces; index++) {
      // Up and out from the middle of the target, more up than out.
      const angle = -Math.PI / 2 + between(-0.7, 0.7);
      const speed = between(550, 1150);
      const size = between(6, 11);
      current.pieces.push({
        x: box.left + scrollX + box.width * between(0.3, 0.7),
        y: box.top + scrollY + box.height * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        width: size,
        height: size * between(0.4, 0.6),
        round: Math.random() < 0.25,
        color: palette[index % palette.length] ?? ink,
        angle: between(0, Math.PI * 2),
        spin: between(-8, 8),
        flip: between(0, Math.PI * 2),
        flipSpeed: between(5, 12),
        sway: between(0, Math.PI * 2),
        age: 0,
        life: between(2.2, 3.2),
        burst,
        landed: null,
      });
    }
    // Past the most at once, the oldest pieces make room.
    const over = current.pieces.length - mostAtOnce;
    if (over > 0) {
      for (const piece of current.pieces.splice(0, over)) {
        piece.burst.left -= 1;
        if (piece.burst.left === 0) piece.burst.done();
      }
    }
  });
}

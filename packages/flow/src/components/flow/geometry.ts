// Everything about where things are, as plain arithmetic. Nothing here
// touches the page, so all of it runs on a server and in a unit test.

/** The shapes a node can have, as a flowchart uses them. */
export type FlowShape = "box" | "rounded" | "circle" | "diamond" | "pill";

/** How an edge's line goes from one node to the other. */
export type FlowPath = "straight" | "curved" | "step";

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

type Side = "top" | "right" | "bottom" | "left";

/** The size a node of each shape is drawn at when it isn't given one. */
export const shapeSizes: Record<FlowShape, Size> = {
  box: { width: 160, height: 56 },
  rounded: { width: 160, height: 56 },
  circle: { width: 88, height: 88 },
  diamond: { width: 144, height: 88 },
  pill: { width: 160, height: 48 },
};

const center = (rect: Rect): Point => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

const roundedRadius = (height: number) => Math.min(12, height / 4);

/** The shape's outline as a path, from the node's top left corner. */
export function outlinePath(shape: FlowShape, width: number, height: number) {
  const w = width;
  const h = height;
  switch (shape) {
    case "box":
      return `M0 0H${w}V${h}H0Z`;
    case "rounded":
    case "pill": {
      const r =
        shape === "pill" ? Math.min(h, w) / 2 : roundedRadius(Math.min(h, w));
      return `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H${r}A${r} ${r} 0 0 1 0 ${h - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
    }
    case "circle": {
      const rx = w / 2;
      const ry = h / 2;
      return `M0 ${ry}A${rx} ${ry} 0 1 1 ${w} ${ry}A${rx} ${ry} 0 1 1 0 ${ry}Z`;
    }
    case "diamond":
      return `M${w / 2} 0L${w} ${h / 2}L${w / 2} ${h}L0 ${h / 2}Z`;
  }
}

/**
 * The part of a node its label is written in, from its top left corner. A
 * circle's and a diamond's label sit in the largest box that fits inside
 * them, so the words don't run over the outline.
 */
export function labelBox(shape: FlowShape, width: number, height: number) {
  switch (shape) {
    case "circle": {
      // The square inside a circle has sides of the diameter over root two.
      const insetX = (width - width / Math.SQRT2) / 2;
      const insetY = (height - height / Math.SQRT2) / 2;
      return {
        x: insetX,
        y: insetY,
        width: width - insetX * 2,
        height: height - insetY * 2,
      };
    }
    case "diamond":
      return {
        x: width / 4,
        y: height / 4,
        width: width / 2,
        height: height / 2,
      };
    case "pill": {
      const inset = Math.min(height, width) / 2 - 4;
      return { x: inset, y: 4, width: width - inset * 2, height: height - 8 };
    }
    default:
      return { x: 8, y: 4, width: width - 16, height: height - 8 };
  }
}

/** Whether a point is inside a node's shape, its outline included. */
export function contains(shape: FlowShape, rect: Rect, point: Point) {
  const c = center(rect);
  const hw = rect.width / 2;
  const hh = rect.height / 2;
  const dx = Math.abs(point.x - c.x);
  const dy = Math.abs(point.y - c.y);
  if (dx > hw || dy > hh) return false;
  switch (shape) {
    case "circle":
      return (dx / hw) ** 2 + (dy / hh) ** 2 <= 1;
    case "diamond":
      return dx / hw + dy / hh <= 1;
    case "pill": {
      const r = Math.min(hw, hh);
      const straight = hw - r;
      if (dx <= straight) return true;
      return (dx - straight) ** 2 + dy ** 2 <= r * r;
    }
    default:
      return true;
  }
}

/**
 * Where a line from the node's center toward a point leaves its outline.
 * A point at the center itself gives the center.
 */
export function boundaryPoint(shape: FlowShape, rect: Rect, toward: Point) {
  const c = center(rect);
  const ux = toward.x - c.x;
  const uy = toward.y - c.y;
  if (ux === 0 && uy === 0) return c;
  const hw = rect.width / 2;
  const hh = rect.height / 2;
  const ax = Math.abs(ux);
  const ay = Math.abs(uy);
  let t: number;
  switch (shape) {
    case "circle":
      t = 1 / Math.sqrt((ux / hw) ** 2 + (uy / hh) ** 2);
      break;
    case "diamond":
      t = 1 / (ax / hw + ay / hh);
      break;
    case "pill": {
      t = Math.min(ax ? hw / ax : Infinity, ay ? hh / ay : Infinity);
      const r = Math.min(hw, hh);
      const straight = hw - r;
      if (Math.abs(ux * t) > straight) {
        // In one of the round ends: where the ray meets that end's circle.
        const ox = Math.sign(ux) * straight;
        const a = ux * ux + uy * uy;
        const b = -2 * ox * ux;
        const k = ox * ox - r * r;
        t = (-b + Math.sqrt(b * b - 4 * a * k)) / (2 * a);
      }
      break;
    }
    default:
      t = Math.min(ax ? hw / ax : Infinity, ay ? hh / ay : Infinity);
  }
  return { x: c.x + ux * t, y: c.y + uy * t };
}

// Which side of `from` faces `to`. Measured against both nodes' sizes, so
// two wide boxes side by side join at their sides, not their tops.
function facing(from: Rect, to: Rect): Side {
  const a = center(from);
  const b = center(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const across = (from.width + to.width) / 2;
  const down = (from.height + to.height) / 2;
  if (Math.abs(dx) / across >= Math.abs(dy) / down) {
    return dx >= 0 ? "right" : "left";
  }
  return dy >= 0 ? "bottom" : "top";
}

const normals: Record<Side, Point> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

// The middle of a side. For every shape here it's on the outline: a
// circle's and a diamond's widest points are their sides' middles.
function sidePoint(rect: Rect, side: Side): Point {
  const c = center(rect);
  const n = normals[side];
  return { x: c.x + (n.x * rect.width) / 2, y: c.y + (n.y * rect.height) / 2 };
}

const horizontal = (side: Side) => side === "left" || side === "right";

/** An edge, worked out: its path, and what's needed to find it and label it. */
export interface EdgeGeometry {
  d: string;
  /** Points along the line, for telling whether the pointer is on it. */
  points: Point[];
  /** Where its label goes. */
  middle: Point;
  bounds: Rect;
}

function boundsOfPoints(points: Point[]): Rect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

const round = (n: number) => Math.round(n * 100) / 100;
const pt = (p: Point) => `${round(p.x)} ${round(p.y)}`;

// A line through corners, with each corner rounded by up to `radius`, and
// never by more than half of either line beside it.
function cornered(points: Point[], radius: number) {
  let d = `M${pt(points[0] as Point)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1] as Point;
    const at = points[i] as Point;
    const next = points[i + 1] as Point;
    const inLength = Math.hypot(at.x - prev.x, at.y - prev.y);
    const outLength = Math.hypot(next.x - at.x, next.y - at.y);
    const r = Math.min(radius, inLength / 2, outLength / 2);
    if (r < 0.5) {
      d += `L${pt(at)}`;
      continue;
    }
    const before = {
      x: at.x - ((at.x - prev.x) / inLength) * r,
      y: at.y - ((at.y - prev.y) / inLength) * r,
    };
    const after = {
      x: at.x + ((next.x - at.x) / outLength) * r,
      y: at.y + ((next.y - at.y) / outLength) * r,
    };
    d += `L${pt(before)}Q${pt(at)} ${pt(after)}`;
  }
  return `${d}L${pt(points[points.length - 1] as Point)}`;
}

function cubicAt(p0: Point, p1: Point, p2: Point, p3: Point, t: number) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + e * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + e * p3.y,
  };
}

// An edge from a node to itself: a loop off its top right.
function loop(shape: FlowShape, rect: Rect): EdgeGeometry {
  const start = boundaryPoint(shape, rect, {
    x: rect.x + rect.width * 0.75,
    y: rect.y - rect.height,
  });
  const end = boundaryPoint(shape, rect, {
    x: rect.x + rect.width * 2,
    y: rect.y + rect.height * 0.25,
  });
  const reach = Math.max(32, Math.min(rect.width, rect.height) * 0.6);
  const c1 = { x: start.x, y: start.y - reach };
  const c2 = { x: end.x + reach, y: end.y };
  const points = Array.from({ length: 13 }, (_, i) =>
    cubicAt(start, c1, c2, end, i / 12),
  );
  return {
    d: `M${pt(start)}C${pt(c1)} ${pt(c2)} ${pt(end)}`,
    points,
    middle: cubicAt(start, c1, c2, end, 0.5),
    bounds: boundsOfPoints(points),
  };
}

/** The line from one node to another, by the way it's drawn. */
export function edgeGeometry(
  path: FlowPath,
  fromShape: FlowShape,
  from: Rect,
  toShape: FlowShape,
  to: Rect,
  sameNode = false,
): EdgeGeometry {
  if (sameNode) return loop(fromShape, from);

  if (path === "straight") {
    const start = boundaryPoint(fromShape, from, center(to));
    const end = boundaryPoint(toShape, to, center(from));
    const points = [start, end];
    return {
      d: `M${pt(start)}L${pt(end)}`,
      points,
      middle: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      bounds: boundsOfPoints(points),
    };
  }

  const out = facing(from, to);
  const into = facing(to, from);
  const start = sidePoint(from, out);
  const end = sidePoint(to, into);

  if (path === "curved") {
    const reach = Math.max(
      24,
      Math.hypot(end.x - start.x, end.y - start.y) * 0.4,
    );
    const a = normals[out];
    const b = normals[into];
    const c1 = { x: start.x + a.x * reach, y: start.y + a.y * reach };
    const c2 = { x: end.x + b.x * reach, y: end.y + b.y * reach };
    const points = Array.from({ length: 17 }, (_, i) =>
      cubicAt(start, c1, c2, end, i / 16),
    );
    return {
      d: `M${pt(start)}C${pt(c1)} ${pt(c2)} ${pt(end)}`,
      points,
      middle: cubicAt(start, c1, c2, end, 0.5),
      bounds: boundsOfPoints(points),
    };
  }

  // Step: right angles only.
  let corners: Point[];
  if (horizontal(out) && horizontal(into)) {
    const midX = (start.x + end.x) / 2;
    corners = [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
  } else if (!horizontal(out) && !horizontal(into)) {
    const midY = (start.y + end.y) / 2;
    corners = [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
  } else if (horizontal(out)) {
    corners = [start, { x: end.x, y: start.y }, end];
  } else {
    corners = [start, { x: start.x, y: end.y }, end];
  }
  const middleIndex = Math.floor((corners.length - 1) / 2);
  const m0 = corners[middleIndex] as Point;
  const m1 = corners[middleIndex + 1] as Point;
  return {
    d: cornered(corners, 8),
    points: corners,
    middle: { x: (m0.x + m1.x) / 2, y: (m0.y + m1.y) / 2 },
    bounds: boundsOfPoints(corners),
  };
}

/** How far a point is from a line through `points`. */
export function distanceToLine(points: Point[], point: Point) {
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i] as Point;
    const b = points[i + 1] as Point;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t =
      length === 0
        ? 0
        : Math.max(
            0,
            Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length),
          );
    const d = Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
    if (d < best) best = d;
  }
  return best;
}

export const intersects = (a: Rect, b: Rect) =>
  a.x <= b.x + b.width &&
  b.x <= a.x + a.width &&
  a.y <= b.y + b.height &&
  b.y <= a.y + a.height;

/** The smallest box around all of `rects`, or `null` when there are none. */
export function boundsOf(rects: Iterable<Rect>): Rect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
    if (r.y + r.height > maxY) maxY = r.y + r.height;
  }
  if (minX === Infinity) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Where the diagram is on the screen: a point at (x, y) in the diagram is
 * drawn at (x * zoom + this.x, y * zoom + this.y) in the frame.
 */
export interface FlowViewport {
  x: number;
  y: number;
  zoom: number;
}

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/**
 * The viewport that shows all of `bounds` in a frame of `size`, centered,
 * with `padding` pixels around it, and no closer than `maxZoom`.
 */
export function fitViewport(
  bounds: Rect,
  size: Size,
  padding: number,
  minZoom: number,
  maxZoom: number,
): FlowViewport {
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const zoom = clamp(
    Math.min(
      (size.width - padding * 2) / width,
      (size.height - padding * 2) / height,
    ),
    minZoom,
    maxZoom,
  );
  return {
    x: size.width / 2 - (bounds.x + width / 2) * zoom,
    y: size.height / 2 - (bounds.y + height / 2) * zoom,
    zoom,
  };
}

/** The part of the diagram a viewport shows in a frame of `size`. */
export function visibleRect(viewport: FlowViewport, size: Size): Rect {
  return {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: size.width / viewport.zoom,
    height: size.height / viewport.zoom,
  };
}

/** `rect`, grown by `by` of its own size on every side. */
export const grow = (rect: Rect, by: number): Rect => ({
  x: rect.x - rect.width * by,
  y: rect.y - rect.height * by,
  width: rect.width * (1 + by * 2),
  height: rect.height * (1 + by * 2),
});

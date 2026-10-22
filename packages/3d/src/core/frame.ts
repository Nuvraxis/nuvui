/** Where the camera starts, around the model. */
export interface ModelViewerCamera {
  /**
   * Degrees around the model, from its front. Positive goes round to the
   * model's right.
   * @default 30
   */
  azimuth?: number;
  /**
   * Degrees above the model's middle. Negative looks from below.
   * @default 15
   */
  elevation?: number;
  /**
   * How far away, as a share of the distance the whole model fits at. 1
   * fits it, 2 is twice as far.
   * @default 1
   */
  distance?: number;
}

export type Vec3 = [x: number, y: number, z: number];

export interface Box {
  min: Vec3;
  max: Vec3;
}

/** The camera around a point: how far, and from which way. */
export interface Orbit {
  radius: number;
  /** Radians around the vertical, from the front (+z). */
  theta: number;
  /** Radians down from straight above. */
  phi: number;
}

/** How the model is framed: what's moved, and where the camera goes. */
export interface Framing {
  /** The model's middle, which is moved to the origin. */
  center: Vec3;
  /** The radius of a ball that holds the model. */
  radius: number;
  /** The distance the whole model fits at. */
  fit: number;
  start: Orbit;
  minRadius: number;
  maxRadius: number;
  near: number;
  far: number;
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

// Never quite straight above or below, where which way is up is lost.
const lowestPhi = 0.01;
const highestPhi = Math.PI - 0.01;

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

/**
 * Frames a model of any size, in any units: a millimeter part and a
 * building in meters both fill the view. `fov` is the camera's vertical
 * field of view in degrees, and `aspect` its width over its height.
 */
export function frameOf(
  box: Box,
  fov: number,
  aspect: number,
  camera: ModelViewerCamera = {},
): Framing {
  const center: Vec3 = [
    (box.min[0] + box.max[0]) / 2,
    (box.min[1] + box.max[1]) / 2,
    (box.min[2] + box.max[2]) / 2,
  ];
  const size = box.max.map((high, axis) => high - (box.min[axis] ?? 0));
  const diagonal = Math.hypot(...size);
  // A model that's a single point still gets a view.
  const radius = diagonal > 0 && Number.isFinite(diagonal) ? diagonal / 2 : 1;
  const vertical = toRadians(fov);
  // On a narrow viewer the width is what runs out first.
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect);
  const narrowest = Math.min(vertical, horizontal);
  // A little room around it, so it doesn't touch the edges.
  const fit = (radius / Math.sin(narrowest / 2)) * 1.08;
  const start = orbitOf(fit, camera);
  return {
    center,
    radius,
    fit,
    start,
    minRadius: radius * 1.05,
    maxRadius: fit * 4,
    near: Math.max(radius / 100, (fit - radius) / 50),
    far: fit * 4 + radius * 2,
  };
}

/** The orbit a camera prop asks for, at a model that fits at `fit`. */
export function orbitOf(fit: number, camera: ModelViewerCamera = {}): Orbit {
  const { azimuth = 30, elevation = 15, distance = 1 } = camera;
  return {
    radius: fit * Math.max(distance, 0.01),
    theta: toRadians(azimuth),
    phi: clamp(Math.PI / 2 - toRadians(elevation), lowestPhi, highestPhi),
  };
}

/** Where a camera on `orbit` is, around the origin. */
export function positionOf({ radius, theta, phi }: Orbit): Vec3 {
  return [
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta),
  ];
}

/** The orbit a camera at `position` is on, around the origin. */
export function orbitAt([x, y, z]: Vec3): Orbit {
  const radius = Math.hypot(x, y, z);
  if (radius === 0) return { radius: 0, theta: 0, phi: Math.PI / 2 };
  return {
    radius,
    theta: Math.atan2(x, z),
    phi: Math.acos(clamp(y / radius, -1, 1)),
  };
}

/**
 * Turns the model by degrees: positive `right` turns its front to the
 * right, and positive `up` shows more of its top. The camera is what
 * moves, the other way.
 */
export function turned(orbit: Orbit, right: number, up: number): Orbit {
  return {
    radius: orbit.radius,
    theta: orbit.theta - toRadians(right),
    phi: clamp(orbit.phi - toRadians(up), lowestPhi, highestPhi),
  };
}

/** Moves the camera nearer by `factor`, below 1, or further, above it. */
export function zoomed(
  orbit: Orbit,
  factor: number,
  framing: Pick<Framing, "minRadius" | "maxRadius">,
): Orbit {
  return {
    ...orbit,
    radius: clamp(orbit.radius * factor, framing.minRadius, framing.maxRadius),
  };
}

/** Whether the camera can go nearer, and further, from where it is. */
export function zoomRoom(
  radius: number,
  framing: Pick<Framing, "minRadius" | "maxRadius">,
): { in: boolean; out: boolean } {
  // A hair's room is no room, so the buttons don't stay on for a step
  // that does nothing.
  const room = 1e-6 * framing.maxRadius;
  return {
    in: radius > framing.minRadius + room,
    out: radius < framing.maxRadius - room,
  };
}

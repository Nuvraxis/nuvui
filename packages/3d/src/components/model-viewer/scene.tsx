"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box3,
  Color,
  type PerspectiveCamera,
  PMREMGenerator,
  SRGBColorSpace,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ModelViewerError } from "../../core/error";
import type { ModelFormat } from "../../core/format";
import {
  type Framing,
  frameOf,
  type ModelViewerCamera,
  type Orbit,
  orbitAt,
  positionOf,
  turned,
  type Vec3,
  zoomed,
  zoomRoom,
} from "../../core/frame";
import type { Rgb, SceneTheme } from "../../core/theme";
import type { ModelDecoders, ModelInfo, ModelSource } from "../../core/types";
import { type LoadedModel, loadModel } from "./load";

/** What the viewer's buttons and keys do to the scene. */
export interface SceneApi {
  turn(right: number, up: number): void;
  zoom(factor: number): void;
  reset(): void;
}

export interface SceneProps {
  source: ModelSource;
  /** Changes when the source does. */
  sourceKey: string;
  format: ModelFormat | undefined;
  decoders: ModelDecoders;
  decodersKey: string;
  camera: ModelViewerCamera | undefined;
  cameraKey: string;
  theme: SceneTheme;
  interactive: boolean;
  /** Turning by itself, now. */
  rotating: boolean;
  onApi: (api: SceneApi | null) => void;
  onProgress: (fraction: number | null) => void;
  onLoad: (info: ModelInfo) => void;
  onError: (error: ModelViewerError) => void;
  onZoomRoom: (room: { in: boolean; out: boolean }) => void;
  /** The model was turned or zoomed by a pointer or a finger. */
  onInteract: () => void;
  children?: ReactNode;
}

// The camera's field of view from top to bottom, in degrees.
const fov = 40;
// How fast the model turns by itself, in degrees a second: a turn in 30
// seconds.
const rotation = 12;
// How long the browser has to give the drawing back once it's taken it,
// in milliseconds, before the viewer says it can't be drawn.
const lostFor = 5000;

const colorOf = (rgb: Rgb) => new Color().setRGB(...rgb, SRGBColorSpace);

// Kept up to date in a layout effect, so the framing, which is one too,
// reads this render's props and not the last one's.
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

const toError = (error: unknown) =>
  error instanceof ModelViewerError
    ? error
    : new ModelViewerError("parse", "The model couldn't be read.", {
        cause: error,
      });

// Light from all round, made here from boxes in a room and not from a
// file, so metal and gloss look right and nothing is downloaded.
function Lights({ ground }: { ground: Rgb }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const groundColor = useMemo(() => colorOf(ground), [ground]);

  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    // A cube of 128 pixels a side and not three's 256: it looks the same
    // in a viewer, and where the browser draws on the processor, with no
    // graphics card, it's ready in under half the time. three before 0.174
    // has no size, and makes 256.
    const environment = generator.fromScene(room, 0.04, 0.1, 100, {
      size: 128,
    }).texture;
    scene.environment = environment;
    invalidate();
    return () => {
      scene.environment = null;
      environment.dispose();
      generator.dispose();
      // Older versions of three have no dispose on the room.
      (room as { dispose?: () => void }).dispose?.();
    };
  }, [gl, scene, invalidate]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new color is a new frame to draw.
  useEffect(() => {
    invalidate();
  }, [groundColor, invalidate]);

  return (
    <>
      <hemisphereLight
        color={0xffffff}
        groundColor={groundColor}
        intensity={0.3}
      />
      <directionalLight position={[3, 5, 4]} intensity={0.8} />
    </>
  );
}

function Viewer({
  source,
  sourceKey,
  format,
  decoders,
  decodersKey,
  camera: cameraProp,
  cameraKey,
  theme,
  interactive,
  rotating,
  onApi,
  onProgress,
  onLoad,
  onError,
  onZoomRoom,
  onInteract,
  children,
}: SceneProps) {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const [model, setModel] = useState<LoadedModel | null>(null);
  const [framing, setFraming] = useState<Framing | null>(null);
  const controls = useRef<OrbitControls | null>(null);
  const told = useRef<LoadedModel | null>(null);
  const latest = useLatest({
    source,
    format,
    decoders,
    theme,
    cameraProp,
    size,
    onApi,
    onProgress,
    onLoad,
    onError,
    onZoomRoom,
    onInteract,
  });

  // A new source, or new decoders, is a new model. The old one is let go
  // as soon as the new one is asked for.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the keys stand for what's in latest.
  useEffect(() => {
    const abort = new AbortController();
    let loaded: LoadedModel | undefined;
    const { signal } = abort;
    setModel(null);
    setFraming(null);
    const now = latest.current;
    loadModel({
      source: now.source,
      format: now.format,
      decoders: now.decoders,
      renderer: gl,
      color: now.theme.model,
      signal,
      onProgress: (fraction) => {
        if (!signal.aborted) latest.current.onProgress(fraction);
      },
    })
      .then((done) => {
        if (signal.aborted) {
          done.dispose();
          return;
        }
        loaded = done;
        setModel(done);
      })
      .catch((error: unknown) => {
        if (!signal.aborted) latest.current.onError(toError(error));
      });
    return () => {
      abort.abort();
      loaded?.dispose();
    };
  }, [gl, sourceKey, decodersKey, format, latest]);

  // Framed once for each model, and again for a new camera prop. A new
  // size of viewer keeps the view the person has turned it to.
  // biome-ignore lint/correctness/useExhaustiveDependencies: cameraKey stands for the camera prop.
  useLayoutEffect(() => {
    if (!model) return;
    const box = new Box3().setFromObject(model.object);
    const { width, height } = latest.current.size;
    const next = frameOf(
      {
        min: box.isEmpty() ? [0, 0, 0] : (box.min.toArray() as Vec3),
        max: box.isEmpty() ? [0, 0, 0] : (box.max.toArray() as Vec3),
      },
      fov,
      width > 0 && height > 0 ? width / height : 1,
      latest.current.cameraProp,
    );
    camera.fov = fov;
    camera.near = next.near;
    camera.far = next.far;
    camera.position.set(...positionOf(next.start));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    const orbit = controls.current;
    if (orbit) {
      orbit.target.set(0, 0, 0);
      orbit.minDistance = next.minRadius;
      orbit.maxDistance = next.maxRadius;
      orbit.update();
    }
    setFraming(next);
    latest.current.onZoomRoom(zoomRoom(next.start.radius, next));
    invalidate();
    if (told.current !== model) {
      told.current = model;
      latest.current.onLoad(model.info);
    }
  }, [model, cameraKey, camera, invalidate, latest]);

  // An STL's color is the theme's.
  useEffect(() => {
    if (!model?.plain) return;
    model.plain.color.copy(colorOf(theme.model));
    invalidate();
  }, [model, theme.model, invalidate]);

  // Drag to turn, and pinch or the wheel to zoom. Panning is off, so the
  // model stays in the middle. The wheel is only let through while the
  // viewer has the focus: see the viewer.
  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.enablePan = false;
    orbit.enableDamping = false;
    orbit.rotateSpeed = 0.8;
    const changed = () => {
      invalidate();
      const now = orbitAt(camera.position.toArray() as Vec3);
      latest.current.onZoomRoom(
        zoomRoom(now.radius, {
          minRadius: orbit.minDistance,
          maxRadius: orbit.maxDistance,
        }),
      );
    };
    const started = () => latest.current.onInteract();
    orbit.addEventListener("change", changed);
    orbit.addEventListener("start", started);
    controls.current = orbit;
    return () => {
      orbit.removeEventListener("change", changed);
      orbit.removeEventListener("start", started);
      orbit.dispose();
      controls.current = null;
    };
  }, [camera, gl, invalidate, latest]);

  useEffect(() => {
    if (controls.current) controls.current.enabled = interactive;
  }, [interactive]);

  useEffect(() => {
    if (!framing) {
      latest.current.onApi(null);
      return;
    }
    const apply = (orbit: Orbit) => {
      camera.position.set(...positionOf(orbit));
      camera.lookAt(0, 0, 0);
      controls.current?.update();
      latest.current.onZoomRoom(zoomRoom(orbit.radius, framing));
      invalidate();
    };
    const now = () => orbitAt(camera.position.toArray() as Vec3);
    latest.current.onApi({
      turn: (right, up) => apply(turned(now(), right, up)),
      zoom: (factor) => apply(zoomed(now(), factor, framing)),
      reset: () => apply(framing.start),
    });
    return () => latest.current.onApi(null);
  }, [framing, camera, invalidate, latest]);

  // Turning by itself is the only thing that draws frame after frame.
  // Otherwise a frame is drawn only when something changes.
  useEffect(() => {
    if (rotating && framing) invalidate();
  }, [rotating, framing, invalidate]);
  useFrame((_, delta) => {
    if (!rotating || !framing) return;
    const now = orbitAt(camera.position.toArray() as Vec3);
    const next = turned(now, Math.min(delta, 0.1) * rotation, 0);
    camera.position.set(...positionOf(next));
    camera.lookAt(0, 0, 0);
    invalidate();
  });

  // The browser can take the drawing away, such as when the graphics
  // driver restarts. three asks for it back. If it doesn't come, the
  // viewer says so.
  useEffect(() => {
    const canvas = gl.domElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let gone = false;
    const lost = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (gone) return;
        latest.current.onError(
          new ModelViewerError(
            "context-lost",
            "The browser took the WebGL context away and didn't give it back.",
          ),
        );
      }, lostFor);
    };
    const restored = () => {
      clearTimeout(timer);
      invalidate();
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      gone = true;
      clearTimeout(timer);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl, invalidate, latest]);

  if (!model || !framing) return null;
  const [x, y, z] = framing.center;
  return (
    <group position={[-x, -y, -z]}>
      <primitive object={model.object} />
      {children}
    </group>
  );
}

/**
 * The drawing, in a canvas of its own. It's loaded with three and
 * react-three-fiber once the viewer is in a browser, so neither is in the
 * page until a model is shown.
 */
export function Scene(props: SceneProps) {
  return (
    <Canvas
      className="nuv-model-viewer__canvas"
      aria-hidden="true"
      frameloop="demand"
      dpr={[1, 2]}
      // react-three-fiber's tone mapping, ACES, is left on: the light from
      // the room is bright, and without it light colors wash out to white.
      gl={{ antialias: true, alpha: true }}
      camera={{ fov, near: 0.01, far: 100, position: [0, 0, 3] }}
    >
      <Lights ground={props.theme.ground} />
      <Viewer {...props} />
    </Canvas>
  );
}

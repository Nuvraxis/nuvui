"use client";

import { Button } from "@nuvui/react/button";
import { Progress } from "@nuvui/react/progress";
import {
  type ComponentType,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ModelViewerError } from "../../core/error";
import { filesKey } from "../../core/files";
import type { ModelFormat } from "../../core/format";
import type { ModelViewerCamera } from "../../core/frame";
import { keyAction, zoomInFactor, zoomOutFactor } from "../../core/keys";
import {
  englishLabels,
  errorText,
  type ModelViewerLabels,
} from "../../core/labels";
import {
  canDrawWebgl,
  readTheme,
  type SceneTheme,
  sameTheme,
} from "../../core/theme";
import type { ModelDecoders, ModelInfo, ModelSource } from "../../core/types";
import { cx } from "../../utils/cx";
import { assignRef } from "../../utils/ref";
import type { SceneApi, SceneProps } from "./scene";

export interface ModelViewerOwnProps {
  /**
   * The model: the address of a `.glb`, `.gltf` or `.stl` file, or files
   * the person picked. A glTF whose buffers and textures are files of their
   * own is picked together with them.
   */
  src: string | URL | File | readonly File[];
  /**
   * The format, for an address or a file whose name doesn't say, such as a
   * signed address. Otherwise it's read from the name, or from the file.
   */
  format?: ModelFormat;
  /**
   * What the model is, such as "Office chair". It's the viewer's name, read
   * in place of the drawing.
   */
  label: string;
  /** A longer description of the model, read after its name. */
  description?: string;
  /**
   * The address of a picture of the model, shown while it loads, and in
   * its place when it can't be drawn.
   */
  poster?: string;
  /** Where the camera starts. Changing it moves the camera there. */
  camera?: ModelViewerCamera;
  /**
   * The decoders for compressed glTF. Both are off, and a model that needs
   * one says so in words.
   */
  decoders?: ModelDecoders;
  /**
   * Whether the model can be turned and zoomed, by pointer, finger, keys
   * and buttons.
   * @default true
   */
  interactive?: boolean;
  /**
   * The buttons to zoom and to go back to the first view.
   * @default true
   */
  controls?: boolean;
  /**
   * Turns the model slowly until it's touched. Not for anyone who asked for
   * less motion, and not while it's out of view or the tab is hidden.
   * @default false
   */
  autoRotate?: boolean;
  /** Called when a model has loaded, with what it's made of. */
  onLoad?: (info: ModelInfo) => void;
  /** Called when a model can't be shown, with why. */
  onError?: (error: ModelViewerError) => void;
  /** The viewer's own words, for another language. */
  labels?: Partial<ModelViewerLabels>;
  /**
   * react-three-fiber elements, drawn in the scene with the model and in
   * its units, such as a marker on one of its parts.
   */
  children?: ReactNode;
}

export interface ModelViewerProps
  extends ModelViewerOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ModelViewerOwnProps> {}

type Phase = "loading" | "ready" | "error";

const sourceOf = (src: ModelViewerOwnProps["src"]): ModelSource => {
  if (typeof src === "string") return { kind: "url", url: src };
  if (Array.isArray(src)) return { kind: "files", files: src };
  if (typeof URL !== "undefined" && src instanceof URL) {
    return { kind: "url", url: src.href };
  }
  return { kind: "files", files: [src as File] };
};

const keyOf = (source: ModelSource) =>
  source.kind === "url"
    ? `url:${source.url}`
    : `files:${filesKey(source.files)}`;

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const ModelViewer = forwardRef<HTMLDivElement, ModelViewerProps>(
  (
    {
      src,
      format,
      label,
      description,
      poster,
      camera,
      decoders,
      interactive = true,
      controls = true,
      autoRotate = false,
      onLoad,
      onError,
      labels: given,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const labels = { ...englishLabels, ...given };
    const root = useRef<HTMLDivElement | null>(null);
    const stage = useRef<HTMLDivElement>(null);
    const descriptionId = useId();
    const keysId = useId();
    const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
    const [phase, setPhase] = useState<Phase>("loading");
    const [error, setError] = useState<ModelViewerError | null>(null);
    const [progress, setProgress] = useState<number | null>(null);
    const [api, setApi] = useState<SceneApi | null>(null);
    const [room, setRoom] = useState({ in: true, out: true });
    const [theme, setTheme] = useState<SceneTheme | null>(null);
    // Turning by itself stops for good once the person turns it.
    const [touched, setTouched] = useState(false);
    const [still, setStill] = useState(false);
    const [seen, setSeen] = useState(true);

    const source = sourceOf(src);
    const sourceKey = keyOf(source);
    const decodersKey = `${decoders?.meshopt ? "meshopt" : ""}|${decoders?.ktx2 ?? ""}`;
    const cameraKey = camera
      ? `${camera.azimuth}|${camera.elevation}|${camera.distance}`
      : "";
    const handlers = useRef({ onLoad, onError });
    handlers.current = { onLoad, onError };

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        root.current = node;
        assignRef(ref, node);
      },
      [ref],
    );

    // Set when no model can be shown in this browser at all, whatever
    // the source: there's no WebGL, or the scene couldn't be loaded.
    const broken = useRef(false);

    const fail = useCallback((failure: ModelViewerError) => {
      setPhase("error");
      setError(failure);
      handlers.current.onError?.(failure);
    }, []);

    // Nothing touches WebGL until the viewer is near the screen. A page of
    // many models then only pays for the ones being looked at, and stays
    // under the browser's limit on WebGL contexts. Once near, it stays.
    const [near, setNear] = useState(false);
    useEffect(() => {
      const element = root.current;
      if (!element) return;
      if (typeof IntersectionObserver === "undefined") {
        setNear(true);
        return;
      }
      const views = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          setNear(true);
          views.disconnect();
        },
        { rootMargin: "200px" },
      );
      views.observe(element);
      return () => views.disconnect();
    }, []);

    // three and react-three-fiber come with the scene, here.
    useEffect(() => {
      if (!near) return;
      if (!canDrawWebgl()) {
        broken.current = true;
        fail(new ModelViewerError("webgl", "This browser can't draw WebGL."));
        return;
      }
      let gone = false;
      import("./scene")
        .then((module) => {
          if (!gone) setScene(() => module.Scene);
        })
        .catch((cause: unknown) => {
          if (gone) return;
          broken.current = true;
          fail(
            new ModelViewerError("network", "The viewer couldn't be loaded.", {
              cause,
            }),
          );
        });
      return () => {
        gone = true;
      };
    }, [fail, near]);

    // A new model starts again from loading.
    // biome-ignore lint/correctness/useExhaustiveDependencies: the keys are what's new.
    useEffect(() => {
      if (broken.current) return;
      setPhase("loading");
      setError(null);
      setProgress(null);
    }, [sourceKey, decodersKey, format]);

    // The theme's colors, read again when a class or attribute changes on
    // the page or around the viewer, or the system's scheme does.
    useEffect(() => {
      const element = root.current;
      if (!element) return;
      const read = () =>
        setTheme((was) => {
          const now = readTheme(element);
          return was && sameTheme(was, now) ? was : now;
        });
      read();
      let frame = 0;
      const later = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(read);
      };
      const changes = new MutationObserver((records) => {
        if (records.some((record) => record.target.contains(element))) {
          later();
        }
      });
      changes.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme", "data-mode"],
        subtree: true,
      });
      const scheme = matchMedia("(prefers-color-scheme: dark)");
      scheme.addEventListener("change", later);
      return () => {
        cancelAnimationFrame(frame);
        changes.disconnect();
        scheme.removeEventListener("change", later);
      };
    }, []);

    // Turning by itself waits for the model to be seen, and stops for
    // reduced motion and a hidden tab.
    useEffect(() => {
      const element = root.current;
      if (!autoRotate || !element) return;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)");
      let inView = true;
      const update = () => {
        setStill(reduced.matches);
        setSeen(inView && document.visibilityState === "visible");
      };
      const views = new IntersectionObserver((entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        update();
      });
      views.observe(element);
      reduced.addEventListener("change", update);
      document.addEventListener("visibilitychange", update);
      update();
      return () => {
        views.disconnect();
        reduced.removeEventListener("change", update);
        document.removeEventListener("visibilitychange", update);
      };
    }, [autoRotate]);

    useEffect(() => {
      if (autoRotate) setTouched(false);
    }, [autoRotate]);

    // The wheel zooms only while the viewer has the focus. Otherwise it's
    // stopped on its way to the canvas and scrolls the page past.
    useEffect(() => {
      const element = stage.current;
      if (!element) return;
      const wheel = (event: WheelEvent) => {
        if (!element.contains(document.activeElement)) event.stopPropagation();
      };
      element.addEventListener("wheel", wheel, { capture: true });
      return () =>
        element.removeEventListener("wheel", wheel, { capture: true });
    }, []);

    const touch = useCallback(() => setTouched(true), []);

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (!api) return;
      const action = keyAction(
        event.key,
        event.shiftKey,
        event.ctrlKey || event.metaKey || event.altKey,
      );
      if (!action) return;
      event.preventDefault();
      touch();
      if (action.type === "turn") api.turn(action.right, action.up);
      else if (action.type === "zoom") api.zoom(action.factor);
      else api.reset();
    };

    const ready = phase === "ready" && api !== null;
    const rotating = autoRotate && !touched && !still && seen && ready;
    const describedBy = [
      description ? descriptionId : null,
      interactive ? keysId : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        ref={setRefs}
        data-state={phase}
        {...props}
        className={cx("nuv-model-viewer", className)}
      >
        {/* It takes the focus: the keys turn the model while it has it. */}
        <div
          ref={stage}
          className="nuv-model-viewer__stage"
          role="img"
          aria-label={label}
          aria-roledescription={labels.roleDescription}
          aria-describedby={describedBy || undefined}
          aria-busy={phase === "loading" || undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={interactive ? onKeyDown : undefined}
          // The focus stops it turning by itself, as a press does: it's
          // where someone using the keys is about to turn it.
          onFocus={interactive ? touch : undefined}
          // three's controls stop the browser giving the focus on a
          // press, so it's given here.
          onPointerDown={
            interactive
              ? () => stage.current?.focus({ preventScroll: true })
              : undefined
          }
        >
          {poster && phase !== "ready" && (
            <img className="nuv-model-viewer__poster" src={poster} alt="" />
          )}
          {Scene && theme && phase !== "error" && (
            <Scene
              source={source}
              sourceKey={sourceKey}
              format={format}
              decoders={decoders ?? {}}
              decodersKey={decodersKey}
              camera={camera}
              cameraKey={cameraKey}
              theme={theme}
              interactive={interactive}
              rotating={rotating}
              onApi={setApi}
              onProgress={setProgress}
              onLoad={(info) => {
                setPhase("ready");
                handlers.current.onLoad?.(info);
              }}
              onError={fail}
              onZoomRoom={setRoom}
              onInteract={touch}
            >
              {children}
            </Scene>
          )}
        </div>
        {description && (
          <p id={descriptionId} className="nuv-model-viewer__hidden">
            {description}
          </p>
        )}
        {interactive && (
          <p id={keysId} className="nuv-model-viewer__hidden">
            {labels.keys}
          </p>
        )}
        {phase === "loading" && (
          <div className="nuv-model-viewer__loading">
            <p className="nuv-model-viewer__note" role="status">
              {labels.loading}
            </p>
            <Progress
              size="sm"
              aria-label={labels.loading}
              value={progress === null ? null : Math.round(progress * 100)}
              getValueLabel={(value) => labels.progress(value)}
            />
          </div>
        )}
        {phase === "error" && error && (
          <p
            className={cx(
              "nuv-model-viewer__error",
              poster && "nuv-model-viewer__error--over",
            )}
            role="alert"
          >
            {errorText(labels, error.code, error.files)}
          </p>
        )}
        {interactive && controls && (
          <fieldset
            className="nuv-model-viewer__controls"
            aria-label={labels.controls}
          >
            <Button
              intent="secondary"
              size="sm"
              className="nuv-model-viewer__control"
              aria-label={labels.zoomIn}
              disabled={!ready || !room.in}
              onClick={() => {
                touch();
                api?.zoom(zoomInFactor);
              }}
            >
              <Icon>
                <path d="M8 3.5v9M3.5 8h9" />
              </Icon>
            </Button>
            <Button
              intent="secondary"
              size="sm"
              className="nuv-model-viewer__control"
              aria-label={labels.zoomOut}
              disabled={!ready || !room.out}
              onClick={() => {
                touch();
                api?.zoom(zoomOutFactor);
              }}
            >
              <Icon>
                <path d="M3.5 8h9" />
              </Icon>
            </Button>
            <Button
              intent="secondary"
              size="sm"
              className="nuv-model-viewer__control"
              aria-label={labels.reset}
              disabled={!ready}
              onClick={() => {
                touch();
                api?.reset();
              }}
            >
              <Icon>
                <path d="M3 8a5 5 0 1 0 1.5-3.5" />
                <path d="M3 2.5v3h3" />
              </Icon>
            </Button>
          </fieldset>
        )}
      </div>
    );
  },
);
ModelViewer.displayName = "ModelViewer";

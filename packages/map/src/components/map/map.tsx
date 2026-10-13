// MapLibre's types speak of GeoJSON without saying where it's from. This
// brings it along, so an app that checks the types of what it installs
// finds it.
/// <reference types="geojson" preserve="true" />
"use client";

import { Button } from "@nuvui/react/button";
import type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  Offset,
  StyleSpecification,
} from "maplibre-gl";
import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "../../utils/cx";

/** A place, as longitude and then latitude, which is the order GeoJSON has. */
export type MapLngLat = [longitude: number, latitude: number];

/** An area, by its south-west corner and its north-east one. */
export type MapBounds = [southWest: MapLngLat, northEast: MapLngLat];

/** The MapLibre map a `MapView` draws, for what the props don't cover. */
export type MapInstance = MapLibreMap;

/** A map style: the address of one, or the style itself. */
export type MapStyle = string | StyleSpecification;

export interface MapViewState {
  center: MapLngLat;
  zoom: number;
  /** Which way is up, in degrees clockwise from north. */
  bearing: number;
  /** How far the map is tilted, in degrees. */
  pitch: number;
}

export interface MapLabels {
  /** The name of the map, when it's given no `aria-label`. */
  map?: string;
  /** Shown and said until the map's style has come. */
  loading?: string;
  /** Shown and said when the map can't be drawn. */
  error?: string;
  zoomIn?: string;
  zoomOut?: string;
  /** The name of the button that turns north back up. */
  resetNorth?: string;
  /** The name of the button that goes to where the reader is. */
  locate?: string;
  /** Said when the browser won't say where the reader is. */
  locateError?: string;
  /** The name of the marker at where the reader is. */
  location?: string;
  fullscreen?: string;
  exitFullscreen?: string;
  closePopup?: string;
  /** With `cooperativeGestures`, shown over the map on a Mac when the wheel is turned over it. */
  gestureMac?: string;
  /** The same, on other computers. */
  gestureOther?: string;
  /** The same, on a touch screen, when one finger is dragged over it. */
  gestureTouch?: string;
}

const english: Required<MapLabels> = {
  map: "Map",
  loading: "Loading map",
  error: "The map couldn't be drawn",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  resetNorth: "Turn north up",
  locate: "Go to my location",
  locateError: "Your location isn't available",
  location: "Your location",
  fullscreen: "Fill the screen",
  exitFullscreen: "Leave full screen",
  closePopup: "Close",
  gestureMac: "Use ⌘ and scroll to zoom the map",
  gestureOther: "Use Ctrl and scroll to zoom the map",
  gestureTouch: "Use two fingers to move the map",
};

type MapLibrary = typeof import("maplibre-gl");

// MapLibre does its work in a worker, which is a file of its own. It looks
// for that file beside itself, and a bundler that has folded MapLibre into
// another file has left nothing beside it. So the app says where it is.
let workerUrl: string | undefined;

/**
 * Says where MapLibre's worker is, once, before a map is drawn. An app
 * that's built with a bundler needs it: the worker is the file
 * `maplibre-gl/dist/maplibre-gl-worker.mjs`, and the address is the one
 * your bundler gives that file.
 */
export function setMapWorkerUrl(url: string | URL): void {
  workerUrl = String(url);
}

interface MapContextValue {
  map: MapLibreMap;
  lib: MapLibrary;
  root: HTMLDivElement;
  labels: Required<MapLabels>;
}

const MapContext = createContext<MapContextValue | null>(null);

function useMapContext(part: string): MapContextValue {
  const context = useContext(MapContext);
  if (!context) throw new Error(`<${part}> must be inside a <MapView>.`);
  return context;
}

/**
 * The MapLibre map of the `MapView` around this component, for what the
 * props don't cover: layers, sources, its own events.
 */
export function useMap(): MapInstance {
  return useMapContext("useMap").map;
}

const viewOf = (map: MapLibreMap): MapViewState => {
  const center = map.getCenter();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
};

// Close enough to be the same place on a screen.
const near = (one: number, other: number) => Math.abs(one - other) < 1e-7;

// How many views the map remembers having told the app of. An app that
// hands each one back has them taken off as they come.
const toldLimit = 64;

const boundsKey = (bounds: MapBounds | undefined) =>
  bounds ? bounds.flat().join(",") : "";

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

export interface MapViewOwnProps {
  /**
   * The map's style, which says where its tiles come from and how they're
   * drawn: the address of a style, or the style itself. Whoever serves it
   * is the map's provider, and that's yours to choose.
   */
  mapStyle: MapStyle;
  /** The middle of the map, when you keep it. The map moves there when it changes. */
  center?: MapLngLat;
  /**
   * The middle of the map to begin with.
   * @default [0, 20]
   */
  defaultCenter?: MapLngLat;
  /** How far in the map is, when you keep it. 0 is the whole world. */
  zoom?: number;
  /**
   * How far in the map is to begin with.
   * @default 1
   */
  defaultZoom?: number;
  /**
   * An area to show all of. The map fits it when first drawn, in place of
   * the center and the zoom, and again when it changes.
   */
  bounds?: MapBounds;
  /**
   * The room left around `bounds`, in pixels.
   * @default 48
   */
  boundsPadding?: number;
  minZoom?: number;
  maxZoom?: number;
  /**
   * Whether the map can be moved, by pointer, touch and keys. Read when
   * the map is first drawn.
   * @default true
   */
  interactive?: boolean;
  /**
   * Leaves the wheel and one finger to the page: the map zooms with Ctrl
   * or ⌘ held, and moves under two fingers. For a map in a page that
   * scrolls. Read when the map is first drawn.
   * @default false
   */
  cooperativeGestures?: boolean;
  /** Called as the map moves, with where it is. */
  onMove?: (view: MapViewState) => void;
  /** Called when the map has come to rest. */
  onMoveEnd?: (view: MapViewState) => void;
  /** Called once, when the style and the first tiles have come. */
  onLoad?: (map: MapInstance) => void;
  /** Called when the map can't be drawn, or a tile or the style can't be had. */
  onError?: (error: Error) => void;
  /** The map's own words, for another language. Read when the map is first drawn. */
  labels?: MapLabels;
}

export interface MapViewProps
  extends MapViewOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof MapViewOwnProps> {}

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

export const MapView = forwardRef<HTMLDivElement, MapViewProps>(
  (
    {
      mapStyle,
      center,
      defaultCenter = [0, 20],
      zoom,
      defaultZoom = 1,
      bounds,
      boundsPadding = 48,
      minZoom,
      maxZoom,
      interactive = true,
      cooperativeGestures = false,
      onMove,
      onMoveEnd,
      onLoad,
      onError,
      labels: given,
      className,
      children,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const [labels] = useState(() => ({ ...english, ...given }));
    const [root, setRoot] = useState<HTMLDivElement | null>(null);
    const canvas = useRef<HTMLDivElement>(null);
    const [drawn, setDrawn] = useState<{
      map: MapLibreMap;
      lib: MapLibrary;
    } | null>(null);
    const [state, setState] = useState<"loading" | "ready" | "error">(
      "loading",
    );
    const handlers = useLatest({ onMove, onMoveEnd, onLoad, onError });
    // What the map is first drawn with. Changes after that are followed by
    // the effects below.
    const first = useRef({
      mapStyle,
      center: center ?? defaultCenter,
      zoom: zoom ?? defaultZoom,
      bounds,
      boundsPadding,
      minZoom,
      maxZoom,
      interactive,
      cooperativeGestures,
    });
    const fitted = useRef(boundsKey(bounds));
    const styled = useRef(mapStyle);
    // The views the app has been told of and hasn't handed back yet. One
    // that comes back as `center` and `zoom` is the map's own, and not
    // somewhere to go: by then the map may be further along, and going back
    // to it would stop a move halfway.
    const told = useRef<MapViewState[]>([]);

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        setRoot(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    useEffect(() => {
      const container = canvas.current;
      if (!container) return;
      let gone = false;
      let map: MapLibreMap | undefined;
      const fail = (error: unknown) => {
        if (gone) return;
        setState("error");
        handlers.current.onError?.(toError(error));
      };

      import("maplibre-gl")
        .then((loaded) => {
          if (gone) return;
          const lib: MapLibrary = loaded;
          if (workerUrl) lib.setWorkerUrl(workerUrl);
          const start = first.current;
          // Throws where the browser has no WebGL.
          const made = new lib.Map({
            container,
            style: start.mapStyle,
            center: start.center,
            zoom: start.zoom,
            bounds: start.bounds,
            fitBoundsOptions: { padding: start.boundsPadding },
            minZoom: start.minZoom,
            maxZoom: start.maxZoom,
            interactive: start.interactive,
            cooperativeGestures: start.cooperativeGestures,
            // Added below, never folded away: the people whose map it is
            // are named on it at every width.
            attributionControl: false,
            locale: {
              "Map.Title": labels.map,
              "CooperativeGesturesHandler.MacHelpText": labels.gestureMac,
              "CooperativeGesturesHandler.WindowsHelpText": labels.gestureOther,
              "CooperativeGesturesHandler.MobileHelpText": labels.gestureTouch,
            },
          });
          map = made;
          made.addControl(
            new lib.AttributionControl({ compact: false }),
            "bottom-right",
          );

          // Before the style has come, an error is the style's, and there
          // will be no map. After it, one is a tile's, and the map stands.
          let hasStyle = false;
          made.once("styledata", () => {
            hasStyle = true;
            if (!gone) setState("ready");
          });
          made.once("load", () => {
            if (!gone) handlers.current.onLoad?.(made);
          });
          made.on("error", (event) => {
            if (gone) return;
            if (!hasStyle) setState("error");
            handlers.current.onError?.(toError(event.error));
          });
          const tell = (to: "onMove" | "onMoveEnd") => {
            const view = viewOf(made);
            told.current.push(view);
            if (told.current.length > toldLimit) told.current.shift();
            handlers.current[to]?.(view);
          };
          made.on("move", () => tell("onMove"));
          made.on("moveend", () => tell("onMoveEnd"));
          setDrawn({ map: made, lib });
        })
        .catch(fail);

      return () => {
        gone = true;
        map?.remove();
        setDrawn(null);
        setState("loading");
      };
    }, [handlers, labels]);

    const map = drawn?.map;

    // The canvas is what holds the focus and takes the keys, so the name
    // is its.
    useEffect(() => {
      map?.getCanvas().setAttribute("aria-label", ariaLabel ?? labels.map);
    }, [map, ariaLabel, labels]);

    const lng = center?.[0];
    const lat = center?.[1];
    useEffect(() => {
      if (!map) return;
      const echo = told.current.findIndex(
        (view) =>
          (lng === undefined ||
            lat === undefined ||
            (near(view.center[0], lng) && near(view.center[1], lat))) &&
          (zoom === undefined || near(view.zoom, zoom)),
      );
      if (echo !== -1) {
        told.current.splice(0, echo);
        return;
      }
      const now = map.getCenter();
      const moved =
        lng !== undefined &&
        lat !== undefined &&
        !(near(now.lng, lng) && near(now.lat, lat));
      const zoomed = zoom !== undefined && !near(map.getZoom(), zoom);
      if (!moved && !zoomed) return;
      // Asked for by the app. What the map told of before this is behind
      // it now, and a place among it may be asked for again.
      told.current = [];
      map.easeTo({
        ...(moved ? { center: [lng, lat] as MapLngLat } : null),
        ...(zoomed ? { zoom } : null),
      });
    }, [map, lng, lat, zoom]);

    const area = boundsKey(bounds);
    useEffect(() => {
      if (!map || !area || area === fitted.current) return;
      fitted.current = area;
      const [west, south, east, north] = area.split(",").map(Number) as [
        number,
        number,
        number,
        number,
      ];
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: boundsPadding },
      );
    }, [map, area, boundsPadding]);

    useEffect(() => {
      if (!map || styled.current === mapStyle) return;
      styled.current = mapStyle;
      map.setStyle(mapStyle);
    }, [map, mapStyle]);

    useEffect(() => {
      if (!map) return;
      map.setMinZoom(minZoom ?? null);
      map.setMaxZoom(maxZoom ?? null);
    }, [map, minZoom, maxZoom]);

    return (
      <div
        ref={setRefs}
        data-state={state}
        {...props}
        className={cx("nuv-map", className)}
      >
        <div ref={canvas} className="nuv-map__canvas" />
        {state === "loading" && (
          <p className="nuv-map__note" role="status">
            {labels.loading}
          </p>
        )}
        {state === "error" && (
          <p className="nuv-map__note" role="alert">
            {labels.error}
          </p>
        )}
        {drawn && root && (
          <MapContext.Provider value={{ ...drawn, root, labels }}>
            {children}
          </MapContext.Provider>
        )}
      </div>
    );
  },
);
MapView.displayName = "MapView";

function PinIcon() {
  return (
    <svg
      className="nuv-map__pin"
      aria-hidden="true"
      width="24"
      height="32"
      viewBox="0 0 24 32"
    >
      <path
        className="nuv-map__pin-body"
        d="M12 .5C5.65.5.5 5.6.5 11.9c0 8 9.1 17.3 11.1 19.2.2.2.6.2.8 0 2-1.9 11.1-11.2 11.1-19.2C23.5 5.6 18.35.5 12 .5Z"
      />
      <circle className="nuv-map__pin-dot" cx="12" cy="12" r="4.5" />
    </svg>
  );
}

// How far a popup stands off a marker, for each side the popup may open
// on. The marker's point is the middle of its foot or its own middle.
function popupOffset(holder: HTMLElement, anchor: "bottom" | "center"): Offset {
  const { width, height } = holder.getBoundingClientRect();
  const gap = 4;
  if (anchor === "center") {
    const across = width / 2 + gap;
    const up = height / 2 + gap;
    return {
      center: [0, 0],
      top: [0, up],
      "top-left": [0, up],
      "top-right": [0, up],
      bottom: [0, -up],
      "bottom-left": [0, -up],
      "bottom-right": [0, -up],
      left: [across, 0],
      right: [-across, 0],
    };
  }
  const across = width / 2 + gap;
  const up = height + gap;
  return {
    center: [0, -height / 2],
    top: [0, gap],
    "top-left": [0, gap],
    "top-right": [0, gap],
    bottom: [0, -up],
    "bottom-left": [0, -up],
    "bottom-right": [0, -up],
    left: [across, -height / 2],
    right: [-across, -height / 2],
  };
}

const steps: Record<string, [x: number, y: number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export interface MapMarkerOwnProps {
  /** Where it is. */
  position: MapLngLat;
  /**
   * What it marks, such as "Berlin office". It's the marker's name, read
   * in place of the drawing.
   */
  label: string;
  /**
   * The part of the marker that's on the place: the middle of its foot,
   * for a pin, or its own middle, for a dot.
   * @default "bottom"
   */
  anchor?: "bottom" | "center";
  /**
   * Whether it can be moved, by dragging it or with the arrow keys.
   * @default false
   */
  draggable?: boolean;
  /** Called when it's been moved, with where it was put. */
  onPositionChange?: (position: MapLngLat) => void;
  /** What opens over the marker when it's pressed. */
  popup?: ReactNode;
  /** Whether the popup is open, when you keep it. Use it with `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the popup is open to begin with.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the popup opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The marker's drawing, in place of the pin. */
  children?: ReactNode;
}

export interface MapMarkerProps
  extends MapMarkerOwnProps,
    Omit<HTMLAttributes<HTMLElement>, keyof MapMarkerOwnProps> {}

export const MapMarker = forwardRef<HTMLElement, MapMarkerProps>(
  (
    {
      position,
      label,
      anchor = "bottom",
      draggable = false,
      onPositionChange,
      popup,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      className,
      children,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const { map, lib } = useMapContext("MapMarker");
    // MapLibre places this element, and the marker is drawn into it.
    const [holder] = useState(() => {
      const element = document.createElement("div");
      element.className = "nuv-map__marker-holder";
      return element;
    });
    const marker = useRef<MapLibreMarker | null>(null);
    const button = useRef<HTMLElement | null>(null);
    const bubble = useRef<HTMLDivElement>(null);
    const dragged = useRef(false);
    // Opened by a press on the marker, the popup takes the focus. Opened
    // by the app, or with the page, it leaves the focus where it is.
    const asked = useRef(false);
    const [openState, setOpenState] = useState(defaultOpen);
    const open = popup !== undefined && (openProp ?? openState);
    // How far the popup stands off the marker, once the marker has been
    // measured. Until then there's no popup, so it's never drawn in the
    // wrong place first and moved.
    const [offset, setOffset] = useState<Offset | null>(null);
    const latest = useLatest({ position, draggable, onPositionChange });
    const [lng, lat] = position;

    const setOpen = (next: boolean) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChange?.(next);
    };

    useEffect(() => {
      const made = new lib.Marker({
        element: holder,
        anchor,
        draggable: latest.current.draggable,
      })
        .setLngLat(latest.current.position)
        .addTo(map);
      // MapLibre names the element and calls it a button. The name and
      // the role are on what's drawn inside it.
      holder.removeAttribute("aria-label");
      holder.removeAttribute("role");
      made.on("dragstart", () => {
        dragged.current = true;
      });
      made.on("dragend", () => {
        const now = made.getLngLat();
        latest.current.onPositionChange?.([now.lng, now.lat]);
        // The click that ends a drag comes before this runs. Where none
        // comes, as under a finger, the next press is a press again.
        setTimeout(() => {
          dragged.current = false;
        }, 0);
      });
      marker.current = made;
      return () => {
        marker.current = null;
        made.remove();
      };
    }, [map, lib, holder, anchor, latest]);

    useEffect(() => {
      marker.current?.setLngLat([lng, lat]);
    }, [lng, lat]);

    useEffect(() => {
      marker.current?.setDraggable(draggable);
    }, [draggable]);

    useEffect(() => {
      setOffset(open ? popupOffset(holder, anchor) : null);
      if (!open) asked.current = false;
    }, [open, holder, anchor]);

    // A press anywhere else on the map closes the popup, another marker
    // included. A press on this marker reaches the map as well, and is left
    // to the marker, which closes it itself.
    const close = useLatest(() => setOpen(false));
    useEffect(() => {
      if (!open) return;
      const pressed = (event: { originalEvent?: Event }) => {
        const target = event.originalEvent?.target;
        if (target instanceof Node && button.current?.contains(target)) return;
        close.current();
      };
      map.on("click", pressed);
      return () => {
        map.off("click", pressed);
      };
    }, [map, open, close]);

    const pressable = popup !== undefined || onClick !== undefined || draggable;
    const drawing = children ?? <PinIcon />;
    const setRefs = (node: HTMLElement | null) => {
      button.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    const press = (event: MouseEvent<HTMLElement>) => {
      // The click that ends a drag isn't a press.
      if (dragged.current) {
        dragged.current = false;
        return;
      }
      onClick?.(event);
      if (event.defaultPrevented || popup === undefined) return;
      asked.current = !open;
      setOpen(!open);
    };

    const keys = (event: KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === "Escape" && open) {
        event.stopPropagation();
        setOpen(false);
        return;
      }
      const step = steps[event.key];
      if (!draggable || !step) return;
      // The arrow keys would move the map under it.
      event.preventDefault();
      event.stopPropagation();
      const size = event.shiftKey ? 50 : 10;
      const point = map.project([lng, lat]);
      const next = map.unproject([
        point.x + step[0] * size,
        point.y + step[1] * size,
      ]);
      marker.current?.setLngLat(next);
      onPositionChange?.([next.lng, next.lat]);
    };

    return (
      <>
        {createPortal(
          pressable ? (
            <button
              ref={setRefs as Ref<HTMLButtonElement>}
              type="button"
              aria-label={label}
              aria-haspopup={popup !== undefined ? "dialog" : undefined}
              aria-expanded={popup !== undefined ? open : undefined}
              data-draggable={draggable ? "" : undefined}
              {...props}
              className={cx("nuv-map__marker", className)}
              onClick={press}
              onKeyDown={keys}
            >
              {drawing}
            </button>
          ) : (
            <div
              ref={setRefs as Ref<HTMLDivElement>}
              role="img"
              aria-label={label}
              {...props}
              className={cx("nuv-map__marker", className)}
            >
              {drawing}
            </div>
          ),
          holder,
        )}
        {open && offset !== null && (
          <MapPopup
            ref={bubble}
            position={position}
            offset={offset}
            aria-label={label}
            closeOnMapClick={false}
            autoFocus={asked.current}
            onClose={() => {
              // Closed from inside it, by its button or by Escape, the
              // focus goes back to what opened it.
              if (bubble.current?.contains(document.activeElement)) {
                button.current?.focus({ preventScroll: true });
              }
              setOpen(false);
            }}
          >
            {popup}
          </MapPopup>
        )}
      </>
    );
  },
);
MapMarker.displayName = "MapMarker";

export interface MapPopupOwnProps {
  /** The place it points at. */
  position: MapLngLat;
  /** Called when it's closed: by its button, by Escape, or by a press on the map. */
  onClose?: () => void;
  /**
   * How far it stands off the place, in pixels.
   * @default 0
   */
  offset?: Offset;
  /**
   * Whether a press on the map closes it.
   * @default true
   */
  closeOnMapClick?: boolean;
  /**
   * Whether the focus goes into it when it opens. Turn it off for one
   * that opens without being asked for, such as with the page.
   * @default true
   */
  autoFocus?: boolean;
}

export interface MapPopupProps
  extends MapPopupOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof MapPopupOwnProps> {}

export const MapPopup = forwardRef<HTMLDivElement, MapPopupProps>(
  (
    {
      position,
      onClose,
      offset = 0,
      closeOnMapClick = true,
      autoFocus = true,
      className,
      children,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const { map, lib, labels } = useMapContext("MapPopup");
    const [holder] = useState(() => document.createElement("div"));
    const popup = useRef<InstanceType<MapLibrary["Popup"]> | null>(null);
    const box = useRef<HTMLDivElement | null>(null);
    const latest = useLatest({ position, offset, onClose, autoFocus });
    const [lng, lat] = position;

    useEffect(() => {
      const made = new lib.Popup({
        closeButton: false,
        // Closing is asked of whoever opened it, below, and not done here.
        closeOnClick: false,
        focusAfterOpen: false,
        maxWidth: "none",
        offset: latest.current.offset,
        className: "nuv-map__popup-holder",
      })
        .setLngLat(latest.current.position)
        .setDOMContent(holder)
        .addTo(map);
      popup.current = made;
      if (latest.current.autoFocus) {
        box.current?.focus({ preventScroll: true });
      }
      return () => {
        popup.current = null;
        made.remove();
      };
    }, [map, lib, holder, latest]);

    useEffect(() => {
      popup.current?.setLngLat([lng, lat]);
    }, [lng, lat]);

    useEffect(() => {
      popup.current?.setOffset(offset);
    }, [offset]);

    useEffect(() => {
      if (!closeOnMapClick) return;
      const pressed = () => latest.current.onClose?.();
      map.on("click", pressed);
      return () => {
        map.off("click", pressed);
      };
    }, [map, closeOnMapClick, latest]);

    const setRefs = (node: HTMLDivElement | null) => {
      box.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    return createPortal(
      <div
        ref={setRefs}
        role="dialog"
        tabIndex={-1}
        {...props}
        className={cx("nuv-map__popup", className)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Escape") return;
          event.stopPropagation();
          onClose?.();
        }}
      >
        <div className="nuv-map__popup-body">{children}</div>
        <button
          type="button"
          className="nuv-map__popup-close"
          aria-label={labels.closePopup}
          onClick={() => onClose?.()}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="m4 4 8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>,
      holder,
    );
  },
);
MapPopup.displayName = "MapPopup";

// A button's drawing. The button has the name.
function Icon({ children, turn = 0 }: { children: ReactNode; turn?: number }) {
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
      style={turn ? { transform: `rotate(${turn}deg)` } : undefined}
    >
      {children}
    </svg>
  );
}

export interface MapControlsOwnProps {
  /**
   * The corner they're in. The start is the left where text reads from
   * the left.
   * @default "top-end"
   */
  position?: "top-start" | "top-end" | "bottom-start" | "bottom-end";
  /**
   * Buttons to zoom in and out.
   * @default true
   */
  zoom?: boolean;
  /**
   * A button that turns north back up. It shows which way north is.
   * @default false
   */
  compass?: boolean;
  /**
   * A button that goes to where the reader is, which the browser asks
   * them to allow.
   * @default false
   */
  locate?: boolean;
  /**
   * A button that fills the screen with the map, where the browser can.
   * @default false
   */
  fullscreen?: boolean;
  /** Called when the browser has said where the reader is. */
  onLocate?: (position: MapLngLat) => void;
}

export interface MapControlsProps
  extends MapControlsOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof MapControlsOwnProps> {}

export const MapControls = forwardRef<HTMLDivElement, MapControlsProps>(
  (
    {
      position = "top-end",
      zoom = true,
      compass = false,
      locate = false,
      fullscreen = false,
      onLocate,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { map, root, labels } = useMapContext("MapControls");
    const [level, setLevel] = useState(() => map.getZoom());
    const [bearing, setBearing] = useState(() => map.getBearing());
    const [filled, setFilled] = useState(false);
    // Known only in a browser, and an iPhone has none.
    const [canFill, setCanFill] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [you, setYou] = useState<MapLngLat | null>(null);
    const [said, setSaid] = useState("");
    const located = useLatest(onLocate);

    useEffect(() => {
      const zoomed = () => setLevel(map.getZoom());
      const turned = () => setBearing(map.getBearing());
      map.on("zoom", zoomed);
      map.on("rotate", turned);
      return () => {
        map.off("zoom", zoomed);
        map.off("rotate", turned);
      };
    }, [map]);

    useEffect(() => {
      setCanFill(document.fullscreenEnabled === true);
      const changed = () => setFilled(document.fullscreenElement === root);
      document.addEventListener("fullscreenchange", changed);
      return () => document.removeEventListener("fullscreenchange", changed);
    }, [root]);

    const find = () => {
      if (!("geolocation" in navigator)) {
        setSaid(labels.locateError);
        return;
      }
      setWaiting(true);
      setSaid("");
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const here: MapLngLat = [coords.longitude, coords.latitude];
          setWaiting(false);
          setYou(here);
          map.flyTo({ center: here, zoom: Math.max(map.getZoom(), 14) });
          located.current?.(here);
        },
        () => {
          setWaiting(false);
          setSaid(labels.locateError);
        },
      );
    };

    return (
      <div
        ref={ref}
        {...props}
        className={cx(
          "nuv-map__controls",
          `nuv-map__controls--${position}`,
          className,
        )}
      >
        {zoom && (
          <>
            <Button
              intent="secondary"
              size="sm"
              className="nuv-map__control"
              aria-label={labels.zoomIn}
              disabled={level >= map.getMaxZoom()}
              onClick={() => map.zoomIn()}
            >
              <Icon>
                <path d="M8 3.5v9M3.5 8h9" />
              </Icon>
            </Button>
            <Button
              intent="secondary"
              size="sm"
              className="nuv-map__control"
              aria-label={labels.zoomOut}
              disabled={level <= map.getMinZoom()}
              onClick={() => map.zoomOut()}
            >
              <Icon>
                <path d="M3.5 8h9" />
              </Icon>
            </Button>
          </>
        )}
        {compass && (
          <Button
            intent="secondary"
            size="sm"
            className="nuv-map__control"
            aria-label={labels.resetNorth}
            onClick={() => map.easeTo({ bearing: 0, pitch: 0 })}
          >
            <Icon turn={-bearing}>
              <path d="M8 2 5.5 8h5L8 2Z" fill="currentColor" />
              <path d="M5.5 8 8 14l2.5-6" />
            </Icon>
          </Button>
        )}
        {locate && (
          <Button
            intent="secondary"
            size="sm"
            className="nuv-map__control"
            aria-label={labels.locate}
            aria-busy={waiting || undefined}
            onClick={find}
          >
            <Icon>
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" />
            </Icon>
          </Button>
        )}
        {fullscreen && canFill && (
          <Button
            intent="secondary"
            size="sm"
            className="nuv-map__control"
            aria-label={filled ? labels.exitFullscreen : labels.fullscreen}
            onClick={() => {
              if (filled) void document.exitFullscreen();
              else void root.requestFullscreen();
            }}
          >
            <Icon>
              {filled ? (
                <path d="M6 2.5V6H2.5M10 2.5V6h3.5M6 13.5V10H2.5M10 13.5V10h3.5" />
              ) : (
                <path d="M2.5 6V2.5H6M13.5 6V2.5H10M2.5 10v3.5H6M13.5 10v3.5H10" />
              )}
            </Icon>
          </Button>
        )}
        {children}
        {locate && (
          <span className="nuv-map__status" role="status">
            {said}
          </span>
        )}
        {you && (
          <MapMarker position={you} label={labels.location} anchor="center">
            <span className="nuv-map__location" />
          </MapMarker>
        )}
      </div>
    );
  },
);
MapControls.displayName = "MapControls";

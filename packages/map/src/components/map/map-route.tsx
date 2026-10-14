"use client";

import type { GeoJSONSource } from "maplibre-gl";
import {
  forwardRef,
  type HTMLAttributes,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import { type MapLngLat, useMapContext } from "./map";

// MapLibre draws on a canvas and takes a color as numbers, where a theme's
// color is a variable, written any way CSS allows. A pixel painted with it
// says what it comes to.
function toRgba(color: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return color;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha = 255] = context.getImageData(0, 0, 1, 1).data;
  return `rgba(${red}, ${green}, ${blue}, ${Math.round((alpha / 255) * 100) / 100})`;
}

// Counts up when the page's theme may have changed: the reader's setting,
// or a class or an attribute on the page itself, which is where a theme
// switch puts it.
function useThemeChanges(): number {
  const [changes, setChanges] = useState(0);

  useEffect(() => {
    const changed = () => setChanges((count) => count + 1);
    const queries = [
      "(prefers-color-scheme: dark)",
      "(forced-colors: active)",
    ].map((query) => window.matchMedia(query));
    for (const query of queries) query.addEventListener("change", changed);
    const observer = new MutationObserver(changed);
    for (const element of [document.documentElement, document.body]) {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme"],
      });
    }
    return () => {
      for (const query of queries) query.removeEventListener("change", changed);
      observer.disconnect();
    };
  }, []);

  return changes;
}

export interface MapRouteOwnProps {
  /** The places the line goes through, in order. */
  coordinates: MapLngLat[];
  /**
   * How thick the line is, in pixels.
   * @default 4
   */
  width?: number;
  /**
   * Draws it in dashes, for a way that's planned and not yet gone.
   * @default false
   */
  dashed?: boolean;
  /**
   * The name of a layer in the map's style to draw it under, such as the
   * style's first layer of place names. Left out, it's drawn over the map.
   */
  before?: string;
}

export interface MapRouteProps
  extends MapRouteOwnProps,
    Omit<
      HTMLAttributes<HTMLSpanElement>,
      keyof MapRouteOwnProps | "children"
    > {}

export const MapRoute = forwardRef<HTMLSpanElement, MapRouteProps>(
  (
    { coordinates, width = 4, dashed = false, before, className, ...props },
    ref,
  ) => {
    const { map } = useMapContext("MapRoute");
    const id = `nuv-map-route-${useId()}`;
    const edge = `${id}-edge`;
    // Not drawn. It's where the line's colors are read from, so they're
    // CSS variables like every other color, and follow the theme.
    const probe = useRef<HTMLSpanElement | null>(null);
    const theme = useThemeChanges();
    const path = coordinates.map((place) => place.join(",")).join(";");
    const latest = useRef({ coordinates, width, dashed });
    useEffect(() => {
      latest.current = { coordinates, width, dashed };
    });

    useEffect(() => {
      const colors = () => {
        const style = probe.current ? getComputedStyle(probe.current) : null;
        return {
          line: toRgba(style?.color ?? "#000"),
          edge: toRgba(style?.backgroundColor ?? "#fff"),
        };
      };
      // Adds what isn't there. A style that's still on its way can't be
      // added to, and says when it has come. A style that's swapped for
      // another takes the line with it, and says so the same way.
      const ensure = () => {
        try {
          const now = latest.current;
          if (!map.getSource(id)) {
            map.addSource(id, {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: now.coordinates },
              },
            });
          }
          const under = before && map.getLayer(before) ? before : undefined;
          const layout = {
            "line-cap": "round",
            "line-join": "round",
          } as const;
          const paint = colors();
          // An edge in the other color, so the line is seen on a map of
          // any color.
          if (!map.getLayer(edge)) {
            map.addLayer(
              {
                id: edge,
                type: "line",
                source: id,
                layout,
                paint: {
                  "line-color": paint.edge,
                  "line-width": now.width + 2,
                },
              },
              under,
            );
          }
          if (!map.getLayer(id)) {
            map.addLayer(
              {
                id,
                type: "line",
                source: id,
                layout,
                paint: {
                  "line-color": paint.line,
                  "line-width": now.width,
                  ...(now.dashed ? { "line-dasharray": [2, 2] } : null),
                },
              },
              under,
            );
          }
        } catch {
          // The style isn't there yet.
        }
      };
      ensure();
      map.on("styledata", ensure);
      return () => {
        map.off("styledata", ensure);
        try {
          if (map.getLayer(id)) map.removeLayer(id);
          if (map.getLayer(edge)) map.removeLayer(edge);
          if (map.getSource(id)) map.removeSource(id);
        } catch {
          // The map was taken down first, and the line with it.
        }
      };
    }, [map, id, edge, before]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: `path` is the coordinates as text, so a list that's written out again with the same places isn't sent again.
    useEffect(() => {
      try {
        void map.getSource<GeoJSONSource>(id)?.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: latest.current.coordinates,
          },
        });
      } catch {
        // No style yet. The line is added with these places when it comes.
      }
    }, [map, id, path]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: `theme` and `className` aren't read here, and are what the colors may have changed with.
    useEffect(() => {
      try {
        if (!map.getLayer(id) || !probe.current) return;
        const style = getComputedStyle(probe.current);
        map.setPaintProperty(id, "line-color", toRgba(style.color));
        map.setPaintProperty(id, "line-width", width);
        map.setPaintProperty(id, "line-dasharray", dashed ? [2, 2] : undefined);
        map.setPaintProperty(edge, "line-color", toRgba(style.backgroundColor));
        map.setPaintProperty(edge, "line-width", width + 2);
      } catch {
        // No style yet. The line is added as it should be when it comes.
      }
    }, [map, id, edge, width, dashed, theme, className, props.style]);

    return (
      <span
        ref={(node) => {
          probe.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        hidden
        {...props}
        className={cx("nuv-map__route", className)}
      />
    );
  },
);
MapRoute.displayName = "MapRoute";

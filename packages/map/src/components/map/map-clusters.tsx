"use client";

import type { GeoJSONSource } from "maplibre-gl";
import {
  Fragment,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { type MapLngLat, MapMarker, useMapContext } from "./map";

/** A place that may be gathered with others. What else is on it is yours. */
export interface MapClusterPoint {
  /** What tells it from the others. */
  id: string | number;
  /** Where it is. */
  position: MapLngLat;
}

export interface MapClustersOwnProps<
  Point extends MapClusterPoint = MapClusterPoint,
> {
  /** Every place, whether it's in view or not. */
  points: Point[];
  /**
   * Draws a place that stands on its own, as a `MapMarker`. It's called
   * for the places in view that aren't gathered, and not for the rest.
   */
  children: (point: Point) => ReactNode;
  /**
   * How near two places are, in pixels, to be gathered into one.
   * @default 50
   */
  radius?: number;
  /**
   * The zoom past which nothing is gathered, however near.
   * @default 14
   */
  maxZoom?: number;
  /**
   * The name of a gathering, from how many places are in it. It's what's
   * read in place of the number.
   * @default (count) => `${count} places`
   */
  clusterLabel?: (count: number) => string;
}

export type MapClustersProps<Point extends MapClusterPoint = MapClusterPoint> =
  MapClustersOwnProps<Point>;

interface Cluster {
  id: number;
  count: number;
  position: MapLngLat;
}

interface Shown {
  // What's shown, as text, so the same answer twice draws nothing again.
  key: string;
  clusters: Cluster[];
  points: string[];
}

const nothing: Shown = { key: "", clusters: [], points: [] };

const english = (count: number) => `${count} places`;

// 1200 as 1.2K, in the reader's own language.
const short = (count: number) =>
  new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);

const sizeOf = (count: number) =>
  count < 10 ? "sm" : count < 100 ? "md" : "lg";

export function MapClusters<Point extends MapClusterPoint>({
  points,
  children,
  radius = 50,
  maxZoom = 14,
  clusterLabel = english,
}: MapClustersProps<Point>) {
  const { map } = useMapContext("MapClusters");
  const id = `nuv-map-clusters-${useId()}`;
  const hold = `${id}-hold`;
  const [shown, setShown] = useState<Shown>(nothing);
  // The places as text, so a list that's written out again with the same
  // places isn't gathered again.
  const listed = points
    .map((point) => `${point.id}:${point.position.join(",")}`)
    .join(";");
  // biome-ignore lint/correctness/useExhaustiveDependencies: `listed` is the points as text.
  const byId = useMemo(
    () => new Map(points.map((point) => [String(point.id), point])),
    [listed],
  );
  const latest = useRef(byId);
  useEffect(() => {
    latest.current = byId;
  });

  useEffect(() => {
    const collection = () => ({
      type: "FeatureCollection" as const,
      features: [...latest.current].map(([key, point]) => ({
        type: "Feature" as const,
        properties: { id: key },
        geometry: { type: "Point" as const, coordinates: point.position },
      })),
    });
    // Adds what isn't there. A style that's still on its way can't be
    // added to, and says when it has come. A style that's swapped for
    // another takes the places with it, and says so the same way.
    const ensure = () => {
      try {
        if (!map.getSource(id)) {
          map.addSource(id, {
            type: "geojson",
            data: collection(),
            cluster: true,
            clusterRadius: radius,
            clusterMaxZoom: maxZoom,
          });
        }
        // MapLibre gathers the places of a source that a layer draws, and
        // of no other. This one draws nothing: the markers are elements.
        if (!map.getLayer(hold)) {
          map.addLayer({
            id: hold,
            type: "circle",
            source: id,
            paint: { "circle-radius": 0, "circle-opacity": 0 },
          });
        }
      } catch {
        // The style isn't there yet.
      }
    };

    const read = () => {
      let features: ReturnType<typeof map.querySourceFeatures>;
      try {
        features = map.querySourceFeatures(id);
      } catch {
        return;
      }
      // A place near the edge of a tile is in the tile beside it as well.
      const clusters = new Map<number, Cluster>();
      const alone = new Set<string>();
      for (const feature of features) {
        if (feature.geometry.type !== "Point") continue;
        const properties = feature.properties ?? {};
        if (properties.cluster) {
          const [lng = 0, lat = 0] = feature.geometry.coordinates;
          clusters.set(Number(properties.cluster_id), {
            id: Number(properties.cluster_id),
            count: Number(properties.point_count),
            position: [lng, lat],
          });
        } else {
          alone.add(String(properties.id));
        }
      }
      const groups = [...clusters.values()].sort(
        (one, other) => one.id - other.id,
      );
      const singles = [...alone].sort();
      const key = `${groups.map((group) => group.id).join(",")}|${singles.join(",")}`;
      setShown((now) =>
        now.key === key ? now : { key, clusters: groups, points: singles },
      );
    };

    // Once a frame at the most, however often the map says it's moved.
    let frame = 0;
    const later = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        read();
      });
    };
    const loaded = (event: { sourceId?: string }) => {
      if (event.sourceId === id) later();
    };

    ensure();
    later();
    map.on("styledata", ensure);
    map.on("sourcedata", loaded);
    map.on("move", later);
    map.on("moveend", later);
    map.on("idle", later);
    return () => {
      cancelAnimationFrame(frame);
      map.off("styledata", ensure);
      map.off("sourcedata", loaded);
      map.off("move", later);
      map.off("moveend", later);
      map.off("idle", later);
      setShown(nothing);
      try {
        if (map.getLayer(hold)) map.removeLayer(hold);
        if (map.getSource(id)) map.removeSource(id);
      } catch {
        // The map was taken down first, and the places with it.
      }
    };
  }, [map, id, hold, radius, maxZoom]);

  useEffect(() => {
    try {
      void map.getSource<GeoJSONSource>(id)?.setData({
        type: "FeatureCollection",
        features: [...byId].map(([key, point]) => ({
          type: "Feature",
          properties: { id: key },
          geometry: { type: "Point", coordinates: point.position },
        })),
      });
    } catch {
      // No style yet. The places are added when it comes.
    }
  }, [map, id, byId]);

  const open = (cluster: Cluster, event: MouseEvent<HTMLElement>) => {
    // The gathering is gone once the map has zoomed. Pressed from the
    // keys, the map takes the focus, so the keys still have somewhere to be.
    if (event.currentTarget === document.activeElement) {
      map.getCanvas().focus({ preventScroll: true });
    }
    const source = map.getSource<GeoJSONSource>(id);
    if (!source) return;
    source
      .getClusterExpansionZoom(cluster.id)
      .then((zoom) => map.easeTo({ center: cluster.position, zoom }))
      .catch(() => {
        // Gathered again since it was pressed, by a move or by new places.
      });
  };

  return (
    <>
      {shown.clusters.map((cluster) => (
        <MapMarker
          key={`cluster-${cluster.id}`}
          className="nuv-map__cluster"
          data-size={sizeOf(cluster.count)}
          position={cluster.position}
          anchor="center"
          label={clusterLabel(cluster.count)}
          onClick={(event) => open(cluster, event)}
        >
          {short(cluster.count)}
        </MapMarker>
      ))}
      {shown.points.map((key) => {
        const point = byId.get(key);
        return point ? (
          <Fragment key={`point-${key}`}>{children(point)}</Fragment>
        ) : null;
      })}
    </>
  );
}
MapClusters.displayName = "MapClusters";

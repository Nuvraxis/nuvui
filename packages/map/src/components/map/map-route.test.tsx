import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import type { GeoJSONSource } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import {
  Component,
  type ComponentProps,
  createRef,
  type ReactNode,
} from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  type MapInstance,
  type MapLngLat,
  MapRoute,
  type MapStyle,
  MapView,
  mapBoundsOf,
  setMapWorkerUrl,
} from ".";

setMapWorkerUrl(workerUrl);

const land = {
  id: "land",
  type: "background",
  paint: { "background-color": "#dfe7ec" },
} as const;

// A map of one color, with nothing to fetch.
const blank: MapStyle = { version: 8, sources: {}, layers: [land] };

// The same with a layer over the land, to draw a route under.
const named: MapStyle = {
  version: 8,
  sources: {
    places: {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    },
  },
  layers: [land, { id: "names", type: "circle", source: "places" }],
};

const berlin: MapLngLat = [13.405, 52.52];
const leipzig: MapLngLat = [12.3731, 51.3397];
const munich: MapLngLat = [11.582, 48.1351];
const way = [berlin, leipzig, munich];

const webgl = (() => {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
})();

class Caught extends Component<{ children: ReactNode }, { said: string }> {
  override state = { said: "" };

  static getDerivedStateFromError(error: Error) {
    return { said: error.message };
  }

  override render() {
    return this.state.said ? (
      <p role="alert">{this.state.said}</p>
    ) : (
      this.props.children
    );
  }
}

type RouteProps = ComponentProps<typeof MapRoute>;

const view = (
  route: Partial<RouteProps> | null = {},
  mapStyle: MapStyle = blank,
  onLoad?: (map: MapInstance) => void,
) => (
  <MapView
    mapStyle={mapStyle}
    aria-label="The way south"
    defaultCenter={leipzig}
    defaultZoom={6}
    onLoad={onLoad}
  >
    {route && <MapRoute coordinates={way} {...route} />}
  </MapView>
);

// The layers a route has drawn, the edge and then the line.
const lines = (map: MapInstance) =>
  map.getStyle().layers.filter((layer) => layer.type === "line");

async function mount(route: Partial<RouteProps> = {}, mapStyle = blank) {
  const onLoad = vi.fn();
  const screen = await render(view(route, mapStyle, onLoad));
  await expect
    .poll(() => onLoad.mock.calls.length, { timeout: 20_000 })
    .toBe(1);
  const map = onLoad.mock.calls[0]?.[0] as MapInstance;
  await expect.poll(() => lines(map).length).toBe(2);
  const [edge, line] = lines(map);
  return { screen, map, edge: edge?.id ?? "", line: line?.id ?? "" };
}

const placesOf = async (map: MapInstance, id: string) => {
  const data = await (map.getSource(id) as GeoJSONSource).getData();
  return data.type === "Feature" && data.geometry.type === "LineString"
    ? data.geometry.coordinates
    : null;
};

beforeEach(async () => {
  await setViewport("desktop");
  await emulateMedia({ reducedMotion: "reduce" });
});

describe("mapBoundsOf", () => {
  test("it's the south-west and north-east corners of the places", () => {
    expect(mapBoundsOf(way)).toEqual([
      [11.582, 48.1351],
      [13.405, 52.52],
    ]);
  });

  test("one place is an area of that place, and none is no area", () => {
    expect(mapBoundsOf([berlin])).toEqual([berlin, berlin]);
    expect(mapBoundsOf([])).toBeUndefined();
  });
});

describe("outside a map", () => {
  test("a route says where it belongs", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    await render(
      <Caught>
        <MapRoute coordinates={way} />
      </Caught>,
    );

    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("<MapRoute> must be inside a <MapView>.");
    quiet.mockRestore();
  });
});

describe.skipIf(!webgl)("a route", () => {
  test("it's a line through its places, with an edge under it", async () => {
    const { map, edge, line } = await mount();

    expect(await placesOf(map, line)).toEqual(way);
    expect(map.getLayer(edge)?.source).toBe(line);
    expect(map.getPaintProperty(line, "line-width")).toBe(4);
    expect(map.getPaintProperty(edge, "line-width")).toBe(6);
    expect(map.getLayoutProperty(line, "line-cap")).toBe("round");
    expect(map.getPaintProperty(line, "line-dasharray")).toBeUndefined();
  });

  test("its colors are the theme's, read from its variables", async () => {
    const { map, edge, line } = await mount({
      style: {
        "--nuv-map-route-color": "rgb(10, 20, 30)",
        "--nuv-map-route-edge": "rgb(240, 250, 255)",
      } as never,
    });

    expect(map.getPaintProperty(line, "line-color")).toBe(
      "rgba(10, 20, 30, 1)",
    );
    expect(map.getPaintProperty(edge, "line-color")).toBe(
      "rgba(240, 250, 255, 1)",
    );
  });

  test("with no variables set it's the primary color, on its foreground", async () => {
    const { map, edge, line } = await mount();
    const probe = document.querySelector(".nuv-map__route") as Element;

    expect(map.getPaintProperty(line, "line-color")).toMatch(/^rgba\(/);
    expect(map.getPaintProperty(line, "line-color")).not.toBe(
      map.getPaintProperty(edge, "line-color"),
    );
    // Not drawn: it's only where the colors are read.
    expect(getComputedStyle(probe).display).toBe("none");
  });

  test("width and dashed are followed when they change", async () => {
    const { screen, map, edge, line } = await mount();

    await screen.rerender(view({ width: 8, dashed: true }));

    await expect.poll(() => map.getPaintProperty(line, "line-width")).toBe(8);
    expect(map.getPaintProperty(edge, "line-width")).toBe(10);
    expect(map.getPaintProperty(line, "line-dasharray")).toEqual([2, 2]);

    await screen.rerender(view({ width: 8 }));
    await expect
      .poll(() => map.getPaintProperty(line, "line-dasharray"))
      .toBeUndefined();
  });

  test("a color that changes is followed", async () => {
    const { screen, map, line } = await mount({
      style: { "--nuv-map-route-color": "rgb(10, 20, 30)" } as never,
    });

    await screen.rerender(
      view({ style: { "--nuv-map-route-color": "rgb(200, 0, 0)" } as never }),
    );

    await expect
      .poll(() => map.getPaintProperty(line, "line-color"))
      .toBe("rgba(200, 0, 0, 1)");
  });

  test("other places are gone through when they're given", async () => {
    const { screen, map, line } = await mount();

    await screen.rerender(view({ coordinates: [berlin, munich] }));

    await expect.poll(() => placesOf(map, line)).toEqual([berlin, munich]);
  });

  test("before draws it under a layer of the style's", async () => {
    const { map, edge, line } = await mount({ before: "names" }, named);
    const order = map.getStyle().layers.map((layer) => layer.id);

    expect(order).toEqual(["land", edge, line, "names"]);
  });

  test("a before that the style doesn't have leaves it on top", async () => {
    const { map, edge, line } = await mount({ before: "nothing-here" }, named);

    expect(map.getStyle().layers.map((layer) => layer.id)).toEqual([
      "land",
      "names",
      edge,
      line,
    ]);
  });

  test("it's drawn again on a style that's swapped for another", async () => {
    const { screen, map } = await mount();

    await screen.rerender(view({}, named));

    await expect
      .poll(() => map.getStyle().layers.map((layer) => layer.type))
      .toEqual(["background", "circle", "line", "line"]);
  });

  test("taken away, its layers and its source go with it", async () => {
    const { screen, map, line } = await mount();

    await screen.rerender(view(null));

    await expect.poll(() => lines(map).length).toBe(0);
    expect(map.getSource(line)).toBeUndefined();
  });

  test("two routes are two lines", async () => {
    const onLoad = vi.fn();
    await render(
      <MapView mapStyle={blank} aria-label="Two ways" onLoad={onLoad}>
        <MapRoute coordinates={[berlin, leipzig]} />
        <MapRoute coordinates={[leipzig, munich]} dashed />
      </MapView>,
    );
    await expect
      .poll(() => onLoad.mock.calls.length, { timeout: 20_000 })
      .toBe(1);
    const map = onLoad.mock.calls[0]?.[0] as MapInstance;

    await expect.poll(() => lines(map).length).toBe(4);
    expect(
      new Set(lines(map).map((layer) => "source" in layer && layer.source))
        .size,
    ).toBe(2);
  });

  test("it takes a ref, a class and other props", async () => {
    const ref = createRef<HTMLSpanElement>();
    await mount({ ref, className: "late", id: "van-12" } as never);

    expect(ref.current?.classList.contains("nuv-map__route")).toBe(true);
    expect(ref.current?.classList.contains("late")).toBe(true);
    expect(ref.current?.id).toBe("van-12");
  });
});

import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Component, type ComponentProps, type ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  type MapClusterPoint,
  MapClusters,
  type MapInstance,
  type MapLngLat,
  MapMarker,
  type MapStyle,
  MapView,
  setMapWorkerUrl,
} from ".";

setMapWorkerUrl(workerUrl);

const land = {
  id: "land",
  type: "background",
  paint: { "background-color": "#dfe7ec" },
} as const;

const blank: MapStyle = { version: 8, sources: {}, layers: [land] };
const other: MapStyle = {
  version: 8,
  sources: {},
  layers: [{ ...land, id: "sea" }],
};

interface Station extends MapClusterPoint {
  name: string;
}

const berlin: MapLngLat = [13.405, 52.52];

// Three in Berlin, a few streets apart, and one in Paris.
const stations: Station[] = [
  { id: "mitte", name: "Mitte", position: [13.405, 52.52] },
  { id: "kreuzberg", name: "Kreuzberg", position: [13.4034, 52.4986] },
  { id: "wedding", name: "Wedding", position: [13.3662, 52.5497] },
  { id: "paris", name: "Paris", position: [2.3522, 48.8566] },
];

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

const one = (station: Station) => (
  <MapMarker position={station.position} label={station.name} />
);

type Props = Partial<ComponentProps<typeof MapClusters<Station>>>;

const view = (
  clusters: Props | null = {},
  map: Partial<ComponentProps<typeof MapView>> = {},
) => (
  <MapView
    mapStyle={blank}
    aria-label="Stations"
    defaultCenter={[8, 51]}
    defaultZoom={4}
    {...map}
  >
    {clusters && (
      <MapClusters points={stations} {...clusters}>
        {clusters.children ?? one}
      </MapClusters>
    )}
  </MapView>
);

async function mount(
  clusters: Props = {},
  map: Partial<ComponentProps<typeof MapView>> = {},
) {
  const onLoad = vi.fn();
  const screen = await render(view(clusters, { ...map, onLoad }));
  await expect
    .poll(() => onLoad.mock.calls.length, { timeout: 20_000 })
    .toBe(1);
  return { screen, map: onLoad.mock.calls[0]?.[0] as MapInstance };
}

const cluster = (name: string) => page.getByRole("button", { name });
const marker = (name: string) =>
  document.querySelector(`.nuv-map__marker[aria-label="${name}"]`);
const count = (selector: string) => document.querySelectorAll(selector).length;

beforeEach(async () => {
  await setViewport("desktop");
  // A move is a jump, so no test waits on one to finish.
  await emulateMedia({ reducedMotion: "reduce" });
});

describe("outside a map", () => {
  test("it says where it belongs", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    await render(
      <Caught>
        <MapClusters points={stations}>{one}</MapClusters>
      </Caught>,
    );

    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("<MapClusters> must be inside a <MapView>.");
    quiet.mockRestore();
  });
});

describe.skipIf(!webgl)("clusters", () => {
  test("places near each other are one button with how many on it, and a place alone is its marker", async () => {
    await mount();

    await expect.element(cluster("3 places")).toBeVisible();
    expect(cluster("3 places").element().textContent).toBe("3");
    expect(
      cluster("3 places").element().classList.contains("nuv-map__cluster"),
    ).toBe(true);
    await expect.poll(() => marker("Paris")).not.toBeNull();
    // The three aren't drawn as well.
    expect(marker("Mitte")).toBeNull();
    expect(count(".nuv-map__cluster")).toBe(1);
  });

  test("a press on one zooms the map in until its places come apart", async () => {
    const { map } = await mount();
    await expect.element(cluster("3 places")).toBeVisible();

    await cluster("3 places").click();

    await expect.poll(() => map.getZoom()).toBeGreaterThan(4);
    // Far enough for the one furthest from the others to stand alone. The
    // two that are left may still be together, and are a press away.
    await expect.poll(() => marker("Wedding")).not.toBeNull();
    expect(cluster("3 places").elements()).toHaveLength(0);
    // Around where the three are.
    expect(map.getCenter().lng).toBeCloseTo(13.39, 1);
  });

  test("pressed from the keys, the focus goes to the map", async () => {
    await mount();
    await expect.element(cluster("3 places")).toBeVisible();
    (cluster("3 places").element() as HTMLElement).focus();

    await cluster("3 places").click();

    await expect
      .poll(() =>
        document.activeElement?.classList.contains("maplibregl-canvas"),
      )
      .toBe(true);
  });

  test("zooming out by hand gathers them again", async () => {
    const { map } = await mount({}, { defaultCenter: berlin, defaultZoom: 13 });
    await expect.poll(() => marker("Mitte")).not.toBeNull();
    expect(count(".nuv-map__cluster")).toBe(0);

    map.jumpTo({ zoom: 4 });

    await expect.element(cluster("3 places")).toBeVisible();
    expect(marker("Mitte")).toBeNull();
  });

  test("past maxZoom nothing is gathered, however near", async () => {
    const near: Station[] = [
      { id: "a", name: "Door A", position: [13.405, 52.52] },
      { id: "b", name: "Door B", position: [13.40501, 52.52001] },
    ];
    const { map } = await mount(
      { points: near, maxZoom: 5 },
      { defaultCenter: berlin, defaultZoom: 5 },
    );
    await expect.element(cluster("2 places")).toBeVisible();

    map.jumpTo({ zoom: 6 });

    await expect.poll(() => marker("Door A")).not.toBeNull();
    expect(marker("Door B")).not.toBeNull();
    expect(count(".nuv-map__cluster")).toBe(0);
  });

  test("a smaller radius gathers less", async () => {
    // At this zoom the three are some 25 and 45 pixels apart.
    const { screen } = await mount(
      {},
      { defaultCenter: berlin, defaultZoom: 9 },
    );
    await expect.element(cluster("3 places")).toBeVisible();

    await screen.rerender(
      view({ radius: 10 }, { defaultCenter: berlin, defaultZoom: 9 }),
    );

    await expect.poll(() => marker("Wedding")).not.toBeNull();
    expect(marker("Mitte")).not.toBeNull();
    expect(count(".nuv-map__cluster")).toBe(0);
  });

  test("the name of a gathering is yours to give", async () => {
    await mount({ clusterLabel: (many) => `${many} laadpalen` });

    await expect.element(cluster("3 laadpalen")).toBeVisible();
  });

  test("it follows the places when they change", async () => {
    const { screen } = await mount();
    await expect.element(cluster("3 places")).toBeVisible();

    await screen.rerender(view({ points: stations.slice(1) }));

    await expect.element(cluster("2 places")).toBeVisible();
    expect(count(".nuv-map__cluster")).toBe(1);

    await screen.rerender(view({ points: stations.slice(3) }));
    await expect.poll(() => count(".nuv-map__cluster")).toBe(0);
    expect(marker("Paris")).not.toBeNull();
  });

  test("the function draws each place that stands alone, with what's on it", async () => {
    const draw = vi.fn((station: Station) => (
      <MapMarker
        position={station.position}
        label={`${station.name} station`}
        popup={station.name}
      />
    ));
    await mount({ children: draw });

    await expect
      .element(page.getByRole("button", { name: "Paris station" }))
      .toBeVisible();
    expect(draw).toHaveBeenCalledWith(stations[3]);
    expect(draw).not.toHaveBeenCalledWith(stations[0]);
  });

  test("a gathering grows a step at ten places and at a hundred", async () => {
    const many = (length: number): Station[] =>
      Array.from({ length }, (_, index) => ({
        id: index,
        name: `Station ${index}`,
        position: [13.4 + index * 0.0001, 52.52],
      }));
    const { screen } = await mount({ points: many(4) });
    await expect.element(cluster("4 places")).toBeVisible();
    const small = cluster("4 places").element().getBoundingClientRect().height;
    expect(cluster("4 places").element().getAttribute("data-size")).toBe("sm");

    await screen.rerender(view({ points: many(12) }));
    await expect.element(cluster("12 places")).toBeVisible();
    expect(cluster("12 places").element().getAttribute("data-size")).toBe("md");
    expect(
      cluster("12 places").element().getBoundingClientRect().height,
    ).toBeGreaterThan(small);

    await screen.rerender(view({ points: many(120) }));
    await expect.element(cluster("120 places")).toBeVisible();
    expect(cluster("120 places").element().getAttribute("data-size")).toBe(
      "lg",
    );
  });

  test("it's a round button in the primary color, and its variables change it", async () => {
    await mount(
      {},
      {
        style: {
          "--nuv-map-cluster-bg": "rgb(10, 20, 30)",
          "--nuv-map-cluster-fg": "rgb(240, 250, 255)",
          "--nuv-map-cluster-size": "40px",
        } as never,
      },
    );
    await expect.element(cluster("3 places")).toBeVisible();
    const style = getComputedStyle(cluster("3 places").element());

    expect(style.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(style.color).toBe("rgb(240, 250, 255)");
    expect(style.blockSize).toBe("40px");
    expect(Number.parseFloat(style.inlineSize)).toBeGreaterThanOrEqual(40);
    expect(Number.parseFloat(style.borderTopLeftRadius)).toBeGreaterThan(19);
  });

  test("it's gathered again on a style that's swapped for another", async () => {
    const { screen, map } = await mount();
    await expect.element(cluster("3 places")).toBeVisible();

    await screen.rerender(view({}, { mapStyle: other }));

    await expect
      .poll(() => map.getStyle().layers.map((layer) => layer.type))
      .toEqual(["background", "circle"]);
    await expect.element(cluster("3 places")).toBeVisible();
  });

  test("taken away, its markers, its layer and its source go with it", async () => {
    const { screen, map } = await mount();
    await expect.element(cluster("3 places")).toBeVisible();

    await screen.rerender(view(null));

    await expect.poll(() => count(".nuv-map__marker")).toBe(0);
    expect(map.getStyle().layers.map((layer) => layer.id)).toEqual(["land"]);
    expect(Object.keys(map.getStyle().sources)).toEqual([]);
  });

  test("passes axe with a gathering and a place alone", async () => {
    const { screen } = await mount();
    await expect.element(cluster("3 places")).toBeVisible();

    expect(await axe(screen.container)).toHaveNoViolations();
  });
});

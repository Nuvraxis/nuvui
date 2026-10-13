import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
// The address Vite gives MapLibre's worker, which is how an app built
// with Vite asks for it.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import {
  Component,
  type ComponentProps,
  createRef,
  type ReactNode,
  useState,
} from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  MapControls,
  type MapInstance,
  type MapLngLat,
  MapMarker,
  MapPopup,
  type MapStyle,
  MapView,
  setMapWorkerUrl,
  useMap,
} from ".";

setMapWorkerUrl(workerUrl);

const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();

// A map of one color, with nothing to fetch. The tests are about the
// component, and none of them should wait on someone's tiles.
const blank: MapStyle = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "land",
      type: "background",
      paint: { "background-color": "#dfe7ec" },
    },
  ],
};

// The same with a source that names whose it is.
const credited: MapStyle = {
  version: 8,
  sources: {
    places: {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      attribution: "Example Maps",
    },
  },
  layers: [
    {
      id: "land",
      type: "background",
      paint: { "background-color": "#dfe7ec" },
    },
    { id: "places", type: "circle", source: "places" },
  ],
};

const berlin: MapLngLat = [13.405, 52.52];
const paris: MapLngLat = [2.3522, 48.8566];

// A map is drawn with WebGL. A browser that's run without it draws none,
// and what's left to test there is that the component says so.
const webgl = (() => {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
})();

type Props = Partial<ComponentProps<typeof MapView>>;

// Shows what a part threw, in place of the part.
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

const root = () => document.querySelector(".nuv-map") as HTMLDivElement;
const canvas = () =>
  document.querySelector(".maplibregl-canvas") as HTMLCanvasElement;
const marker = (name: string) =>
  document.querySelector(
    `.nuv-map__marker[aria-label="${name}"]`,
  ) as HTMLElement;
const dialog = (name: string) => page.getByRole("dialog", { name });

// Drawn, with its style and its first frame.
async function mount(props: Props = {}, children?: ReactNode) {
  const onLoad = vi.fn();
  const screen = await render(
    <MapView
      mapStyle={blank}
      aria-label="Offices"
      defaultCenter={berlin}
      defaultZoom={10}
      onLoad={onLoad}
      {...props}
    >
      {children}
    </MapView>,
  );
  await expect
    .poll(() => onLoad.mock.calls.length, { timeout: 20_000 })
    .toBe(1);
  // MapLibre says it's loaded from its own frame, which on a busy machine
  // can come before React has drawn what's on the map. The box says
  // "ready" in the same pass that draws the markers, and a frame after
  // that their own effects have run.
  await expect.poll(() => root().dataset.state).toBe("ready");
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return { screen, map: onLoad.mock.calls[0]?.[0] as MapInstance };
}

// At rest, after a move that was asked for.
const settled = (map: MapInstance) =>
  expect.poll(() => map.isMoving(), { timeout: 10_000 }).toBe(false);

beforeEach(async () => {
  await setViewport("desktop");
  // A move is a jump, so no test waits on one to finish.
  await emulateMedia({ reducedMotion: "reduce" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("without WebGL", () => {
  test("it says the map couldn't be drawn, and tells the app", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const onError = vi.fn();
    await render(<MapView mapStyle={blank} onError={onError} />);

    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("The map couldn't be drawn");
    expect(root().dataset.state).toBe("error");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });

  test("the words are yours to give", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    await render(<MapView mapStyle={blank} labels={{ error: "Geen kaart" }} />);

    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Geen kaart");
  });

  test("a part outside a MapView says where it belongs", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    await render(
      <Caught>
        <MapMarker position={berlin} label="Berlin" />
      </Caught>,
    );

    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("<MapMarker> must be inside a <MapView>.");
    quiet.mockRestore();
  });
});

describe.skipIf(!webgl)("rendering", () => {
  // What a server sends, and what's on the page until MapLibre and the
  // style have come. Asked of the server's renderer, since in a browser
  // the map may be ready before a test can look.
  test("before there's a map, the box says it's loading", () => {
    const html = renderToString(
      <MapView mapStyle={blank} aria-label="Offices" />,
    );

    expect(html).toContain('data-state="loading"');
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading map");
    expect(html).not.toContain("nuv-map__marker");
  });

  test("then it's a map with a name, and the words are gone", async () => {
    const onLoad = vi.fn();
    await render(
      <MapView mapStyle={blank} aria-label="Offices" onLoad={onLoad} />,
    );

    await expect
      .poll(() => root().dataset.state, { timeout: 20_000 })
      .toBe("ready");
    expect(document.querySelector(".nuv-map__note")).toBeNull();
    await expect
      .element(page.getByRole("region", { name: "Offices" }))
      .toBeVisible();
    expect(canvas().tabIndex).toBe(0);
    await expect.poll(() => onLoad.mock.calls.length).toBe(1);
  });

  test("with no name given it's named Map, or by the word you give", async () => {
    await mount({ "aria-label": undefined, labels: { map: "Kaart" } });

    expect(canvas().getAttribute("aria-label")).toBe("Kaart");
  });

  test("it forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLDivElement>();
    await mount({ ref, className: "mine", id: "offices" } as Props);

    expect(ref.current).toBe(root());
    expect(root().classList.contains("mine")).toBe(true);
    expect(root().classList.contains("nuv-map")).toBe(true);
    expect(root().id).toBe("offices");
  });

  test("it begins at the center and the zoom it's given", async () => {
    const { map } = await mount();

    expect(map.getCenter().lng).toBeCloseTo(berlin[0], 4);
    expect(map.getCenter().lat).toBeCloseTo(berlin[1], 4);
    expect(map.getZoom()).toBeCloseTo(10, 4);
  });

  test("given an area, it shows all of it", async () => {
    const { map } = await mount({ bounds: [paris, berlin] });
    const shown = map.getBounds();

    expect(shown.contains(paris)).toBe(true);
    expect(shown.contains(berlin)).toBe(true);
    // And not the whole world to do it.
    expect(map.getZoom()).toBeGreaterThan(3);
  });

  test("another area is gone to when it's given", async () => {
    const { screen, map } = await mount({ bounds: [paris, berlin] });
    const tokyo: MapLngLat = [139.69, 35.68];
    const osaka: MapLngLat = [135.5, 34.69];

    await screen.rerender(
      <MapView mapStyle={blank} aria-label="Offices" bounds={[osaka, tokyo]} />,
    );

    await expect.poll(() => map.getBounds().contains(tokyo)).toBe(true);
    expect(map.getBounds().contains(berlin)).toBe(false);
  });

  test("the map goes where center and zoom say when they change", async () => {
    const { screen, map } = await mount({ center: berlin, zoom: 10 });

    await screen.rerender(
      <MapView
        mapStyle={blank}
        aria-label="Offices"
        center={paris}
        zoom={12}
      />,
    );

    await expect.poll(() => map.getCenter().lng).toBeCloseTo(paris[0], 3);
    expect(map.getCenter().lat).toBeCloseTo(paris[1], 3);
    expect(map.getZoom()).toBeCloseTo(12, 3);
  });

  test("the app is told as the map moves, and when it's come to rest", async () => {
    const onMove = vi.fn();
    const onMoveEnd = vi.fn();
    const { map } = await mount({ onMove, onMoveEnd });

    map.jumpTo({ center: paris, zoom: 8 });

    await expect.poll(() => onMoveEnd.mock.calls.length).toBeGreaterThan(0);
    expect(onMove).toHaveBeenCalled();
    const view = onMoveEnd.mock.lastCall?.[0];
    expect(view.center[0]).toBeCloseTo(paris[0], 4);
    expect(view.center[1]).toBeCloseTo(paris[1], 4);
    expect(view.zoom).toBeCloseTo(8, 4);
    expect(view.bearing).toBeCloseTo(0, 4);
    expect(view.pitch).toBeCloseTo(0, 4);
  });

  test("a view that's kept by the app and handed back doesn't move the map again", async () => {
    let instance: MapInstance | undefined;
    const ends = vi.fn();
    function Kept() {
      const [view, setView] = useState({ center: berlin, zoom: 10 });
      return (
        <MapView
          mapStyle={blank}
          center={view.center}
          zoom={view.zoom}
          onMove={(next) => setView({ center: next.center, zoom: next.zoom })}
          onMoveEnd={ends}
          onLoad={(map) => {
            instance = map;
          }}
        />
      );
    }
    await render(<Kept />);
    await expect.poll(() => instance, { timeout: 20_000 }).toBeDefined();
    const map = instance as MapInstance;

    map.jumpTo({ center: paris, zoom: 7 });
    await settled(map);
    // Long enough for an echo to have moved it, had there been one.
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(map.getCenter().lng).toBeCloseTo(paris[0], 4);
    expect(map.getZoom()).toBeCloseTo(7, 4);
    expect(ends).toHaveBeenCalledTimes(1);
  });

  test("another style is drawn when it's given", async () => {
    const { screen, map } = await mount();
    expect(map.getStyle().layers.map((layer) => layer.id)).toEqual(["land"]);

    await screen.rerender(<MapView mapStyle={credited} aria-label="Offices" />);

    await expect
      .poll(() => map.getStyle().layers.map((layer) => layer.id))
      .toEqual(["land", "places"]);
  });

  test("minZoom and maxZoom are the map's limits, and follow the props", async () => {
    const { screen, map } = await mount({ minZoom: 4, maxZoom: 12 });
    expect(map.getMinZoom()).toBe(4);
    expect(map.getMaxZoom()).toBe(12);

    await screen.rerender(
      <MapView mapStyle={blank} aria-label="Offices" minZoom={2} maxZoom={9} />,
    );

    await expect.poll(() => map.getMinZoom()).toBe(2);
    expect(map.getMaxZoom()).toBe(9);
  });

  test("whose map it is, is written on it", async () => {
    await mount({ mapStyle: credited });

    await expect
      .poll(
        () => document.querySelector(".maplibregl-ctrl-attrib")?.textContent,
      )
      .toContain("Example Maps");
    expect(
      style(document.querySelector(".maplibregl-ctrl-attrib") as Element)
        .display,
    ).not.toBe("none");
  });

  test("a style that names nobody leaves no empty box", async () => {
    await mount();

    expect(
      style(document.querySelector(".maplibregl-ctrl-attrib") as Element)
        .display,
    ).toBe("none");
  });

  test("a style that can't be had is an error, said and told", async () => {
    const onError = vi.fn();
    await render(
      <MapView mapStyle="/there-is-no-style-here.json" onError={onError} />,
    );

    await expect
      .element(page.getByRole("alert"), { timeout: 20_000 })
      .toHaveTextContent("The map couldn't be drawn");
    expect(onError).toHaveBeenCalled();
  });

  test("taken off the page, the map is taken down with it", async () => {
    const { screen } = await mount(
      {},
      <MapMarker position={berlin} label="Berlin" />,
    );
    expect(canvas()).not.toBeNull();

    await screen.unmount();

    expect(document.querySelector(".maplibregl-canvas")).toBeNull();
    expect(document.querySelector(".nuv-map__marker")).toBeNull();
  });

  test("useMap hands a part of yours the map", async () => {
    let seen: MapInstance | undefined;
    function Part() {
      seen = useMap();
      return null;
    }
    const { map } = await mount({}, <Part />);

    expect(seen).toBe(map);
  });

  test("not interactive, the map takes no focus", async () => {
    await mount({ interactive: false });

    expect(canvas().tabIndex).toBe(-1);
  });
});

describe.skipIf(!webgl)("markers", () => {
  test("a marker is a picture with a name, with its foot on its place", async () => {
    await mount({}, <MapMarker position={berlin} label="Berlin office" />);
    const pin = marker("Berlin office");

    expect(pin.getAttribute("role")).toBe("img");
    expect(pin.tagName).toBe("DIV");
    expect(pin.querySelector(".nuv-map__pin")).not.toBeNull();
    // The map's middle is Berlin.
    const box = rect(root());
    await expect
      .poll(() => Math.abs(rect(pin).bottom - (box.top + box.height / 2)))
      .toBeLessThan(2);
    expect(
      Math.abs(
        rect(pin).left + rect(pin).width / 2 - (box.left + box.width / 2),
      ),
    ).toBeLessThan(2);
  });

  test("anchored by its middle, its middle is on its place", async () => {
    await mount(
      {},
      <MapMarker position={berlin} label="Berlin office" anchor="center">
        <span style={{ display: "block", inlineSize: 20, blockSize: 20 }} />
      </MapMarker>,
    );
    const dot = marker("Berlin office");
    const box = rect(root());

    await expect
      .poll(() =>
        Math.abs(
          rect(dot).top + rect(dot).height / 2 - (box.top + box.height / 2),
        ),
      )
      .toBeLessThan(2);
  });

  test("what MapLibre places has no name or role of its own", async () => {
    await mount({}, <MapMarker position={berlin} label="Berlin office" />);
    const holder = document.querySelector(".nuv-map__marker-holder") as Element;

    expect(holder.hasAttribute("aria-label")).toBe(false);
    expect(holder.hasAttribute("role")).toBe(false);
    expect(holder.classList.contains("maplibregl-marker")).toBe(true);
  });

  test("it moves when its position does", async () => {
    const { screen } = await mount(
      {},
      <MapMarker position={berlin} label="Van" />,
    );
    const before = rect(marker("Van")).left;

    await screen.rerender(
      <MapView mapStyle={blank} aria-label="Offices">
        <MapMarker position={[berlin[0] + 0.1, berlin[1]]} label="Van" />
      </MapView>,
    );

    await expect.poll(() => rect(marker("Van")).left).toBeGreaterThan(before);
  });

  test("children are drawn in place of the pin", async () => {
    await mount(
      {},
      <MapMarker position={berlin} label="Depot">
        <span data-own>D</span>
      </MapMarker>,
    );

    expect(marker("Depot").querySelector("[data-own]")).not.toBeNull();
    expect(marker("Depot").querySelector(".nuv-map__pin")).toBeNull();
  });

  test("one with onClick is a button, and a press calls it", async () => {
    const onClick = vi.fn();
    await mount(
      {},
      <MapMarker position={berlin} label="Berlin office" onClick={onClick} />,
    );

    await page.getByRole("button", { name: "Berlin office" }).click();

    expect(marker("Berlin office").tagName).toBe("BUTTON");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("it takes a ref and a class", async () => {
    const ref = createRef<HTMLElement>();
    await mount(
      {},
      <MapMarker ref={ref} position={berlin} label="Berlin" className="mine" />,
    );

    expect(ref.current).toBe(marker("Berlin"));
    expect(marker("Berlin").classList.contains("mine")).toBe(true);
  });

  test("taken away, it's gone from the map", async () => {
    const { screen } = await mount(
      {},
      <MapMarker position={berlin} label="Berlin" />,
    );

    await screen.rerender(<MapView mapStyle={blank} aria-label="Offices" />);

    await expect
      .poll(() => document.querySelector(".nuv-map__marker-holder"))
      .toBeNull();
  });
});

describe.skipIf(!webgl)("a marker's popup", () => {
  const withPopup = (props: Partial<ComponentProps<typeof MapMarker>> = {}) => (
    <MapMarker
      position={berlin}
      label="Berlin office"
      popup={<a href="#berlin">Friedrichstraße 68</a>}
      {...props}
    />
  );
  const pin = () => page.getByRole("button", { name: "Berlin office" });

  test("the marker is a button that says it has one, and that it's closed", async () => {
    await mount({}, withPopup());

    expect(marker("Berlin office").getAttribute("aria-haspopup")).toBe(
      "dialog",
    );
    expect(marker("Berlin office").getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector(".nuv-map__popup")).toBeNull();
  });

  test("a press opens it over the marker, named for it, with the focus in it", async () => {
    await mount({}, withPopup());

    await pin().click();

    await expect.element(dialog("Berlin office")).toBeVisible();
    expect(marker("Berlin office").getAttribute("aria-expanded")).toBe("true");
    expect(dialog("Berlin office").element().textContent).toContain(
      "Friedrichstraße 68",
    );
    expect(document.activeElement).toBe(dialog("Berlin office").element());
    // Above the pin, and not over it.
    await expect
      .poll(
        () =>
          rect(document.querySelector(".maplibregl-popup-content") as Element)
            .bottom,
      )
      .toBeLessThanOrEqual(rect(marker("Berlin office")).top);
  });

  test("Escape closes it and puts the focus back on the marker", async () => {
    await mount({}, withPopup());
    await pin().click();
    await expect.element(dialog("Berlin office")).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect
      .poll(() => document.querySelector(".nuv-map__popup"))
      .toBeNull();
    expect(document.activeElement).toBe(marker("Berlin office"));
    expect(marker("Berlin office").getAttribute("aria-expanded")).toBe("false");
  });

  test("its button closes it and puts the focus back on the marker", async () => {
    await mount({}, withPopup());
    await pin().click();

    await page.getByRole("button", { name: "Close" }).click();

    await expect
      .poll(() => document.querySelector(".nuv-map__popup"))
      .toBeNull();
    expect(document.activeElement).toBe(marker("Berlin office"));
  });

  test("a second press on the marker closes it", async () => {
    await mount({}, withPopup());
    await pin().click();
    await expect.element(dialog("Berlin office")).toBeVisible();

    await pin().click();

    await expect
      .poll(() => document.querySelector(".nuv-map__popup"))
      .toBeNull();
  });

  test("a press on the map closes it", async () => {
    await mount({}, withPopup());
    await pin().click();
    await expect.element(dialog("Berlin office")).toBeVisible();

    await userEvent.click(canvas(), { position: { x: 20, y: 20 } });

    await expect
      .poll(() => document.querySelector(".nuv-map__popup"))
      .toBeNull();
  });

  test("a press on another marker closes it and opens the other's", async () => {
    await mount(
      {},
      <>
        {withPopup()}
        <MapMarker
          position={[berlin[0] + 0.15, berlin[1]]}
          label="Depot"
          popup="Open until six"
        />
      </>,
    );
    await pin().click();
    await expect.element(dialog("Berlin office")).toBeVisible();

    await page.getByRole("button", { name: "Depot" }).click();

    await expect.element(dialog("Depot")).toBeVisible();
    await expect
      .poll(() => document.querySelectorAll(".nuv-map__popup").length)
      .toBe(1);
    expect(marker("Berlin office").getAttribute("aria-expanded")).toBe("false");
  });

  test("opened with the page, or by the app, it leaves the focus where it was", async () => {
    await render(<button type="button">Before</button>);
    (
      page.getByRole("button", { name: "Before" }).element() as HTMLElement
    ).focus();
    await mount({}, withPopup({ defaultOpen: true }));
    await expect.element(dialog("Berlin office")).toBeVisible();

    expect(document.activeElement?.textContent).toBe("Before");
  });

  test("defaultOpen begins with it open", async () => {
    await mount({}, withPopup({ defaultOpen: true }));

    await expect.element(dialog("Berlin office")).toBeVisible();
  });

  test("kept by the app, it's open when the app says, and the app is asked", async () => {
    const onOpenChange = vi.fn();
    const { screen } = await mount(
      {},
      withPopup({ open: false, onOpenChange }),
    );

    await pin().click();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(document.querySelector(".nuv-map__popup")).toBeNull();

    await screen.rerender(
      <MapView mapStyle={blank} aria-label="Offices">
        {withPopup({ open: true, onOpenChange })}
      </MapView>,
    );
    await expect.element(dialog("Berlin office")).toBeVisible();

    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test("an onClick that prevents the default leaves it closed", async () => {
    await mount({}, withPopup({ onClick: (event) => event.preventDefault() }));

    await pin().click();

    expect(document.querySelector(".nuv-map__popup")).toBeNull();
  });

  test("Enter and Space open it from the keys", async () => {
    await mount({}, withPopup());
    marker("Berlin office").focus();

    await userEvent.keyboard("{Enter}");

    await expect.element(dialog("Berlin office")).toBeVisible();
  });
});

describe.skipIf(!webgl)("a popup of its own", () => {
  test("it's a dialog at a place, with what it's given in it", async () => {
    await mount(
      {},
      <MapPopup position={berlin} aria-label="Delivery">
        Left at the door
      </MapPopup>,
    );

    await expect.element(dialog("Delivery")).toBeVisible();
    expect(dialog("Delivery").element().textContent).toContain(
      "Left at the door",
    );
  });

  test("its button, Escape and a press on the map each ask to close it", async () => {
    const onClose = vi.fn();
    await mount(
      {},
      <MapPopup position={berlin} aria-label="Delivery" onClose={onClose}>
        Left at the door
      </MapPopup>,
    );
    await expect.element(dialog("Delivery")).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);

    (dialog("Delivery").element() as HTMLElement).focus();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);

    await userEvent.click(canvas(), { position: { x: 20, y: 20 } });
    await expect.poll(() => onClose.mock.calls.length).toBe(3);
    // Asked, and no more: it's the app's to take away.
    expect(document.querySelector(".nuv-map__popup")).not.toBeNull();
  });

  test("the focus goes into it, unless autoFocus is off", async () => {
    const { screen } = await mount(
      {},
      <MapPopup position={berlin} aria-label="Delivery">
        Left at the door
      </MapPopup>,
    );
    await expect.element(dialog("Delivery")).toBeVisible();
    expect(document.activeElement).toBe(dialog("Delivery").element());

    canvas().focus();
    await screen.rerender(
      <MapView mapStyle={blank} aria-label="Offices">
        <MapPopup position={paris} aria-label="Collection" autoFocus={false}>
          At the desk
        </MapPopup>
      </MapView>,
    );
    await expect.element(dialog("Collection")).toBeVisible();
    expect(document.activeElement).toBe(canvas());
  });

  test("closeOnMapClick={false} leaves a press on the map alone", async () => {
    const onClose = vi.fn();
    await mount(
      {},
      <MapPopup
        position={berlin}
        aria-label="Delivery"
        closeOnMapClick={false}
        onClose={onClose}
      >
        Left at the door
      </MapPopup>,
    );
    await expect.element(dialog("Delivery")).toBeVisible();

    await userEvent.click(canvas(), { position: { x: 20, y: 20 } });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onClose).not.toHaveBeenCalled();
  });

  test("the close button's name is yours to give", async () => {
    await mount(
      { labels: { closePopup: "Sluiten" } },
      <MapPopup position={berlin} aria-label="Bezorging">
        Bij de deur
      </MapPopup>,
    );

    await expect
      .element(page.getByRole("button", { name: "Sluiten" }))
      .toBeVisible();
  });
});

describe.skipIf(!webgl)("a marker that can be moved", () => {
  test("the arrow keys move it, tell the app where, and leave the map be", async () => {
    const onPositionChange = vi.fn();
    const { map } = await mount(
      {},
      <MapMarker
        position={berlin}
        label="Delivery point"
        draggable
        onPositionChange={onPositionChange}
      />,
    );
    const before = rect(marker("Delivery point")).left;
    marker("Delivery point").focus();

    await userEvent.keyboard("{ArrowRight}");

    expect(onPositionChange).toHaveBeenCalledTimes(1);
    const [lng, lat] = (onPositionChange.mock.calls[0] ?? [])[0] as MapLngLat;
    expect(lng).toBeGreaterThan(berlin[0]);
    expect(lat).toBeCloseTo(berlin[1], 4);
    await expect
      .poll(() => Math.round(rect(marker("Delivery point")).left - before))
      .toBe(10);
    expect(map.getCenter().lng).toBeCloseTo(berlin[0], 6);
  });

  test("with Shift a key moves it five times as far", async () => {
    await mount(
      {},
      <MapMarker position={berlin} label="Delivery point" draggable />,
    );
    const before = rect(marker("Delivery point")).top;
    marker("Delivery point").focus();

    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");

    await expect
      .poll(() => Math.round(rect(marker("Delivery point")).top - before))
      .toBe(50);
  });

  test("it's a button that says it can be moved, and one that can't doesn't take the keys", async () => {
    const onPositionChange = vi.fn();
    await mount(
      {},
      <>
        <MapMarker position={berlin} label="Delivery point" draggable />
        <MapMarker
          position={[berlin[0] + 0.1, berlin[1]]}
          label="Depot"
          onClick={() => {}}
          onPositionChange={onPositionChange}
        />
      </>,
    );

    expect(marker("Delivery point").tagName).toBe("BUTTON");
    expect(marker("Delivery point").hasAttribute("data-draggable")).toBe(true);
    marker("Depot").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onPositionChange).not.toHaveBeenCalled();
  });
});

describe.skipIf(!webgl)("controls", () => {
  test("by default they're the two zoom buttons, in the top corner at the end", async () => {
    await mount({}, <MapControls />);
    const controls = document.querySelector(".nuv-map__controls") as Element;

    expect(controls.classList.contains("nuv-map__controls--top-end")).toBe(
      true,
    );
    expect(
      [...controls.querySelectorAll("button")].map((button) =>
        button.getAttribute("aria-label"),
      ),
    ).toEqual(["Zoom in", "Zoom out"]);
    expect(rect(controls).right).toBeLessThanOrEqual(rect(root()).right);
    expect(rect(controls).left).toBeGreaterThan(
      rect(root()).left + rect(root()).width / 2,
    );
  });

  test("the zoom buttons zoom the map", async () => {
    const { map } = await mount({}, <MapControls />);

    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect.poll(() => map.getZoom()).toBeCloseTo(11, 3);

    await page.getByRole("button", { name: "Zoom out" }).click();
    await expect.poll(() => map.getZoom()).toBeCloseTo(10, 3);
  });

  test("a zoom button is disabled when there's no further to go", async () => {
    const { map } = await mount(
      { defaultZoom: 5, minZoom: 5, maxZoom: 6 },
      <MapControls />,
    );
    await expect
      .element(page.getByRole("button", { name: "Zoom out" }))
      .toBeDisabled();

    map.jumpTo({ zoom: 6 });

    await expect
      .element(page.getByRole("button", { name: "Zoom in" }))
      .toBeDisabled();
    await expect
      .element(page.getByRole("button", { name: "Zoom out" }))
      .toBeEnabled();
  });

  test("the compass turns north back up", async () => {
    const { map } = await mount({}, <MapControls compass />);
    map.jumpTo({ bearing: 90 });
    await expect.poll(() => Math.round(map.getBearing())).toBe(90);

    await page.getByRole("button", { name: "Turn north up" }).click();

    await expect.poll(() => Math.round(map.getBearing())).toBe(0);
  });

  test("locate goes to where the browser says the reader is, marks it and tells the app", async () => {
    const onLocate = vi.fn();
    vi.spyOn(navigator.geolocation, "getCurrentPosition").mockImplementation(
      (found) =>
        found({
          coords: { longitude: paris[0], latitude: paris[1] },
        } as GeolocationPosition),
    );
    const { map } = await mount({}, <MapControls locate onLocate={onLocate} />);

    await page.getByRole("button", { name: "Go to my location" }).click();

    expect(onLocate).toHaveBeenCalledWith(paris);
    await expect.poll(() => map.getCenter().lng).toBeCloseTo(paris[0], 3);
    expect(map.getZoom()).toBeGreaterThanOrEqual(14);
    await expect
      .element(page.getByRole("img", { name: "Your location" }))
      .toBeVisible();
  });

  test("when the browser won't say, that's said", async () => {
    vi.spyOn(navigator.geolocation, "getCurrentPosition").mockImplementation(
      (_found, failed) => failed?.({ code: 1 } as GeolocationPositionError),
    );
    await mount({}, <MapControls locate />);

    await page.getByRole("button", { name: "Go to my location" }).click();

    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("Your location isn't available");
  });

  test("the fullscreen button is there where the browser can fill the screen", async () => {
    await mount({}, <MapControls fullscreen />);

    await expect
      .poll(
        () =>
          page.getByRole("button", { name: "Fill the screen" }).elements()
            .length,
      )
      .toBe(document.fullscreenEnabled ? 1 : 0);
  });

  test("zoom={false} leaves the zoom buttons out, and children are buttons of yours", async () => {
    await mount(
      {},
      <MapControls zoom={false} position="bottom-start">
        <button type="button">Layers</button>
      </MapControls>,
    );
    const controls = document.querySelector(".nuv-map__controls") as Element;

    expect(
      [...controls.querySelectorAll("button")].map(
        (button) => button.textContent,
      ),
    ).toEqual(["Layers"]);
    expect(controls.classList.contains("nuv-map__controls--bottom-start")).toBe(
      true,
    );
    expect(rect(controls).bottom).toBeLessThanOrEqual(rect(root()).bottom);
  });

  test("the buttons' names are yours to give", async () => {
    await mount(
      { labels: { zoomIn: "Inzoomen", zoomOut: "Uitzoomen" } },
      <MapControls />,
    );

    await expect
      .element(page.getByRole("button", { name: "Inzoomen" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Uitzoomen" }))
      .toBeVisible();
  });

  test("it takes a ref and a class", async () => {
    const ref = createRef<HTMLDivElement>();
    await mount({}, <MapControls ref={ref} className="mine" />);

    expect(ref.current).toBe(document.querySelector(".nuv-map__controls"));
    expect(ref.current?.classList.contains("mine")).toBe(true);
  });
});

describe.skipIf(!webgl)("the keys", () => {
  test("the map is a stop for the Tab key, then its markers, then its buttons", async () => {
    await mount(
      {},
      <>
        <MapMarker position={berlin} label="Berlin office" popup="Open" />
        <MapControls />
      </>,
    );
    canvas().focus();

    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(marker("Berlin office"));

    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Zoom in");
  });

  test("the arrow keys move the map, and the key with plus on it zooms it", async () => {
    const { map } = await mount();
    canvas().focus();

    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => map.getCenter().lng).toBeGreaterThan(berlin[0]);

    await userEvent.keyboard("=");
    await expect.poll(() => map.getZoom()).toBeGreaterThan(10);
  });

  test("the map shows a ring when the keys are on it", async () => {
    await mount({}, <MapControls />);
    (document.querySelector(".nuv-map__control") as HTMLElement).focus();

    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");

    expect(document.activeElement).toBe(canvas());
    expect(style(canvas()).outlineStyle).toBe("solid");
  });
});

describe.skipIf(!webgl)("styles", () => {
  test("it's as wide as the room it's given and 24rem tall, with the map filling it", async () => {
    await render(
      <div style={{ inlineSize: 500 }}>
        <MapView mapStyle={blank} />
      </div>,
    );
    await expect
      .poll(() => root().dataset.state, { timeout: 20_000 })
      .toBe("ready");

    expect(rect(root()).width).toBe(500);
    expect(rect(root()).height).toBe(384);
    await expect
      .poll(() => Math.round(rect(canvas()).width))
      .toBe(Math.round(root().clientWidth));
    expect(Math.round(rect(canvas()).height)).toBe(root().clientHeight);
  });

  test("the map follows the box when the box changes size", async () => {
    const { screen, map } = await mount({ style: { blockSize: 300 } });
    expect(Math.round(rect(canvas()).height)).toBe(root().clientHeight);

    await screen.rerender(
      <MapView
        mapStyle={blank}
        aria-label="Offices"
        style={{ blockSize: 500 }}
      />,
    );

    await expect
      .poll(() => Math.round(rect(canvas()).height))
      .toBe(root().clientHeight);
    expect(map.getContainer().clientHeight).toBe(root().clientHeight);
  });

  test("component variables change the size and the colors", async () => {
    await mount(
      {
        style: {
          "--nuv-map-height": "300px",
          "--nuv-map-radius": "2px",
          "--nuv-map-border": "rgb(1, 2, 3)",
          "--nuv-map-marker-bg": "rgb(10, 20, 30)",
          "--nuv-map-popup-bg": "rgb(40, 50, 60)",
          "--nuv-map-popup-fg": "rgb(240, 250, 255)",
          "--nuv-map-popup-width": "200px",
        } as never,
      },
      <MapMarker
        position={berlin}
        label="Berlin office"
        defaultOpen
        popup="A long line of text that would be wider than two hundred pixels if it were let"
      />,
    );
    await expect.element(dialog("Berlin office")).toBeVisible();

    expect(rect(root()).height).toBe(300);
    expect(style(root()).borderTopLeftRadius).toBe("2px");
    expect(style(root()).borderTopColor).toBe("rgb(1, 2, 3)");
    expect(style(marker("Berlin office")).color).toBe("rgb(10, 20, 30)");
    expect(
      style(document.querySelector(".maplibregl-popup-content") as Element)
        .backgroundColor,
    ).toBe("rgb(40, 50, 60)");
    expect(style(dialog("Berlin office").element()).color).toBe(
      "rgb(240, 250, 255)",
    );
    expect(rect(dialog("Berlin office").element()).width).toBeLessThanOrEqual(
      200,
    );
  });

  test("with a mouse a control is a square of the small control size", async () => {
    await mount({}, <MapControls />);
    const button = rect(document.querySelector(".nuv-map__control") as Element);

    expect(button.width).toBe(button.height);
    expect(button.height).toBeLessThan(44);
  });

  test("the popup's tip points at the marker", async () => {
    await mount(
      {},
      <MapMarker
        position={berlin}
        label="Berlin office"
        defaultOpen
        popup="Open"
      />,
    );
    await expect.element(dialog("Berlin office")).toBeVisible();
    const tip = document.querySelector(".maplibregl-popup-tip") as Element;
    const pin = rect(marker("Berlin office"));
    // The popup is drawn once the marker has been measured, so it's never
    // over the pin, not even to begin with.
    expect(rect(tip).bottom).toBeLessThanOrEqual(pin.top + 1);

    await expect
      .poll(() =>
        Math.abs(
          rect(tip).left + rect(tip).width / 2 - (pin.left + pin.width / 2),
        ),
      )
      .toBeLessThan(2);
    await expect.poll(() => rect(tip).bottom).toBeLessThanOrEqual(pin.top + 1);
  });
});

describe.skipIf(!webgl)("cooperative gestures", () => {
  test("the words that say how to move the map are yours to give, and aren't seen until they're needed", async () => {
    await mount({
      cooperativeGestures: true,
      labels: { gestureMac: "Mac words", gestureOther: "Other words" },
    });
    const screen = document.querySelector(
      ".maplibregl-cooperative-gesture-screen",
    ) as Element;

    expect(screen.textContent).toMatch(/Mac words|Other words/);
    expect(style(screen).opacity).toBe("0");
    expect(style(screen).pointerEvents).toBe("none");
  });
});

describe.skipIf(!webgl)("forced colors", () => {
  test("the pin is drawn in the system's colors", async () => {
    await emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await mount({}, <MapMarker position={berlin} label="Berlin office" />);
    const body = document.querySelector(".nuv-map__pin-body") as Element;
    const dot = document.querySelector(".nuv-map__pin-dot") as Element;

    expect(style(body).fill).not.toBe(style(dot).fill);
  });
});

describe.skipIf(!webgl).each(themes)("accessibility in %s", (theme) => {
  test("passes axe with markers, an open popup and every control", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const onLoad = vi.fn();
    const { container } = await renderThemed(
      theme,
      <MapView
        mapStyle={credited}
        aria-label="Offices"
        defaultCenter={berlin}
        defaultZoom={10}
        onLoad={onLoad}
      >
        <MapMarker
          position={berlin}
          label="Berlin office"
          defaultOpen
          popup={<a href="#berlin">Friedrichstraße 68</a>}
        />
        <MapMarker position={[berlin[0] + 0.2, berlin[1]]} label="Depot" />
        <MapControls compass locate fullscreen />
      </MapView>,
    );
    await expect
      .poll(() => onLoad.mock.calls.length, { timeout: 20_000 })
      .toBe(1);
    await expect.element(dialog("Berlin office")).toBeVisible();

    expect(await axe(container)).toHaveNoViolations();
  });

  test("passes axe while it's loading", async () => {
    const { container } = await renderThemed(
      theme,
      <MapView mapStyle={blank} aria-label="Offices" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

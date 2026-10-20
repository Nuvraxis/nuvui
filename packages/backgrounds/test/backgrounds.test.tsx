import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import type { ComponentType, CSSProperties, ReactNode, Ref } from "react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  FireworksBackground,
  GlyphBackground,
  GradientBackground,
  GridBackground,
  HexagonBackground,
  HoleBackground,
  StarsBackground,
  TopographyBackground,
} from "../src";

interface CanvasProps {
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  scrim?: "none" | "soft" | "strong";
  paused?: boolean;
  interactive?: boolean;
}

// Every background drawn on a canvas, with the variable that colors what it
// draws, and whether a press shows on it while it's paused.
const canvases: {
  name: string;
  block: string;
  Component: ComponentType<CanvasProps>;
  colors: string[];
  pressShows: boolean;
}[] = [
  {
    name: "StarsBackground",
    block: "nuv-stars-background",
    Component: StarsBackground,
    colors: ["--nuv-stars-background-color"],
    pressShows: false,
  },
  {
    name: "TopographyBackground",
    block: "nuv-topography-background",
    Component: TopographyBackground,
    colors: ["--nuv-topography-background-color"],
    pressShows: true,
  },
  {
    name: "HexagonBackground",
    block: "nuv-hexagon-background",
    Component: HexagonBackground,
    colors: ["--nuv-hexagon-background-color", "--nuv-hexagon-background-glow"],
    pressShows: true,
  },
  {
    name: "FireworksBackground",
    block: "nuv-fireworks-background",
    Component: FireworksBackground,
    colors: [1, 2, 3, 4, 5].map((n) => `--nuv-fireworks-background-color-${n}`),
    pressShows: true,
  },
  {
    name: "HoleBackground",
    block: "nuv-hole-background",
    Component: HoleBackground,
    colors: ["--nuv-hole-background-color", "--nuv-hole-background-glow"],
    pressShows: false,
  },
  {
    name: "GlyphBackground",
    block: "nuv-glyph-background",
    Component: GlyphBackground,
    colors: ["--nuv-glyph-background-color", "--nuv-glyph-background-glow"],
    pressShows: true,
  },
];

const box: CSSProperties = { inlineSize: 400, blockSize: 300 };
const root = () => document.querySelector(".nuv-background") as HTMLElement;
const canvas = () =>
  document.querySelector(".nuv-background__canvas") as HTMLCanvasElement;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const picture = () => canvas().toDataURL();

// The red, green and blue of any CSS color, as the browser draws it.
function rgbOf(color: string): [number, number, number] {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d") as CanvasRenderingContext2D;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

const luminance = ([r, g, b]: [number, number, number]) => {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const contrast = (a: [number, number, number], b: [number, number, number]) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
};

// Whether any pixel of the canvas has something on it.
function anythingDrawn() {
  const context = canvas().getContext("2d") as CanvasRenderingContext2D;
  const { data } = context.getImageData(0, 0, canvas().width, canvas().height);
  for (let index = 3; index < data.length; index += 4) {
    if ((data[index] ?? 0) > 0) return true;
  }
  return false;
}

afterEach(async () => {
  await emulateMedia({ reducedMotion: null, forcedColors: null });
});

describe.each(canvases)("$name", ({ block, Component, colors, pressShows }) => {
  test("draws under what's laid on it, hidden from screen readers", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Component style={box} ref={ref}>
        <h1>Ship faster</h1>
      </Component>,
    );

    await expect
      .element(page.getByRole("heading", { name: "Ship faster" }))
      .toBeVisible();
    expect(root().classList).toContain(block);
    expect(ref.current).toBe(root());
    expect(canvas().closest("[aria-hidden='true']")).not.toBeNull();
    await expect.poll(anythingDrawn).toBe(true);
  });

  test("the server sends what's laid on it, and no style attribute", () => {
    const html = renderToString(
      <Component>
        <h1>Ship faster</h1>
      </Component>,
    );

    expect(html).toContain("<h1>Ship faster</h1>");
    expect(html).toContain('class="nuv-background__canvas"');
    expect(html).not.toMatch(/style="/);
  });

  test("draws in the colors its variables give", async () => {
    const red = Object.fromEntries(
      colors.map((name) => [name, "rgb(255, 0, 0)"]),
    );
    await render(<Component style={{ ...box, ...red }} />);
    await expect.poll(anythingDrawn).toBe(true);

    const context = canvas().getContext("2d") as CanvasRenderingContext2D;
    const { data } = context.getImageData(
      0,
      0,
      canvas().width,
      canvas().height,
    );
    for (let index = 0; index < data.length; index += 4) {
      if ((data[index + 3] ?? 0) === 0) continue;
      expect([data[index + 1], data[index + 2]]).toEqual([0, 0]);
    }
  });

  test("moves while it plays, and holds still while it's paused", async () => {
    const { rerender } = await render(<Component style={box} />);
    await expect.poll(anythingDrawn).toBe(true);
    const first = picture();
    await expect.poll(picture, { timeout: 3000 }).not.toBe(first);

    await rerender(<Component style={box} paused />);
    await wait(50);
    const held = picture();
    await wait(300);
    expect(picture()).toBe(held);
  });

  test("for less motion it's a finished frame that holds still", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Component style={box} />);
    await expect.poll(anythingDrawn).toBe(true);

    const held = picture();
    await wait(300);
    expect(picture()).toBe(held);
  });

  test("where the browser forces its colors, it's the system's background alone", async ({
    skip,
  }) => {
    await emulateMedia({ forcedColors: "active" });
    if (!matchMedia("(forced-colors: active)").matches) {
      skip("this browser doesn't report forced colors");
    }
    await render(<Component style={box} scrim="soft" />);

    const layer = canvas().parentElement as HTMLElement;
    expect(getComputedStyle(layer).display).toBe("none");
    const scrim = document.querySelector(".nuv-background__scrim") as Element;
    expect(getComputedStyle(scrim).display).toBe("none");
  });

  test.runIf(pressShows)(
    "a press on it shows, and a press on a button laid on it doesn't",
    async () => {
      await render(
        <Component style={box} paused>
          <button type="button">Start</button>
        </Component>,
      );
      await expect.poll(anythingDrawn).toBe(true);
      const before = picture();

      await page.getByRole("button", { name: "Start" }).click();
      await wait(50);
      expect(picture()).toBe(before);

      await page.elementLocator(root()).click({ position: { x: 300, y: 250 } });
      await expect.poll(picture).not.toBe(before);
    },
  );

  test("with interactive off, a press does nothing", async () => {
    await render(<Component style={box} paused interactive={false} />);
    await expect.poll(anythingDrawn).toBe(true);
    const before = picture();

    await page.elementLocator(root()).click({ position: { x: 300, y: 250 } });
    await wait(50);
    expect(picture()).toBe(before);
  });

  test.for(themes)(
    "with a strong scrim, body text reads at 4.5:1 over any part of it in %s",
    async (theme) => {
      await renderThemed(
        theme,
        <Component style={box} scrim="strong" paused>
          <p>Text</p>
        </Component>,
      );
      await expect.poll(anythingDrawn).toBe(true);

      const style = getComputedStyle(root());
      const under = rgbOf(style.backgroundColor);
      const text = rgbOf(style.color);
      const context = canvas().getContext("2d") as CanvasRenderingContext2D;
      const { data } = context.getImageData(
        0,
        0,
        canvas().width,
        canvas().height,
      );
      let worst = Number.POSITIVE_INFINITY;
      for (let index = 0; index < data.length; index += 4) {
        const alpha = (data[index + 3] ?? 0) / 255;
        if (alpha === 0) continue;
        // The pixel over the background's color, then the scrim, 80% of
        // that color, over both.
        const pixel = [0, 1, 2].map((channel) => {
          const drawn =
            alpha * (data[index + channel] ?? 0) +
            (1 - alpha) * (under[channel] ?? 0);
          return 0.8 * (under[channel] ?? 0) + 0.2 * drawn;
        }) as [number, number, number];
        worst = Math.min(worst, contrast(pixel, text));
      }
      expect(worst).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe("GradientBackground", () => {
  test("is drawn in CSS, with no script, and in a server component's HTML whole", () => {
    const html = renderToString(
      <GradientBackground scrim="soft">
        <h1>Ship faster</h1>
      </GradientBackground>,
    );

    expect(html).toContain("<h1>Ship faster</h1>");
    expect(html.match(/nuv-gradient-background__field/g)).toHaveLength(3);
    expect(html).toContain('data-scrim="soft"');
    expect(html).not.toContain("<canvas");
    expect(html).not.toMatch(/style="/);
  });

  test("drifts, stops where it is when paused, and holds still for less motion", async () => {
    const field = () =>
      document.querySelector(".nuv-gradient-background__field") as Element;
    const { rerender } = await render(<GradientBackground style={box} />);
    expect(getComputedStyle(field()).animationName).toBe(
      "nuv-gradient-background-drift",
    );
    expect(getComputedStyle(field()).animationPlayState).toBe("running");

    await rerender(<GradientBackground style={box} paused />);
    expect(getComputedStyle(field()).animationPlayState).toBe("paused");

    await emulateMedia({ reducedMotion: "reduce" });
    expect(getComputedStyle(field()).animationName).toBe("none");
  });

  test("takes its colors from the variables", async () => {
    await render(
      <GradientBackground
        style={{
          ...box,
          ["--nuv-gradient-background-color-1" as string]: "rgb(1, 2, 3)",
        }}
      />,
    );
    const field = document.querySelector(
      ".nuv-gradient-background__field",
    ) as Element;

    expect(getComputedStyle(field).backgroundImage).toContain("rgb(1, 2, 3)");
  });
});

describe("GridBackground", () => {
  const lit = () =>
    document.querySelector(
      ".nuv-grid-background__pattern--lit",
    ) as HTMLElement | null;

  test("draws lines or dots, faded at the edges unless asked not to", async () => {
    const pattern = () =>
      document.querySelector(".nuv-grid-background__pattern") as Element;
    const { rerender } = await render(<GridBackground style={box} />);
    expect(getComputedStyle(pattern()).backgroundImage).toContain(
      "linear-gradient",
    );
    expect(getComputedStyle(pattern()).maskImage).toContain("radial-gradient");

    await rerender(<GridBackground style={box} variant="dots" fade={false} />);
    expect(getComputedStyle(pattern()).backgroundImage).toContain(
      "radial-gradient",
    );
    expect(getComputedStyle(pattern()).maskImage).toBe("none");
  });

  test("lights up under the pointer, and goes dark when it leaves", async () => {
    await render(
      <GridBackground style={box}>
        <h1>Ship faster</h1>
      </GridBackground>,
    );
    expect(root().hasAttribute("data-lit")).toBe(false);

    await page.getByRole("heading").hover();
    await expect.poll(() => root().hasAttribute("data-lit")).toBe(true);
    expect(root().style.getPropertyValue("--nuv-background-x")).toMatch(/px$/);
    await expect
      .poll(() => getComputedStyle(lit() as Element).opacity)
      .toBe("1");

    root().dispatchEvent(new PointerEvent("pointerleave"));
    await expect.poll(() => root().hasAttribute("data-lit")).toBe(false);
  });

  test("with interactive off, there's no light", async () => {
    await render(<GridBackground style={box} interactive={false} />);
    root().dispatchEvent(
      new PointerEvent("pointermove", { clientX: 10, clientY: 10 }),
    );
    await wait(50);

    expect(lit()).toBeNull();
    expect(root().hasAttribute("data-lit")).toBe(false);
  });

  test("the server sends the grid whole, with no style attribute", () => {
    const html = renderToString(<GridBackground>Text</GridBackground>);

    expect(html).toContain('data-variant="lines"');
    expect(html).not.toMatch(/style="/);
  });
});

describe("accessibility", () => {
  const all: [string, ComponentType<CanvasProps>][] = [
    ["GradientBackground", GradientBackground],
    ["GridBackground", GridBackground],
    ...canvases.map(
      ({ name, Component }) => [name, Component] as [string, typeof Component],
    ),
  ];

  for (const [name, Component] of all) {
    test.for(themes)(`${name} with a scrim passes axe in %s`, async (theme) => {
      const { container } = await renderThemed(
        theme,
        <Component style={box} scrim="strong">
          <h1>Ship faster</h1>
          <p>Everything your team needs.</p>
        </Component>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  }
});

// Drawn in CSS, so read from the colors the browser worked out: a field's
// middle, or a lit line, under the scrim's four fifths of the background.
describe("a strong scrim over the backgrounds drawn in CSS", () => {
  // The first color in a gradient as the browser writes it out.
  const firstColor = (image: string) =>
    /gradient\((?:[^,]*?,\s*)?((?:rgba?|oklch|oklab|lab|lch|color|hsla?)\([^)]*\))/.exec(
      image,
    )?.[1] ?? "";

  function worst(colors: [number, number, number][]) {
    const style = getComputedStyle(root());
    const under = rgbOf(style.backgroundColor);
    const text = rgbOf(style.color);
    return Math.min(
      ...colors.map((color) => {
        const pixel = [0, 1, 2].map(
          (channel) =>
            0.8 * (under[channel] ?? 0) + 0.2 * (color[channel] ?? 0),
        ) as [number, number, number];
        return contrast(pixel, text);
      }),
    );
  }

  test.for(themes)(
    "GradientBackground keeps body text at 4.5:1 in %s",
    async (theme) => {
      await renderThemed(
        theme,
        <GradientBackground style={box} scrim="strong" paused>
          <p>Text</p>
        </GradientBackground>,
      );
      const under = rgbOf(getComputedStyle(root()).backgroundColor);
      const fields = Array.from(
        document.querySelectorAll(".nuv-gradient-background__field"),
      ).map((field) => {
        const style = getComputedStyle(field);
        const color = rgbOf(firstColor(style.backgroundImage));
        const opacity = Number(style.opacity);
        return [0, 1, 2].map(
          (channel) =>
            opacity * (color[channel] ?? 0) +
            (1 - opacity) * (under[channel] ?? 0),
        ) as [number, number, number];
      });

      expect(fields).toHaveLength(3);
      expect(worst(fields)).toBeGreaterThanOrEqual(4.5);
    },
  );

  test.for(themes)(
    "GridBackground keeps body text at 4.5:1 in %s",
    async (theme) => {
      await renderThemed(
        theme,
        <GridBackground style={box} scrim="strong">
          <p>Text</p>
        </GridBackground>,
      );
      const lines = Array.from(
        document.querySelectorAll(".nuv-grid-background__pattern"),
      ).map((pattern) =>
        rgbOf(firstColor(getComputedStyle(pattern).backgroundImage)),
      );

      expect(lines).toHaveLength(2);
      expect(worst(lines)).toBeGreaterThanOrEqual(4.5);
    },
  );
});

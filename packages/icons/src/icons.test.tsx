import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { type ComponentType, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import manifest from "../manifest.json";
import * as standard from ".";
import { ArrowRightIcon, createIcon, type IconProps } from ".";
import { componentName } from "./names";
import * as rounded from "./rounded";
import * as sharp from "./sharp";
import { type IconStyle, iconStyles } from "./strokes";

const entries: Record<IconStyle, Record<string, unknown>> = {
  rounded,
  standard,
  sharp,
};

// The icons an entry exports. createIcon also ends in Icon, and starts
// with a small letter.
const iconsOf = (style: IconStyle) =>
  Object.entries(entries[style])
    .filter(([name]) => /^[A-Z]\w*Icon$/.test(name))
    .sort(([a], [b]) => a.localeCompare(b)) as [
    string,
    ComponentType<IconProps>,
  ][];

const svgs = () => [...document.querySelectorAll("svg")];

describe("the set", () => {
  test("the manifest names each icon once, and its component the one way", () => {
    const names = manifest.icons.map((icon) => icon.name);
    expect(new Set(names).size).toBe(names.length);
    for (const icon of manifest.icons) {
      expect(icon.component).toBe(componentName(icon.name));
      expect(icon.category).not.toBe("");
    }
    expect(manifest.styles).toEqual([...iconStyles]);
  });

  test.for(iconStyles)(
    "the %s entry has every icon in the manifest, and no other",
    (style) => {
      expect(iconsOf(style).map(([name]) => name)).toEqual(
        manifest.icons.map((icon) => icon.component).sort(),
      );
    },
  );

  test.for(iconStyles)(
    "every %s icon draws something on the 24 grid, in the color of the text and no other",
    async (style) => {
      const icons = iconsOf(style);
      await render(
        <div style={{ color: "rgb(10, 120, 40)" }}>
          {icons.map(([name, Icon]) => (
            <Icon key={name} data-name={name} />
          ))}
        </div>,
      );

      expect(svgs()).toHaveLength(icons.length);
      for (const svg of svgs()) {
        const name = svg.dataset.name;
        expect(svg.getAttribute("viewBox"), name).toBe("0 0 24 24");
        expect(svg.getAttribute("width"), name).toBe("24");
        expect(svg.getAttribute("fill"), name).toBe("none");
        expect(svg.getAttribute("stroke"), name).toBe("currentColor");
        // No color is written into an icon, so nothing can disagree with
        // the text it sits in.
        expect(svg.outerHTML, name).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);

        const shapes = [...svg.children] as SVGGraphicsElement[];
        expect(shapes.length, name).toBeGreaterThan(0);
        for (const shape of shapes) {
          expect(getComputedStyle(shape).stroke, name).toBe("rgb(10, 120, 40)");
        }
        const box = svg.getBBox();
        expect(box.width + box.height, name).toBeGreaterThan(0);
        // Inside the grid, with the line's half width to spare.
        expect(box.x, name).toBeGreaterThanOrEqual(0);
        expect(box.y, name).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, name).toBeLessThanOrEqual(24);
        expect(box.y + box.height, name).toBeLessThanOrEqual(24);
      }
    },
  );

  test("each style ends and joins its lines its own way", async () => {
    await render(
      <>
        <rounded.ArrowRightIcon data-style="rounded" />
        <standard.ArrowRightIcon data-style="standard" />
        <sharp.ArrowRightIcon data-style="sharp" />
      </>,
    );
    const drawn = (style: IconStyle) => {
      const path = document.querySelector(`[data-style="${style}"] > *`);
      if (!path) throw new Error(`no ${style} icon`);
      const { strokeLinecap, strokeLinejoin } = getComputedStyle(path);
      return [strokeLinecap, strokeLinejoin];
    };

    expect(drawn("rounded")).toEqual(["round", "round"]);
    expect(drawn("standard")).toEqual(["round", "round"]);
    expect(drawn("sharp")).toEqual(["square", "miter"]);
  });

  test("each icon is named for what it is, in React's tools", () => {
    for (const style of iconStyles) {
      for (const [name, Icon] of iconsOf(style)) {
        expect((Icon as { displayName?: string }).displayName).toBe(name);
      }
    }
  });
});

describe("props", () => {
  test("size sets the width and the height, and strokeWidth the line", async () => {
    await render(
      <>
        <ArrowRightIcon size={16} strokeWidth={2} data-testid="small" />
        <span style={{ fontSize: 20 }}>
          <ArrowRightIcon size="1em" data-testid="em" />
        </span>
      </>,
    );
    const small = document.querySelector<SVGSVGElement>(
      '[data-testid="small"]',
    );
    const em = document.querySelector<SVGSVGElement>('[data-testid="em"]');

    expect(small?.getBoundingClientRect().width).toBe(16);
    expect(small?.getBoundingClientRect().height).toBe(16);
    expect(small?.getAttribute("stroke-width")).toBe("2");
    expect(em?.getBoundingClientRect().width).toBe(20);
  });

  test("the line is 1.5 on the grid unless it's changed", async () => {
    await render(<ArrowRightIcon />);
    expect(svgs()[0]?.getAttribute("stroke-width")).toBe("1.5");
  });

  test("what an svg takes is passed on, and the ref is the svg", async () => {
    const ref = createRef<SVGSVGElement>();
    let clicked = 0;
    await render(
      <ArrowRightIcon
        ref={ref}
        className="next"
        data-testid="icon"
        onClick={() => {
          clicked += 1;
        }}
      />,
    );

    expect(ref.current).toBeInstanceOf(SVGSVGElement);
    expect(ref.current?.getAttribute("class")).toBe("next");
    ref.current?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(clicked).toBe(1);
  });
});

describe("screen readers", () => {
  test("an icon with no name is hidden, as one beside its own words should be", async () => {
    await render(<ArrowRightIcon />);
    const svg = svgs()[0];

    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.hasAttribute("role")).toBe(false);
    expect(svg?.querySelector("title")).toBeNull();
  });

  test("title names it, as a picture", async () => {
    await render(<ArrowRightIcon title="Next page" />);
    const svg = svgs()[0];

    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.hasAttribute("aria-hidden")).toBe(false);
    expect(svg?.querySelector("title")?.textContent).toBe("Next page");
  });

  test("a name given with aria-label does the same", async () => {
    await render(<ArrowRightIcon aria-label="Next page" />);
    const svg = svgs()[0];

    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.hasAttribute("aria-hidden")).toBe(false);
  });

  test("passes axe beside words, on its own, and named", async () => {
    const { container } = await render(
      <main>
        <button type="button">
          Next <ArrowRightIcon />
        </button>
        <button type="button">
          <ArrowRightIcon title="Next page" />
        </button>
        <ArrowRightIcon aria-label="Moves on" />
      </main>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("where it's drawn", () => {
  test("where the browser forces colors, the line follows the forced text color", async () => {
    await emulateMedia({ forcedColors: "active" });
    await render(
      <p style={{ color: "rgb(200, 0, 0)" }}>
        <ArrowRightIcon />
      </p>,
    );
    const svg = svgs()[0];
    const path = svg?.firstElementChild;
    if (!svg || !path) throw new Error("no icon");

    expect(getComputedStyle(path).stroke).toBe(getComputedStyle(svg).color);
  });

  test("it renders on a server as markup, with nothing to run in a browser", () => {
    const html = renderToStaticMarkup(<ArrowRightIcon title="Next page" />);

    expect(html).toMatch(/^<svg [^>]*role="img"/);
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain("<title>Next page</title>");
  });
});

describe("createIcon", () => {
  test("draws an icon of your own the way the set's are drawn", async () => {
    const FrameIcon = createIcon("FrameIcon", "sharp", [
      ["rect", { x: "4", y: "4", width: "16", height: "16" }],
    ]);
    await render(<FrameIcon title="Frame" />);
    const svg = svgs()[0];

    expect(FrameIcon.displayName).toBe("FrameIcon");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg?.getAttribute("stroke-linecap")).toBe("square");
    expect(svg?.querySelector("rect")?.getAttribute("width")).toBe("16");
  });
});

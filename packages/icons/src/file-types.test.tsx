import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { type ComponentType, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import manifest from "../manifest.json";
import * as fileTypes from "./file-types";
import { type FileTypeIconProps, JsFileIcon, TsFileIcon } from "./file-types";
import { fileTypeComponentName } from "./names";

// The order a plain sort() gives, as the set's tests have it, the same on
// Windows and on Linux.
const icons = Object.entries(fileTypes).sort(([a], [b]) =>
  a < b ? -1 : a > b ? 1 : 0,
) as [string, ComponentType<FileTypeIconProps>][];

const svgs = () => [...document.querySelectorAll("svg")];

describe("the file types", () => {
  test("the manifest names each once, and its component the one way", () => {
    const names = manifest.fileTypes.map((icon) => icon.name);
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
    for (const icon of manifest.fileTypes) {
      expect(icon.component).toBe(fileTypeComponentName(icon.name));
      expect(icon.description).not.toBe("");
    }
  });

  test("their entry has every one in the manifest, and nothing else", () => {
    expect(icons.map(([name]) => name)).toEqual(
      manifest.fileTypes.map((icon) => icon.component).sort(),
    );
  });

  test("none has a name an icon of the set has", () => {
    const set = new Set(manifest.icons.map((icon) => icon.component));
    for (const icon of manifest.fileTypes) {
      expect(set.has(icon.component), icon.component).toBe(false);
    }
  });

  test("each draws on the 32 grid: the page in the color of the text, and a tag in colors of its own", async () => {
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
      expect(svg.getAttribute("viewBox"), name).toBe("0 0 32 32");
      expect(svg.getAttribute("width"), name).toBe("32");
      expect(svg.getAttribute("fill"), name).toBe("none");

      const shapes = [...svg.children] as SVGGraphicsElement[];
      const lines = shapes.filter(
        (shape) => getComputedStyle(shape).stroke !== "none",
      );
      const filled = shapes.filter(
        (shape) => getComputedStyle(shape).fill !== "none",
      );
      // The page's line is the only one, and it follows the text, so it's
      // seen on a dark page as well as a light one.
      expect(lines.length, name).toBeGreaterThan(0);
      for (const line of lines) {
        expect(getComputedStyle(line).stroke, name).toBe("rgb(10, 120, 40)");
      }
      // The tag and its label keep their own colors.
      expect(filled.length, name).toBeGreaterThanOrEqual(2);
      for (const shape of filled) {
        expect(getComputedStyle(shape).fill, name).not.toBe("rgb(10, 120, 40)");
      }

      const box = svg.getBBox();
      expect(box.x, name).toBeGreaterThanOrEqual(0);
      expect(box.y, name).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, name).toBeLessThanOrEqual(32);
      expect(box.y + box.height, name).toBeLessThanOrEqual(32);
    }
  });

  test("a light tag has a dark label, and a dark tag a white one", async () => {
    await render(
      <>
        <JsFileIcon data-name="js" />
        <TsFileIcon data-name="ts" />
      </>,
    );
    const label = (name: string) => {
      const shapes = document.querySelectorAll(`[data-name="${name}"] > *`);
      const last = shapes[shapes.length - 1];
      if (!last) throw new Error(`no ${name} icon`);
      return getComputedStyle(last).fill;
    };

    expect(label("js")).toBe("rgb(17, 24, 39)");
    expect(label("ts")).toBe("rgb(255, 255, 255)");
  });

  test("each is named for what it is, in React's tools", () => {
    for (const [name, Icon] of icons) {
      expect((Icon as { displayName?: string }).displayName).toBe(name);
    }
  });
});

describe("props", () => {
  test("size sets the width and the height", async () => {
    await render(
      <>
        <TsFileIcon size={24} data-testid="small" />
        <span style={{ fontSize: 40 }}>
          <TsFileIcon size="1em" data-testid="em" />
        </span>
      </>,
    );
    const small = document.querySelector('[data-testid="small"]');
    const em = document.querySelector('[data-testid="em"]');

    expect(small?.getBoundingClientRect().width).toBe(24);
    expect(small?.getBoundingClientRect().height).toBe(24);
    expect(em?.getBoundingClientRect().width).toBe(40);
  });

  test("what an svg takes is passed on, and the ref is the svg", async () => {
    const ref = createRef<SVGSVGElement>();
    await render(<TsFileIcon ref={ref} className="tab-icon" />);

    expect(ref.current).toBeInstanceOf(SVGSVGElement);
    expect(ref.current?.getAttribute("class")).toBe("tab-icon");
  });
});

describe("screen readers", () => {
  test("one with no name is hidden, as one beside the file's name should be", async () => {
    await render(<TsFileIcon />);
    const svg = svgs()[0];

    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.hasAttribute("role")).toBe(false);
  });

  test("title names it as a picture, and aria-label does the same", async () => {
    await render(
      <>
        <TsFileIcon title="TypeScript file" data-testid="title" />
        <TsFileIcon aria-label="TypeScript file" data-testid="label" />
      </>,
    );
    const titled = document.querySelector('[data-testid="title"]');
    const labelled = document.querySelector('[data-testid="label"]');

    expect(titled?.getAttribute("role")).toBe("img");
    expect(titled?.getAttribute("aria-label")).toBe("TypeScript file");
    expect(titled?.querySelector("title")?.textContent).toBe("TypeScript file");
    expect(labelled?.getAttribute("role")).toBe("img");
    expect(labelled?.hasAttribute("aria-hidden")).toBe(false);
  });

  test("passes axe beside a file's name, and named on its own", async () => {
    const { container } = await render(
      <main>
        <ul>
          <li>
            <TsFileIcon /> button.tsx
          </li>
        </ul>
        <TsFileIcon title="TypeScript file" />
      </main>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("where it's drawn", () => {
  test("where the browser forces colors, the page follows the forced text color", async () => {
    await emulateMedia({ forcedColors: "active" });
    await render(
      <p style={{ color: "rgb(200, 0, 0)" }}>
        <TsFileIcon />
      </p>,
    );
    const svg = svgs()[0];
    const page = svg?.firstElementChild;
    if (!svg || !page) throw new Error("no icon");

    expect(getComputedStyle(page).stroke).toBe(getComputedStyle(svg).color);
  });

  test("it renders on a server as markup, with nothing to run in a browser", () => {
    const html = renderToStaticMarkup(<TsFileIcon title="TypeScript file" />);

    expect(html).toMatch(/^<svg [^>]*role="img"/);
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain("<title>TypeScript file</title>");
  });
});

import "../src/styles/index.scss";
import { createTheme, type PresetName, presets } from "@nuvui/theme";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Button } from "../src";
import { emulateMedia } from "./media";

// How a preset, data-theme and data-density combine. There's one test for
// each way they can sit on the same element or on different ones.

type Mode = "light" | "dark";
type Token = keyof ReturnType<typeof createTheme>["light"];

// What the browser makes of a color, so two ways of writing the same color
// compare equal.
function computed(color: string, inside: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = color;
  inside.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

const shown = (element: Element, token: string) =>
  computed(`var(${token})`, element);

const ofPreset = (
  name: PresetName,
  mode: Mode,
  token: Token = "--color-primary",
) => computed(createTheme(presets[name])[mode][token]);

const ofDefault = (mode: Mode, token: Token = "--color-primary") =>
  computed(createTheme()[mode][token]);

const root = document.documentElement;

describe("where the stylesheets are", () => {
  // The hard order: a preset that loads first has to beat the library's
  // :root rule by weight, because it can't beat it by coming later.
  test("the presets load before the library in these tests", () => {
    const presetSheet = document.querySelector("style[data-presets]");
    const sheets = [...document.querySelectorAll("style")];
    const library = sheets.find((sheet) =>
      sheet.textContent?.includes(".nuv-button"),
    );

    expect(presetSheet).not.toBe(null);
    expect(library).toBeDefined();
    expect(sheets.indexOf(presetSheet as HTMLStyleElement)).toBeLessThan(
      sheets.indexOf(library as HTMLStyleElement),
    );
  });

  test("a preset on <html> wins whichever loads first", () => {
    root.setAttribute("data-preset", "ink");
    expect(shown(root, "--color-primary")).toBe(ofPreset("ink", "light"));

    const presetSheet = document.querySelector("style[data-presets]");
    if (!presetSheet) throw new Error("the presets aren't loaded");
    const place = presetSheet.nextSibling;
    document.head.append(presetSheet);
    try {
      expect(shown(root, "--color-primary")).toBe(ofPreset("ink", "light"));
    } finally {
      document.head.insertBefore(presetSheet, place);
    }
  });
});

describe("a preset and a mode", () => {
  test("a preset with no data-theme is light", () => {
    root.setAttribute("data-preset", "ink");

    expect(shown(root, "--color-primary")).toBe(ofPreset("ink", "light"));
    expect(shown(root, "--color-background")).toBe(
      ofPreset("ink", "light", "--color-background"),
    );
  });

  test("a dark system setting alone doesn't make it dark", async () => {
    await emulateMedia({ colorScheme: "dark" });
    root.setAttribute("data-preset", "ink");

    expect(shown(root, "--color-primary")).toBe(ofPreset("ink", "light"));
  });

  test.each(["light", "dark"] as const)(
    "both on the same element, in %s",
    (mode) => {
      root.setAttribute("data-preset", "ember");
      root.setAttribute("data-theme", mode);

      expect(shown(root, "--color-primary")).toBe(ofPreset("ember", mode));
      expect(shown(root, "--color-background")).toBe(
        ofPreset("ember", mode, "--color-background"),
      );
    },
  );

  test("the preset on the page and the mode on a section", async () => {
    root.setAttribute("data-preset", "meadow");
    const screen = await render(
      <section data-theme="dark" data-testid="section" />,
    );
    const section = screen.getByTestId("section").element();

    expect(shown(root, "--color-primary")).toBe(ofPreset("meadow", "light"));
    expect(shown(section, "--color-primary")).toBe(ofPreset("meadow", "dark"));
    expect(shown(section, "--color-surface")).toBe(
      ofPreset("meadow", "dark", "--color-surface"),
    );
  });

  test("the mode on the page and the preset on a section", async () => {
    root.setAttribute("data-theme", "dark");
    const screen = await render(
      <section data-preset="ledger" data-testid="section" />,
    );
    const section = screen.getByTestId("section").element();

    expect(shown(root, "--color-primary")).toBe(ofDefault("dark"));
    expect(shown(section, "--color-primary")).toBe(ofPreset("ledger", "dark"));
  });

  test("the nearest mode wins, however deep the preset is", async () => {
    root.setAttribute("data-theme", "dark");
    const screen = await render(
      <div data-theme="light">
        <section data-preset="ink" data-testid="light">
          <div data-theme="dark">
            <div data-theme="light" data-testid="inner" />
          </div>
        </section>
      </div>,
    );

    for (const id of ["light", "inner"]) {
      const element = screen.getByTestId(id).element();
      expect(shown(element, "--color-primary")).toBe(ofPreset("ink", "light"));
    }
  });

  test("a section outside the preset keeps the default theme", async () => {
    root.setAttribute("data-theme", "dark");
    const screen = await render(
      <>
        <section data-preset="ink" />
        <section data-theme="light" data-testid="plain" />
      </>,
    );
    const plain = screen.getByTestId("plain").element();

    expect(shown(plain, "--color-primary")).toBe(ofDefault("light"));
    expect(shown(root, "--color-primary")).toBe(ofDefault("dark"));
  });

  test('data-theme="system" follows the system setting', async () => {
    root.setAttribute("data-preset", "ink");
    root.setAttribute("data-theme", "system");

    await emulateMedia({ colorScheme: "light" });
    expect(shown(root, "--color-primary")).toBe(ofPreset("ink", "light"));

    await emulateMedia({ colorScheme: "dark" });
    expect(shown(root, "--color-primary")).toBe(ofPreset("ink", "dark"));
  });

  test('a "system" section inside a dark preset goes back to the system setting', async () => {
    await emulateMedia({ colorScheme: "light" });
    root.setAttribute("data-preset", "ink");
    root.setAttribute("data-theme", "dark");
    const screen = await render(
      <section data-theme="system" data-testid="section" />,
    );

    expect(
      shown(screen.getByTestId("section").element(), "--color-primary"),
    ).toBe(ofPreset("ink", "light"));
  });
});

describe("a preset inside a preset", () => {
  test("the nearest preset wins, and a mode inside it applies to it", async () => {
    root.setAttribute("data-preset", "ink");
    const screen = await render(
      <section data-preset="ember" data-testid="ember">
        <div data-theme="dark" data-testid="dark" />
      </section>,
    );

    expect(shown(root, "--color-primary")).toBe(ofPreset("ink", "light"));
    expect(
      shown(screen.getByTestId("ember").element(), "--color-primary"),
    ).toBe(ofPreset("ember", "light"));
    expect(shown(screen.getByTestId("dark").element(), "--color-primary")).toBe(
      ofPreset("ember", "dark"),
    );
  });
});

describe("what a preset doesn't set", () => {
  test("the chart colors and the overlay still follow the mode inside one", async () => {
    root.setAttribute("data-preset", "ink");
    const screen = await render(
      <section data-theme="dark" data-testid="section" />,
    );
    const section = screen.getByTestId("section").element();

    expect(shown(section, "--color-chart-1")).not.toBe(
      shown(root, "--color-chart-1"),
    );
    expect(shown(section, "--color-overlay")).not.toBe(
      shown(root, "--color-overlay"),
    );
  });

  test("the color scales stay the library's", () => {
    const before = shown(root, "--color-blue-600");
    root.setAttribute("data-preset", "ember");

    expect(shown(root, "--color-blue-600")).toBe(before);
  });
});

describe("a preset that isn't loaded", () => {
  test.each(["light", "dark"] as const)(
    "is the default theme, in %s",
    async (mode) => {
      const screen = await render(
        <section data-preset="nowhere" data-theme={mode} data-testid="section">
          <div
            data-theme={mode === "light" ? "dark" : "light"}
            data-testid="inner"
          />
        </section>,
      );
      const other = mode === "light" ? "dark" : "light";

      expect(
        shown(screen.getByTestId("section").element(), "--color-primary"),
      ).toBe(ofDefault(mode));
      expect(
        shown(screen.getByTestId("inner").element(), "--color-primary"),
      ).toBe(ofDefault(other));
    },
  );
});

describe("the switches presets are built on", () => {
  test("pick between two values in your own CSS", async () => {
    const value =
      "var(--nuv-light, rgb(1, 2, 3)) var(--nuv-dark, rgb(4, 5, 6))";
    const screen = await render(
      <div data-theme="dark" data-testid="dark">
        <div data-theme="light" data-testid="light" />
      </div>,
    );

    expect(computed(value)).toBe("rgb(1, 2, 3)");
    expect(computed(value, screen.getByTestId("dark").element())).toBe(
      "rgb(4, 5, 6)",
    );
    expect(computed(value, screen.getByTestId("light").element())).toBe(
      "rgb(1, 2, 3)",
    );
  });

  test('follow the system setting under data-theme="system"', async () => {
    const value =
      "var(--nuv-light, rgb(1, 2, 3)) var(--nuv-dark, rgb(4, 5, 6))";
    root.setAttribute("data-theme", "system");

    await emulateMedia({ colorScheme: "dark" });
    expect(computed(value)).toBe("rgb(4, 5, 6)");

    await emulateMedia({ colorScheme: "light" });
    expect(computed(value)).toBe("rgb(1, 2, 3)");
  });
});

describe("a preset and your own CSS", () => {
  test("a rule outside a layer still wins over a preset", () => {
    root.setAttribute("data-preset", "ink");
    const style = document.createElement("style");
    style.textContent = ":where(html) { --color-primary: rgb(1, 2, 3); }";
    document.head.prepend(style);

    try {
      expect(shown(root, "--color-primary")).toBe("rgb(1, 2, 3)");
    } finally {
      style.remove();
    }
  });
});

const height = (element: Element) => element.getBoundingClientRect().height;

describe("a preset and density", () => {
  test("a preset brings its own density", async () => {
    const screen = await render(
      <div data-preset="ledger">
        <Button>Save</Button>
      </div>,
    );

    expect(presets.ledger.density).toBe("compact");
    expect(height(screen.getByRole("button").element())).toBe(36);
  });

  test("data-density on the same element wins over the preset's", async () => {
    const screen = await render(
      <div data-preset="ledger" data-density="comfortable">
        <Button>Save</Button>
      </div>,
    );

    expect(height(screen.getByRole("button").element())).toBe(44);
  });

  test("the same on <html>, where the library's own rule is in play too", async () => {
    root.setAttribute("data-preset", "ledger");
    const screen = await render(<Button>Save</Button>);
    const button = screen.getByRole("button").element();
    expect(height(button)).toBe(36);

    root.setAttribute("data-density", "comfortable");
    expect(height(button)).toBe(44);
  });

  test("data-density inside a preset wins, being nearer", async () => {
    const screen = await render(
      <div data-preset="ledger">
        <div data-density="default">
          <Button>Save</Button>
        </div>
      </div>,
    );

    expect(height(screen.getByRole("button").element())).toBe(40);
  });

  test("a preset inside data-density uses its own, being nearer", async () => {
    const screen = await render(
      <div data-density="comfortable">
        <div data-preset="ledger">
          <Button>Save</Button>
        </div>
      </div>,
    );

    expect(height(screen.getByRole("button").element())).toBe(36);
  });
});

describe("a preset's shape", () => {
  test("the radius scale comes with the preset", async () => {
    const screen = await render(
      <>
        <div data-preset="ledger">
          <Button>Square</Button>
        </div>
        <div data-preset="meadow">
          <Button>Round</Button>
        </div>
      </>,
    );
    const radius = (name: string) =>
      getComputedStyle(screen.getByRole("button", { name }).element())
        .borderTopLeftRadius;

    expect(radius("Square")).toBe("0px");
    expect(radius("Round")).toBe("12px");
  });
});

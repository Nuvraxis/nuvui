import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Toggle } from "./toggle";

const toggle = (name = "Bold") => page.getByRole("button", { name });
const style = (name = "Bold") => getComputedStyle(toggle(name).element());

describe("rendering", () => {
  test("starts off, and a click presses and releases it", async () => {
    await render(<Toggle>Bold</Toggle>);

    await expect.element(toggle()).toHaveAttribute("aria-pressed", "false");
    await toggle().click();
    await expect.element(toggle()).toHaveAttribute("aria-pressed", "true");
    await toggle().click();
    await expect.element(toggle()).toHaveAttribute("aria-pressed", "false");
  });

  test("can start pressed, and can be controlled", async () => {
    const onPressedChange = vi.fn();
    await render(
      <>
        <Toggle defaultPressed>Bold</Toggle>
        <Toggle pressed={false} onPressedChange={onPressedChange}>
          Italic
        </Toggle>
      </>,
    );

    await expect.element(toggle()).toHaveAttribute("aria-pressed", "true");
    await toggle("Italic").click();
    expect(onPressedChange).toHaveBeenCalledWith(true);
    await expect
      .element(toggle("Italic"))
      .toHaveAttribute("aria-pressed", "false");
  });

  test("defaults to the ghost variant at medium size", async () => {
    await render(<Toggle>Bold</Toggle>);

    await expect
      .element(toggle())
      .toHaveClass("nuv-toggle", "nuv-toggle--ghost", "nuv-toggle--md");
  });

  test("turns variant and size into BEM modifiers", async () => {
    await render(
      <Toggle variant="outline" size="lg" className="mine">
        Bold
      </Toggle>,
    );

    await expect
      .element(toggle())
      .toHaveClass("nuv-toggle--outline", "nuv-toggle--lg", "mine");
  });

  test("doesn't submit a form, and forwards its ref", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    const ref = createRef<HTMLButtonElement>();
    await render(
      <form onSubmit={onSubmit}>
        <Toggle ref={ref}>Bold</Toggle>
      </form>,
    );

    await toggle().click();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(ref.current).toBe(toggle().element());
  });
});

describe("keyboard", () => {
  test("Tab focuses it, Space and Enter press it", async () => {
    await render(<Toggle>Bold</Toggle>);

    await userEvent.keyboard("{Tab}");
    await expect.element(toggle()).toHaveFocus();

    await userEvent.keyboard(" ");
    await expect.element(toggle()).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Enter}");
    await expect.element(toggle()).toHaveAttribute("aria-pressed", "false");
  });

  test("a disabled one is skipped and fades", async () => {
    await render(
      <>
        <Toggle disabled>Bold</Toggle>
        <Toggle>Italic</Toggle>
      </>,
    );

    await userEvent.keyboard("{Tab}");

    await expect.element(toggle("Italic")).toHaveFocus();
    expect(style().opacity).toBe("0.5");
  });
});

describe("styles", () => {
  test("sizes get denser with a mouse", async () => {
    await render(
      <>
        <Toggle size="sm">Small</Toggle>
        <Toggle size="md">Medium</Toggle>
        <Toggle size="lg">Large</Toggle>
      </>,
    );
    const height = (name: string) =>
      toggle(name).element().getBoundingClientRect().height;

    expect(height("Small")).toBe(32);
    expect(height("Medium")).toBe(40);
    expect(height("Large")).toBe(48);
  });

  test.each([
    ["sm", 32],
    ["md", 40],
    ["lg", 48],
  ] as const)(
    "a %s one that holds only an icon is %ipx square",
    async (size, side) => {
      await render(
        <Toggle aria-label="Bold" size={size}>
          <svg aria-hidden="true" width="16" height="16" />
        </Toggle>,
      );
      const box = toggle().element().getBoundingClientRect();

      expect(box.width).toBe(side);
      expect(box.height).toBe(side);
    },
  );

  test("pressed fills it, and the outline variant has an edge when it isn't", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <>
        <Toggle>Bold</Toggle>
        <Toggle defaultPressed>Italic</Toggle>
        <Toggle variant="outline">Underline</Toggle>
      </>,
    );

    expect(style("Bold").backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style("Bold").borderTopColor).toBe("rgba(0, 0, 0, 0)");
    expect(style("Italic").backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style("Underline").borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("changes color under the pointer", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Toggle>Bold</Toggle>);
    const before = style().backgroundColor;

    await userEvent.hover(toggle());

    expect(style().backgroundColor).not.toBe(before);
  });

  test("shows a focus ring for keyboard focus", async () => {
    await render(<Toggle>Bold</Toggle>);

    await userEvent.keyboard("{Tab}");

    expect(style().outlineStyle).toBe("solid");
  });

  test("variables change its look", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <div
        style={
          {
            "--nuv-toggle-on-bg": "rgb(1, 2, 3)",
            "--nuv-toggle-radius": "0px",
            "--nuv-toggle-height": "50px",
          } as never
        }
      >
        <Toggle defaultPressed>Bold</Toggle>
      </div>,
    );

    expect(style().backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style().borderRadius).toBe("0px");
    expect(toggle().element().getBoundingClientRect().height).toBe(50);
  });

  test("only animates when motion is fine", async () => {
    await render(<Toggle>Bold</Toggle>);

    await emulateMedia({ reducedMotion: "no-preference" });
    expect(style().transitionDuration).not.toBe("0s");
    await emulateMedia({ reducedMotion: "reduce" });
    expect(style().transitionDuration).toBe("0s");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe off, on, outlined and disabled", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(
      theme,
      <>
        <Toggle>Off</Toggle>
        <Toggle defaultPressed>On</Toggle>
        <Toggle variant="outline">Outlined</Toggle>
        <Toggle variant="outline" defaultPressed>
          Outlined on
        </Toggle>
        <Toggle disabled>Disabled</Toggle>
      </>,
    );

    const results = await axe(screen.container);

    expect(results).toHaveNoViolations();
    // axe skips the disabled one by design.
    const checked = results.passes.find((rule) => rule.id === "color-contrast");
    expect(checked?.nodes).toHaveLength(4);
  });

  // Pressed and not pressed are told apart by the fill, so the fill has to
  // stand out from the page the way a control's edge does.
  test("the pressed fill can be told from the page", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(
      theme,
      <Toggle defaultPressed>Bold</Toggle>,
    );
    const pageColor = getComputedStyle(
      screen.container.firstElementChild as Element,
    ).backgroundColor;

    expect(contrast(style().backgroundColor, pageColor)).toBeGreaterThanOrEqual(
      3,
    );
  });
});

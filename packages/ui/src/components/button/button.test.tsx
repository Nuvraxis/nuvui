import "../../styles/index.scss";
import { type CSSProperties, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axe } from "../../../test/axe";
import { emulateMedia, emulateTouch } from "../../../test/media";
import { Button } from "./button";

const intents = ["primary", "secondary", "ghost", "danger"] as const;
const sizes = ["sm", "md", "lg"] as const;

describe("rendering", () => {
  test("renders a button that doesn't submit a form by default", async () => {
    const onSubmit = vi.fn((event: { preventDefault(): void }) =>
      event.preventDefault(),
    );
    const screen = await render(
      <form onSubmit={onSubmit}>
        <Button>Save</Button>
      </form>,
    );
    const button = screen.getByRole("button", { name: "Save" });

    await expect.element(button).toHaveAttribute("type", "button");
    await button.click();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('type="submit" still submits', async () => {
    const onSubmit = vi.fn((event: { preventDefault(): void }) =>
      event.preventDefault(),
    );
    const screen = await render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>,
    );

    await screen.getByRole("button", { name: "Save" }).click();

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test("defaults to the primary intent at medium size", async () => {
    const screen = await render(<Button>Save</Button>);

    await expect
      .element(screen.getByRole("button"))
      .toHaveClass("nuv-button", "nuv-button--primary", "nuv-button--md");
  });

  test("turns intent and size into BEM modifiers", async () => {
    const screen = await render(
      <Button intent="danger" size="lg" className="mine">
        Delete
      </Button>,
    );

    await expect
      .element(screen.getByRole("button"))
      .toHaveClass("nuv-button--danger", "nuv-button--lg", "mine");
  });

  test("forwards its ref and passes other props through", async () => {
    const ref = createRef<HTMLButtonElement>();
    const screen = await render(
      <Button ref={ref} aria-describedby="hint" data-test="x">
        Save
      </Button>,
    );
    const button = screen.getByRole("button");

    expect(ref.current).toBe(button.element());
    await expect.element(button).toHaveAttribute("aria-describedby", "hint");
    await expect.element(button).toHaveAttribute("data-test", "x");
  });

  test("asChild renders the child with the button's classes", async () => {
    const screen = await render(
      <Button asChild intent="secondary">
        <a href="#docs">Docs</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Docs" });

    await expect
      .element(link)
      .toHaveClass("nuv-button", "nuv-button--secondary");
    await expect.element(link).not.toHaveAttribute("type");
    expect(screen.container.querySelector("button")).toBeNull();
  });

  test("a disabled asChild link says so and leaves the tab order", async () => {
    const screen = await render(
      <Button asChild disabled>
        <a href="#docs">Docs</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Docs" });

    await expect.element(link).toHaveAttribute("aria-disabled", "true");
    await expect.element(link).toHaveAttribute("tabindex", "-1");
    await expect.element(link).not.toHaveAttribute("disabled");
  });
});

describe("keyboard", () => {
  test("Tab focuses it, Enter and Space press it", async () => {
    const onClick = vi.fn();
    const screen = await render(<Button onClick={onClick}>Save</Button>);

    await userEvent.keyboard("{Tab}");
    await expect.element(screen.getByRole("button")).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  test("a disabled button is skipped by Tab and can't be pressed", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <>
        <Button disabled onClick={onClick}>
          Save
        </Button>
        <Button>Cancel</Button>
      </>,
    );

    await userEvent.keyboard("{Tab}");

    await expect
      .element(screen.getByRole("button", { name: "Cancel" }))
      .toHaveFocus();
    await expect
      .element(screen.getByRole("button", { name: "Save" }))
      .toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("styles", () => {
  test("shows a focus ring for keyboard focus", async () => {
    const screen = await render(<Button>Save</Button>);
    const button = screen.getByRole("button");

    await userEvent.keyboard("{Tab}");

    await expect.element(button).toHaveFocus();
    const style = getComputedStyle(button.element());
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
  });

  test("shows no focus ring after a click", async () => {
    const screen = await render(<Button>Save</Button>);
    const button = screen.getByRole("button");

    await button.click();

    await expect.element(button).toHaveFocus();
    expect(getComputedStyle(button.element()).outlineStyle).toBe("none");
  });

  test.each(sizes)(
    "size %s is at least 44px on a touch screen",
    async (size) => {
      await emulateTouch(true);
      const screen = await render(<Button size={size}>A</Button>);

      const { width, height } = screen
        .getByRole("button")
        .element()
        .getBoundingClientRect();

      expect(height).toBeGreaterThanOrEqual(44);
      expect(width).toBeGreaterThanOrEqual(44);
    },
  );

  test("sizes get denser with a mouse", async () => {
    const screen = await render(
      <div>
        {sizes.map((size) => (
          <Button key={size} size={size}>
            {size}
          </Button>
        ))}
      </div>,
    );
    const height = (name: string) =>
      screen.getByRole("button", { name }).element().getBoundingClientRect()
        .height;

    expect(height("sm")).toBe(32);
    expect(height("md")).toBe(40);
    expect(height("lg")).toBe(48);
  });

  test("a component variable overrides the intent's default", async () => {
    const screen = await render(
      // Set on a wrapper, not on the button, to show it doesn't need to be.
      <div style={{ "--nuv-button-bg": "rgb(1, 2, 3)" } as CSSProperties}>
        <Button
          intent="danger"
          style={{ "--nuv-button-radius": "0px" } as CSSProperties}
        >
          Save
        </Button>
      </div>,
    );
    const style = getComputedStyle(screen.getByRole("button").element());

    expect(style.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style.borderRadius).toBe("0px");
  });

  test("only animates when motion is fine", async () => {
    const screen = await render(<Button>Save</Button>);
    const style = getComputedStyle(screen.getByRole("button").element());

    await emulateMedia({ reducedMotion: "no-preference" });
    expect(style.transitionDuration).not.toBe("0s");

    await emulateMedia({ reducedMotion: "reduce" });
    expect(style.transitionDuration).toBe("0s");
  });
});

describe.each(["light", "dark"] as const)("accessibility in %s", (theme) => {
  test("every intent passes axe", async () => {
    const screen = await render(
      <main
        data-theme={theme}
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {intents.map((intent) => (
          <Button key={intent} intent={intent}>
            {intent}
          </Button>
        ))}
        <Button disabled>disabled</Button>
        <Button asChild>
          <a href="#docs">Read the docs</a>
        </Button>
      </main>,
    );

    const results = await axe(screen.container);

    expect(results).toHaveNoViolations();
    // Four intents plus the link. axe skips the disabled button by design.
    const contrast = results.passes.find(
      (rule) => rule.id === "color-contrast",
    );
    expect(contrast?.nodes).toHaveLength(intents.length + 1);
  });
});

import "../../styles/index.scss";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import { VisuallyHidden } from "./visually-hidden";

const rect = (element: Element) => element.getBoundingClientRect();

describe("rendering", () => {
  test("is a span that's in the page and can't be seen", async () => {
    await render(
      <p data-testid="line">
        3<VisuallyHidden> unread messages</VisuallyHidden>
      </p>,
    );
    const hidden = page.getByText("unread messages").element();

    expect(hidden.tagName).toBe("SPAN");
    expect(hidden.className).toBe("nuv-visually-hidden");
    expect(rect(hidden).width).toBeLessThanOrEqual(1);
    expect(rect(hidden).height).toBeLessThanOrEqual(1);
    // Hidden this way, a screen reader still reads it.
    expect(getComputedStyle(hidden).display).not.toBe("none");
    expect(getComputedStyle(hidden).visibility).toBe("visible");
    expect(page.getByTestId("line").element().textContent).toBe(
      "3 unread messages",
    );
  });

  test("takes no room in the layout", async () => {
    await render(
      <>
        <p data-testid="plain">3</p>
        <p data-testid="with">
          3
          <VisuallyHidden>
            {" "}
            unread messages that go on for a while
          </VisuallyHidden>
        </p>
      </>,
    );

    expect(rect(page.getByTestId("with").element()).height).toBe(
      rect(page.getByTestId("plain").element()).height,
    );
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("gives a button with only an icon its name", async () => {
    await render(
      <Button>
        <svg aria-hidden="true" width="16" height="16" />
        <VisuallyHidden>Delete</VisuallyHidden>
      </Button>,
    );

    await expect
      .element(page.getByRole("button", { name: "Delete" }))
      .toBeVisible();
  });

  test("asChild hides your own element", async () => {
    await render(
      <VisuallyHidden asChild>
        <h2>Search results</h2>
      </VisuallyHidden>,
    );
    const heading = page.getByRole("heading", { name: "Search results" });

    await expect.element(heading).toHaveClass("nuv-visually-hidden");
    expect(rect(heading.element()).width).toBeLessThanOrEqual(1);
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(
      <VisuallyHidden ref={ref} className="mine" id="hint">
        Text
      </VisuallyHidden>,
    );

    expect(ref.current?.className).toBe("nuv-visually-hidden mine");
    expect(ref.current?.id).toBe("hint");
  });
});

describe("focusable", () => {
  function SkipLink() {
    return (
      <>
        <VisuallyHidden focusable asChild>
          <a href="#main">Skip to content</a>
        </VisuallyHidden>
        <Button>Menu</Button>
      </>
    );
  }

  const link = () => page.getByRole("link", { name: "Skip to content" });

  test("is hidden until it has focus, and hidden again after", async () => {
    await render(<SkipLink />);
    expect(rect(link().element()).width).toBeLessThanOrEqual(1);

    // Focus given by script, because Safari doesn't stop at links with Tab.
    (link().element() as HTMLElement).focus();

    expect(rect(link().element()).width).toBeGreaterThan(50);
    expect(rect(link().element()).height).toBeGreaterThan(10);
    expect(getComputedStyle(link().element()).position).toBe("static");

    await userEvent.keyboard("{Tab}");

    await expect
      .element(page.getByRole("button", { name: "Menu" }))
      .toHaveFocus();
    expect(rect(link().element()).width).toBeLessThanOrEqual(1);
  });

  test("shows while something inside it has focus", async () => {
    await render(
      <VisuallyHidden focusable data-testid="wrapper">
        <Button>Skip to content</Button>
      </VisuallyHidden>,
    );
    const wrapper = page.getByTestId("wrapper").element();
    expect(rect(wrapper).width).toBeLessThanOrEqual(1);

    await userEvent.keyboard("{Tab}");

    await expect.element(page.getByRole("button")).toHaveFocus();
    expect(rect(wrapper).width).toBeGreaterThan(50);
  });

  test("without the prop, focus doesn't show it", async () => {
    await render(
      <VisuallyHidden asChild>
        <a href="#main">Skip to content</a>
      </VisuallyHidden>,
    );

    (link().element() as HTMLElement).focus();

    expect(rect(link().element()).width).toBeLessThanOrEqual(1);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(
      theme,
      <Button>
        <svg aria-hidden="true" width="16" height="16" />
        <VisuallyHidden>Delete</VisuallyHidden>
      </Button>,
    );

    await expectNoViolations(screen.container);
  });
});

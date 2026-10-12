import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { RichTextEditor } from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone. What a mouse and a keyboard do is
// checked next to the component.

const rect = (element: Element) => element.getBoundingClientRect();
const box = () => page.getByRole("textbox", { name: "Notes" });

test("each control in the toolbar is 44px", async () => {
  await render(<RichTextEditor aria-label="Notes" />);
  await expect.element(box()).toBeInTheDocument();

  for (const name of ["Bold", "Heading 2", "Link", "Undo"]) {
    const control = rect(
      page.getByRole("button", { name, exact: true }).element(),
    );
    expect(control.width, name).toBeGreaterThanOrEqual(44);
    expect(control.height, name).toBeGreaterThanOrEqual(44);
  }
});

test("the text is 16px, so the page isn't zoomed when it's tapped, whatever the variable for a mouse says", async () => {
  await render(
    <div style={{ "--nuv-rich-text-editor-font-size": "12px" } as never}>
      <RichTextEditor aria-label="Notes" />
    </div>,
  );
  await expect.element(box()).toBeInTheDocument();

  expect(getComputedStyle(box().element()).fontSize).toBe("16px");
});

test("the toolbar wraps inside the box, and the page doesn't scroll sideways", async () => {
  await render(<RichTextEditor aria-label="Notes" />);
  await expect.element(box()).toBeInTheDocument();
  const root = document.querySelector(".nuv-rich-text-editor") as HTMLElement;

  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth + 1);
  expect(document.documentElement.scrollWidth).toBe(
    document.documentElement.clientWidth,
  );
});

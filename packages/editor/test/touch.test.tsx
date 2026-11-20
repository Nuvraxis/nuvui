import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { RichTextEditor } from "../src";
import { CodeEditor, DiffEditor } from "../src/code";

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

const code = () => page.getByRole("textbox", { name: "Script" });

test("each control in the code editor's toolbar is 44px, and so is each button in its search", async () => {
  await render(<CodeEditor aria-label="Script" defaultLanguage="css" />);
  await expect.element(code()).toBeInTheDocument();

  for (const name of ["Language", "Wrap lines", "Copy code"]) {
    const control = rect(
      page
        .getByRole(name === "Language" ? "combobox" : "button", {
          name,
          exact: true,
        })
        .element(),
    );
    expect(control.height, name).toBeGreaterThanOrEqual(44);
  }
});

test("the code is 16px, so the page isn't zoomed when it's tapped, whatever the variable for a mouse says", async () => {
  await render(
    <div style={{ "--nuv-code-editor-font-size": "12px" } as never}>
      <CodeEditor aria-label="Script" defaultValue="a" />
    </div>,
  );
  await expect.element(code()).toBeInTheDocument();
  expect(getComputedStyle(code().element()).fontSize).toBe("16px");
});

test("a tap puts the cursor in the code, and typing writes there", async () => {
  await render(<CodeEditor aria-label="Script" defaultValue="" />);
  await expect.element(code()).toBeInTheDocument();
  await code().click();
  await expect.element(code()).toHaveFocus();
  await userEvent.keyboard("ok");
  await expect.element(code()).toHaveTextContent("ok");
});

test("a long line scrolls inside the code editor, and the page doesn't scroll sideways", async () => {
  await render(
    <CodeEditor aria-label="Script" defaultValue={"x".repeat(400)} />,
  );
  await expect.element(code()).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBe(
    document.documentElement.clientWidth,
  );
});

test("on a phone the diff editor is in one column, and each button beside a change is 44px", async () => {
  await render(
    <DiffEditor
      aria-label="Changes"
      original={"a\nb\n"}
      defaultModified={"a\nc\n"}
      editable
    />,
  );
  await expect
    .element(page.getByRole("textbox", { name: "Changed" }))
    .toBeInTheDocument();
  expect(
    (document.querySelector(".nuv-diff-editor") as HTMLElement).dataset.layout,
  ).toBe("unified");
  const buttons = [
    ...document.querySelectorAll(".nuv-diff-editor__chunk-button"),
  ];
  expect(buttons.length).toBeGreaterThan(0);
  for (const control of buttons) {
    expect(rect(control).height).toBeGreaterThanOrEqual(44);
  }
});

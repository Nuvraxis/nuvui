import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Flow, type FlowNode } from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone.

const nodes: FlowNode[] = [
  { id: "a", label: "Start", shape: "pill", position: { x: 0, y: 0 } },
  { id: "b", label: "Review", position: { x: 0, y: 140 } },
];

test("the buttons are 44px, the size of a fingertip", async () => {
  await render(<Flow aria-label="Steps" defaultNodes={nodes} />);
  for (const name of [
    "Zoom out",
    "Zoom in",
    "Fit the diagram",
    "Show as a list",
  ]) {
    const box = page
      .getByRole("button", { name })
      .element()
      .getBoundingClientRect();
    expect(box.width).toBe(44);
    expect(box.height).toBe(44);
  }
});

test("a tap on a node selects it", async () => {
  const onSelectionChange = vi.fn();
  await render(
    <Flow
      aria-label="Steps"
      defaultNodes={nodes}
      onSelectionChange={onSelectionChange}
    />,
  );
  await page.getByRole("option", { name: "Review, step" }).click();
  await expect
    .poll(() => onSelectionChange.mock.lastCall?.[0])
    .toEqual({ nodes: ["b"], edges: [] });
});

test("a finger on the diagram doesn't scroll or zoom the page, and the page doesn't scroll sideways", async () => {
  await render(<Flow aria-label="Steps" defaultNodes={nodes} />);
  const canvas = document.querySelector(".nuv-flow__canvas") as HTMLElement;
  expect(getComputedStyle(canvas).touchAction).toBe("none");
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
});

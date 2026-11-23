import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { OrgChart, type OrgChartPerson } from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone.

const people: OrgChartPerson[] = [
  { id: "a", name: "Ada Quill", title: "Chief Executive" },
  { id: "b", managerId: "a", name: "Bo Ferro", title: "Head of Sales" },
  { id: "c", managerId: "b", name: "Cy Lund", title: "Account Manager" },
];

test("the buttons above the chart are 44px, the size of a fingertip", async () => {
  await render(<OrgChart aria-label="Team" people={people} />);
  for (const name of ["Zoom out", "Zoom in", "Fit the chart"]) {
    const box = page
      .getByRole("button", { name })
      .element()
      .getBoundingClientRect();
    expect(box.width).toBe(44);
    expect(box.height).toBe(44);
  }
});

test("a team's button looks small, and takes a tap 44px across around it", async () => {
  await render(<OrgChart aria-label="Team" people={people} />);
  const button = document.querySelector(
    '.nuv-org-chart__toggle[data-for="b"]',
  ) as HTMLElement;
  const area = getComputedStyle(button, "::after");
  expect(button.getBoundingClientRect().height).toBeLessThan(44);
  // The area is in the chart's units, so it's a fingertip at a zoom of 1.
  expect(Number.parseFloat(area.blockSize)).toBeGreaterThanOrEqual(44);
  expect(Number.parseFloat(area.inlineSize)).toBeGreaterThanOrEqual(44);
});

test("a tap on a card chooses the person", async () => {
  const onSelectedChange = vi.fn();
  await render(
    <OrgChart
      aria-label="Team"
      people={people}
      onSelectedChange={onSelectedChange}
    />,
  );
  await page.getByRole("treeitem", { name: /^Bo Ferro/ }).click();
  expect(onSelectedChange).toHaveBeenLastCalledWith("b");
});

test("a finger on the chart doesn't scroll or zoom the page, and the page doesn't scroll sideways", async () => {
  await render(<OrgChart aria-label="Team" people={people} />);
  const frame = document.querySelector(".nuv-org-chart__frame") as HTMLElement;
  expect(getComputedStyle(frame).touchAction).toBe("none");
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
});

test("on a phone the find box and the buttons wrap onto their own lines inside the page", async () => {
  await render(<OrgChart aria-label="Team" people={people} />);
  const bar = document.querySelector(".nuv-org-chart__bar") as HTMLElement;
  expect(bar.getBoundingClientRect().right).toBeLessThanOrEqual(
    window.innerWidth,
  );
});

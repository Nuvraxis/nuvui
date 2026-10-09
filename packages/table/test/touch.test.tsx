import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { hitAt } from "@nuvui/tooling/test/themed";
import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { DataTable } from "../src";
import { createColumnHelper, useDataTable } from "../src/full";
import { type Person, people } from "./people";

// This file runs in a browser context of its own, one that reports a touch
// screen. What the parts measure with a mouse is checked next to each
// component.

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.select(),
  helper.expand(),
  helper.accessor("name", { header: "Name", size: 160 }),
  helper.accessor("role", { header: "Role", size: 120 }),
]);

function People({ layout }: { layout?: "auto" | "fixed" }) {
  const table = useDataTable({
    columns,
    data: people,
    getRowCanExpand: () => true,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });
  return (
    <div style={{ padding: 16 }}>
      <DataTable
        table={table}
        aria-label="People"
        rowHeader="name"
        layout={layout}
        renderDetail={() => "Details"}
      />
    </div>
  );
}

const box = (element: Element) => element.getBoundingClientRect();

test("the browser reports a touch screen", () => {
  expect(matchMedia("(pointer: coarse)").matches).toBe(true);
});

test("a heading that sorts is 44px tall", async () => {
  await render(<People />);
  const sort = page.getByRole("button", { name: "Name" }).element();
  expect(box(sort).height).toBeGreaterThanOrEqual(44);
});

test("a checkbox answers a tap anywhere in 44px around it", async () => {
  await render(<People />);
  const checkbox = page
    .getByRole("checkbox", { name: "Select Ada Lovelace" })
    .element();
  expect(box(checkbox).width).toBe(20);
  expect(hitAt(checkbox, 0, 21)).toBe(checkbox);
  expect(hitAt(checkbox, 0, -21)).toBe(checkbox);
});

test("the button that opens a row answers a tap anywhere in 44px around it", async () => {
  await render(<People />);
  const toggle = page
    .getByRole("button", { name: "Show details for Ada Lovelace" })
    .element();
  expect(hitAt(toggle, 0, 21)).toBe(toggle);
  expect(hitAt(toggle, 0, -21)).toBe(toggle);
});

test("the page buttons and the page size are 44px", async () => {
  await render(<People />);
  for (const name of [
    "First page",
    "Previous page",
    "Next page",
    "Last page",
  ]) {
    const button = page.getByRole("button", { name }).element();
    expect(box(button).width).toBeGreaterThanOrEqual(44);
    expect(box(button).height).toBeGreaterThanOrEqual(44);
  }
  const size = page.getByRole("combobox", { name: "Rows per page" }).element();
  expect(box(size).height).toBeGreaterThanOrEqual(44);
});

test("the search field and the column chooser are 44px tall", async () => {
  await render(<People />);
  expect(
    box(page.getByRole("searchbox", { name: "Search" }).element()).height,
  ).toBeGreaterThanOrEqual(44);
  expect(
    box(page.getByRole("button", { name: "Columns" }).element()).height,
  ).toBeGreaterThanOrEqual(44);
});

test("the grip that resizes a column is wider for a finger", async () => {
  await render(<People layout="fixed" />);
  const grip = page.getByRole("separator", { name: "Resize Name" }).element();
  expect(box(grip).width).toBe(16);
});

test("density doesn't make a control smaller than a finger", async () => {
  document.documentElement.setAttribute("data-density", "compact");
  await render(<People />);
  const sort = page.getByRole("button", { name: "Name" }).element();
  expect(box(sort).height).toBeGreaterThanOrEqual(44);
  const next = page.getByRole("button", { name: "Next page" }).element();
  expect(box(next).height).toBeGreaterThanOrEqual(44);
});

test("the table fits a phone, and scrolls inside its own box", async () => {
  await render(<People />);
  expect(document.documentElement.scrollWidth).toBe(
    document.documentElement.clientWidth,
  );
});

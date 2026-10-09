import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed } from "@nuvui/tooling/test/themed";
import { beforeEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { createColumnHelper, useDataTable } from "../src/full";
import { DataTableVirtual, type DataTableVirtualProps } from "../src/virtual";
import { many, type Person } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.select(),
  helper.accessor("name", { header: "Name" }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("age", { header: "Age" }),
]);
const tenThousand = many(10_000);

function Big(
  props: Partial<
    DataTableVirtualProps<typeof import("../src/full").features, Person>
  >,
) {
  const table = useDataTable({
    columns,
    data: tenThousand,
    getRowId: (person) => person.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10_000 } },
  });
  return (
    <div style={{ padding: 16 }}>
      <DataTableVirtual
        table={table}
        aria-label="People"
        rowHeader="name"
        pagination={false}
        height={400}
        {...(props as object)}
      />
    </div>
  );
}

const box = () => document.querySelector(".nuv-table-container") as HTMLElement;
const drawn = () => [
  ...document.querySelectorAll<HTMLElement>("tbody tr[data-index]"),
];
const first = () => Number(drawn()[0]?.dataset.index);
const checkbox = (row: number) =>
  page.getByRole("checkbox", { name: `Select Person ${row}`, exact: true });

beforeEach(async () => {
  await setViewport("desktop");
});

describe("ten thousand rows", () => {
  test("only the rows in view are in the page", async () => {
    await render(<Big />);
    await expect.poll(() => drawn().length).toBeGreaterThan(10);
    expect(drawn().length).toBeLessThan(40);
    // The scroll bar is as long as all ten thousand would make it.
    expect(box().scrollHeight).toBeGreaterThan(10_000 * 39);
    expect(box().scrollHeight).toBeLessThan(10_000 * 41 + 100);
  });

  test("a screen reader is told how many rows there are and where each one is", async () => {
    await render(<Big />);
    const table = page.getByRole("table", { name: "People" }).element();
    expect(table.getAttribute("aria-rowcount")).toBe("10001");
    expect(
      document.querySelector("thead tr")?.getAttribute("aria-rowindex"),
    ).toBe("1");
    await expect
      .poll(() => drawn()[0]?.getAttribute("aria-rowindex"))
      .toBe("2");
  });

  test("scrolling draws the rows that come into view, in real table rows", async () => {
    await render(<Big />);
    box().scrollTop = 200_000;
    await expect.poll(first).toBeGreaterThan(4900);
    expect(first()).toBeLessThan(5001);
    const row = drawn()[12] as HTMLElement;
    expect(row.tagName).toBe("TR");
    expect(row.querySelectorAll("td, th")).toHaveLength(4);
    // The columns still line up with their headings.
    const heading = page.getByRole("columnheader", { name: "Email" }).element();
    const cell = row.querySelectorAll("td, th")[2] as Element;
    expect(cell.getBoundingClientRect().left).toBeCloseTo(
      heading.getBoundingClientRect().left,
      0,
    );
  });

  test("the last row can be reached", async () => {
    await render(<Big />);
    box().scrollTop = box().scrollHeight;
    await expect
      .element(
        page.getByRole("rowheader", { name: "Person 10000", exact: true }),
      )
      .toBeVisible();
  });

  test("the header stays in view", async () => {
    await render(<Big />);
    box().scrollTop = 50_000;
    await expect.poll(first).toBeGreaterThan(1000);
    const heading = page.getByRole("columnheader", { name: "Name" }).element();
    expect(heading.getBoundingClientRect().top).toBeCloseTo(
      box().getBoundingClientRect().top + 1,
      0,
    );
  });

  test("the row that holds focus stays in the page when it scrolls away", async () => {
    await render(<Big />);
    const third = checkbox(3).element();
    // WebKit brings a newly focused element into view a moment after
    // focus() returns, which would undo a scroll made straight after it.
    third.focus({ preventScroll: true });
    box().scrollTop = 200_000;
    await expect
      .poll(() => drawn().length > 1 && Number(drawn()[1]?.dataset.index))
      .toBeGreaterThan(4900);
    expect(document.activeElement).toBe(third);
    expect(first()).toBe(2);
    // Space still works on it, though it's far out of view.
    await userEvent.keyboard(" ");
    expect(third.getAttribute("data-state")).toBe("checked");
  });

  test("Tab moves on from that row to the rows in view", async () => {
    await render(<Big />);
    checkbox(3).element().focus({ preventScroll: true });
    box().scrollTop = 200_000;
    await expect
      .poll(() => drawn().length > 1 && Number(drawn()[1]?.dataset.index))
      .toBeGreaterThan(4900);
    await userEvent.keyboard("{Tab}");
    const next = document.activeElement as HTMLElement;
    expect(Number(next.closest("tr")?.dataset.index)).toBeGreaterThan(4900);
    // And the table stays where it was scrolled to.
    expect(box().scrollTop).toBeGreaterThan(190_000);
  });

  test("the box takes focus, and the keyboard scrolls it", async () => {
    await render(<Big />);
    await expect.poll(() => box().getAttribute("tabindex")).toBe("0");
    box().focus();
    await userEvent.keyboard("{End}");
    await expect
      .poll(() => box().scrollTop)
      .toBe(box().scrollHeight - box().clientHeight);
    // Chromium animates a scroll made with a key, and drops the next key if
    // it lands in the moment that animation ends. It's the browser: nothing
    // in the page sets the scroll position. A person pressing Home again
    // gets there, and a test has to wait.
    await new Promise((resolve) => setTimeout(resolve, 250));
    await userEvent.keyboard("{Home}");
    await expect.poll(() => box().scrollTop).toBe(0);
  });

  test("sorting works over all of them, not the ones in view", async () => {
    await render(<Big />);
    await page.getByRole("button", { name: "Age" }).click();
    // Numbers sort from the largest first.
    await expect
      .poll(() => drawn()[0]?.querySelectorAll("td, th")[3]?.textContent)
      .toBe("69");
    expect(drawn()[0]?.querySelectorAll("td, th")[1]?.textContent).toBe(
      "Person 50",
    );
  });

  test("selecting all selects all of them", async () => {
    await render(<Big />);
    await page
      .getByRole("checkbox", { name: "Select all rows on this page" })
      .click();
    await expect
      .poll(() =>
        document.querySelector(".nuv-data-table__status")?.textContent?.trim(),
      )
      .toBe("10000 selected");
  });

  test("a filter that leaves a few rows draws just those", async () => {
    await render(<Big />);
    await page.getByRole("searchbox", { name: "Search" }).fill("Person 999");
    // 999, and 9990 to 9999.
    await expect.poll(() => drawn().length).toBe(11);
    expect(box().scrollHeight).toBeLessThan(600);
  });
});

describe("a row's panel", () => {
  const withDetail = helper.columns([
    helper.expand(),
    helper.accessor("name", { header: "Name" }),
  ]);

  function Details() {
    const table = useDataTable({
      columns: withDetail,
      data: tenThousand,
      getRowCanExpand: () => true,
      initialState: { pagination: { pageIndex: 0, pageSize: 10_000 } },
    });
    return (
      <DataTableVirtual
        table={table}
        aria-label="People"
        rowHeader="name"
        pagination={false}
        height={400}
        renderDetail={(row) => (
          <div style={{ height: 200 }}>Email: {row.original.email}</div>
        )}
      />
    );
  }

  test("opens under its row and is counted in the height", async () => {
    await render(<Details />);
    const before = box().scrollHeight;
    await page
      .getByRole("button", { name: "Show details for Person 2", exact: true })
      .click();
    await expect
      .element(page.getByText("Email: person2@example.com"))
      .toBeVisible();
    await expect.poll(() => box().scrollHeight).toBeGreaterThan(before + 190);
  });
});

describe("accessibility", () => {
  test.each(["light", "dark"] as const)(
    "no violations in %s",
    async (theme) => {
      const screen = await renderThemed(theme, <Big />);
      await expect.poll(() => drawn().length).toBeGreaterThan(10);
      expect(await axe(screen.container)).toHaveNoViolations();
    },
  );
});

import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { Button } from "@nuvui/react/button";
import { DirectionProvider } from "@nuvui/react/direction";
import { axe } from "@nuvui/tooling/test/axe";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import {
  createSortedRowModel,
  rowExpandingFeature,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { type Person, people, tree } from "../../../test/people";
import {
  createColumnHelper,
  useDataTable,
  useTableContext as useTableContextForTest,
} from "../../full";
import {
  createDataTableHook,
  DataTable,
  DataTableColumnFilter,
  DataTableContent,
  DataTablePagination,
  type DataTableProps,
  DataTableRoot,
  DataTableToolbar,
  useDataTableRequest,
} from ".";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.select(),
  helper.accessor("name", { header: "Name" }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("role", { header: "Role" }),
  helper.accessor("age", { header: "Age", meta: { align: "end" } }),
]);

type Options = Partial<Parameters<typeof useDataTable<Person>>[0]>;
type View = Partial<
  DataTableProps<typeof import("../../full").features, Person>
>;

function People({
  options,
  ...view
}: { options?: Options } & Omit<View, "table">) {
  const table = useDataTable({
    columns,
    data: people,
    getRowId: (person) => person.id,
    ...options,
  });
  return (
    <div style={{ padding: 16 }}>
      <DataTable
        table={table}
        rowHeader="name"
        {...(view as object)}
        {...((view.caption || view["aria-labelledby"]
          ? {}
          : { "aria-label": view["aria-label"] ?? "People" }) as {
          "aria-label": string;
        })}
      />
      <Button intent="ghost">After</Button>
    </div>
  );
}

const rows = () => page.getByRole("row").elements().slice(1);
const cellText = (row: Element, index: number) =>
  row.querySelectorAll("th, td")[index]?.textContent ?? "";
const names = () => rows().map((row) => cellText(row, 1));
const header = (name: string) => page.getByRole("columnheader", { name });
const sortButton = (name: string) =>
  page.getByRole("columnheader", { name }).getByRole("button", { name });
const status = () =>
  document.querySelector(".nuv-data-table__status")?.textContent?.trim();

beforeEach(async () => {
  await setViewport("desktop");
});

describe("what's drawn", () => {
  test("a table with a name, headings with scope, and a heading for each row", async () => {
    await render(<People />);
    await expect
      .element(page.getByRole("table", { name: "People" }))
      .toBeVisible();
    for (const name of ["Name", "Email", "Role", "Age"]) {
      expect(header(name).element().getAttribute("scope")).toBe("col");
    }
    const first = page.getByRole("rowheader", { name: "Cleo Park" }).element();
    expect(first.tagName).toBe("TH");
    expect(first.getAttribute("scope")).toBe("row");
    expect(rows()).toHaveLength(10);
  });

  test("a caption names the table and the box around it", async () => {
    await render(<People caption="Everyone on the team" />);
    await expect
      .element(page.getByRole("table", { name: "Everyone on the team" }))
      .toBeVisible();
    await expect.element(page.getByText("Everyone on the team")).toBeVisible();
  });

  test("the heading of the checkbox column isn't a column heading", async () => {
    await render(<People />);
    expect(page.getByRole("columnheader").elements()).toHaveLength(4);
  });

  test("a column aligned to the end has its heading there too", async () => {
    await render(<People />);
    expect(getComputedStyle(header("Age").element()).textAlign).toBe("end");
    const cell = rows()[0]?.querySelectorAll("td, th")[4] as Element;
    expect(getComputedStyle(cell).textAlign).toBe("end");
  });
});

describe("sorting", () => {
  test("a click sorts ascending, then descending, then not at all", async () => {
    await render(
      <People
        pagination={false}
        options={{
          initialState: { pagination: { pageIndex: 0, pageSize: 100 } },
        }}
      />,
    );
    await sortButton("Name").click();
    expect(names().slice(0, 3)).toEqual([
      "Ada Lovelace",
      "Bo Jensen",
      "Cleo Park",
    ]);
    expect(header("Name").element().getAttribute("aria-sort")).toBe(
      "ascending",
    );
    await expect.poll(status).toBe("Sorted by Name, ascending");

    await sortButton("Name").click();
    expect(names()[0]).toBe("Lena Braun");
    expect(header("Name").element().getAttribute("aria-sort")).toBe(
      "descending",
    );
    await expect.poll(status).toBe("Sorted by Name, descending");

    await sortButton("Name").click();
    expect(names()[0]).toBe("Cleo Park");
    expect(header("Name").element().hasAttribute("aria-sort")).toBe(false);
    await expect.poll(status).toBe("Sorting cleared");
  });

  test("the keyboard sorts", async () => {
    await render(<People />);
    sortButton("Name").element().focus();
    await userEvent.keyboard("{Enter}");
    expect(header("Name").element().getAttribute("aria-sort")).toBe(
      "ascending",
    );
    await userEvent.keyboard(" ");
    expect(header("Name").element().getAttribute("aria-sort")).toBe(
      "descending",
    );
  });

  test("numbers sort from the largest first, which is TanStack's choice", async () => {
    await render(<People />);
    await sortButton("Age").click();
    expect(header("Age").element().getAttribute("aria-sort")).toBe(
      "descending",
    );
  });

  test("Shift and a click sorts by a second column, and only the first says so", async () => {
    await render(<People />);
    await sortButton("Role").click();
    await userEvent.keyboard("{Shift>}");
    await sortButton("Name").click();
    await userEvent.keyboard("{/Shift}");
    expect(header("Role").element().getAttribute("aria-sort")).toBe(
      "ascending",
    );
    expect(header("Name").element().hasAttribute("aria-sort")).toBe(false);
    expect(names().slice(0, 2)).toEqual(["Cleo Park", "Dana Scully"]);
    // The order of the two is shown as a number by each arrow.
    expect(sortButton("Role").element().textContent).toContain("1");
    expect(sortButton("Name").element().textContent).toContain("2");
  });

  test("Shift and Enter adds a column to the sort from the keyboard", async () => {
    await render(<People />);
    sortButton("Role").element().focus();
    await userEvent.keyboard("{Enter}");
    sortButton("Name").element().focus();
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    expect(header("Role").element().getAttribute("aria-sort")).toBe(
      "ascending",
    );
    expect(names().slice(0, 2)).toEqual(["Cleo Park", "Dana Scully"]);
    expect(sortButton("Name").element().textContent).toContain("2");
  });

  test("a column that can't be sorted has no button", async () => {
    const fixed = helper.columns([
      helper.accessor("name", { header: "Name", enableSorting: false }),
    ]);
    await render(<People options={{ columns: fixed }} />);
    expect(header("Name").getByRole("button").elements()).toHaveLength(0);
  });
});

describe("filtering", () => {
  test("the search field filters every column and says how many rows are left", async () => {
    await render(<People />);
    await page.getByRole("searchbox", { name: "Search" }).fill("editor");
    await expect.poll(() => rows().length).toBe(4);
    await expect.poll(status).toBe("4 rows");
    await page.getByRole("searchbox", { name: "Search" }).fill("ada");
    await expect.poll(names).toEqual(["Ada Lovelace"]);
    await expect.poll(status).toBe("1 row");
  });

  test("nothing matching says so, with a button that clears the filters", async () => {
    await render(<People />);
    const search = page.getByRole("searchbox", { name: "Search" });
    await search.fill("zzz");
    await expect.element(page.getByText("No rows match.")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    expect(rows()).toHaveLength(10);
    await expect.element(search).toHaveValue("");
  });

  test("a debounce holds the filter back until typing stops", async () => {
    await render(
      <People
        toolbar={
          <DataTableToolbar>
            <DataTableFilterWithDebounce />
          </DataTableToolbar>
        }
      />,
    );
    await page.getByRole("searchbox", { name: "Search" }).fill("ada");
    expect(rows()).toHaveLength(10);
    await expect.poll(names).toEqual(["Ada Lovelace"]);
  });

  test("a column filter filters its own column", async () => {
    const filtered = helper.columns([
      helper.accessor("name", { header: "Name" }),
      helper.accessor("role", {
        header: ({ header }) => (
          <>
            <header.ColumnHeader>Role</header.ColumnHeader>
            <header.ColumnFilter />
          </>
        ),
        meta: { label: "Role" },
      }),
    ]);
    await render(<People options={{ columns: filtered }} />);
    await page.getByRole("searchbox", { name: "Filter Role" }).fill("adm");
    await expect.poll(() => rows().length).toBe(4);
    expect(rows().every((row) => cellText(row, 1) === "Admin")).toBe(true);
  });
});

function DataTableFilterWithDebounce() {
  const table = useTableContextForTest();
  return <table.Filter debounce={150} />;
}

describe("pagination", () => {
  test("says which rows are showing, and moves between pages", async () => {
    await render(<People />);
    const bar = page.getByRole("group", { name: "Pagination" });
    await expect.element(bar.getByText("1–10 of 12")).toBeVisible();
    await expect.element(bar.getByText("Page 1 of 2")).toBeVisible();

    await bar.getByRole("button", { name: "Next page" }).click();
    expect(names()).toEqual(["Kofi Mensah", "Lena Braun"]);
    await expect.element(bar.getByText("11–12 of 12")).toBeVisible();
    await expect.poll(status).toBe("Page 2 of 2");

    await bar.getByRole("button", { name: "First page" }).click();
    expect(rows()).toHaveLength(10);
    await bar.getByRole("button", { name: "Last page" }).click();
    expect(rows()).toHaveLength(2);
    await bar.getByRole("button", { name: "Previous page" }).click();
    expect(rows()).toHaveLength(10);
  });

  test("a button with no page to go to keeps focus and does nothing", async () => {
    await render(<People />);
    const next = page.getByRole("button", { name: "Next page" });
    next.element().focus();
    await userEvent.keyboard("{Enter}");
    expect(next.element().getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(next.element());
    await userEvent.keyboard("{Enter}");
    expect(rows()).toHaveLength(2);
    expect(document.activeElement).toBe(next.element());
  });

  test("rows per page changes the page size, and offers the size it has", async () => {
    await render(
      <People
        options={{
          initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
        }}
      />,
    );
    const select = page.getByRole("combobox", { name: "Rows per page" });
    expect(
      [...select.element().querySelectorAll("option")].map(
        (o) => o.textContent,
      ),
    ).toEqual(["5", "10", "20", "50", "100"]);
    expect(rows()).toHaveLength(5);
    await select.selectOptions("20");
    expect(rows()).toHaveLength(12);
  });
});

describe("selection", () => {
  test("each row's checkbox is named after the row", async () => {
    await render(<People />);
    await page.getByRole("checkbox", { name: "Select Ada Lovelace" }).click();
    expect(rows()[1]?.getAttribute("data-state")).toBe("selected");
    await expect.poll(status).toBe("1 selected");
  });

  test("without a row heading, a row is named by its place", async () => {
    await render(<People rowHeader={undefined} />);
    await expect
      .element(page.getByRole("checkbox", { name: "Select row 2" }))
      .toBeVisible();
  });

  test("the heading's checkbox selects the page, and shows a dash for some", async () => {
    await render(<People />);
    const all = page.getByRole("checkbox", {
      name: "Select all rows on this page",
    });
    await page.getByRole("checkbox", { name: "Select Bo Jensen" }).click();
    await expect.element(all).toHaveAttribute("data-state", "indeterminate");
    await all.click();
    await expect.element(all).toHaveAttribute("data-state", "checked");
    expect(
      rows().every((row) => row.getAttribute("data-state") === "selected"),
    ).toBe(true);
    await all.click();
    await expect.element(all).toHaveAttribute("data-state", "unchecked");
  });

  test("Shift and a click selects the rows in between", async () => {
    await render(<People />);
    await page.getByRole("checkbox", { name: "Select Ada Lovelace" }).click();
    await userEvent.keyboard("{Shift>}");
    await page.getByRole("checkbox", { name: "Select Emeka Obi" }).click();
    await userEvent.keyboard("{/Shift}");
    expect(
      rows().filter((row) => row.getAttribute("data-state") === "selected"),
    ).toHaveLength(4);
  });

  test("Shift and Space selects a range from the keyboard", async () => {
    await render(<People />);
    page
      .getByRole("checkbox", { name: "Select Ada Lovelace" })
      .element()
      .focus();
    await userEvent.keyboard(" ");
    page
      .getByRole("checkbox", { name: "Select Dana Scully" })
      .element()
      .focus();
    await userEvent.keyboard("{Shift>} {/Shift}");
    expect(
      rows().filter((row) => row.getAttribute("data-state") === "selected"),
    ).toHaveLength(3);
  });

  test("a row that can't be selected has a disabled checkbox, and the heading's doesn't count it", async () => {
    await render(
      <People
        options={{ enableRowSelection: (row) => row.original.role !== "Admin" }}
      />,
    );
    await expect
      .element(page.getByRole("checkbox", { name: "Select Cleo Park" }))
      .toBeDisabled();
    const all = page.getByRole("checkbox", {
      name: "Select all rows on this page",
    });
    await all.click();
    await expect.element(all).toHaveAttribute("data-state", "checked");
    expect(
      rows().filter((row) => row.getAttribute("data-state") === "selected"),
    ).toHaveLength(6);
  });

  test("selection is kept for a row that's gone from the data, until it's cleared", async () => {
    function Removable() {
      const [data, setData] = useState(people);
      const table = useDataTable({
        columns,
        data,
        getRowId: (person) => person.id,
      });
      return (
        <>
          <DataTable table={table} aria-label="People" rowHeader="name" />
          <Button onClick={() => setData((old) => old.slice(2))}>
            Drop two
          </Button>
          <output>{table.getSelectedRowIds().join(",")}</output>
        </>
      );
    }
    await render(<Removable />);
    await page.getByRole("checkbox", { name: "Select Ada Lovelace" }).click();
    await page.getByRole("button", { name: "Drop two" }).click();
    await expect.element(page.getByText("p2")).toBeVisible();
  });

  test("the keyboard selects", async () => {
    await render(<People />);
    page.getByRole("checkbox", { name: "Select Cleo Park" }).element().focus();
    await userEvent.keyboard(" ");
    expect(rows()[0]?.getAttribute("data-state")).toBe("selected");
  });

  test("the bar shows while rows are selected, and hands focus back when it goes", async () => {
    const remove = vi.fn();
    await render(
      <People
        bulkActions={(selected) => (
          <Button
            size="sm"
            intent="danger"
            onClick={() => remove(selected.map((row) => row.id))}
          >
            Delete
          </Button>
        )}
      />,
    );
    expect(
      page.getByRole("group", { name: "Selected rows" }).elements(),
    ).toHaveLength(0);
    await page.getByRole("checkbox", { name: "Select Ada Lovelace" }).click();
    await page.getByRole("checkbox", { name: "Select Bo Jensen" }).click();
    const bar = page.getByRole("group", { name: "Selected rows" });
    await expect.element(bar.getByText("2 selected")).toBeVisible();
    await bar.getByRole("button", { name: "Delete" }).click();
    expect(remove).toHaveBeenCalledWith(["p2", "p3"]);

    const clear = bar.getByRole("button", { name: "Clear selection" });
    clear.element().focus();
    await userEvent.keyboard("{Enter}");
    expect(
      page.getByRole("group", { name: "Selected rows" }).elements(),
    ).toHaveLength(0);
    expect(document.activeElement).toBe(
      page
        .getByRole("checkbox", { name: "Select all rows on this page" })
        .element(),
    );
  });
});

describe("column chooser", () => {
  test("hides and shows columns, and stays open between them", async () => {
    await render(<People />);
    await page.getByRole("button", { name: "Columns" }).click();
    const items = page.getByRole("menuitemcheckbox");
    // The checkbox column can't be hidden, so it isn't offered.
    expect(items.elements().map((item) => item.textContent)).toEqual([
      "Name",
      "Email",
      "Role",
      "Age",
    ]);
    await page.getByRole("menuitemcheckbox", { name: "Email" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Age" }).click();
    expect(header("Email").elements()).toHaveLength(0);
    expect(header("Age").elements()).toHaveLength(0);
    await page.getByRole("menuitemcheckbox", { name: "Email" }).click();
    await userEvent.keyboard("{Escape}");
    await expect.element(header("Email")).toBeVisible();
  });
});

describe("hidden columns", () => {
  test("a hidden column is still searched", async () => {
    await render(
      <People
        options={{ initialState: { columnVisibility: { email: false } } }}
      />,
    );
    expect(header("Email").elements()).toHaveLength(0);
    await page.getByRole("searchbox", { name: "Search" }).fill("ada@example");
    await expect.poll(names).toEqual(["Ada Lovelace"]);
  });
});

describe("pinned columns", () => {
  const pinning = {
    initialState: {
      columnPinning: { start: ["select", "name"], end: ["age"] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  };
  const box = (element: Element) => element.getBoundingClientRect();
  const container = () =>
    document.querySelector(".nuv-table-container") as HTMLElement;

  test("stay in view while the rest scrolls sideways", async () => {
    await setViewport("phone");
    await render(<People options={pinning} />);
    const scroller = container();
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    const name = header("Name").element();
    const age = header("Age").element();
    const before = { name: box(name).left, age: box(age).right };
    scroller.scrollLeft = 40;
    await expect.poll(() => scroller.scrollLeft).toBe(40);
    expect(box(name).left).toBeCloseTo(before.name, 0);
    expect(box(age).right).toBeCloseTo(before.age, 0);
    // The second pinned column starts where the first one ends.
    const select = document.querySelector(
      "thead [data-pin-index='0']",
    ) as Element;
    expect(box(name).left).toBeCloseTo(box(select).right, 0);
    // And the same in the body.
    const cells = rows()[0]?.querySelectorAll("th, td") as NodeListOf<Element>;
    expect(box(cells[1] as Element).left).toBeCloseTo(before.name, 0);
    expect(box(cells[4] as Element).right).toBeCloseTo(before.age, 0);
  });

  test("the page itself doesn't scroll sideways", async () => {
    await setViewport("phone");
    await render(<People options={pinning} />);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("the box takes focus while there's something to scroll, and is a named region", async () => {
    await setViewport("phone");
    await render(<People options={pinning} />);
    const scroller = container();
    await expect.poll(() => scroller.getAttribute("tabindex")).toBe("0");
    expect(scroller.getAttribute("role")).toBe("region");
    expect(scroller.getAttribute("aria-label")).toBe("People");
  });

  test("in right-to-left, the start is the right", async () => {
    await setViewport("phone");
    await render(
      <div dir="rtl">
        <DirectionProvider dir="rtl">
          <People options={pinning} />
        </DirectionProvider>
      </div>,
    );
    const scroller = container();
    const name = header("Name").element();
    const before = box(name).right;
    scroller.scrollLeft = -40;
    await expect.poll(() => scroller.scrollLeft).toBe(-40);
    expect(box(name).right).toBeCloseTo(before, 0);
    expect(box(name).right).toBeGreaterThan(
      box(header("Email").element()).right,
    );
  });
});

describe("resizing", () => {
  const sized = helper.columns([
    helper.accessor("name", {
      header: "Name",
      size: 200,
      minSize: 100,
      maxSize: 400,
    }),
    helper.accessor("email", { header: "Email", size: 240 }),
  ]);
  const handle = () => page.getByRole("separator", { name: "Resize Name" });

  test("no grips in the automatic layout", async () => {
    await render(<People options={{ columns: sized }} />);
    expect(page.getByRole("separator").elements()).toHaveLength(0);
  });

  test("in the fixed layout each column has its width, and the table their sum", async () => {
    await render(<People options={{ columns: sized }} layout="fixed" />);
    expect(header("Name").element().getBoundingClientRect().width).toBe(200);
    expect(header("Email").element().getBoundingClientRect().width).toBe(240);
    expect(
      page.getByRole("table").element().getBoundingClientRect().width,
    ).toBe(440);
  });

  test("the arrow keys resize, Home goes to the least, and Enter puts it back", async () => {
    await render(<People options={{ columns: sized }} layout="fixed" />);
    const width = () => header("Name").element().getBoundingClientRect().width;
    handle().element().focus();
    expect(handle().element().getAttribute("aria-valuenow")).toBe("200");
    expect(handle().element().getAttribute("aria-valuemin")).toBe("100");
    expect(handle().element().getAttribute("aria-valuemax")).toBe("400");
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(width).toBe(216);
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
    await expect.poll(width).toBe(280);
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(width).toBe(264);
    await userEvent.keyboard("{Home}");
    await expect.poll(width).toBe(100);
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(width).toBe(100);
    await userEvent.keyboard("{Enter}");
    await expect.poll(width).toBe(200);
  });

  test("in right-to-left the left arrow makes the column wider", async () => {
    await render(
      <div dir="rtl">
        <DirectionProvider dir="rtl">
          <People options={{ columns: sized }} layout="fixed" />
        </DirectionProvider>
      </div>,
    );
    handle().element().focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect
      .poll(() => header("Name").element().getBoundingClientRect().width)
      .toBe(216);
  });

  test("a heading wider than its column is cut short, and keeps inside it", async () => {
    const narrow = helper.columns([
      helper.accessor("name", {
        header: "A very long heading for a name",
        size: 80,
      }),
      helper.accessor("email", { header: "Email", size: 240 }),
    ]);
    await render(<People options={{ columns: narrow }} layout="fixed" />);
    const heading = page
      .getByRole("columnheader", { name: "A very long heading for a name" })
      .element();
    expect(heading.getBoundingClientRect().width).toBe(80);
    const text = heading.querySelector(
      ".nuv-data-table__heading",
    ) as HTMLElement;
    expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(
      heading.getBoundingClientRect().right,
    );
    expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
  });

  test("dragging the grip resizes, and a double click puts it back", async () => {
    await render(<People options={{ columns: sized }} layout="fixed" />);
    const width = () => header("Name").element().getBoundingClientRect().width;
    const grip = handle().element();
    const { right, top } = grip.getBoundingClientRect();
    const at = (x: number) => ({ clientX: x, clientY: top + 4, bubbles: true });
    grip.dispatchEvent(new MouseEvent("mousedown", at(right - 2)));
    document.dispatchEvent(new MouseEvent("mousemove", at(right + 38)));
    document.dispatchEvent(new MouseEvent("mouseup", at(right + 38)));
    await expect.poll(width).toBe(240);
    await handle().dblClick();
    await expect.poll(width).toBe(200);
  });
});

describe("expanding", () => {
  const withDetail = helper.columns([
    helper.expand(),
    helper.accessor("name", { header: "Name" }),
  ]);

  test("a row opens a panel under itself", async () => {
    await render(
      <People
        options={{ columns: withDetail, getRowCanExpand: () => true }}
        renderDetail={(row) => <p>Email: {row.original.email}</p>}
      />,
    );
    const open = page.getByRole("button", {
      name: "Show details for Ada Lovelace",
    });
    await expect.element(open).toHaveAttribute("aria-expanded", "false");
    await open.click();
    await expect
      .element(page.getByText("Email: ada@example.com"))
      .toBeVisible();
    const close = page.getByRole("button", {
      name: "Hide details for Ada Lovelace",
    });
    await expect.element(close).toHaveAttribute("aria-expanded", "true");
    close.element().focus();
    await userEvent.keyboard("{Enter}");
    expect(page.getByText("Email: ada@example.com").elements()).toHaveLength(0);
  });

  test("panels need no expanded row model", async () => {
    const features = tableFeatures({ rowExpandingFeature });
    const app = createDataTableHook({ features });
    const few = app.createColumnHelper<Person>();
    const fewColumns = few.columns([
      few.expand(),
      few.accessor("name", { header: "Name" }),
    ]);
    function Panels() {
      const table = app.useDataTable({
        columns: fewColumns,
        data: people,
        getRowCanExpand: (row) => row.original.role !== "Viewer",
      });
      return (
        <DataTable
          table={table}
          aria-label="People"
          rowHeader="name"
          renderDetail={(row) => <p>Role: {row.original.role}</p>}
        />
      );
    }
    await render(<Panels />);
    await page
      .getByRole("button", { name: "Show details for Ada Lovelace" })
      .click();
    await expect.element(page.getByText("Role: Editor")).toBeVisible();
    // A row that can't open has no button, and a gap where it would be.
    expect(
      page
        .getByRole("button", { name: "Show details for Bo Jensen" })
        .elements(),
    ).toHaveLength(0);
    expect(
      document.querySelectorAll(".nuv-data-table__expand-gap").length,
    ).toBe(4);
  });

  test("a tree opens the rows under a row, indented", async () => {
    const treeColumns = helper.columns([
      helper.accessor("name", {
        header: "Name",
        cell: ({ cell, getValue }) => (
          <>
            <cell.ExpandToggle /> {getValue()}
          </>
        ),
      }),
    ]);
    await render(
      <People
        options={{
          columns: treeColumns,
          data: tree,
          getSubRows: (person) => person.team,
        }}
      />,
    );
    expect(rows()).toHaveLength(2);
    await page
      .getByRole("button", { name: "Show details for Cleo Park" })
      .click();
    expect(rows()).toHaveLength(4);
    const toggle = page.getByRole("button", {
      name: "Show details for Bo Jensen",
    });
    expect(
      parseFloat(getComputedStyle(toggle.element()).marginInlineStart),
    ).toBe(20);
    await toggle.click();
    expect(rows()).toHaveLength(5);
  });
});

describe("states", () => {
  test("no rows", async () => {
    await render(<People options={{ data: [] }} />);
    await expect.element(page.getByText("No rows.")).toBeVisible();
    expect(rows()).toHaveLength(1);
    expect(rows()[0]?.querySelector("td")?.colSpan).toBe(5);
  });

  test("an empty state of your own", async () => {
    await render(
      <People options={{ data: [] }} empty="Nobody yet. Invite someone." />,
    );
    await expect
      .element(page.getByText("Nobody yet. Invite someone."))
      .toBeVisible();
  });

  test("the first load shows placeholders and marks the table busy", async () => {
    await render(<People options={{ data: [] }} loading loadingRows={3} />);
    expect(page.getByRole("table").element().getAttribute("aria-busy")).toBe(
      "true",
    );
    expect(document.querySelectorAll(".nuv-skeleton")).toHaveLength(15);
    expect(page.getByText("No rows.").elements()).toHaveLength(0);
  });

  test("a later load keeps the rows it has", async () => {
    await render(<People loading />);
    expect(rows()).toHaveLength(10);
    expect(page.getByRole("table").element().getAttribute("aria-busy")).toBe(
      "true",
    );
  });

  test("an error is said at once, with a way to try again", async () => {
    const retry = vi.fn();
    await render(<People error onRetry={retry} />);
    const alert = page.getByRole("alert");
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain(
      "The rows couldn't be loaded.",
    );
    await alert.getByRole("button", { name: "Try again" }).click();
    expect(retry).toHaveBeenCalledOnce();
  });

  test("an error message of your own", async () => {
    await render(<People error="The server is down." />);
    await expect.element(page.getByRole("alert")).toBeVisible();
    expect(page.getByRole("alert").element().textContent).toBe(
      "The server is down.",
    );
  });
});

describe("labels", () => {
  test("every piece of text can be replaced", async () => {
    await render(
      <People
        labels={{
          search: "Suchen",
          columns: "Spalten",
          rowsPerPage: "Zeilen pro Seite",
          nextPage: "Nächste Seite",
          selectRow: (row) => `${row} auswählen`,
          page: (current, pages) => `Seite ${current} von ${pages}`,
        }}
      />,
    );
    await expect
      .element(page.getByRole("searchbox", { name: "Suchen" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Spalten" }))
      .toBeVisible();
    await expect.element(page.getByText("Seite 1 von 2")).toBeVisible();
    await expect
      .element(page.getByRole("checkbox", { name: "Ada Lovelace auswählen" }))
      .toBeVisible();
  });
});

describe("a table with fewer features", () => {
  const sortingOnly = tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: { text: sortFn_text },
  });
  const app = createDataTableHook({ features: sortingOnly });
  const few = app.createColumnHelper<Person>();
  const fewColumns = few.columns([
    few.accessor("name", { header: "Name" }),
    few.accessor("role", { header: "Role", enableSorting: false }),
  ]);

  function Few() {
    const table = app.useDataTable({ columns: fewColumns, data: people });
    return <DataTable table={table} aria-label="People" />;
  }

  test("shows the controls it has features for, and no others", async () => {
    await render(<Few />);
    expect(rows()).toHaveLength(12);
    expect(page.getByRole("searchbox").elements()).toHaveLength(0);
    expect(
      page.getByRole("group", { name: "Pagination" }).elements(),
    ).toHaveLength(0);
    expect(page.getByRole("checkbox").elements()).toHaveLength(0);
    expect(document.querySelector(".nuv-data-table__toolbar")).toBeNull();
    await page.getByRole("button", { name: "Name" }).click();
    expect(cellText(rows()[0] as Element, 0)).toBe("Ada Lovelace");
  });

  const none = tableFeatures({});
  const plainColumns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "role", header: "Role" },
  ];

  function Plain() {
    const table = useTable({
      features: none,
      columns: plainColumns,
      data: people,
    });
    return <DataTable table={table} caption="People" />;
  }

  test("takes a table from TanStack's own useTable, with no features at all", async () => {
    await render(<Plain />);
    expect(rows()).toHaveLength(12);
    expect(page.getByRole("button").elements()).toHaveLength(0);
    await expect.element(header("Name")).toBeVisible();
  });

  function Narrow() {
    // Only follows the pagination state. The parts still have to see a sort.
    const table = useDataTable({ columns, data: people }, (state) => ({
      pagination: state.pagination,
    }));
    return <DataTable table={table} aria-label="People" />;
  }

  test("follows all of the table's state when the table was told to follow some", async () => {
    await render(<Narrow />);
    await sortButton("Name").click();
    await expect.poll(() => names()[0]).toBe("Ada Lovelace");
    expect(header("Name").element().getAttribute("aria-sort")).toBe(
      "ascending",
    );
  });
});

describe("grouped headings", () => {
  const grouped = helper.columns([
    helper.accessor("name", { header: "Name" }),
    helper.group({
      id: "contact",
      header: "Contact",
      columns: helper.columns([
        helper.accessor("email", { header: "Email" }),
        helper.accessor("role", { header: "Role" }),
      ]),
    }),
  ]);

  test("a group spans its columns, and a column outside one spans both rows", async () => {
    await render(<People options={{ columns: grouped }} />);
    const contact = header("Contact").element() as HTMLTableCellElement;
    expect(contact.colSpan).toBe(2);
    expect(contact.getAttribute("scope")).toBe("col");
    const name = header("Name").element() as HTMLTableCellElement;
    expect(name.rowSpan).toBe(2);
    expect(page.getByRole("columnheader").elements()).toHaveLength(4);
    expect(document.querySelectorAll("thead td")).toHaveLength(0);
  });
});

describe("footers", () => {
  const withFooter = helper.columns([
    helper.accessor("name", { header: "Name", footer: "Average" }),
    helper.accessor("age", {
      header: "Age",
      footer: ({ table }) => {
        const all = table.getCoreRowModel().rows;
        return Math.round(
          all.reduce((sum, row) => sum + row.original.age, 0) / all.length,
        );
      },
    }),
  ]);

  test("a column's footer is drawn under it", async () => {
    await render(<People options={{ columns: withFooter }} />);
    const foot = document.querySelector("tfoot") as Element;
    expect(
      [...foot.querySelectorAll("td")].map((cell) => cell.textContent),
    ).toEqual(["Average", "42"]);
  });
});

describe("a server doing the work", () => {
  const fetchPeople = vi.fn(
    (request: {
      pagination: { pageIndex: number; pageSize: number };
      sorting: { id: string; desc: boolean }[];
      globalFilter: string;
    }) => {
      let found = people.filter((person) =>
        person.name.toLowerCase().includes(request.globalFilter.toLowerCase()),
      );
      const [sort] = request.sorting;
      if (sort) {
        found = [...found].sort(
          (a, b) => a.name.localeCompare(b.name) * (sort.desc ? -1 : 1),
        );
      }
      const start = request.pagination.pageIndex * request.pagination.pageSize;
      return {
        rows: found.slice(start, start + request.pagination.pageSize),
        total: found.length,
      };
    },
  );

  function Server() {
    const [request, options] = useDataTableRequest({
      pagination: { pageIndex: 0, pageSize: 5 },
    });
    const [result, setResult] = useState(() => fetchPeople(request));
    const [loading, setLoading] = useState(false);
    const [asked, setAsked] = useState(request);
    if (asked !== request) {
      setAsked(request);
      setLoading(true);
      setTimeout(() => {
        setResult(fetchPeople(request));
        setLoading(false);
      }, 50);
    }
    const table = useDataTable({
      columns,
      data: result.rows,
      rowCount: result.total,
      getRowId: (person) => person.id,
      ...options,
    });
    return (
      <DataTable
        table={table}
        aria-label="People"
        loading={loading}
        rowHeader="name"
      />
    );
  }

  beforeEach(() => {
    fetchPeople.mockClear();
  });

  test("the table reports what's asked for and shows what comes back", async () => {
    await render(<Server />);
    expect(names()).toHaveLength(5);
    await expect.element(page.getByText("1–5 of 12")).toBeVisible();

    await page.getByRole("button", { name: "Next page" }).click();
    await expect.poll(() => names()[0]).toBe("Fatima Zahra");
    expect(fetchPeople).toHaveBeenLastCalledWith(
      expect.objectContaining({ pagination: { pageIndex: 1, pageSize: 5 } }),
    );
    await expect.poll(status).toBe("Page 2 of 3");
  });

  test("a sort is the server's, and goes back to the first page", async () => {
    await render(<Server />);
    await page.getByRole("button", { name: "Next page" }).click();
    await expect.poll(() => names()[0]).toBe("Fatima Zahra");
    await sortButton("Name").click();
    await expect.poll(() => names()[0]).toBe("Ada Lovelace");
    expect(fetchPeople).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sorting: [{ id: "name", desc: false }],
        pagination: { pageIndex: 0, pageSize: 5 },
      }),
    );
    expect(header("Name").element().getAttribute("aria-sort")).toBe(
      "ascending",
    );
  });

  test("a filter is the server's, and its count is read out once the rows are back", async () => {
    await render(<Server />);
    await page.getByRole("button", { name: "Next page" }).click();
    await expect.poll(() => names()[0]).toBe("Fatima Zahra");
    await page.getByRole("searchbox", { name: "Search" }).fill("an");
    await expect
      .poll(names)
      .toEqual(
        ["Dana Scully", "Hana Sato", "Goran Ilic"].sort(
          (a, b) =>
            people.findIndex((p) => p.name === a) -
            people.findIndex((p) => p.name === b),
        ),
      );
    await expect.element(page.getByText("1–3 of 3")).toBeVisible();
    await expect.poll(status).toBe("3 rows");
  });

  // The way an app without a fetching library does it. Loading is set by
  // the effect, so it's still false in the render where the filter changed.
  function ServerWithEffect({ markLoading = true }: { markLoading?: boolean }) {
    const [request, options] = useDataTableRequest({
      pagination: { pageIndex: 0, pageSize: 5 },
    });
    const [result, setResult] = useState(() => fetchPeople(request));
    const [loading, setLoading] = useState(false);
    const first = useRef(true);
    useEffect(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      setLoading(true);
      const timer = setTimeout(() => {
        setResult(fetchPeople(request));
        setLoading(false);
      }, 80);
      return () => clearTimeout(timer);
    }, [request]);
    const table = useDataTable({
      columns,
      data: result.rows,
      rowCount: result.total,
      getRowId: (person) => person.id,
      ...options,
    });
    return (
      <DataTable
        table={table}
        aria-label="People"
        rowHeader="name"
        loading={markLoading && loading}
      />
    );
  }

  test("the count waits for the rows when loading is set an effect later", async () => {
    await render(<ServerWithEffect />);
    await page.getByRole("searchbox", { name: "Search" }).fill("an");
    // Not the twelve that were there when the filter changed.
    await expect.poll(status).toBe("3 rows");
    expect(names()).toHaveLength(3);
  });

  test("and when the table is never marked as loading", async () => {
    await render(<ServerWithEffect markLoading={false} />);
    await page.getByRole("searchbox", { name: "Search" }).fill("an");
    await expect.poll(status).toBe("3 rows");
    await sortButton("Name").click();
    await expect.poll(status).toBe("Sorted by Name, ascending");
  });

  test("selection is kept across pages, by id", async () => {
    await render(<Server />);
    await page.getByRole("checkbox", { name: "Select Ada Lovelace" }).click();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect.poll(() => names()[0]).toBe("Fatima Zahra");
    await page.getByRole("checkbox", { name: "Select Fatima Zahra" }).click();
    await expect.poll(status).toBe("2 selected");
  });
});

describe("arranging the parts yourself", () => {
  function Custom() {
    const table = useDataTable({ columns, data: people });
    return (
      <DataTableRoot table={table} rowHeader="name">
        <DataTablePagination pageSizes={[]} />
        <DataTableContent aria-label="People" stickyHeader striped />
        <table.Toolbar>
          <table.ColumnChooser />
        </table.Toolbar>
      </DataTableRoot>
    );
  }

  test("the parts work in any order inside the root", async () => {
    await render(<Custom />);
    expect(page.getByRole("combobox").elements()).toHaveLength(0);
    expect(page.getByRole("searchbox").elements()).toHaveLength(0);
    await page.getByRole("button", { name: "Next page" }).click();
    expect(rows()).toHaveLength(2);
    expect(getComputedStyle(header("Name").element()).position).toBe("sticky");
  });

  test("a part outside the root says what's wrong", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<DataTablePagination />)).rejects.toThrow(
      "DataTablePagination has to be inside a DataTable or DataTableRoot.",
    );
  });

  test("a column filter outside a header takes its column", async () => {
    function Outside() {
      const table = useDataTable({ columns, data: people });
      return (
        <DataTableRoot table={table}>
          <DataTableColumnFilter column={table.getColumn("role")} />
          <DataTableContent aria-label="People" />
        </DataTableRoot>
      );
    }
    await render(<Outside />);
    await page.getByRole("searchbox", { name: "Filter Role" }).fill("viewer");
    await expect.poll(() => rows().length).toBe(4);
  });
});

describe("density", () => {
  const rowHeight = () => (rows()[0] as Element).getBoundingClientRect().height;
  const plain = helper.columns([helper.accessor("name", { header: "Name" })]);

  test.each([
    ["compact", 36],
    ["default", 40],
    ["comfortable", 44],
  ])("%s rows are %ipx", async (density, height) => {
    document.documentElement.setAttribute("data-density", density);
    await render(<People options={{ columns: plain }} />);
    expect(rowHeight()).toBe(height);
  });

  test("the row height and the cell padding are variables", async () => {
    await render(
      <div
        style={
          {
            "--nuv-table-row-height": "64px",
            "--nuv-table-cell-padding-x": "32px",
          } as ComponentProps<"div">["style"]
        }
      >
        <People options={{ columns: plain }} />
      </div>,
    );
    expect(rowHeight()).toBe(64);
    const cell = rows()[0]?.querySelector("td, th") as Element;
    expect(getComputedStyle(cell).paddingInlineStart).toBe("32px");
  });
});

describe("accessibility", () => {
  test.each(themes)("no violations in %s", async (theme) => {
    const screen = await renderThemed(
      theme,
      <People
        caption="Everyone on the team"
        stickyHeader
        bulkActions={<Button size="sm">Export</Button>}
        options={{
          initialState: {
            rowSelection: { p2: true },
            sorting: [{ id: "name", desc: false }],
            columnPinning: { start: ["select"], end: [] },
            pagination: { pageIndex: 0, pageSize: 5 },
          },
        }}
      />,
    );
    expect(await axe(screen.container)).toHaveNoViolations();
  });

  test.each(["light", "dark"] as const)(
    "no violations with no rows, loading, failed and resizable, in %s",
    async (theme) => {
      const screen = await renderThemed(
        theme,
        <>
          <People aria-label="Empty" options={{ data: [] }} />
          <People aria-label="Loading" options={{ data: [] }} loading />
          <People aria-label="Failed" error onRetry={() => {}} />
          <People aria-label="Resizable" layout="fixed" />
        </>,
      );
      expect(await axe(screen.container)).toHaveNoViolations();
    },
  );
});

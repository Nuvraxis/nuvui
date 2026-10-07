import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef } from "react";
import { beforeEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from ".";

const invoices = [
  { id: "INV-001", customer: "Acme", status: "Paid", total: "$250.00" },
  { id: "INV-002", customer: "Globex", status: "Pending", total: "$1,150.00" },
  { id: "INV-003", customer: "Initech", status: "Overdue", total: "$350.00" },
  { id: "INV-004", customer: "Umbrella", status: "Paid", total: "$450.00" },
];

function Invoices({
  container,
  selected,
  ...props
}: ComponentProps<typeof Table> & {
  container?: ComponentProps<typeof TableContainer>;
  selected?: string;
}) {
  return (
    <TableContainer {...container}>
      <Table {...props}>
        <TableCaption>Invoices this month</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead pinned="start" pinnedEdge>
              Invoice
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="end">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} selected={invoice.id === selected}>
              <TableCell rowHeader pinned="start" pinnedEdge>
                {invoice.id}
              </TableCell>
              <TableCell>{invoice.customer}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell align="end">{invoice.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell align="end">$2,200.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}

const box = () => document.querySelector(".nuv-table-container") as HTMLElement;
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

beforeEach(async () => {
  await setViewport("desktop");
});

describe("markup", () => {
  test("it's a real table, named by its caption", async () => {
    await render(<Invoices />);
    const table = page.getByRole("table", { name: "Invoices this month" });
    await expect.element(table).toBeVisible();
    expect(table.element().tagName).toBe("TABLE");
    expect(page.getByRole("row").elements()).toHaveLength(6);
  });

  test("a heading is a th for its column, and a row's heading a th for its row", async () => {
    await render(<Invoices />);
    const heading = page
      .getByRole("columnheader", { name: "Customer" })
      .element();
    expect(heading.tagName).toBe("TH");
    expect(heading.getAttribute("scope")).toBe("col");
    const row = page.getByRole("rowheader", { name: "INV-002" }).element();
    expect(row.tagName).toBe("TH");
    expect(row.getAttribute("scope")).toBe("row");
  });

  test("a row's heading reads like the cells next to it, a little heavier", async () => {
    await render(<Invoices />);
    const row = page.getByRole("rowheader", { name: "INV-002" }).element();
    const cell = page.getByRole("cell", { name: "Globex" }).element();
    expect(style(row).textAlign).toBe("start");
    expect(style(row).color).toBe(style(cell).color);
    expect(Number(style(row).fontWeight)).toBeGreaterThan(
      Number(style(cell).fontWeight),
    );
  });

  test("every part takes a ref, a class and other attributes", async () => {
    const refs = {
      container: createRef<HTMLDivElement>(),
      table: createRef<HTMLTableElement>(),
      caption: createRef<HTMLTableCaptionElement>(),
      header: createRef<HTMLTableSectionElement>(),
      body: createRef<HTMLTableSectionElement>(),
      footer: createRef<HTMLTableSectionElement>(),
      row: createRef<HTMLTableRowElement>(),
      head: createRef<HTMLTableCellElement>(),
      cell: createRef<HTMLTableCellElement>(),
    };
    await render(
      <TableContainer ref={refs.container} className="a" data-part="container">
        <Table ref={refs.table} className="b">
          <TableCaption ref={refs.caption} className="c">
            Caption
          </TableCaption>
          <TableHeader ref={refs.header} className="d">
            <TableRow ref={refs.row} className="e">
              <TableHead ref={refs.head} className="f">
                Heading
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={refs.body} className="g">
            <TableRow>
              <TableCell ref={refs.cell} className="h">
                Cell
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter ref={refs.footer} className="i" />
        </Table>
      </TableContainer>,
    );
    expect(refs.container.current?.className).toBe("nuv-table-container a");
    expect(refs.container.current?.dataset.part).toBe("container");
    expect(refs.table.current?.className).toBe("nuv-table b");
    expect(refs.caption.current?.className).toBe("nuv-table__caption c");
    expect(refs.header.current?.className).toBe("nuv-table__header d");
    expect(refs.row.current?.className).toBe("nuv-table__row e");
    expect(refs.head.current?.className).toBe("nuv-table__head f");
    expect(refs.body.current?.className).toBe("nuv-table__body g");
    expect(refs.cell.current?.className).toBe("nuv-table__cell h");
    expect(refs.footer.current?.className).toBe("nuv-table__footer i");
  });

  test("a hidden caption still names the table", async () => {
    await render(
      <Table>
        <TableCaption visuallyHidden>Hidden name</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    await expect
      .element(page.getByRole("table", { name: "Hidden name" }))
      .toBeVisible();
    const caption = document.querySelector("caption") as Element;
    expect(rect(caption).width).toBeLessThanOrEqual(1);
  });
});

describe("looks", () => {
  test("alignment", async () => {
    await render(<Invoices />);
    expect(
      style(page.getByRole("columnheader", { name: "Total" }).element())
        .textAlign,
    ).toBe("end");
    expect(
      style(page.getByRole("cell", { name: "$250.00" }).element()).textAlign,
    ).toBe("end");
    expect(
      style(page.getByRole("columnheader", { name: "Customer" }).element())
        .textAlign,
    ).toBe("start");
  });

  test("a selected row is marked and painted", async () => {
    await render(<Invoices selected="INV-002" />);
    const rows = page.getByRole("row").elements();
    expect(rows[2]?.getAttribute("data-state")).toBe("selected");
    expect(rows[1]?.hasAttribute("data-state")).toBe(false);
    const picked = style(
      rows[2]?.querySelector("td") as Element,
    ).backgroundColor;
    const plain = style(
      rows[1]?.querySelector("td") as Element,
    ).backgroundColor;
    expect(picked).not.toBe(plain);
  });

  test("stripes shade every second row of the body, and no row of the footer", async () => {
    await render(<Invoices striped />);
    const rows = page.getByRole("row").elements();
    const color = (index: number) =>
      style(rows[index]?.querySelector("td") as Element).backgroundColor;
    expect(color(2)).not.toBe(color(1));
    expect(color(3)).toBe(color(1));
    expect(color(4)).toBe(color(2));
  });

  test("rows follow the density, and a touch of the variable sets them", async () => {
    document.documentElement.setAttribute("data-density", "compact");
    await render(<Invoices />);
    const row = page.getByRole("row").elements()[1] as Element;
    expect(rect(row).height).toBe(36);
  });

  test("fixed layout", async () => {
    await render(<Invoices layout="fixed" />);
    expect(style(page.getByRole("table").element()).tableLayout).toBe("fixed");
  });
});

describe("scrolling", () => {
  beforeEach(async () => {
    await setViewport("phone");
  });

  const narrow = { style: { width: 280 } };

  test("a wide table scrolls inside its box, and the page doesn't", async () => {
    await render(<Invoices container={narrow} />);
    expect(box().scrollWidth).toBeGreaterThan(box().clientWidth);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("the box takes focus while it scrolls, and the arrow keys scroll it", async () => {
    await render(
      <Invoices container={{ ...narrow, "aria-label": "Invoices" }} />,
    );
    await expect.poll(() => box().getAttribute("tabindex")).toBe("0");
    expect(box().getAttribute("role")).toBe("region");
    box().focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => box().scrollLeft).toBeGreaterThan(0);
  });

  test("a box with nothing to scroll isn't a stop for Tab", async () => {
    await setViewport("desktop");
    await render(<Invoices container={{ "aria-label": "Invoices" }} />);
    expect(box().hasAttribute("tabindex")).toBe(false);
    expect(box().hasAttribute("role")).toBe(false);
  });

  test("the focus ring is drawn inside the box", async () => {
    await render(<Invoices container={narrow} />);
    await expect.poll(() => box().getAttribute("tabindex")).toBe("0");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(box());
    expect(style(box()).outlineStyle).toBe("solid");
    expect(parseFloat(style(box()).outlineOffset)).toBeLessThan(0);
  });

  test("a pinned column stays put, with a line at its edge", async () => {
    await render(<Invoices container={narrow} />);
    const cell = page.getByRole("rowheader", { name: "INV-001" }).element();
    const before = rect(cell).left;
    box().scrollLeft = 15;
    await expect.poll(() => box().scrollLeft).toBe(15);
    expect(rect(cell).left).toBeCloseTo(before, 0);
    expect(parseFloat(style(cell).borderInlineEndWidth)).toBeGreaterThan(0);
    // It's painted, or the cells scrolling under it would show through.
    expect(style(cell).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("a sticky header stays at the top of a box with a height", async () => {
    await render(
      <Invoices stickyHeader container={{ style: { maxHeight: 120 } }} />,
    );
    const heading = page
      .getByRole("columnheader", { name: "Customer" })
      .element();
    box().scrollTop = 80;
    await expect.poll(() => box().scrollTop).toBe(80);
    expect(rect(heading).top).toBeCloseTo(rect(box()).top + 1, 0);
    // The pinned heading is over both the header and the pinned column.
    const corner = page
      .getByRole("columnheader", { name: "Invoice" })
      .element();
    expect(Number(style(corner).zIndex)).toBeGreaterThan(
      Number(style(heading).zIndex),
    );
  });

  test("the height of the box is a variable", async () => {
    await render(
      <div
        style={
          {
            "--nuv-table-container-max-height": "100px",
          } as ComponentProps<"div">["style"]
        }
      >
        <Invoices />
      </div>,
    );
    expect(rect(box()).height).toBe(100);
  });
});

describe("forced colors", () => {
  test("a selected row has a bar at its start", async () => {
    await emulateMedia({ forcedColors: "active" });
    await render(<Invoices selected="INV-002" />);
    const rows = page.getByRole("row").elements();
    const picked = rows[2]?.firstElementChild as Element;
    const plain = rows[1]?.firstElementChild as Element;
    expect(parseFloat(style(picked).borderInlineStartWidth)).toBe(4);
    expect(parseFloat(style(plain).borderInlineStartWidth)).toBe(0);
    await emulateMedia({ forcedColors: null });
  });
});

describe("accessibility", () => {
  test.each(themes)("no violations in %s", async (theme) => {
    const screen = await renderThemed(
      theme,
      <Invoices selected="INV-002" striped />,
    );
    expect(await axe(screen.container)).toHaveNoViolations();
  });
});

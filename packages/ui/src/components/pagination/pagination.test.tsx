import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import { tabsToLinks } from "../../../test/keys";
import { setViewport } from "../../../test/media";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  type PaginationProps,
  paginationRange,
} from "./pagination";

// Page `current` of `count`, built the way the docs say to.
function Example({
  current = 5,
  count = 20,
  siblings,
  ...props
}: PaginationProps & { current?: number; count?: number; siblings?: number }) {
  return (
    <Pagination {...props}>
      <PaginationList>
        <PaginationItem>
          <PaginationPrevious
            href={`#page-${current - 1}`}
            disabled={current === 1}
          />
        </PaginationItem>
        {paginationRange({ page: current, count, siblings }).map((entry) => (
          <PaginationItem key={entry}>
            {typeof entry === "number" ? (
              <PaginationLink
                href={`#page-${entry}`}
                active={entry === current}
                aria-label={`Page ${entry}`}
              >
                {entry}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={`#page-${current + 1}`}
            disabled={current === count}
          />
        </PaginationItem>
      </PaginationList>
    </Pagination>
  );
}

const nav = () => page.getByRole("navigation");
const link = (name: string) => page.getByRole("link", { name, exact: true });
const rect = (element: Element) => element.getBoundingClientRect();
const label = (name: string) =>
  link(name).element().querySelector(".nuv-pagination__label") as Element;

describe("rendering", () => {
  test("is a navigation landmark named Pagination, around a list of links", async () => {
    await render(<Example />);

    await expect.element(nav()).toHaveAccessibleName("Pagination");
    await expect.element(nav()).toHaveClass("nuv-pagination");
    expect(page.getByRole("list").element().tagName).toBe("UL");
    await expect.element(link("Page 4")).toHaveAttribute("href", "#page-4");
  });

  test("takes a translated name", async () => {
    await render(<Example aria-label="Seiten" />);

    await expect.element(nav()).toHaveAccessibleName("Seiten");
  });

  test("the current page says so, and no other link does", async () => {
    await render(<Example />);

    await expect
      .element(link("Page 5"))
      .toHaveAttribute("aria-current", "page");
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(1);
    expect(document.querySelectorAll("[data-active]")).toHaveLength(1);
  });

  test("Previous and Next have their names, an arrow each, and go one page either way", async () => {
    await render(<Example />);

    await expect.element(link("Previous")).toHaveAttribute("href", "#page-4");
    await expect.element(link("Next")).toHaveAttribute("href", "#page-6");
    await expect
      .element(link("Previous"))
      .toHaveClass("nuv-pagination__link", "nuv-pagination__link--previous");
    await expect
      .element(link("Next"))
      .toHaveClass("nuv-pagination__link", "nuv-pagination__link--next");
    // The arrow is on the outer side of each.
    const first = (name: string) => link(name).element().firstElementChild;
    expect(first("Previous")?.tagName.toLowerCase()).toBe("svg");
    expect(first("Next")?.tagName.toLowerCase()).toBe("span");
  });

  test("their text can be translated", async () => {
    await render(
      <Pagination>
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious href="#1">Zurück</PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#3">Weiter</PaginationNext>
          </PaginationItem>
        </PaginationList>
      </Pagination>,
    );

    await expect.element(link("Zurück")).toBeVisible();
    await expect.element(link("Weiter")).toBeVisible();
  });

  test("the three dots have a name, which can be translated", async () => {
    const screen = await render(<Example />);
    expect(
      page.getByRole("img", { name: "More pages" }).elements(),
    ).toHaveLength(2);
    await screen.unmount();

    await render(<PaginationEllipsis label="Weitere Seiten" />);
    await expect
      .element(page.getByRole("img", { name: "Weitere Seiten" }))
      .toBeVisible();
  });

  test("every part forwards its ref and keeps a className", async () => {
    const refs = {
      nav: createRef<HTMLElement>(),
      list: createRef<HTMLUListElement>(),
      item: createRef<HTMLLIElement>(),
      link: createRef<HTMLAnchorElement>(),
      previous: createRef<HTMLAnchorElement>(),
      next: createRef<HTMLAnchorElement>(),
      ellipsis: createRef<HTMLSpanElement>(),
    };
    await render(
      <Pagination ref={refs.nav} className="mine">
        <PaginationList ref={refs.list} className="mine">
          <PaginationItem ref={refs.item} className="mine">
            <PaginationPrevious
              ref={refs.previous}
              className="mine"
              href="#1"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink ref={refs.link} className="mine" href="#2">
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis ref={refs.ellipsis} className="mine" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext ref={refs.next} className="mine" href="#3" />
          </PaginationItem>
        </PaginationList>
      </Pagination>,
    );

    expect(refs.nav.current?.className).toBe("nuv-pagination mine");
    expect(refs.list.current?.className).toBe("nuv-pagination__list mine");
    expect(refs.item.current?.className).toBe("nuv-pagination__item mine");
    expect(refs.link.current?.className).toBe("nuv-pagination__link mine");
    expect(refs.previous.current?.className).toBe(
      "nuv-pagination__link nuv-pagination__link--previous mine",
    );
    expect(refs.next.current?.className).toBe(
      "nuv-pagination__link nuv-pagination__link--next mine",
    );
    expect(refs.ellipsis.current?.className).toBe(
      "nuv-pagination__ellipsis mine",
    );
  });
});

describe("disabled", () => {
  test("Previous on the first page is still a link to a screen reader, and leads nowhere", async () => {
    await render(<Example current={1} />);
    const previous = link("Previous");

    await expect.element(previous).toHaveAttribute("aria-disabled", "true");
    await expect.element(previous).toHaveAttribute("data-disabled");
    await expect.element(previous).not.toHaveAttribute("href");
    expect(getComputedStyle(previous.element()).pointerEvents).toBe("none");
    expect(getComputedStyle(previous.element()).opacity).toBe("0.5");
  });

  test("Next on the last page is the same", async () => {
    await render(<Example current={20} />);

    await expect.element(link("Next")).toHaveAttribute("aria-disabled", "true");
    await expect.element(link("Next")).not.toHaveAttribute("href");
    await expect.element(link("Previous")).toHaveAttribute("href", "#page-19");
  });

  test.skipIf(!tabsToLinks)("Tab skips a disabled link", async () => {
    await render(<Example current={1} count={3} />);

    await userEvent.keyboard("{Tab}");

    await expect.element(link("Page 1")).toHaveFocus();
  });
});

describe("asChild", () => {
  test("a button takes the link's look and its state", async () => {
    await render(
      <Pagination>
        <PaginationList>
          <PaginationItem>
            <PaginationLink asChild active>
              <button type="button">1</button>
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink asChild disabled>
              <button type="button" disabled>
                2
              </button>
            </PaginationLink>
          </PaginationItem>
        </PaginationList>
      </Pagination>,
    );
    const one = page.getByRole("button", { name: "1" });
    const two = page.getByRole("button", { name: "2" });

    await expect.element(one).toHaveClass("nuv-pagination__link");
    await expect.element(one).toHaveAttribute("aria-current", "page");
    await expect.element(two).toBeDisabled();
    await expect.element(two).toHaveAttribute("data-disabled");
    // No role on an element that already has one of its own.
    await expect.element(two).not.toHaveAttribute("role");
    expect(getComputedStyle(two.element()).opacity).toBe("0.5");
  });

  test("Previous and Next put their arrow and their text inside your element", async () => {
    await render(
      <Pagination>
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious asChild>
              <a href="#1" data-router="">
                Back
              </a>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext asChild>
              <a href="#3" data-router="">
                Forward
              </a>
            </PaginationNext>
          </PaginationItem>
        </PaginationList>
      </Pagination>,
    );

    for (const name of ["Back", "Forward"]) {
      const element = link(name).element();
      expect(element.hasAttribute("data-router")).toBe(true);
      expect(element.classList.contains("nuv-pagination__link")).toBe(true);
      expect(element.querySelector("svg")).not.toBeNull();
      expect(label(name).textContent).toBe(name);
    }
    expect(link("Back").element().className).toContain("--previous");
    expect(link("Forward").element().className).toContain("--next");
  });
});

describe("keyboard", () => {
  test.skipIf(!tabsToLinks)("Tab goes through the links in order", async () => {
    await render(<Example current={2} count={3} />);

    const visited: string[] = [];
    for (let press = 0; press < 5; press += 1) {
      await userEvent.keyboard("{Tab}");
      visited.push(document.activeElement?.textContent ?? "");
    }

    expect(visited).toEqual(["Previous", "1", "2", "3", "Next"]);
  });

  test("a link with keyboard focus has a ring that can be seen", async () => {
    await render(<Example />);

    // Focus that didn't come from the pointer, which is what gets a ring.
    (link("Previous").element() as HTMLElement).focus();

    const style = getComputedStyle(link("Previous").element());
    expect(style.outlineStyle).toBe("solid");
    expect(contrast(style.outlineColor, "white")).toBeGreaterThanOrEqual(3);
  });
});

describe("layout", () => {
  test("with a mouse a page link is a 40px square", async () => {
    await render(<Example />);
    const box = rect(link("Page 4").element());

    expect(box.width).toBe(40);
    expect(box.height).toBe(40);
  });

  test("a long number makes its link wider, not taller", async () => {
    await render(<Example current={12345} count={99999} />);
    const box = rect(link("Page 12345").element());

    expect(box.width).toBeGreaterThan(40);
    expect(box.height).toBe(40);
  });

  test("on a desktop the links sit in one row, centered, 4px apart", async () => {
    await setViewport("desktop");
    await render(<Example />);
    const links = page.getByRole("link").elements();
    const tops = new Set(links.map((element) => rect(element).top));
    const list = rect(page.getByRole("list").element());
    const first = rect(links[0] as Element);
    const last = rect(links.at(-1) as Element);

    expect(tops.size).toBe(1);
    expect(first.left - list.left).toBeCloseTo(list.right - last.right, 0);
    expect(rect(link("Page 5").element()).left).toBe(
      rect(link("Page 4").element()).right + 4,
    );
  });

  test("on a desktop Previous and Next show their text", async () => {
    await setViewport("desktop");
    await render(<Example />);

    expect(rect(label("Previous")).width).toBeGreaterThan(40);
    expect(rect(link("Previous").element()).width).toBeGreaterThan(80);
  });

  test("on a phone they show the arrow alone, and keep their names", async () => {
    await setViewport("phone");
    await render(<Example />);

    for (const name of ["Previous", "Next"]) {
      expect(rect(label(name)).width).toBe(1);
      expect(rect(link(name).element()).width).toBe(40);
      await expect.element(link(name)).toHaveAccessibleName(name);
    }
  });

  test("with no numbers either side of the current one, the links fit a phone in one row", async () => {
    await setViewport("phone");
    await render(<Example siblings={0} />);
    const tops = new Set(
      page
        .getByRole("link")
        .elements()
        .map((element) => rect(element).top),
    );

    expect(tops.size).toBe(1);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("more links than fit wrap, and the page doesn't scroll sideways", async () => {
    await setViewport("phone");
    await render(
      <div style={{ inlineSize: 200 }}>
        <Example />
      </div>,
    );

    expect(rect(page.getByRole("list").element()).height).toBeGreaterThan(80);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("the arrows point the other way in a right-to-left layout", async () => {
    await setViewport("desktop");
    const screen = await render(
      <div dir="rtl">
        <Example />
      </div>,
    );
    const arrow = screen.container.querySelector(
      ".nuv-pagination__arrow",
    ) as Element;

    expect(getComputedStyle(arrow).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    // Previous is now on the right, with its arrow on its outer side.
    expect(rect(link("Previous").element()).left).toBeGreaterThan(
      rect(link("Next").element()).left,
    );
    expect(rect(arrow).left).toBeGreaterThan(rect(label("Previous")).left);
  });
});

describe("styles", () => {
  test("the current page is filled, and stands out from the page around it", async () => {
    await render(<Example />);
    const current = getComputedStyle(link("Page 5").element());
    const other = getComputedStyle(link("Page 4").element());

    expect(other.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    // 3:1 against the page to be seen as a state, 4.5:1 for its own number.
    expect(contrast(current.backgroundColor, "white")).toBeGreaterThanOrEqual(
      3,
    );
    expect(
      contrast(current.color, current.backgroundColor),
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("a link changes color under the pointer, and the current one doesn't", async () => {
    await render(<Example />);
    const other = getComputedStyle(link("Page 4").element());
    const current = getComputedStyle(link("Page 5").element());
    const filled = current.backgroundColor;

    await userEvent.hover(link("Page 4"));
    await expect.poll(() => other.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

    await userEvent.hover(link("Page 5"));
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(current.backgroundColor).toBe(filled);
  });

  test("numbers are all the same width, so the row doesn't shift", async () => {
    await render(<Example />);

    expect(getComputedStyle(link("Page 4").element()).fontVariantNumeric).toBe(
      "tabular-nums",
    );
  });

  test("component variables change the size, the gap and the colors", async () => {
    await render(
      <Example
        style={
          {
            "--nuv-pagination-size": "32px",
            "--nuv-pagination-gap": "12px",
            "--nuv-pagination-radius": "0px",
            "--nuv-pagination-fg": "rgb(10, 20, 30)",
            "--nuv-pagination-active-bg": "rgb(40, 50, 60)",
            "--nuv-pagination-active-fg": "rgb(250, 250, 250)",
          } as never
        }
      />,
    );
    const other = getComputedStyle(link("Page 4").element());
    const current = getComputedStyle(link("Page 5").element());

    expect(rect(link("Page 4").element()).height).toBe(32);
    expect(rect(link("Page 5").element()).left).toBe(
      rect(link("Page 4").element()).right + 12,
    );
    expect(other.borderTopLeftRadius).toBe("0px");
    expect(other.color).toBe("rgb(10, 20, 30)");
    expect(current.backgroundColor).toBe("rgb(40, 50, 60)");
    expect(current.color).toBe("rgb(250, 250, 250)");
  });
});

describe("paginationRange", () => {
  test("shows every page when there are few", () => {
    expect(paginationRange({ page: 1, count: 1 })).toEqual([1]);
    expect(paginationRange({ page: 3, count: 7 })).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  test("leaves a gap at the end while the current page is near the start", () => {
    expect(paginationRange({ page: 1, count: 20 })).toEqual([
      1,
      2,
      3,
      4,
      5,
      "ellipsis-end",
      20,
    ]);
    expect(paginationRange({ page: 4, count: 20 })).toEqual([
      1,
      2,
      3,
      4,
      5,
      "ellipsis-end",
      20,
    ]);
  });

  test("leaves a gap on both sides in the middle", () => {
    expect(paginationRange({ page: 10, count: 20 })).toEqual([
      1,
      "ellipsis-start",
      9,
      10,
      11,
      "ellipsis-end",
      20,
    ]);
  });

  test("leaves a gap at the start while the current page is near the end", () => {
    expect(paginationRange({ page: 18, count: 20 })).toEqual([
      1,
      "ellipsis-start",
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  test("siblings and boundaries widen what's shown", () => {
    expect(
      paginationRange({ page: 10, count: 20, siblings: 2, boundaries: 2 }),
    ).toEqual([
      1,
      2,
      "ellipsis-start",
      8,
      9,
      10,
      11,
      12,
      "ellipsis-end",
      19,
      20,
    ]);
    expect(paginationRange({ page: 10, count: 20, siblings: 0 })).toEqual([
      1,
      "ellipsis-start",
      10,
      "ellipsis-end",
      20,
    ]);
  });

  test("gives nothing for no pages, and puts a page that's out of range back in it", () => {
    expect(paginationRange({ page: 1, count: 0 })).toEqual([]);
    expect(paginationRange({ page: 99, count: 20 })).toEqual(
      paginationRange({ page: 20, count: 20 }),
    );
    expect(paginationRange({ page: -3, count: 20 })).toEqual(
      paginationRange({ page: 1, count: 20 }),
    );
  });

  // Every page of every count, for a spread of settings.
  test("holds its promises for every page", () => {
    for (const siblings of [0, 1, 2, 3]) {
      for (const boundaries of [1, 2, 3]) {
        for (let count = 1; count <= 40; count += 1) {
          const lengths = new Set<number>();
          for (let current = 1; current <= count; current += 1) {
            const range = paginationRange({
              page: current,
              count,
              siblings,
              boundaries,
            });
            const numbers = range.filter(
              (entry): entry is number => typeof entry === "number",
            );
            lengths.add(range.length);

            // The current page, the first and the last are always there.
            expect(numbers).toContain(current);
            expect(numbers[0]).toBe(1);
            expect(numbers.at(-1)).toBe(count);
            // In order, and no entry twice. That's what makes them keys.
            expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
            expect(new Set(range).size).toBe(range.length);
            // A gap stands for two pages or more, never for one.
            range.forEach((entry, index) => {
              if (typeof entry === "number") return;
              const before = range[index - 1] as number;
              const after = range[index + 1] as number;
              expect(after - before).toBeGreaterThan(2);
            });
            // Without a gap between them, two numbers are neighbours.
            numbers.forEach((number, index) => {
              const next = numbers[index + 1];
              if (next === undefined) return;
              const gap = range[range.indexOf(number) + 1] !== next;
              if (!gap) expect(next - number).toBe(1);
            });
          }
          // The row is the same length whichever page is current.
          expect(lengths.size).toBe(1);
        }
      }
    }
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, with a link disabled", async () => {
    const screen = await renderThemed(theme, <Example current={1} />);

    await expectNoViolations(screen.container);
  });

  test("the current page and a hovered link pass axe", async () => {
    const screen = await renderThemed(theme, <Example />);
    await userEvent.hover(link("Page 4"));

    await expectNoViolations(screen.container);
  });
});

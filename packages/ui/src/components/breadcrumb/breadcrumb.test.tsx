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
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  type BreadcrumbProps,
  BreadcrumbSeparator,
} from "./breadcrumb";

function Example(props: BreadcrumbProps) {
  return (
    <Breadcrumb {...props}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#home">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Atlas</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const nav = () => page.getByRole("navigation");
const link = (name: string) => page.getByRole("link", { name });
const rect = (element: Element) => element.getBoundingClientRect();

describe("rendering", () => {
  test("is a navigation landmark named Breadcrumb, around an ordered list", async () => {
    await render(<Example />);

    await expect.element(nav()).toHaveAccessibleName("Breadcrumb");
    await expect.element(nav()).toHaveClass("nuv-breadcrumb");
    expect(page.getByRole("list").element().tagName).toBe("OL");
    // The four entries. The separators aren't announced.
    expect(page.getByRole("listitem").elements()).toHaveLength(4);
  });

  test("takes a translated name", async () => {
    await render(<Example aria-label="Brotkrumen" />);

    await expect.element(nav()).toHaveAccessibleName("Brotkrumen");
  });

  test("the entries before the last are links", async () => {
    await render(<Example />);

    await expect.element(link("Home")).toHaveAttribute("href", "#home");
    await expect.element(link("Projects")).toHaveClass("nuv-breadcrumb__link");
  });

  test("the last entry is the current page, and not a link", async () => {
    await render(<Example />);
    const current = page.getByText("Atlas");

    await expect.element(current).toHaveAttribute("aria-current", "page");
    expect(current.element().tagName).toBe("SPAN");
    expect(page.getByRole("link").elements()).toHaveLength(2);
  });

  test("a separator is hidden from screen readers, and draws an arrow", async () => {
    await render(<Example />);
    const separator = document.querySelector(
      ".nuv-breadcrumb__separator",
    ) as Element;

    expect(separator.tagName).toBe("LI");
    expect(separator.getAttribute("aria-hidden")).toBe("true");
    expect(separator.getAttribute("role")).toBe("presentation");
    expect(separator.querySelector("svg")).not.toBeNull();
  });

  test("a separator draws its children when it has some", async () => {
    await render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#home">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Atlas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const separator = document.querySelector(
      ".nuv-breadcrumb__separator",
    ) as Element;

    expect(separator.textContent).toBe("/");
    expect(separator.querySelector("svg")).toBeNull();
  });

  test("the three dots have a name, which can be translated", async () => {
    const screen = await render(<Example />);
    await expect.element(page.getByRole("img", { name: "More" })).toBeVisible();
    await screen.unmount();

    await render(<BreadcrumbEllipsis label="Mehr" />);
    await expect.element(page.getByRole("img", { name: "Mehr" })).toBeVisible();
  });

  test("asChild puts the link's class on your own element", async () => {
    await render(
      <BreadcrumbLink asChild>
        <button type="button">Projects</button>
      </BreadcrumbLink>,
    );

    await expect
      .element(page.getByRole("button", { name: "Projects" }))
      .toHaveClass("nuv-breadcrumb__link");
  });

  test("every part forwards its ref and keeps a className", async () => {
    const refs = {
      nav: createRef<HTMLElement>(),
      list: createRef<HTMLOListElement>(),
      item: createRef<HTMLLIElement>(),
      link: createRef<HTMLAnchorElement>(),
      separator: createRef<HTMLLIElement>(),
      ellipsis: createRef<HTMLSpanElement>(),
      page: createRef<HTMLSpanElement>(),
    };
    await render(
      <Breadcrumb ref={refs.nav} className="mine">
        <BreadcrumbList ref={refs.list} className="mine">
          <BreadcrumbItem ref={refs.item} className="mine">
            <BreadcrumbLink ref={refs.link} className="mine" href="#home">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator ref={refs.separator} className="mine" />
          <BreadcrumbItem>
            <BreadcrumbEllipsis ref={refs.ellipsis} className="mine" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage ref={refs.page} className="mine">
              Atlas
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(refs.nav.current?.className).toBe("nuv-breadcrumb mine");
    expect(refs.list.current?.className).toBe("nuv-breadcrumb__list mine");
    expect(refs.item.current?.className).toBe("nuv-breadcrumb__item mine");
    expect(refs.link.current?.className).toBe("nuv-breadcrumb__link mine");
    expect(refs.separator.current?.className).toBe(
      "nuv-breadcrumb__separator mine",
    );
    expect(refs.ellipsis.current?.className).toBe(
      "nuv-breadcrumb__ellipsis mine",
    );
    expect(refs.page.current?.className).toBe("nuv-breadcrumb__page mine");
  });
});

describe("keyboard", () => {
  test.skipIf(!tabsToLinks)(
    "Tab goes through the links, and skips the current page",
    async () => {
      await render(
        <>
          <Example />
          <button type="button">After</button>
        </>,
      );

      await userEvent.keyboard("{Tab}");
      await expect.element(link("Home")).toHaveFocus();
      await userEvent.keyboard("{Tab}");
      await expect.element(link("Projects")).toHaveFocus();
      await userEvent.keyboard("{Tab}");
      await expect
        .element(page.getByRole("button", { name: "After" }))
        .toHaveFocus();
    },
  );

  test("a link with keyboard focus has a ring that can be seen", async () => {
    await render(<Example />);

    // Focus that didn't come from the pointer, which is what gets a ring.
    (link("Home").element() as HTMLElement).focus();

    const style = getComputedStyle(link("Home").element());
    expect(style.outlineStyle).toBe("solid");
    expect(contrast(style.outlineColor, "white")).toBeGreaterThanOrEqual(3);
  });
});

describe("layout", () => {
  test("the entries sit in a row, in order, with a mark between each two", async () => {
    await render(<Example />);
    const lefts = [
      ...document.querySelectorAll(".nuv-breadcrumb__list > li"),
    ].map((part) => rect(part).left);

    expect(lefts).toHaveLength(7);
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
    expect(new Set(lefts).size).toBe(7);
  });

  test("with a mouse, a link is as tall as its line of text", async () => {
    await render(<Example />);

    expect(rect(link("Home").element()).height).toBe(20);
  });

  test("a long trail wraps on a phone and doesn't widen the page", async () => {
    await setViewport("phone");
    await render(
      <Breadcrumb>
        <BreadcrumbList>
          {["Home", "Customers", "Northwind Traders", "Orders", "2026"].map(
            (name) => (
              <BreadcrumbItem key={name}>
                <BreadcrumbLink href={`#${name}`}>{name}</BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
            ),
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>
              Order 10248 for a customer whose name goes on for a while
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(rect(page.getByRole("list").element()).height).toBeGreaterThan(40);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("one long word breaks instead of widening the page", async () => {
    await setViewport("phone");
    await render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{"a".repeat(120)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("the arrow points the other way in a right-to-left layout", async () => {
    const screen = await render(
      <div dir="rtl">
        <Example />
      </div>,
    );
    const chevron = screen.container.querySelector(
      ".nuv-breadcrumb__chevron",
    ) as Element;

    expect(getComputedStyle(chevron).transform).toBe(
      "matrix(-1, 0, 0, 1, 0, 0)",
    );
    // And the trail starts from the right.
    expect(rect(link("Home").element()).left).toBeGreaterThan(
      rect(page.getByText("Atlas").element()).left,
    );
  });

  test("the arrow isn't flipped in a left-to-right layout", async () => {
    await render(<Example />);

    expect(
      getComputedStyle(
        document.querySelector(".nuv-breadcrumb__chevron") as Element,
      ).transform,
    ).toBe("none");
  });
});

describe("styles", () => {
  test("the current page is darker and heavier than the links", async () => {
    await render(<Example />);
    const current = getComputedStyle(page.getByText("Atlas").element());
    const other = getComputedStyle(link("Home").element());

    expect(current.color).not.toBe(other.color);
    expect(Number(current.fontWeight)).toBeGreaterThan(
      Number(other.fontWeight),
    );
  });

  test("a link is underlined and darker under the pointer", async () => {
    await render(<Example />);
    const style = getComputedStyle(link("Home").element());
    const resting = style.color;
    expect(style.textDecorationLine).toBe("none");

    await userEvent.hover(link("Home"));

    expect(style.textDecorationLine).toBe("underline");
    expect(style.color).not.toBe(resting);
  });

  test("component variables change the colors and the gap", async () => {
    await render(
      <Example
        style={
          {
            "--nuv-breadcrumb-fg": "rgb(10, 20, 30)",
            "--nuv-breadcrumb-current-fg": "rgb(40, 50, 60)",
            "--nuv-breadcrumb-gap": "20px",
          } as never
        }
      />,
    );

    expect(getComputedStyle(link("Home").element()).color).toBe(
      "rgb(10, 20, 30)",
    );
    expect(getComputedStyle(page.getByText("Atlas").element()).color).toBe(
      "rgb(40, 50, 60)",
    );
    const separator = document.querySelector(
      ".nuv-breadcrumb__separator",
    ) as Element;
    expect(rect(separator).left - rect(link("Home").element()).right).toBe(20);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(theme, <Example />);

    await expectNoViolations(screen.container);
  });
});

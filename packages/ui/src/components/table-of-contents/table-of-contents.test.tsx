import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  TableOfContents,
  type TableOfContentsItem,
  type TableOfContentsProps,
} from "./table-of-contents";

const items: TableOfContentsItem[] = [
  { id: "install", title: "Install" },
  { id: "usage", title: "Usage" },
  { id: "props", title: "Props", depth: 2 },
  { id: "accessibility", title: "Accessibility" },
];

// A page with room above its first heading, two long sections and two
// short ones. The headings are about 300, 1000, 1700 and 1900 pixels down
// and the page about 2100 tall, so the last two can't reach the top of a
// window.
const heights = [700, 700, 200, 200];

function Page(props: Partial<TableOfContentsProps>) {
  return (
    <div style={{ display: "flex" }}>
      <TableOfContents
        aria-label="On this page"
        items={items}
        style={{ position: "sticky", top: 0, alignSelf: "flex-start" }}
        {...props}
      />
      <div style={{ flex: 1 }}>
        <div style={{ height: 300 }} />
        {items.map((item, index) => (
          <section key={item.id} style={{ height: heights[index] }}>
            <h2 id={item.id} style={{ margin: 0 }}>
              About {item.id}
            </h2>
          </section>
        ))}
      </div>
    </div>
  );
}

const nav = () => page.getByRole("navigation", { name: "On this page" });
const link = (name: string) => page.getByRole("link", { name, exact: true });
const current = () =>
  nav().element().querySelector("[aria-current]")?.textContent ?? null;
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();
const end = () => document.documentElement.scrollHeight - window.innerHeight;

// The page is the test's own, and so is its address.
afterEach(() => {
  window.scrollTo(0, 0);
  history.replaceState(null, "", location.pathname + location.search);
});

describe("rendering", () => {
  test("is a navigation landmark with a list of links to the headings", async () => {
    await render(<Page />);

    await expect.element(nav()).toHaveClass("nuv-table-of-contents");
    expect(nav().element().tagName).toBe("NAV");
    expect(nav().getByRole("list").element().tagName).toBe("OL");
    expect(nav().getByRole("listitem").elements()).toHaveLength(4);
    expect(
      nav()
        .getByRole("link")
        .elements()
        .map((element) => element.getAttribute("href")),
    ).toEqual(["#install", "#usage", "#props", "#accessibility"]);
  });

  test("a title can be more than text", async () => {
    await render(
      <TableOfContents
        aria-label="On this page"
        items={[
          {
            id: "install",
            title: (
              <>
                Install <code>nuvui</code>
              </>
            ),
          },
        ]}
      />,
    );

    await expect.element(link("Install nuvui")).toBeVisible();
  });

  test("no items is an empty list", async () => {
    await render(<TableOfContents aria-label="On this page" items={[]} />);

    expect(nav().getByRole("link").elements()).toHaveLength(0);
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLElement>();
    await render(
      <TableOfContents
        ref={ref}
        aria-label="On this page"
        items={items}
        className="mine"
        id="contents"
      />,
    );

    expect(ref.current).toBe(nav().element());
    expect(ref.current?.className).toBe("nuv-table-of-contents mine");
    expect(ref.current?.id).toBe("contents");
  });
});

describe("following the page", () => {
  test("above the first heading none is marked", async () => {
    await render(<Page />);

    expect(current()).toBeNull();
  });

  test("the last heading to have reached the top is marked, and only that one", async () => {
    await render(<Page />);

    window.scrollTo(0, 250);
    await expect.poll(current).toBe("Install");
    expect(link("Install").element().getAttribute("aria-current")).toBe(
      "location",
    );

    window.scrollTo(0, 950);
    await expect.poll(current).toBe("Usage");
    expect(nav().element().querySelectorAll("[aria-current]")).toHaveLength(1);

    window.scrollTo(0, 250);
    await expect.poll(current).toBe("Install");
    window.scrollTo(0, 0);
    await expect.poll(current).toBeNull();
  });

  test("offset says how far down the window counts as reached", async () => {
    await render(<Page offset={0} />);

    // The heading is 50 pixels from the top: reached by default, and not
    // with no offset.
    window.scrollTo(0, 250);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(current()).toBeNull();

    // Past it, whatever room the page has around its edge.
    window.scrollTo(0, 320);
    await expect.poll(current).toBe("Install");
  });

  test("at the end of the page the last heading is marked, though it can't reach the top", async () => {
    await render(<Page />);

    window.scrollTo(0, end());

    await expect.poll(current).toBe("Accessibility");
    expect(
      rect(document.getElementById("accessibility") as Element).top,
    ).toBeGreaterThan(96);
  });

  test("a link that's followed to the end of the page is the one marked there", async () => {
    await render(<Page />);

    await link("Props").click();

    await expect.poll(() => window.scrollY).toBe(end());
    await expect.poll(current).toBe("Props");

    // Scrolling away forgets it.
    window.scrollTo(0, 950);
    await expect.poll(current).toBe("Usage");
    window.scrollTo(0, end());
    await expect.poll(current).toBe("Accessibility");
  });

  test("a heading that isn't in the page is passed over", async () => {
    await render(
      <Page items={[...items, { id: "changelog", title: "Changelog" }]} />,
    );

    window.scrollTo(0, end());

    await expect.poll(current).toBe("Accessibility");
  });

  test("it hears a part of the page that scrolls by itself", async () => {
    await render(
      <>
        <TableOfContents
          aria-label="On this page"
          offset={150}
          items={[
            { id: "one", title: "One" },
            { id: "two", title: "Two" },
          ]}
        />
        <div data-testid="scroller" style={{ height: 300, overflow: "auto" }}>
          <div style={{ height: 400 }} />
          <h2 id="one" style={{ margin: 0, height: 600 }}>
            One
          </h2>
          <h2 id="two" style={{ margin: 0, height: 600 }}>
            Two
          </h2>
        </div>
      </>,
    );
    const scroller = page.getByTestId("scroller").element();
    expect(current()).toBeNull();

    // The box starts under the list. This brings the first heading to its
    // top edge, which is within the offset of the top of the window.
    scroller.scrollTop = 400;
    await expect.poll(current).toBe("One");
    scroller.scrollTop = 1000;
    await expect.poll(current).toBe("Two");
  });

  test("reports the heading it has reached", async () => {
    const onValueChange = vi.fn();
    await render(<Page onValueChange={onValueChange} />);

    window.scrollTo(0, 950);
    await expect.poll(() => onValueChange.mock.lastCall?.[0]).toBe("usage");
    window.scrollTo(0, 0);
    await expect.poll(() => onValueChange.mock.lastCall?.[0]).toBeNull();
  });

  test("controlled, it marks the heading it's given, and still reports", async () => {
    const onValueChange = vi.fn();
    const screen = await render(
      <Page value="props" onValueChange={onValueChange} />,
    );
    expect(current()).toBe("Props");

    window.scrollTo(0, 950);
    await expect.poll(() => onValueChange.mock.lastCall?.[0]).toBe("usage");
    expect(current()).toBe("Props");

    await screen.rerender(<Page value={null} onValueChange={onValueChange} />);
    expect(current()).toBeNull();
  });
});

describe("styles", () => {
  test("a line runs down the start edge, and the marked link draws a bar on it", async () => {
    await render(<Page value="usage" />);
    const list = nav().getByRole("list").element();
    const marked = link("Usage").element();
    const bar = getComputedStyle(marked, "::before");

    expect(style(list).borderLeftStyle).toBe("solid");
    expect(style(list).borderLeftWidth).toBe("2px");
    expect(bar.content).toBe('""');
    expect(bar.borderLeftStyle).toBe("solid");
    expect(bar.borderLeftWidth).toBe("2px");
    expect(bar.borderLeftColor).not.toBe(style(list).borderLeftColor);
    // The bar is on the line, not beside it.
    expect(rect(marked).left).toBe(rect(list).left);
    expect(
      getComputedStyle(link("Install").element(), "::before").content,
    ).toBe("none");
  });

  test("the marked link is heavier and stronger than the rest", async () => {
    await render(<Page value="usage" />);
    const marked = style(link("Usage").element());
    const other = style(link("Install").element());

    expect(Number(marked.fontWeight)).toBeGreaterThan(Number(other.fontWeight));
    expect(marked.color).not.toBe(other.color);
    expect(other.textDecorationLine).toBe("none");
  });

  test("a deeper heading is set further in", async () => {
    await render(<Page />);

    expect(style(link("Install").element()).paddingLeft).toBe("12px");
    expect(style(link("Props").element()).paddingLeft).toBe("24px");
    expect(link("Props").element().dataset.depth).toBe("2");
    expect(link("Install").element().dataset.depth).toBe("1");
  });

  test("with a mouse a link is 32 pixels tall, and a long title wraps", async () => {
    await render(
      <div style={{ width: 140 }}>
        <TableOfContents
          aria-label="On this page"
          items={[
            { id: "a", title: "Short" },
            { id: "b", title: "What the component handles for you" },
            { id: "c", title: "Averyveryverylongwordwithnowheretobreak" },
          ]}
        />
      </div>,
    );

    expect(rect(link("Short").element()).height).toBe(32);
    expect(
      rect(link("What the component handles for you").element()).height,
    ).toBeGreaterThan(32);
    expect(nav().element().scrollWidth).toBeLessThanOrEqual(
      nav().element().clientWidth,
    );
  });

  test("component variables change the look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-table-of-contents-line-width": "4px",
            "--nuv-table-of-contents-line": "rgb(40, 50, 60)",
            "--nuv-table-of-contents-active-line": "rgb(70, 80, 90)",
            "--nuv-table-of-contents-fg": "rgb(100, 110, 120)",
            "--nuv-table-of-contents-active-fg": "rgb(10, 20, 30)",
            "--nuv-table-of-contents-indent": "20px",
            "--nuv-table-of-contents-item-height": "50px",
          } as never
        }
      >
        <Page value="usage" />
      </div>,
    );
    const list = style(nav().getByRole("list").element());

    expect(list.borderLeftWidth).toBe("4px");
    expect(list.borderLeftColor).toBe("rgb(40, 50, 60)");
    expect(
      getComputedStyle(link("Usage").element(), "::before").borderLeftColor,
    ).toBe("rgb(70, 80, 90)");
    expect(style(link("Install").element()).color).toBe("rgb(100, 110, 120)");
    expect(style(link("Usage").element()).color).toBe("rgb(10, 20, 30)");
    expect(style(link("Props").element()).paddingLeft).toBe("32px");
    expect(rect(link("Install").element()).height).toBe(50);
  });

  test("in a right-to-left page the line and the bar are on the right", async () => {
    await render(
      <div dir="rtl">
        <Page value="usage" />
      </div>,
    );
    const list = nav().getByRole("list").element();

    expect(style(list).borderRightWidth).toBe("2px");
    expect(style(list).borderLeftWidth).toBe("0px");
    expect(
      getComputedStyle(link("Usage").element(), "::before").borderRightWidth,
    ).toBe("2px");
    expect(rect(link("Usage").element()).right).toBe(rect(list).right);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, with a heading marked", async () => {
    const screen = await renderThemed(
      theme,
      <TableOfContents aria-label="On this page" items={items} value="usage" />,
    );

    await expectNoViolations(screen.container);
  });

  test("the bar reaches 3:1 against the page", async () => {
    await render(
      <div
        data-testid="page"
        {...themeAttributes(theme)}
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <TableOfContents
          aria-label="On this page"
          items={items}
          value="usage"
        />
      </div>,
    );

    expect(
      contrast(
        getComputedStyle(link("Usage").element(), "::before").borderLeftColor,
        style(page.getByTestId("page").element()).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});

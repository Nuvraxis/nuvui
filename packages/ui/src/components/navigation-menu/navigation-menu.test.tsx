import "../../styles/index.scss";
import { axe, withFocusProxy } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { tabsToLinks } from "@nuvui/tooling/test/keys";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { type CSSProperties, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  type NavigationMenuProps,
  NavigationMenuTrigger,
} from "./navigation-menu";

const list: CSSProperties = {
  display: "grid",
  gap: 4,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

// Radix opens a panel when the pointer comes to rest on its button, and a
// click on a button whose panel is open closes it. A scripted click moves
// the pointer there first, so with a short delay the two would race. The
// delay here is long enough that a click is only ever a click. The tests
// about the pointer pass a delay of their own.
function Example({
  wrapper,
  delayDuration = 60_000,
  ...props
}: NavigationMenuProps & { wrapper?: CSSProperties }) {
  return (
    <div style={{ padding: 16, ...wrapper }}>
      <NavigationMenu delayDuration={delayDuration} {...props}>
        <NavigationMenuList>
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul style={{ ...list, inlineSize: 300 }}>
                <li>
                  <NavigationMenuLink href="#analytics">
                    Analytics
                    <span>Traffic and conversion, by page.</span>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#billing">
                    Billing
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="company">
            <NavigationMenuTrigger>Company</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul style={{ ...list, inlineSize: 200 }}>
                <li>
                  <NavigationMenuLink href="#about">About</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#careers">
                    Careers
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#press">Press</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#pricing" active>
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      {/* Plain, so that what axe measures is the menu and not the look a
          browser gives a button of its own. */}
      <button
        type="button"
        style={{
          marginBlockStart: 320,
          border: 0,
          background: "none",
          color: "inherit",
        }}
      >
        After
      </button>
    </div>
  );
}

const nav = () => page.getByRole("navigation");
const trigger = (name: string) => page.getByRole("button", { name });
const link = (name: string | RegExp) => page.getByRole("link", { name });
const viewport = () =>
  document.querySelector(
    ".nuv-navigation-menu__viewport",
  ) as HTMLElement | null;
const rect = (element: Element) => element.getBoundingClientRect();

// Radix moves focus a moment after an arrow key goes down. See the same
// helper in the radio group's tests.
async function arrow(key: "ArrowRight" | "ArrowLeft" | "ArrowDown") {
  await userEvent.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await userEvent.keyboard(`{/${key}}`);
}

// The panel animates its size as well as its arrival, and Radix measures the
// content a frame after it shows. This waits until the panel has that size.
async function openStill(node: React.ReactNode, width: number) {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await expect.poll(() => viewport()?.clientWidth).toBe(width);
  return viewport() as HTMLElement;
}

describe("rendering", () => {
  test("is a navigation landmark with a list of buttons and links", async () => {
    await render(<Example />);

    await expect.element(nav()).toHaveClass("nuv-navigation-menu");
    await expect.element(nav()).toHaveAccessibleName("Main");
    await expect
      .element(trigger("Products"))
      .toHaveAttribute("aria-expanded", "false");
    await expect.element(link("Pricing")).toHaveAttribute("href", "#pricing");
    expect(viewport()).toBeNull();
  });

  test("takes a translated name", async () => {
    await render(<Example aria-label="Hauptmenü" />);

    await expect.element(nav()).toHaveAccessibleName("Hauptmenü");
  });

  test("a click on a button shows its panel, and a second click hides it", async () => {
    await render(<Example />);

    await trigger("Products").click();
    await expect.element(link(/^Analytics/)).toBeVisible();
    await expect
      .element(trigger("Products"))
      .toHaveAttribute("aria-expanded", "true");
    expect(viewport()).not.toBeNull();

    await trigger("Products").click();
    await expect.element(link(/^Analytics/)).not.toBeInTheDocument();
    await expect.poll(viewport).toBeNull();
  });

  test("the panel is named by the button that opened it", async () => {
    await render(<Example defaultValue="products" />);
    await expect.element(link(/^Analytics/)).toBeVisible();

    const content = document.querySelector(
      ".nuv-navigation-menu__content",
    ) as Element;
    expect(content.getAttribute("aria-labelledby")).toBe(
      trigger("Products").element().id,
    );
  });

  test("the link to the current page says so", async () => {
    await render(<Example />);

    await expect
      .element(link("Pricing"))
      .toHaveAttribute("aria-current", "page");
    await expect.element(link("Docs")).not.toHaveAttribute("aria-current");
  });

  test("following a link in the panel closes it", async () => {
    await render(<Example defaultValue="products" />);

    await link("Billing").click();

    await expect.element(link("Billing")).not.toBeInTheDocument();
  });

  test("a click outside closes the panel", async () => {
    await render(<Example defaultValue="products" />);
    await expect.element(link(/^Analytics/)).toBeVisible();

    await page.getByRole("button", { name: "After" }).click();

    await expect.element(link(/^Analytics/)).not.toBeInTheDocument();
  });

  test("forwards refs and keeps classNames", async () => {
    const root = createRef<HTMLElement>();
    const listRef = createRef<HTMLUListElement>();
    const itemRef = createRef<HTMLLIElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    const linkRef = createRef<HTMLAnchorElement>();
    await render(
      <NavigationMenu ref={root} className="mine" defaultValue="a" align="end">
        <NavigationMenuList ref={listRef} className="row">
          <NavigationMenuItem ref={itemRef} className="entry" value="a">
            <NavigationMenuTrigger ref={triggerRef} className="button">
              Products
            </NavigationMenuTrigger>
            <NavigationMenuContent ref={contentRef} className="panel">
              <NavigationMenuLink ref={linkRef} className="go" href="#a">
                Analytics
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    await expect.element(link(/^Analytics/)).toBeVisible();

    expect(root.current?.className).toBe(
      "nuv-navigation-menu nuv-navigation-menu--end mine",
    );
    expect(listRef.current?.className).toBe("nuv-navigation-menu__list row");
    expect(itemRef.current?.className).toBe("nuv-navigation-menu__item entry");
    expect(triggerRef.current?.className).toBe(
      "nuv-navigation-menu__trigger button",
    );
    expect(contentRef.current?.className).toBe(
      "nuv-navigation-menu__content panel",
    );
    expect(linkRef.current?.className).toBe("nuv-navigation-menu__link go");
  });

  test("can be controlled", async () => {
    const onValueChange = vi.fn();
    await render(<Example value="company" onValueChange={onValueChange} />);
    await expect.element(link("Careers")).toBeVisible();

    await trigger("Products").click();

    expect(onValueChange).toHaveBeenCalledWith("products");
    // Still the same panel, because the parent hasn't changed the prop.
    await expect.element(link("Careers")).toBeVisible();
  });
});

describe("pointer", () => {
  test("resting on a button shows its panel, and leaving hides it", async () => {
    await render(<Example delayDuration={0} />);

    await userEvent.hover(trigger("Products"));
    await expect.element(link(/^Analytics/)).toBeVisible();

    await userEvent.hover(page.getByRole("button", { name: "After" }));
    await expect.element(link(/^Analytics/)).not.toBeInTheDocument();
  });

  // Radix alone closes the panel here: the pointer opens it, and the click
  // that follows counts as a second press.
  test("a click on a button the pointer has just opened leaves its panel open", async () => {
    await render(<Example delayDuration={0} />);
    await userEvent.hover(trigger("Products"));
    await expect.element(link(/^Analytics/)).toBeVisible();

    await trigger("Products").click();
    // Long enough for a close to have happened.
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect.element(link(/^Analytics/)).toBeVisible();

    await trigger("Products").click();
    await expect.element(link(/^Analytics/)).not.toBeInTheDocument();
  });

  test("the same goes for a button the pointer moved to from another", async () => {
    await render(<Example defaultValue="products" delayDuration={0} />);
    await userEvent.hover(trigger("Company"));
    await expect.element(link("Careers")).toBeVisible();

    await trigger("Company").click();
    await new Promise((resolve) => setTimeout(resolve, 300));

    await expect.element(link("Careers")).toBeVisible();
  });

  test("your own onClick still runs, and can stop the button doing anything", async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    await render(
      <NavigationMenu delayDuration={60_000}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger onClick={onClick}>
              More
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#faq">FAQ</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    await trigger("More").click();
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(onClick).toHaveBeenCalledOnce();
    expect(viewport()).toBeNull();
  });

  test("waits for delayDuration before it opens", async () => {
    await render(<Example delayDuration={400} />);

    await userEvent.hover(trigger("Products"));
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(viewport()).toBeNull();

    await expect.element(link(/^Analytics/)).toBeVisible();
  });

  test("moving to another button swaps what the panel shows", async () => {
    await render(<Example defaultValue="products" delayDuration={0} />);
    await expect.element(link(/^Analytics/)).toBeVisible();

    await userEvent.hover(trigger("Company"));

    await expect.element(link("Careers")).toBeVisible();
    await expect.element(link(/^Analytics/)).not.toBeInTheDocument();
    expect(
      document.querySelectorAll(".nuv-navigation-menu__viewport"),
    ).toHaveLength(1);
  });

  test("the panel stays open while the pointer is on it", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example delayDuration={0} />);
    await userEvent.hover(trigger("Products"));
    await expect.element(link(/^Analytics/)).toBeVisible();

    await userEvent.hover(link("Billing"));
    // Longer than the 150ms Radix waits before closing.
    await new Promise((resolve) => setTimeout(resolve, 400));

    await expect.element(link("Billing")).toBeVisible();
  });
});

describe("keyboard", () => {
  test.skipIf(!tabsToLinks)(
    "Tab goes through the buttons and links in the list",
    async () => {
      await render(<Example />);

      const visited: string[] = [];
      for (let press = 0; press < 5; press += 1) {
        await userEvent.keyboard("{Tab}");
        visited.push(document.activeElement?.textContent ?? "");
      }

      expect(visited).toEqual([
        "Products",
        "Company",
        "Pricing",
        "Docs",
        "After",
      ]);
    },
  );

  test("the arrow keys move along the list too", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger("Products")).toHaveFocus();

    await arrow("ArrowRight");
    await expect.element(trigger("Company")).toHaveFocus();
    await arrow("ArrowRight");
    await expect.element(link("Pricing")).toHaveFocus();
    await arrow("ArrowLeft");
    await expect.element(trigger("Company")).toHaveFocus();
  });

  test("Home and End go to the first and last entry", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger("Products")).toHaveFocus();

    await userEvent.keyboard("{End>}");
    await new Promise((resolve) => setTimeout(resolve, 30));
    await userEvent.keyboard("{/End}");
    await expect.element(link("Docs")).toHaveFocus();

    await userEvent.keyboard("{Home>}");
    await new Promise((resolve) => setTimeout(resolve, 30));
    await userEvent.keyboard("{/Home}");
    await expect.element(trigger("Products")).toHaveFocus();
  });

  test("inside the panel, the arrow keys move between its links", async () => {
    await render(<Example defaultValue="company" />);
    await expect.element(link("About")).toBeVisible();
    (link("About").element() as HTMLElement).focus();

    await arrow("ArrowDown");
    await expect.element(link("Careers")).toHaveFocus();
    await userEvent.keyboard("{ArrowUp>}");
    await new Promise((resolve) => setTimeout(resolve, 30));
    await userEvent.keyboard("{/ArrowUp}");
    await expect.element(link("About")).toHaveFocus();
  });

  test.each(["{Enter}", " "])(
    "%s on a button shows its panel and leaves focus on the button",
    async (key) => {
      await render(<Example />);
      await userEvent.keyboard("{Tab}");

      await userEvent.keyboard(key);

      await expect.element(link(/^Analytics/)).toBeVisible();
      await expect.element(trigger("Products")).toHaveFocus();
    },
  );

  test("the down arrow moves from an open button into its panel", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(link(/^Analytics/)).toBeVisible();

    await arrow("ArrowDown");

    await expect.element(link(/^Analytics/)).toHaveFocus();
  });

  test("Tab goes from an open button into its panel, and out to the next button", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(link(/^Analytics/)).toBeVisible();

    await userEvent.keyboard("{Tab}");
    await expect.element(link(/^Analytics/)).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect.element(link("Billing")).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger("Company")).toHaveFocus();
  });

  // What axe objects to, and why it's left out of the checks further down.
  test("the element Tab passes through is hidden, and never keeps focus", async () => {
    await render(<Example defaultValue="products" />);
    await expect.element(link(/^Analytics/)).toBeVisible();
    const proxy = trigger("Products").element().nextElementSibling;

    expect(proxy?.getAttribute("aria-hidden")).toBe("true");
    expect((proxy as HTMLElement).tabIndex).toBe(0);

    (proxy as HTMLElement).focus();

    await expect
      .poll(() =>
        document
          .querySelector(".nuv-navigation-menu__content")
          ?.contains(document.activeElement),
      )
      .toBe(true);
  });

  test("Escape closes the panel and returns focus to its button", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Tab}");
    await expect.element(link(/^Analytics/)).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    await expect.element(link(/^Analytics/)).not.toBeInTheDocument();
    await expect.element(trigger("Products")).toHaveFocus();
  });

  test("dir=rtl swaps the arrow keys", async () => {
    await render(<Example dir="rtl" />);
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger("Products")).toHaveFocus();

    await arrow("ArrowLeft");

    await expect.element(trigger("Company")).toHaveFocus();
  });

  test("a button and a link with keyboard focus each have a ring", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");
    const button = getComputedStyle(trigger("Products").element());
    expect(button.outlineStyle).toBe("solid");
    expect(contrast(button.outlineColor, "white")).toBeGreaterThanOrEqual(3);

    // From the button on, by the arrow keys, which every browser allows.
    await arrow("ArrowRight");
    await arrow("ArrowRight");
    await expect.element(link("Pricing")).toHaveFocus();
    expect(getComputedStyle(link("Pricing").element()).outlineStyle).toBe(
      "solid",
    );
  });
});

describe("layout", () => {
  test("buttons and links in the list are 40px tall with a mouse", async () => {
    await render(<Example />);

    expect(rect(trigger("Products").element()).height).toBe(40);
    expect(rect(link("Pricing").element()).height).toBe(40);
  });

  test("on a desktop the panel sits under the list and takes its content's size", async () => {
    await setViewport("desktop");
    // 300px of links and 8px of padding on each side.
    const panel = await openStill(<Example defaultValue="products" />, 316);

    expect(rect(panel).top - rect(nav().element()).bottom).toBe(6);
    expect(rect(panel).left).toBe(rect(nav().element()).left);
    await expect
      .poll(() => panel.clientHeight)
      .toBe(
        (document.querySelector(".nuv-navigation-menu__content") as HTMLElement)
          .offsetHeight,
      );
    expect(panel.clientHeight).toBeGreaterThan(80);
  });

  test("it changes size with what it shows", async () => {
    await setViewport("desktop");
    const panel = await openStill(
      <Example defaultValue="products" delayDuration={0} />,
      316,
    );

    await userEvent.hover(trigger("Company"));

    await expect.poll(() => panel.clientWidth).toBe(216);
  });

  test.each([
    ["start", (panel: DOMRect, menu: DOMRect) => panel.left - menu.left],
    [
      "center",
      (panel: DOMRect, menu: DOMRect) =>
        panel.left + panel.width / 2 - (menu.left + menu.width / 2),
    ],
    ["end", (panel: DOMRect, menu: DOMRect) => panel.right - menu.right],
  ] as const)(
    "align=%s lines the panel up with that part of the menu",
    async (align, offset) => {
      await setViewport("desktop");
      const panel = await openStill(
        <Example
          defaultValue="company"
          align={align}
          wrapper={{ display: "flex", justifyContent: "center" }}
        />,
        216,
      );

      expect(
        Math.abs(offset(rect(panel), rect(nav().element()))),
      ).toBeLessThanOrEqual(0.5);
    },
  );

  test("on a phone the panel is as wide as the menu, and stays on the screen", async () => {
    await setViewport("phone");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Example defaultValue="company" wrapper={{ display: "grid" }} />,
    );
    await expect.poll(() => viewport()?.clientHeight ?? 0).toBeGreaterThan(80);
    const panel = rect(viewport() as Element);

    expect(panel.left).toBe(rect(nav().element()).left);
    expect(panel.width).toBe(rect(nav().element()).width);
    expect(panel.right).toBeLessThanOrEqual(window.innerWidth);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("more entries than fit a narrow screen wrap", async () => {
    await setViewport("phone");
    await render(<Example wrapper={{ inlineSize: 220 }} />);

    expect(rect(link("Docs").element()).top).toBeGreaterThan(
      rect(trigger("Products").element()).top,
    );
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("a link in the panel is a row as wide as the panel, with its description under its name", async () => {
    await setViewport("desktop");
    await openStill(<Example defaultValue="products" />, 316);
    const row = link(/^Analytics/).element();
    const description = row.querySelector("span") as Element;

    expect(rect(row).width).toBe(300);
    expect(rect(description).top).toBeGreaterThan(rect(row).top + 8);
    expect(rect(description).left).toBe(rect(row).left + 12);
  });

  test("the panel covers what's under it without moving it", async () => {
    await setViewport("desktop");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    const after = page.getByRole("button", { name: "After" }).element();
    const before = rect(after).top;

    await trigger("Products").click();
    await expect.element(link(/^Analytics/)).toBeVisible();

    expect(rect(after).top).toBe(before);
  });
});

describe("styles", () => {
  test("the button whose panel is open is marked, and its arrow turns", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    const button = trigger("Products").element();
    const chevron = button.querySelector(
      ".nuv-navigation-menu__chevron",
    ) as Element;
    const resting = getComputedStyle(button).backgroundColor;
    expect(getComputedStyle(chevron).transform).toBe("none");

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(link(/^Analytics/)).toBeVisible();

    expect(getComputedStyle(button).backgroundColor).not.toBe(resting);
    expect(getComputedStyle(chevron).transform).toBe(
      "matrix(-1, 0, 0, -1, 0, 0)",
    );
  });

  test("the current page's link is filled and heavier", async () => {
    await render(<Example />);
    const current = getComputedStyle(link("Pricing").element());
    const other = getComputedStyle(link("Docs").element());

    expect(current.backgroundColor).not.toBe(other.backgroundColor);
    expect(Number(current.fontWeight)).toBeGreaterThan(
      Number(other.fontWeight),
    );
  });

  test("component variables restyle the panel and the entries", async () => {
    await setViewport("desktop");
    const panel = await openStill(
      <Example
        defaultValue="products"
        style={
          {
            "--nuv-navigation-menu-bg": "rgb(10, 20, 30)",
            "--nuv-navigation-menu-padding": "20px",
            "--nuv-navigation-menu-offset": "20px",
            "--nuv-navigation-menu-hover-bg": "rgb(40, 50, 60)",
            "--nuv-navigation-menu-item-radius": "0px",
          } as never
        }
      />,
      340,
    );

    expect(getComputedStyle(panel).backgroundColor).toBe("rgb(10, 20, 30)");
    expect(rect(panel).top - rect(nav().element()).bottom).toBe(20);
    const current = getComputedStyle(link("Pricing").element());
    expect(current.backgroundColor).toBe("rgb(40, 50, 60)");
    expect(current.borderTopLeftRadius).toBe("0px");
  });

  test("the panel is never wider than its max-width variable", async () => {
    await setViewport("desktop");
    await openStill(
      <Example
        defaultValue="products"
        style={{ "--nuv-navigation-menu-max-width": "200px" } as never}
      />,
      200,
    );
  });

  test("a short list of links still gets a panel 12rem wide, or what its variable says", async () => {
    await setViewport("desktop");
    const short = (style?: object) => (
      <NavigationMenu defaultValue="more" style={style as never}>
        <NavigationMenuList>
          <NavigationMenuItem value="more">
            <NavigationMenuTrigger>More</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#faq">FAQ</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
    await emulateMedia({ reducedMotion: "reduce" });
    const first = await render(short());
    await expect.poll(() => viewport()?.clientWidth).toBe(192);
    await first.unmount();

    await render(short({ "--nuv-navigation-menu-min-width": "300px" }));
    await expect.poll(() => viewport()?.clientWidth).toBe(300);
  });

  test("the panel pops in, and what it shows fades over when it changes", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultValue="products" delayDuration={0} />);
    await expect.poll(viewport).not.toBeNull();
    expect(getComputedStyle(viewport() as Element).animationName).toBe(
      "nuv-navigation-menu-in",
    );

    await userEvent.hover(trigger("Company"));
    await expect.element(link("Careers")).toBeVisible();

    const incoming = link("Careers")
      .element()
      .closest(".nuv-navigation-menu__content") as Element;
    expect(incoming.getAttribute("data-motion")).toBe("from-end");
    expect(getComputedStyle(incoming).animationName).toBe(
      "nuv-navigation-menu-fade-in",
    );
  });

  test("it still closes after its exit animation", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultValue="products" />);
    await expect.element(link(/^Analytics/)).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.poll(viewport).toBeNull();
  });

  test("nothing animates when reduced motion is on", async () => {
    await setViewport("desktop");
    const panel = await openStill(<Example defaultValue="products" />, 316);

    expect(getComputedStyle(panel).animationName).toBe("none");
    expect(getComputedStyle(panel).transitionDuration).toBe("0s");
    expect(
      getComputedStyle(
        trigger("Products")
          .element()
          .querySelector(".nuv-navigation-menu__chevron") as Element,
      ).transitionDuration,
    ).toBe("0s");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("the menu passes axe", async () => {
    const screen = await renderThemed(theme, <Example />);

    await expectNoViolations(screen.container);
  });

  test("the menu with its panel open passes axe", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(
      theme,
      <Example defaultValue="products" />,
    );
    // Radix measures the content a frame after it shows. Until then the
    // panel has no height, and axe skips what it can't see.
    await expect.poll(() => viewport()?.clientHeight ?? 0).toBeGreaterThan(80);

    const results = await axe(screen.container, withFocusProxy);

    expect(results).toHaveNoViolations();
    const checked = results.passes.find((rule) => rule.id === "color-contrast");
    // The four entries, the two links in the panel and the button after.
    expect(checked?.nodes.length).toBeGreaterThanOrEqual(7);
  });
});

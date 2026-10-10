import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import { Component, createRef, type ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import {
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarMenu,
  NavbarNav,
  type NavbarProps,
} from "./navbar";

const pages = [
  { name: "Orders", href: "#orders" },
  { name: "Customers", href: "#customers" },
  { name: "Reports", href: "#reports" },
];

// A bar, and a page under it long enough to scroll.
function Example({
  menu,
  ...props
}: NavbarProps & { menu?: { label?: string; closeLabel?: string } }) {
  return (
    <>
      <Navbar data-testid="bar" {...props}>
        <NavbarBrand data-testid="brand">
          <a href="#home">Acme</a>
        </NavbarBrand>
        <NavbarNav aria-label="Main" data-testid="nav">
          {pages.map((item, index) => (
            <NavbarLink key={item.href} href={item.href} current={index === 0}>
              {item.name}
            </NavbarLink>
          ))}
        </NavbarNav>
        <NavbarActions data-testid="actions">
          <Button size="sm">Sign in</Button>
          <NavbarMenu {...menu}>
            <nav aria-label="Main">
              {pages.map((item, index) => (
                <NavbarLink
                  key={item.href}
                  href={item.href}
                  current={index === 0}
                >
                  {item.name}
                </NavbarLink>
              ))}
            </nav>
            {/* The library's own button. A bare one is drawn by the browser,
                and WebKit's doesn't follow a dark theme. */}
            <Button intent="secondary" size="sm">
              Not a link
            </Button>
          </NavbarMenu>
        </NavbarActions>
      </Navbar>
      <main style={{ height: 3000 }}>
        <h1>Orders</h1>
      </main>
    </>
  );
}

const bar = () => page.getByTestId("bar").element() as HTMLElement;
const nav = () => page.getByTestId("nav").element() as HTMLElement;
const toggle = (name = "Menu") =>
  page.getByRole("button", { name, exact: true });
const panel = (name = "Menu") => page.getByRole("dialog", { name });
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();

// The page is the test's own, and so is its address.
afterEach(() => {
  window.scrollTo(0, 0);
  history.replaceState(null, "", location.pathname + location.search);
});

describe("rendering", () => {
  test("is a header with its parts, each with its class", async () => {
    await render(<Example />);

    expect(bar().tagName).toBe("HEADER");
    expect(bar().className).toBe("nuv-navbar nuv-navbar--collapse-md");
    expect(page.getByTestId("brand").element().className).toBe(
      "nuv-navbar__brand",
    );
    expect(nav().tagName).toBe("NAV");
    expect(nav().className).toBe("nuv-navbar__nav");
    expect(page.getByTestId("actions").element().className).toBe(
      "nuv-navbar__actions",
    );
  });

  test("a link says when it's the page that's open", async () => {
    await setViewport("desktop");
    await render(<Example />);
    const links = page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link");

    expect(
      links.elements().map((link) => link.getAttribute("aria-current")),
    ).toEqual(["page", null, null]);
    expect(links.elements()[0]?.className).toBe("nuv-navbar__link");
  });

  test("a link can be your router's own", async () => {
    await setViewport("desktop");
    await render(
      <Navbar>
        <NavbarNav aria-label="Main">
          <NavbarLink asChild current>
            <a href="#orders" data-router="yes">
              Orders
            </a>
          </NavbarLink>
        </NavbarNav>
      </Navbar>,
    );
    const link = page.getByRole("link", { name: "Orders" }).element();

    expect(link.className).toBe("nuv-navbar__link");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect((link as HTMLElement).dataset.router).toBe("yes");
  });

  test("NavbarNav can be a nav you already have", async () => {
    // Wide enough for the links to be in the bar. On a narrow screen the
    // nav isn't shown, and has no role to be found by.
    await setViewport("desktop");
    await render(
      <Navbar>
        <NavbarNav asChild>
          <nav aria-label="Main" className="mine" data-testid="own" />
        </NavbarNav>
      </Navbar>,
    );

    expect(page.getByTestId("own").element().className).toBe(
      "nuv-navbar__nav mine",
    );
    expect(page.getByRole("navigation").elements()).toHaveLength(1);
  });

  test("every part forwards its ref, a className and other props", async () => {
    const refs = {
      bar: createRef<HTMLElement>(),
      brand: createRef<HTMLDivElement>(),
      nav: createRef<HTMLElement>(),
      actions: createRef<HTMLDivElement>(),
      link: createRef<HTMLAnchorElement>(),
    };
    await render(
      <Navbar ref={refs.bar} className="mine" id="bar">
        <NavbarBrand ref={refs.brand} className="mine" id="brand" />
        <NavbarNav ref={refs.nav} className="mine" id="nav" aria-label="Main">
          <NavbarLink ref={refs.link} className="mine" id="link" href="#a">
            A
          </NavbarLink>
        </NavbarNav>
        <NavbarActions ref={refs.actions} className="mine" id="actions" />
      </Navbar>,
    );

    for (const [name, ref] of Object.entries(refs)) {
      expect(ref.current?.id, name).toBe(name);
      expect(ref.current?.classList.contains("mine"), name).toBe(true);
    }
  });

  test("NavbarMenu outside a bar says where it belongs", async () => {
    class Boundary extends Component<
      { children: ReactNode },
      { message: string }
    > {
      override state = { message: "" };
      static getDerivedStateFromError(error: Error) {
        return { message: error.message };
      }
      override render() {
        return this.state.message ? (
          <p role="alert">{this.state.message}</p>
        ) : (
          this.props.children
        );
      }
    }
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await render(
      <Boundary>
        <NavbarMenu />
      </Boundary>,
    );

    await expect
      .poll(() => page.getByRole("alert").element().textContent)
      .toBe("NavbarMenu has to be inside a Navbar.");
    quiet.mockRestore();
  });
});

describe("on a wide screen", () => {
  test("the links are in the bar, and there's no button for a menu", async () => {
    await setViewport("desktop");
    await render(<Example />);

    expect(style(nav()).display).toBe("flex");
    await expect
      .element(page.getByRole("link", { name: "Customers" }))
      .toBeVisible();
    expect(toggle().elements()).toHaveLength(0);
  });

  test("the name is at the start, the links after it, and the actions at the far end", async () => {
    await setViewport("desktop");
    await render(<Example />);
    const brand = rect(page.getByTestId("brand").element());
    const actions = rect(page.getByTestId("actions").element());

    expect(brand.left).toBe(rect(bar()).left + 16);
    expect(rect(nav()).left).toBeGreaterThanOrEqual(brand.right);
    expect(Math.round(actions.right)).toBe(Math.round(rect(bar()).right - 16));
    expect(rect(bar()).height).toBe(64);
  });

  test("with a mouse a link is 40 pixels tall, and the open page's is underlined", async () => {
    await setViewport("desktop");
    await render(<Example />);
    const open = page.getByRole("link", { name: "Orders" }).element();
    const other = page.getByRole("link", { name: "Reports" }).element();

    expect(rect(open).height).toBe(40);
    expect(style(open).textDecorationLine).toBe("underline");
    expect(style(other).textDecorationLine).toBe("none");
    expect(style(open).color).not.toBe(style(other).color);
  });
});

describe("on a narrow screen", () => {
  test("the links are out of the bar, and a button opens them in a panel", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);

    expect(style(nav()).display).toBe("none");
    await expect.element(toggle()).toBeVisible();
    await expect.element(toggle()).toHaveAttribute("aria-expanded", "false");
    await expect
      .element(page.getByRole("button", { name: "Sign in" }))
      .toBeVisible();

    await toggle().click();

    await expect.element(panel()).toBeVisible();
    expect(
      panel()
        .getByRole("link")
        .elements()
        .map((link) => link.textContent),
    ).toEqual(["Orders", "Customers", "Reports"]);
    await expect
      .element(panel().getByRole("link", { name: "Orders" }))
      .toHaveAttribute("aria-current", "page");
  });

  test("the button is a square the size of a finger, with a picture and a name", async () => {
    await render(<Example />);
    const button = toggle().element();

    expect(rect(button).width).toBe(44);
    expect(rect(button).height).toBe(44);
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(button.getAttribute("type")).toBe("button");
  });

  test("in the panel the links are rows the width of it", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    await toggle().click();
    const rows = panel().getByRole("link").elements();
    const first = rect(rows[0] as Element);
    const second = rect(rows[1] as Element);

    expect(second.top).toBeGreaterThanOrEqual(first.bottom);
    expect(first.width).toBe(
      rect((rows[0] as Element).parentElement as Element).width,
    );
  });

  test("following a link closes the panel, and pressing something else in it doesn't", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    await toggle().click();

    await panel().getByRole("button", { name: "Not a link" }).click();
    await expect.element(panel()).toBeVisible();

    await panel().getByRole("link", { name: "Reports" }).click();
    await expect.element(panel()).not.toBeInTheDocument();
    expect(location.hash).toBe("#reports");
  });

  test("Escape closes the panel, and focus goes back to the button", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    await toggle().click();
    await expect.element(panel()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(panel()).not.toBeInTheDocument();
    await expect.element(toggle()).toHaveFocus();
  });

  test("the panel closes when the screen gets wide enough for the links to be in the bar", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    await toggle().click();
    await expect.element(panel()).toBeVisible();

    await setViewport("desktop");

    await expect.element(panel()).not.toBeInTheDocument();
  });

  test("the names can be translated", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example menu={{ label: "Menü", closeLabel: "Schließen" }} />);

    await toggle("Menü").click();

    await expect.element(panel("Menü")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Schließen" }))
      .toBeVisible();
  });
});

describe("where the links go into the bar", () => {
  test.each([
    ["sm", 700, "flex"],
    ["md", 700, "none"],
    ["lg", 700, "none"],
  ] as const)("collapse=%s at %i pixels", async (collapse, _width, display) => {
    // The frame is resized by hand here: neither of the two named sizes is
    // between the breakpoints.
    await page.viewport(700, 800);
    await render(<Example collapse={collapse} />);

    expect(bar().className).toBe(`nuv-navbar nuv-navbar--collapse-${collapse}`);
    expect(style(nav()).display).toBe(display);
    expect(toggle().elements()).toHaveLength(display === "flex" ? 0 : 1);
  });
});

describe("staying at the top", () => {
  test("a bar that isn't sticky scrolls away with the page", async () => {
    await render(<Example />);

    window.scrollTo(0, 400);

    await expect.poll(() => rect(bar()).bottom).toBeLessThan(0);
    expect(style(bar()).position).toBe("static");
  });

  test("a sticky bar stays at the top", async () => {
    await render(<Example sticky />);
    expect(bar().className).toBe(
      "nuv-navbar nuv-navbar--collapse-md nuv-navbar--sticky",
    );

    window.scrollTo(0, 400);

    await expect.poll(() => window.scrollY).toBe(400);
    expect(rect(bar()).top).toBe(0);
    expect(bar().hasAttribute("data-hidden")).toBe(false);
  });

  test("with hideOnScroll it goes while the page scrolls down, and comes back as soon as it scrolls up", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example hideOnScroll />);
    expect(style(bar()).position).toBe("sticky");

    window.scrollTo(0, 400);
    await expect.poll(() => bar().hasAttribute("data-hidden")).toBe(true);
    await expect.poll(() => Math.round(rect(bar()).bottom)).toBe(0);

    window.scrollTo(0, 380);
    await expect.poll(() => bar().hasAttribute("data-hidden")).toBe(false);
    await expect.poll(() => Math.round(rect(bar()).top)).toBe(0);
  });

  test("it's there at the top of the page, whichever way the page last moved", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example hideOnScroll />);

    window.scrollTo(0, 400);
    await expect.poll(() => bar().hasAttribute("data-hidden")).toBe(true);
    window.scrollTo(0, 0);
    await expect.poll(() => bar().hasAttribute("data-hidden")).toBe(false);
    // A small move down from the top isn't enough to send it away.
    window.scrollTo(0, 30);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(bar().hasAttribute("data-hidden")).toBe(false);
  });

  test("it stays in sight while focus is in it", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example hideOnScroll />);
    window.scrollTo(0, 400);
    await expect.poll(() => bar().hasAttribute("data-hidden")).toBe(true);

    (page.getByRole("link", { name: "Acme" }).element() as HTMLElement).focus({
      preventScroll: true,
    });

    expect(style(bar()).transform).toBe("none");
    expect(Math.round(rect(bar()).top)).toBe(0);
  });

  test("it slides, and doesn't for someone who asked for less motion", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const first = await render(<Example hideOnScroll />);
    expect(style(bar()).transitionProperty).toBe("transform");
    await first.unmount();

    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example hideOnScroll />);
    expect(style(bar()).transitionProperty).not.toBe("transform");
  });
});

describe("styles", () => {
  test("component variables change the look", async () => {
    await setViewport("desktop");
    await render(
      <div
        style={
          {
            "--nuv-navbar-height": "80px",
            "--nuv-navbar-padding": "30px",
            "--nuv-navbar-gap": "11px",
            "--nuv-navbar-border": "rgb(40, 50, 60)",
            "--nuv-navbar-bg": "rgb(10, 20, 30)",
            "--nuv-navbar-fg": "rgb(200, 210, 220)",
            "--nuv-navbar-z": "7",
            "--nuv-navbar-link-fg": "rgb(100, 110, 120)",
            "--nuv-navbar-link-active-fg": "rgb(250, 240, 230)",
            "--nuv-navbar-link-radius": "3px",
          } as never
        }
      >
        <Example sticky />
      </div>,
    );
    const open = page.getByRole("link", { name: "Orders" }).element();
    const other = page.getByRole("link", { name: "Reports" }).element();

    expect(rect(bar()).height).toBe(80);
    expect(style(bar()).paddingLeft).toBe("30px");
    expect(style(bar()).columnGap).toBe("11px");
    expect(style(bar()).borderBottomColor).toBe("rgb(40, 50, 60)");
    expect(style(bar()).backgroundColor).toBe("rgb(10, 20, 30)");
    expect(style(bar()).color).toBe("rgb(200, 210, 220)");
    expect(style(bar()).zIndex).toBe("7");
    expect(style(other).color).toBe("rgb(100, 110, 120)");
    expect(style(open).color).toBe("rgb(250, 240, 230)");
    expect(style(other).borderTopLeftRadius).toBe("3px");
  });

  test("a hover color of your own is used", async () => {
    await setViewport("desktop");
    await render(
      <div style={{ "--nuv-navbar-link-hover-bg": "rgb(9, 8, 7)" } as never}>
        <Example />
      </div>,
    );
    const link = page.getByRole("link", { name: "Reports" });

    await userEvent.hover(link);

    await expect
      .poll(() => style(link.element()).backgroundColor)
      .toBe("rgb(9, 8, 7)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe on a wide screen", async () => {
    setPageTheme(theme);
    await setViewport("desktop");
    await render(<Example />);

    expect(await axe(document.body)).toHaveNoViolations();
  });

  test("passes axe on a narrow screen, with the panel open", async () => {
    setPageTheme(theme);
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    await toggle().click();
    await expect.element(panel()).toBeVisible();

    expect(await axe(document.body)).toHaveNoViolations();
  });
});

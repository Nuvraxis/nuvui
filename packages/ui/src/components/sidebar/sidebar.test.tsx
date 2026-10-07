import "../../styles/index.scss";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { tabsToLinks } from "@nuvui/tooling/test/keys";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, type ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { DirectionProvider } from "../../direction";
import { Button } from "../button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMain,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";

function Icon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" data-testid="icon">
      <circle cx="8" cy="8" r="6" fill="currentColor" />
    </svg>
  );
}

function Nav() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Mail</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton active tooltip="Inbox">
              <Icon />
              <span>Inbox</span>
              <SidebarMenuBadge>12</SidebarMenuBadge>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Sent">
              <a href="#sent">
                <Icon />
                <span>Sent</span>
              </a>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton href="#today">Today</SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton href="#older" active>
                  Older
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <Icon />
              <span>Spam</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Icon />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

function Example({
  sidebar,
  children = <Nav />,
  after = true,
  ...props
}: ComponentProps<typeof SidebarProvider> & {
  sidebar?: ComponentProps<typeof Sidebar>;
  /** Put the sidebar after the page, for side="end". */
  after?: boolean;
}) {
  const bar = (
    <Sidebar {...sidebar}>
      <SidebarHeader>
        <strong>Acme</strong>
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter>
        <span>Signed in</span>
      </SidebarFooter>
    </Sidebar>
  );
  const main = (
    <SidebarMain>
      <SidebarTrigger />
      <p>The page.</p>
    </SidebarMain>
  );

  return (
    // No cookie unless a test asks, so that one test can't change the next.
    <SidebarProvider
      cookieName={null}
      style={{ "--nuv-sidebar-height": "400px" } as never}
      {...props}
    >
      {after ? bar : main}
      {after ? main : bar}
    </SidebarProvider>
  );
}

const bar = () => document.querySelector(".nuv-sidebar") as HTMLElement;
const trigger = () => page.getByRole("button", { name: "Toggle sidebar" });
const inbox = () => page.getByRole("button", { name: /Inbox/ });
const sent = () => page.getByRole("link", { name: "Sent" });
const panel = () => page.getByRole("dialog", { name: "Sidebar" });
const rect = (element: Element) => element.getBoundingClientRect();
const width = () => rect(bar()).width;

// A wide screen with the transition out of the way, so widths can be read
// straight after a change.
async function desktop(node: ReactNode) {
  await setViewport("desktop");
  await emulateMedia({ reducedMotion: "reduce" });
  return render(node);
}

async function phone(node: ReactNode) {
  await setViewport("phone");
  await emulateMedia({ reducedMotion: "reduce" });
  return render(node);
}

function setCookie(cookie: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API isn't in Firefox or Safari
  document.cookie = cookie;
}

function clearCookies() {
  for (const name of ["nuv-sidebar", "mine"]) {
    setCookie(`${name}=; path=/; max-age=0`);
  }
}

afterEach(() => {
  clearCookies();
  document.documentElement.removeAttribute("dir");
});

describe("rendering", () => {
  test("starts expanded, 16rem wide, next to the page", async () => {
    await desktop(<Example />);

    expect(width()).toBe(256);
    expect(bar().getAttribute("data-state")).toBe("expanded");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "true");
    const main = page.getByRole("main").element();
    expect(rect(main).left).toBe(rect(bar()).right);
    expect(rect(main).right).toBe(window.innerWidth);
  });

  test("is a navigation landmark with a name, which can be changed", async () => {
    const first = await desktop(<Example />);
    await expect
      .element(page.getByRole("navigation", { name: "Sidebar" }))
      .toHaveClass("nuv-sidebar");
    await first.unmount();

    await desktop(<Example sidebar={{ label: "Main" }} />);
    await expect
      .element(page.getByRole("navigation", { name: "Main" }))
      .toBeVisible();
  });

  test("the trigger collapses it to a strip of icons, and expands it again", async () => {
    await desktop(<Example />);

    await trigger().click();

    // One row's height, the padding around it, and the edge.
    expect(width()).toBe(40 + 16 + 1);
    expect(bar().classList.contains("nuv-sidebar--rail")).toBe(true);
    expect(bar().getAttribute("data-state")).toBe("collapsed");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(rect(page.getByRole("main").element()).left).toBe(57);

    await trigger().click();

    expect(width()).toBe(256);
    expect(bar().classList.contains("nuv-sidebar--rail")).toBe(false);
  });

  test("collapsible=offcanvas takes it off the screen and out of the tab order", async () => {
    await desktop(
      <Example defaultOpen={false} sidebar={{ collapsible: "offcanvas" }} />,
    );

    expect(width()).toBe(0);
    expect(bar().classList.contains("nuv-sidebar--hidden")).toBe(true);
    expect(getComputedStyle(bar()).visibility).toBe("hidden");
    expect(rect(page.getByRole("main").element()).left).toBe(0);

    await userEvent.keyboard("{Tab}");
    await expect.element(trigger()).toHaveFocus();

    await trigger().click();
    expect(width()).toBe(256);
    expect(getComputedStyle(bar()).visibility).toBe("visible");
  });

  test("collapsible=none can't be collapsed", async () => {
    await desktop(
      <Example defaultOpen={false} sidebar={{ collapsible: "none" }} />,
    );

    expect(width()).toBe(256);
    expect(bar().getAttribute("data-state")).toBe("expanded");

    await trigger().click();
    expect(width()).toBe(256);
  });

  test("can start collapsed", async () => {
    await desktop(<Example defaultOpen={false} />);

    expect(width()).toBe(57);
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  test("can be controlled", async () => {
    const onOpenChange = vi.fn();
    await desktop(<Example open onOpenChange={onOpenChange} />);

    await trigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Still expanded, because the parent hasn't changed the prop.
    expect(width()).toBe(256);
  });

  test("side=end puts the edge on the other side", async () => {
    await desktop(<Example after={false} sidebar={{ side: "end" }} />);
    const style = getComputedStyle(bar());

    expect(bar().classList.contains("nuv-sidebar--end")).toBe(true);
    expect(style.borderLeftWidth).toBe("1px");
    expect(style.borderRightWidth).toBe("0px");
    expect(rect(bar()).right).toBe(window.innerWidth);
  });

  test("the header and footer stay put while a long content scrolls", async () => {
    await desktop(
      <Example>
        <SidebarMenu>
          {Array.from({ length: 30 }, (_, index) => `Page ${index + 1}`).map(
            (name) => (
              <SidebarMenuItem key={name}>
                <SidebarMenuButton>{name}</SidebarMenuButton>
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </Example>,
    );
    const content = bar().querySelector(".nuv-sidebar__content") as Element;
    const footer = bar().querySelector(".nuv-sidebar__footer") as Element;

    expect(rect(bar()).height).toBe(400);
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    expect(rect(footer).bottom).toBe(rect(bar()).bottom);
    expect(content.scrollWidth).toBe(content.clientWidth);
  });

  test("the page can hold something wide without being pushed off the screen", async () => {
    await desktop(
      <SidebarProvider cookieName={null}>
        <Sidebar />
        <SidebarMain>
          <div style={{ inlineSize: 3000 }}>Wide</div>
        </SidebarMain>
      </SidebarProvider>,
    );

    expect(rect(page.getByRole("main").element()).right).toBe(
      window.innerWidth,
    );
  });

  test("forwards refs and keeps class names", async () => {
    const refs = {
      provider: createRef<HTMLDivElement>(),
      sidebar: createRef<HTMLElement>(),
      main: createRef<HTMLElement>(),
      header: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      footer: createRef<HTMLDivElement>(),
      separator: createRef<HTMLDivElement>(),
      group: createRef<HTMLDivElement>(),
      label: createRef<HTMLDivElement>(),
      menu: createRef<HTMLUListElement>(),
      item: createRef<HTMLLIElement>(),
      button: createRef<HTMLButtonElement>(),
      badge: createRef<HTMLSpanElement>(),
      sub: createRef<HTMLUListElement>(),
      subItem: createRef<HTMLLIElement>(),
      subButton: createRef<HTMLAnchorElement>(),
      trigger: createRef<HTMLButtonElement>(),
    };
    await desktop(
      <SidebarProvider ref={refs.provider} className="x" cookieName={null}>
        <Sidebar ref={refs.sidebar} className="x">
          <SidebarHeader ref={refs.header} className="x" />
          <SidebarContent ref={refs.content} className="x">
            <SidebarSeparator ref={refs.separator} className="x" />
            <SidebarGroup ref={refs.group} className="x">
              <SidebarGroupLabel ref={refs.label} className="x">
                Mail
              </SidebarGroupLabel>
              <SidebarMenu ref={refs.menu} className="x">
                <SidebarMenuItem ref={refs.item} className="x">
                  <SidebarMenuButton ref={refs.button} className="x">
                    Inbox
                    <SidebarMenuBadge ref={refs.badge} className="x">
                      3
                    </SidebarMenuBadge>
                  </SidebarMenuButton>
                  <SidebarMenuSub ref={refs.sub} className="x">
                    <SidebarMenuSubItem ref={refs.subItem} className="x">
                      <SidebarMenuSubButton
                        ref={refs.subButton}
                        className="x"
                        href="#a"
                      >
                        Today
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter ref={refs.footer} className="x" />
        </Sidebar>
        <SidebarMain ref={refs.main} className="x">
          <SidebarTrigger ref={refs.trigger} className="x" />
        </SidebarMain>
      </SidebarProvider>,
    );

    const classes = Object.fromEntries(
      Object.entries(refs).map(([name, ref]) => [name, ref.current?.className]),
    );
    expect(classes).toEqual({
      provider: "nuv-sidebar-layout x",
      sidebar: "nuv-sidebar nuv-sidebar--start x",
      main: "nuv-sidebar-layout__main x",
      header: "nuv-sidebar__header x",
      content: "nuv-sidebar__content x",
      footer: "nuv-sidebar__footer x",
      separator: "nuv-sidebar__separator x",
      group: "nuv-sidebar__group x",
      label: "nuv-sidebar__group-label x",
      menu: "nuv-sidebar__menu x",
      item: "nuv-sidebar__menu-item x",
      button: "nuv-sidebar__menu-button x",
      badge: "nuv-sidebar__menu-badge x",
      sub: "nuv-sidebar__menu-sub x",
      subItem: "nuv-sidebar__menu-sub-item x",
      subButton: "nuv-sidebar__menu-sub-button x",
      trigger: "nuv-sidebar__trigger x",
    });
    expect(refs.menu.current?.tagName).toBe("UL");
    expect(refs.item.current?.tagName).toBe("LI");
    expect(refs.main.current?.tagName).toBe("MAIN");
  });

  test("the page area can be an element of your own, where the page's main is elsewhere", async () => {
    await desktop(
      <main>
        <SidebarProvider cookieName={null}>
          <Sidebar />
          <SidebarMain asChild>
            <section data-testid="area" className="mine">
              Page
            </section>
          </SidebarMain>
        </SidebarProvider>
      </main>,
    );
    const area = page.getByTestId("area").element();

    expect(area.tagName).toBe("SECTION");
    expect(area.className).toBe("nuv-sidebar-layout__main mine");
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(rect(area).left).toBe(rect(bar()).right);
  });

  test("a part outside a provider says what's wrong", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<SidebarTrigger />)).rejects.toThrow(
      "SidebarTrigger has to be inside a SidebarProvider.",
    );
    quiet.mockRestore();
  });
});

describe("parts", () => {
  test("a group with a label is a group by that name, and one without isn't a group", async () => {
    await desktop(<Example />);

    await expect
      .element(page.getByRole("group", { name: "Mail" }))
      .toBeVisible();
    expect(page.getByRole("group").elements()).toHaveLength(1);
  });

  test("a menu button is a button that doesn't submit, or the link it's given", async () => {
    await desktop(<Example />);

    await expect.element(inbox()).toHaveAttribute("type", "button");
    await expect.element(sent()).toHaveAttribute("href", "#sent");
    await expect.element(sent()).toHaveClass("nuv-sidebar__menu-button");
    await expect.element(sent()).not.toHaveAttribute("type");
  });

  test("the open page is marked for screen readers and for the eye", async () => {
    await desktop(<Example />);
    const older = page.getByRole("link", { name: "Older" });

    await expect.element(inbox()).toHaveAttribute("aria-current", "page");
    await expect.element(older).toHaveAttribute("aria-current", "page");
    await expect.element(sent()).not.toHaveAttribute("aria-current");

    for (const element of [inbox().element(), older.element()]) {
      const marker = getComputedStyle(element, "::before");
      expect(marker.borderLeftWidth).toBe("3px");
      // The fill is too pale to be the only sign. The bar is what's held
      // to 3:1.
      expect(
        contrast(
          marker.borderLeftColor,
          getComputedStyle(bar()).backgroundColor,
        ),
      ).toBeGreaterThanOrEqual(3);
      expect(getComputedStyle(element).fontWeight).toBe("500");
    }
    expect(getComputedStyle(sent().element(), "::before").content).toBe("none");
  });

  test("a badge sits at the far end of its row and is part of its name", async () => {
    await desktop(<Example />);
    const badge = bar().querySelector(".nuv-sidebar__menu-badge") as Element;

    expect(rect(inbox().element()).right - rect(badge).right).toBe(12);
    await expect
      .element(page.getByRole("button", { name: "Inbox 12" }))
      .toBeVisible();
  });

  test("a long name is cut short with an ellipsis", async () => {
    await desktop(
      <Example>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Icon />
              <span data-testid="text">
                A page with a name that goes on for much longer than the sidebar
                is wide
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Example>,
    );
    const text = page.getByTestId("text").element();

    expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
    expect(getComputedStyle(text).textOverflow).toBe("ellipsis");
    expect(rect(text.parentElement as Element).height).toBe(40);
  });

  test("a disabled button is faded and can't be pressed", async () => {
    await desktop(<Example />);
    const spam = page.getByRole("button", { name: "Spam" });

    await expect.element(spam).toBeDisabled();
    expect(getComputedStyle(spam.element()).opacity).toBe("0.5");
  });

  test("a submenu is indented under its item, with a line down its side", async () => {
    await desktop(<Example />);
    const sub = bar().querySelector(".nuv-sidebar__menu-sub") as Element;
    const icon = sent().element().querySelector("svg") as Element;

    // The line is under the middle of the icon above.
    expect(rect(sub).left).toBe(rect(icon).left + rect(icon).width / 2);
    expect(getComputedStyle(sub).borderLeftWidth).toBe("1px");
    expect(
      rect(page.getByRole("link", { name: "Today" }).element()).height,
    ).toBe(32);
  });

  test("the trigger can be a button of your own", async () => {
    await desktop(
      <SidebarProvider cookieName={null}>
        <Sidebar />
        <SidebarMain>
          <SidebarTrigger asChild>
            <Button intent="secondary">Menu</Button>
          </SidebarTrigger>
        </SidebarMain>
      </SidebarProvider>,
    );
    const button = page.getByRole("button", { name: "Menu" });

    await expect.element(button).toHaveClass("nuv-button");
    await expect.element(button).toHaveAttribute("aria-expanded", "true");
    await button.click();
    await expect.element(button).toHaveAttribute("aria-expanded", "false");
    expect(width()).toBe(57);
  });

  test("the trigger's own click handler runs first and can stop it", async () => {
    await desktop(
      <SidebarProvider cookieName={null}>
        <Sidebar />
        <SidebarMain>
          <SidebarTrigger onClick={(event) => event.preventDefault()} />
        </SidebarMain>
      </SidebarProvider>,
    );

    await trigger().click();

    expect(width()).toBe(256);
  });

  test("the trigger's name can be changed", async () => {
    await desktop(
      <SidebarProvider cookieName={null}>
        <Sidebar />
        <SidebarMain>
          <SidebarTrigger label="Navigation" />
        </SidebarMain>
      </SidebarProvider>,
    );

    await expect
      .element(page.getByRole("button", { name: "Navigation" }))
      .toBeVisible();
  });

  test("useSidebar gives the state and the ways to change it", async () => {
    function Probe() {
      const sidebar = useSidebar();
      return (
        <>
          <output data-testid="state">
            {`${sidebar.state} ${sidebar.open} ${sidebar.isMobile} ${sidebar.openMobile}`}
          </output>
          <button type="button" onClick={() => sidebar.setOpen(false)}>
            Collapse
          </button>
          <button type="button" onClick={sidebar.toggleSidebar}>
            Toggle
          </button>
        </>
      );
    }
    await desktop(
      <SidebarProvider cookieName={null}>
        <Sidebar />
        <SidebarMain>
          <Probe />
        </SidebarMain>
      </SidebarProvider>,
    );
    const state = page.getByTestId("state");

    await expect.element(state).toHaveTextContent("expanded true false false");
    await page.getByRole("button", { name: "Collapse" }).click();
    await expect
      .element(state)
      .toHaveTextContent("collapsed false false false");
    await page.getByRole("button", { name: "Toggle" }).click();
    await expect.element(state).toHaveTextContent("expanded true false false");
  });
});

describe("the strip of icons", () => {
  test("an icon stays where it was, in the middle of what's left of its row", async () => {
    await desktop(<Example />);
    const icon = () => rect(inbox().element().querySelector("svg") as Element);
    const before = icon();

    await trigger().click();

    const button = rect(inbox().element());
    expect(button.width).toBe(40);
    expect(button.height).toBe(40);
    expect(icon().left).toBe(before.left);
    expect(icon().top).toBe(before.top);
    expect(icon().width).toBe(16);
    expect(icon().left + 8).toBe(button.left + 20);
  });

  test("the text is out of sight and still the button's name", async () => {
    await desktop(<Example defaultOpen={false} />);
    const text = inbox().element().querySelector("span") as Element;

    expect(rect(text).left).toBeGreaterThanOrEqual(
      rect(inbox().element()).right,
    );
    await expect.element(inbox()).toBeVisible();
    await expect.element(sent()).toBeVisible();
  });

  test("a group's label keeps its room, and a submenu is taken away", async () => {
    await desktop(<Example defaultOpen={false} />);
    const label = bar().querySelector(".nuv-sidebar__group-label") as Element;
    const sub = bar().querySelector(".nuv-sidebar__menu-sub") as Element;

    expect(getComputedStyle(label).visibility).toBe("hidden");
    expect(rect(label).height).toBe(32);
    // Still the group's name.
    await expect
      .element(page.getByRole("group", { name: "Mail" }))
      .toBeVisible();
    expect(getComputedStyle(sub).display).toBe("none");
  });

  test("a tooltip names a button there, towards the page", async () => {
    await desktop(<Example defaultOpen={false} />);

    await userEvent.hover(inbox());

    const tip = page.getByRole("tooltip", { name: "Inbox" });
    await expect.element(tip).toBeVisible();
    await expect
      .poll(() => rect(tip.element()).left)
      .toBeGreaterThanOrEqual(rect(bar()).right - 1);
  });

  test("the tooltip shows for the keyboard as well", async () => {
    await desktop(<Example defaultOpen={false} />);

    await userEvent.keyboard("{Tab}");
    await expect.element(inbox()).toHaveFocus();

    await expect
      .element(page.getByRole("tooltip", { name: "Inbox" }))
      .toBeVisible();
  });

  test("there's no tooltip while the sidebar is expanded", async () => {
    await desktop(<Example />);

    await userEvent.hover(inbox());
    await new Promise((resolve) => setTimeout(resolve, 900));

    await expect.element(page.getByRole("tooltip")).not.toBeInTheDocument();
  });

  test("with the sidebar on the end side, the tooltip is on the other side of it", async () => {
    await desktop(
      <Example defaultOpen={false} after={false} sidebar={{ side: "end" }} />,
    );

    await userEvent.hover(inbox());

    const tip = page.getByRole("tooltip", { name: "Inbox" });
    await expect.element(tip).toBeVisible();
    await expect
      .poll(() => rect(tip.element()).right)
      .toBeLessThanOrEqual(rect(bar()).left + 1);
  });

  test("in a right-to-left layout the sidebar and its tooltip swap sides", async () => {
    document.documentElement.dir = "rtl";
    await desktop(
      <DirectionProvider dir="rtl">
        <Example defaultOpen={false} />
      </DirectionProvider>,
    );

    expect(rect(bar()).right).toBe(window.innerWidth);
    expect(getComputedStyle(bar()).borderLeftWidth).toBe("1px");

    await userEvent.hover(inbox());

    const tip = page.getByRole("tooltip", { name: "Inbox" });
    await expect.element(tip).toBeVisible();
    await expect
      .poll(() => rect(tip.element()).right)
      .toBeLessThanOrEqual(rect(bar()).left + 1);
  });

  test("a button keeps focus when the sidebar collapses around it", async () => {
    await desktop(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.element(inbox()).toHaveFocus();
    const before = inbox().element();

    await userEvent.keyboard("{Control>}b{/Control}");

    expect(width()).toBe(57);
    // The same element, and not a new one that looks like it.
    expect(inbox().element()).toBe(before);
    await expect.element(inbox()).toHaveFocus();
  });
});

describe("keyboard", () => {
  test.each(["Control", "Meta"])(
    "%s+B collapses and expands it",
    async (modifier) => {
      await desktop(<Example />);

      await userEvent.keyboard(`{${modifier}>}b{/${modifier}}`);
      expect(width()).toBe(57);

      await userEvent.keyboard(`{${modifier}>}b{/${modifier}}`);
      expect(width()).toBe(256);
    },
  );

  test("the shortcut can be another key, or turned off", async () => {
    const first = await desktop(<Example shortcut="m" />);
    await userEvent.keyboard("{Control>}b{/Control}");
    expect(width()).toBe(256);
    await userEvent.keyboard("{Control>}m{/Control}");
    expect(width()).toBe(57);
    await first.unmount();

    await desktop(<Example shortcut={null} />);
    await userEvent.keyboard("{Control>}b{/Control}");
    expect(width()).toBe(256);
  });

  test("Tab goes through the sidebar in order, and each stop shows a ring inside its edge", async () => {
    await desktop(<Example />);

    await userEvent.keyboard("{Tab}");
    await expect.element(inbox()).toHaveFocus();
    const style = getComputedStyle(inbox().element());
    expect(style.outlineStyle).toBe("solid");
    // Outside the edge, the sidebar would cut it off.
    expect(style.outlineOffset).toBe("-2px");

    // Safari only stops at links if it's been set to.
    if (!tabsToLinks) return;
    await userEvent.keyboard("{Tab}");
    await expect.element(sent()).toHaveFocus();
    expect(getComputedStyle(sent().element()).outlineStyle).toBe("solid");
  });

  test("Enter on the trigger collapses it and focus stays there", async () => {
    await desktop(
      <Example>
        <p>Nothing to stop at.</p>
      </Example>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger()).toHaveFocus();
    expect(getComputedStyle(trigger().element()).outlineStyle).toBe("solid");

    await userEvent.keyboard("{Enter}");

    expect(width()).toBe(57);
    await expect.element(trigger()).toHaveFocus();
  });
});

describe("remembering", () => {
  const cookie = (name: string) =>
    document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${name}=`))
      ?.split("=")[1];

  test("writes the state to a cookie when it changes, and not before", async () => {
    await desktop(<Example cookieName="nuv-sidebar" />);
    expect(cookie("nuv-sidebar")).toBeUndefined();

    await trigger().click();
    expect(cookie("nuv-sidebar")).toBe("false");

    await trigger().click();
    expect(cookie("nuv-sidebar")).toBe("true");
  });

  test("the cookie is called nuv-sidebar unless it's given a name", async () => {
    const first = await desktop(
      <SidebarProvider>
        <Sidebar />
        <SidebarMain>
          <SidebarTrigger />
        </SidebarMain>
      </SidebarProvider>,
    );
    await trigger().click();
    expect(cookie("nuv-sidebar")).toBe("false");
    await first.unmount();
    clearCookies();

    await desktop(<Example cookieName="mine" />);
    await trigger().click();
    expect(cookie("mine")).toBe("false");
    expect(cookie("nuv-sidebar")).toBeUndefined();
  });

  test("with cookieName={null} nothing is stored", async () => {
    await desktop(<Example />);

    await trigger().click();

    expect(document.cookie).not.toContain("nuv-sidebar");
  });

  test("comes back in the state it was left in", async () => {
    setCookie("nuv-sidebar=false; path=/");
    await desktop(<Example cookieName="nuv-sidebar" />);

    await expect.poll(width).toBe(57);
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  test("what the cookie says isn't animated, and what the trigger does after is", async () => {
    setCookie("nuv-sidebar=false; path=/");
    await setViewport("desktop");
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example cookieName="nuv-sidebar" />);

    // Collapsed already, with no transition on the way there.
    await expect.poll(() => bar().hasAttribute("data-animated")).toBe(true);
    expect(width()).toBe(57);
    expect(getComputedStyle(bar()).transitionProperty).toContain("inline-size");
  });

  test("a controlled sidebar isn't changed by the cookie", async () => {
    setCookie("nuv-sidebar=false; path=/");
    await desktop(<Example cookieName="nuv-sidebar" open />);

    await expect.poll(() => bar().hasAttribute("data-animated")).toBe(true);
    expect(width()).toBe(256);
  });
});

describe("on a phone", () => {
  test("the sidebar isn't in the page, and the trigger opens it as a panel", async () => {
    await phone(<Example />);

    expect(document.querySelector(".nuv-sidebar")).toBeNull();
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(rect(page.getByRole("main").element()).width).toBe(
      window.innerWidth,
    );

    await trigger().click();

    await expect.element(panel()).toBeVisible();
    await expect
      .element(panel())
      .toHaveClass("nuv-sidebar", "nuv-sidebar--mobile");
    await expect.element(inbox()).toBeVisible();
    await expect.element(page.getByText("Signed in")).toBeVisible();
  });

  test("the panel is as tall as the screen, on the start edge, and leaves a strip of page", async () => {
    await phone(<Example />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();
    const box = rect(panel().element());

    expect(box.left).toBe(0);
    expect(box.top).toBe(0);
    expect(box.height).toBe(window.innerHeight);
    expect(box.width).toBe(288);
    expect(window.innerWidth - box.right).toBeGreaterThanOrEqual(48);
  });

  test("on a narrow phone the panel gives way to keep that strip", async () => {
    await page.viewport(320, 640);
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();

    expect(rect(panel().element()).width).toBe(320 - 48);
  });

  test("side=end puts the panel on the other edge", async () => {
    await phone(<Example after={false} sidebar={{ side: "end" }} />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();

    expect(rect(panel().element()).right).toBe(window.innerWidth);
  });

  test("in a right-to-left layout the start edge is the right one", async () => {
    document.documentElement.dir = "rtl";
    await phone(
      <DirectionProvider dir="rtl">
        <Example />
      </DirectionProvider>,
    );
    await trigger().click();
    await expect.element(panel()).toBeVisible();

    expect(rect(panel().element()).right).toBe(window.innerWidth);
  });

  test("its close button closes it and focus goes back to the trigger", async () => {
    await phone(<Example />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();
    const close = page.getByRole("button", { name: "Close" });
    // In a row of its own, above whatever the sidebar starts with.
    expect(rect(close.element()).bottom).toBeLessThanOrEqual(
      rect(page.getByText("Acme").element()).top,
    );

    await close.click();

    await expect.element(panel()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
  });

  test("Escape closes it and focus goes back to the trigger", async () => {
    await phone(<Example />);
    await userEvent.keyboard("{Tab}{Enter}");
    await expect.element(panel()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(panel()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
  });

  test("a tap on the page behind closes it", async () => {
    await phone(<Example />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();

    await userEvent.click(document.body, {
      position: { x: window.innerWidth - 10, y: 300 },
      force: true,
    });

    await expect.element(panel()).not.toBeInTheDocument();
  });

  test("Tab stays inside the open panel", async () => {
    await phone(<Example />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();

    for (let presses = 0; presses < 12; presses += 1) {
      await userEvent.keyboard("{Tab}");
      expect(panel().element().contains(document.activeElement)).toBe(true);
    }
  });

  test("the panel's name and its close button's can be changed", async () => {
    await phone(
      <Example sidebar={{ label: "Navigation", closeLabel: "Shut" }} />,
    );
    await trigger().click();

    await expect
      .element(page.getByRole("dialog", { name: "Navigation" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Shut" }))
      .toBeVisible();
  });

  test("the shortcut opens and closes the panel", async () => {
    await phone(<Example />);

    await userEvent.keyboard("{Control>}b{/Control}");
    await expect.element(panel()).toBeVisible();

    await userEvent.keyboard("{Control>}b{/Control}");
    await expect.element(panel()).not.toBeInTheDocument();
  });

  test("the panel is never down to icons, and has no tooltips", async () => {
    await phone(<Example defaultOpen={false} />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();

    expect(panel().element().classList.contains("nuv-sidebar--rail")).toBe(
      false,
    );
    await expect.element(page.getByText("Mail")).toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Today" }))
      .toBeVisible();

    await userEvent.hover(inbox());
    await new Promise((resolve) => setTimeout(resolve, 900));
    await expect.element(page.getByRole("tooltip")).not.toBeInTheDocument();
  });

  test("opening the panel doesn't change the sidebar a wider screen gets", async () => {
    await phone(<Example cookieName="nuv-sidebar" />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();
    expect(document.cookie).not.toContain("nuv-sidebar");

    await setViewport("desktop");

    // The panel has gone, and the sidebar in the page is as it started.
    await expect.element(panel()).not.toBeInTheDocument();
    await expect.poll(width).toBe(256);

    await setViewport("phone");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
    await expect.element(panel()).not.toBeInTheDocument();
  });

  test("what a server renders stays out of sight until the screen is wide enough", async () => {
    await setViewport("phone");
    await render(<div className="nuv-sidebar" data-testid="bare" />);
    const bare = page.getByTestId("bare").element();

    expect(getComputedStyle(bare).display).toBe("none");

    await setViewport("desktop");
    expect(getComputedStyle(bare).display).toBe("flex");
  });

  test("slides in from its edge when motion is fine, and not when it's reduced", async () => {
    await setViewport("phone");
    await emulateMedia({ reducedMotion: "no-preference" });
    const first = await render(<Example />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();
    expect(getComputedStyle(panel().element()).animationName).toBe(
      "nuv-sidebar-left-in",
    );
    await first.unmount();

    const second = await render(
      <Example after={false} sidebar={{ side: "end" }} />,
    );
    await trigger().click();
    await expect.element(panel()).toBeVisible();
    expect(getComputedStyle(panel().element()).animationName).toBe(
      "nuv-sidebar-right-in",
    );
    await second.unmount();

    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();
    expect(getComputedStyle(panel().element()).animationName).toBe("none");
  });
});

describe("layout and looks", () => {
  test("rows are 40px tall with a mouse, and the trigger 32px square", async () => {
    await desktop(<Example />);

    expect(rect(inbox().element()).height).toBe(40);
    expect(rect(sent().element()).height).toBe(40);
    expect(rect(trigger().element()).width).toBe(32);
    expect(rect(trigger().element()).height).toBe(32);
  });

  test("variables set its width, height, colors and where it sticks", async () => {
    await desktop(
      <Example
        style={
          {
            "--nuv-sidebar-width": "20rem",
            "--nuv-sidebar-height": "300px",
            "--nuv-sidebar-offset": "10px",
            "--nuv-sidebar-bg": "rgb(10, 20, 30)",
            "--nuv-sidebar-fg": "rgb(240, 240, 240)",
            "--nuv-sidebar-border": "rgb(1, 2, 3)",
            "--nuv-sidebar-item-height": "48px",
          } as never
        }
      />,
    );
    const style = getComputedStyle(bar());

    expect(width()).toBe(320);
    expect(rect(bar()).height).toBe(300);
    expect(style.top).toBe("10px");
    expect(style.position).toBe("sticky");
    expect(style.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(style.color).toBe("rgb(240, 240, 240)");
    expect(style.borderRightColor).toBe("rgb(1, 2, 3)");
    expect(rect(inbox().element()).height).toBe(48);
    // A menu button takes the sidebar's text color, whatever it's given.
    expect(getComputedStyle(inbox().element()).color).toBe(
      "rgb(240, 240, 240)",
    );
  });

  test("a taller row makes a wider strip of icons", async () => {
    await desktop(
      <Example
        defaultOpen={false}
        style={{ "--nuv-sidebar-item-height": "48px" } as never}
      />,
    );

    expect(width()).toBe(48 + 16 + 1);
    expect(rect(inbox().element()).width).toBe(48);
  });

  test("a row under the pointer is filled", async () => {
    await desktop(<Example />);
    const style = getComputedStyle(sent().element());
    const before = style.backgroundColor;

    await userEvent.hover(sent());

    await expect.poll(() => style.backgroundColor).not.toBe(before);
  });

  test("data-theme on the sidebar makes it dark in a light page", async () => {
    setPageTheme("light");
    await desktop(<Example sidebar={{ "data-theme": "dark" } as never} />);
    const page_ = getComputedStyle(document.body).backgroundColor;
    const side = getComputedStyle(bar());

    expect(contrast(side.backgroundColor, page_)).toBeGreaterThan(10);
    expect(contrast(side.color, side.backgroundColor)).toBeGreaterThanOrEqual(
      7,
    );
  });

  test("the width changes over a moment when motion is fine, and at once when it's reduced", async () => {
    await setViewport("desktop");
    await emulateMedia({ reducedMotion: "no-preference" });
    const first = await render(<Example />);
    await expect.poll(() => bar().hasAttribute("data-animated")).toBe(true);
    expect(getComputedStyle(bar()).transitionProperty).toContain("inline-size");
    expect(getComputedStyle(bar()).transitionDuration).toContain("0.25s");
    await first.unmount();

    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    await expect.poll(() => bar().hasAttribute("data-animated")).toBe(true);
    expect(getComputedStyle(bar()).transitionDuration).toBe("0s");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe expanded", async () => {
    setPageTheme(theme);
    await desktop(<Example />);

    const results = await axe(document.body);

    expect(results).toHaveNoViolations();
    const checked = results.passes.find((rule) => rule.id === "color-contrast");
    // The label, the rows that aren't disabled, the badge and the footer.
    expect(checked?.nodes.length).toBeGreaterThanOrEqual(8);
  });

  test("passes axe down to its icons", async () => {
    setPageTheme(theme);
    await desktop(<Example defaultOpen={false} />);

    expect(await axe(document.body)).toHaveNoViolations();
  });

  test("passes axe as a panel on a phone", async () => {
    setPageTheme(theme);
    await phone(<Example />);
    await trigger().click();
    await expect.element(panel()).toBeVisible();

    expect(await axe(document.body, outsideLandmarks)).toHaveNoViolations();
  });

  test("passes axe in the other mode from the page", async () => {
    setPageTheme(theme);
    const other = theme.endsWith("dark") ? "light" : "dark";
    await desktop(<Example sidebar={{ "data-theme": other } as never} />);

    expect(await axe(document.body)).toHaveNoViolations();
  });
});

import "../../styles/index.scss";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { emulateTouch, setViewport } from "../../../test/media";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import {
  Tabs,
  TabsContent,
  TabsList,
  type TabsProps,
  TabsTrigger,
} from "./tabs";

function Example(props: Partial<TabsProps>) {
  return (
    <Tabs defaultValue="account" {...props}>
      <TabsList aria-label="Settings">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Your name and email.</TabsContent>
      <TabsContent value="billing">Invoices.</TabsContent>
      <TabsContent value="team">People with access.</TabsContent>
      <TabsContent value="security">Password and sign-in.</TabsContent>
    </Tabs>
  );
}

const tab = (name: string) => page.getByRole("tab", { name });
const panel = () => page.getByRole("tabpanel");

describe("rendering", () => {
  test("shows the default tab's panel, named by its tab", async () => {
    await render(<Example />);

    await expect
      .element(page.getByRole("tablist", { name: "Settings" }))
      .toBeVisible();
    await expect
      .element(tab("Account"))
      .toHaveAttribute("aria-selected", "true");
    await expect.element(panel()).toHaveTextContent("Your name and email.");
    await expect.element(panel()).toHaveAccessibleName("Account");
  });

  test("a click switches the panel", async () => {
    await render(<Example />);

    await tab("Team").click();

    await expect.element(tab("Team")).toHaveAttribute("aria-selected", "true");
    await expect
      .element(tab("Account"))
      .toHaveAttribute("aria-selected", "false");
    await expect.element(panel()).toHaveTextContent("People with access.");
  });

  test("can be controlled", async () => {
    const onValueChange = vi.fn();
    await render(<Example value="account" onValueChange={onValueChange} />);

    await tab("Team").click();

    expect(onValueChange).toHaveBeenCalledWith("team");
    await expect.element(panel()).toHaveTextContent("Your name and email.");
  });

  test("keeps a className on each part", async () => {
    await render(
      <Tabs defaultValue="a" className="root">
        <TabsList className="list">
          <TabsTrigger value="a" className="trigger">
            A
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a" className="content">
          Content
        </TabsContent>
      </Tabs>,
    );

    await expect
      .element(page.getByRole("tablist"))
      .toHaveClass("nuv-tabs__list", "list");
    await expect.element(tab("A")).toHaveClass("nuv-tabs__trigger", "trigger");
    await expect.element(panel()).toHaveClass("nuv-tabs__content", "content");
    expect(document.querySelector(".nuv-tabs.root")).not.toBeNull();
  });
});

describe("keyboard", () => {
  test("Tab lands on the selected tab, then on the panel", async () => {
    await render(<Example defaultValue="team" />);

    await userEvent.keyboard("{Tab}");
    await expect.element(tab("Team")).toHaveFocus();

    await userEvent.keyboard("{Tab}");
    await expect.element(panel()).toHaveFocus();
  });

  test("arrow keys move and select, skipping a disabled tab", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");

    await userEvent.keyboard("{ArrowRight}");
    await expect.element(tab("Team")).toHaveFocus();
    await expect.element(panel()).toHaveTextContent("People with access.");

    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(tab("Account")).toHaveFocus();
  });

  test("arrow keys wrap, and Home and End jump to the ends", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");

    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(tab("Security")).toHaveFocus();

    await userEvent.keyboard("{Home}");
    await expect.element(tab("Account")).toHaveFocus();

    await userEvent.keyboard("{End}");
    await expect.element(tab("Security")).toHaveFocus();
  });

  test("a vertical list uses the up and down arrows", async () => {
    await render(<Example orientation="vertical" />);
    await userEvent.keyboard("{Tab}");

    await userEvent.keyboard("{ArrowDown}");

    await expect.element(tab("Team")).toHaveFocus();
  });
});

describe("styles", () => {
  test("marks the selected tab with a line in the primary color", async () => {
    await render(<Example />);
    const color = (name: string) =>
      getComputedStyle(tab(name).element()).borderBottomColor;

    expect(color("Account")).not.toBe(color("Team"));
    expect(color("Team")).toBe("rgba(0, 0, 0, 0)");
  });

  test("tabs are at least 44px tall on a touch screen and 40px with a mouse", async () => {
    await render(<Example />);
    const height = () =>
      tab("Account").element().getBoundingClientRect().height;

    expect(height()).toBe(40);
    await emulateTouch(true);
    expect(height()).toBeGreaterThanOrEqual(44);
  });

  test("shows a focus ring for keyboard focus", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");

    expect(getComputedStyle(tab("Account").element()).outlineStyle).toBe(
      "solid",
    );
  });

  test("too many tabs scroll inside the list, not the page", async () => {
    await setViewport("phone");
    await render(
      <Tabs defaultValue="tab-0">
        <TabsList aria-label="Many">
          {Array.from({ length: 12 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static filler
            <TabsTrigger key={index} value={`tab-${index}`}>
              Section {index}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="tab-0">Content</TabsContent>
      </Tabs>,
    );
    const list = page.getByRole("tablist").element();

    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("a vertical list stacks the tabs beside the panel", async () => {
    await render(<Example orientation="vertical" />);
    const first = tab("Account").element().getBoundingClientRect();
    const last = tab("Security").element().getBoundingClientRect();
    const content = panel().element().getBoundingClientRect();

    expect(last.top).toBeGreaterThan(first.bottom);
    expect(last.left).toBe(first.left);
    expect(content.left).toBeGreaterThan(first.right);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(theme, <Example />);

    await expectNoViolations(screen.container);
  });
});

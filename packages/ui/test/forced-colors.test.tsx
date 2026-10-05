import "../src/styles/index.scss";
import { beforeEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../src";
import { contrast } from "./contrast";
import { emulateMedia } from "./media";

// Forced-colors mode is what Windows high contrast turns on. The browser
// replaces every color with one from a short system palette and stops
// drawing backgrounds and shadows, so anything a component shows with a
// background alone disappears. These check that each state can still be
// told apart there.

beforeEach(async () => {
  await emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
});

const style = (element: Element) => getComputedStyle(element);

// The color the browser is using for the page itself.
function canvas() {
  const probe = document.createElement("span");
  probe.style.color = "canvas";
  document.body.append(probe);
  const { color } = style(probe);
  probe.remove();
  return color;
}

test("the browser is forcing colors", async () => {
  expect(matchMedia("(forced-colors: active)").matches).toBe(true);
});

describe("switch", () => {
  test("has an edge, and a thumb that stands out from the page", async () => {
    await render(<Switch aria-label="Updates" />);
    const element = page.getByRole("switch").element();
    const thumb = element.querySelector(".nuv-switch__thumb") as Element;

    expect(style(element).outlineStyle).toBe("solid");
    expect(contrast(style(element).outlineColor, canvas())).toBeGreaterThan(3);
    expect(contrast(style(thumb).backgroundColor, canvas())).toBeGreaterThan(3);
  });

  test("the thumb changes color as well as side when it's on", async () => {
    await render(
      <>
        <Switch aria-label="Off" />
        <Switch aria-label="On" defaultChecked />
      </>,
    );
    const thumb = (name: string) =>
      style(
        page
          .getByRole("switch", { name })
          .element()
          .querySelector(".nuv-switch__thumb") as Element,
      ).backgroundColor;

    expect(thumb("On")).not.toBe(thumb("Off"));
    expect(contrast(thumb("On"), canvas())).toBeGreaterThan(3);
  });
});

describe("checkbox", () => {
  test("keeps its edge, and its mark when checked", async () => {
    await render(<Checkbox aria-label="Terms" defaultChecked />);
    const box = style(page.getByRole("checkbox").element());

    expect(contrast(box.borderTopColor, canvas())).toBeGreaterThan(3);
    // The mark is drawn in the current text color.
    expect(contrast(box.color, box.backgroundColor)).toBeGreaterThan(3);
  });
});

describe("tabs", () => {
  test("only the selected tab has a line under it", async () => {
    await render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Sections">
          <TabsTrigger value="a">First</TabsTrigger>
          <TabsTrigger value="b">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="a">One</TabsContent>
        <TabsContent value="b">Two</TabsContent>
      </Tabs>,
    );
    const line = (name: string) =>
      style(page.getByRole("tab", { name }).element()).borderBottomColor;

    expect(contrast(line("First"), canvas())).toBeGreaterThan(3);
    expect(line("Second")).toBe(canvas());
  });
});

describe("rows that take focus", () => {
  test("the focused menu item has an outline in place of its fill", async () => {
    await render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = page.getByRole("menuitem", { name: "Rename" });
    await userEvent.hover(item);
    await expect.element(item).toHaveAttribute("data-highlighted");

    expect(style(item.element()).outlineStyle).toBe("solid");
    expect(
      contrast(style(item.element()).outlineColor, canvas()),
    ).toBeGreaterThan(3);
    expect(
      style(page.getByRole("menuitem", { name: "Duplicate" }).element())
        .outlineStyle,
    ).toBe("none");
  });

  test("the focused select option has one too", async () => {
    await render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>,
    );
    const option = page.getByRole("option", { name: "Banana" });
    await userEvent.hover(option);
    await expect.element(option).toHaveAttribute("data-highlighted");

    expect(style(option.element()).outlineStyle).toBe("solid");
    expect(
      contrast(style(option.element()).outlineColor, canvas()),
    ).toBeGreaterThan(3);
  });
});

describe("tooltip", () => {
  test("has an edge to set it apart from the page", async () => {
    await render(
      <div style={{ padding: 80 }}>
        <Tooltip defaultOpen>
          <TooltipTrigger>Archive</TooltipTrigger>
          <TooltipContent>Takes it out of your list</TooltipContent>
        </Tooltip>
      </div>,
    );
    await expect
      .poll(() => document.querySelector(".nuv-tooltip"))
      .not.toBeNull();
    const bubble = style(document.querySelector(".nuv-tooltip") as Element);

    expect(bubble.outlineStyle).toBe("solid");
    expect(contrast(bubble.outlineColor, canvas())).toBeGreaterThan(3);
  });
});

describe("focus", () => {
  test("the keyboard focus ring is still drawn", async () => {
    await render(<Button>Save</Button>);

    await userEvent.keyboard("{Tab}");

    const button = style(page.getByRole("button").element());
    expect(button.outlineStyle).toBe("solid");
    expect(contrast(button.outlineColor, canvas())).toBeGreaterThan(3);
  });

  test("a button keeps a visible edge", async () => {
    await render(<Button intent="ghost">Save</Button>);
    const button = style(page.getByRole("button").element());

    expect(contrast(button.borderTopColor, canvas())).toBeGreaterThan(3);
  });
});

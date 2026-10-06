import "../src/styles/index.scss";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanup, render } from "vitest-browser-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
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
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from "../src";
import { contrast } from "./contrast";
import { emulateMedia } from "./media";

// Forced-colors mode is what Windows high contrast turns on. The browser
// replaces every color with one from a short system palette and stops
// drawing backgrounds and shadows, so anything a component shows with a
// background alone disappears. These check that each state can still be
// told apart there.

beforeEach(async ({ skip }) => {
  await emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });

  // WebKit answers the media query when asked to, but has no forced-colors
  // mode: it goes on painting the colors the page set. There's nothing to
  // check there, and no Safari user is in this mode either.
  const probe = document.createElement("span");
  probe.style.color = "rgb(1, 2, 3)";
  document.body.append(probe);
  const forced = getComputedStyle(probe).color !== "rgb(1, 2, 3)";
  probe.remove();
  if (!forced) skip("this browser doesn't force colors");
});

const style = (element: Element) => getComputedStyle(element);

// What the browser is using for one of its system colors.
function system(name: string) {
  const probe = document.createElement("span");
  probe.style.color = name;
  document.body.append(probe);
  const { color } = style(probe);
  probe.remove();
  return color;
}

// The color of the page itself.
const canvas = () => system("canvas");

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
    expect(thumb("On")).toBe(system("highlight"));
    expect(thumb("Off")).toBe(system("buttontext"));
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

    // The system's own color for a selected thing. How well it stands out
    // is up to the theme the user picked, not something to measure here:
    // the palette a browser emulates isn't one anybody chose.
    expect(line("First")).toBe(system("highlight"));
    expect(line("First")).not.toBe(canvas());
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

describe("menus and lists", () => {
  test("a menu has an edge to set it apart from the page", async () => {
    await render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await expect.element(page.getByRole("menu")).toBeVisible();
    const menu = style(page.getByRole("menu").element());

    expect(menu.borderTopStyle).toBe("solid");
    expect(contrast(menu.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(contrast(menu.color, menu.backgroundColor)).toBeGreaterThan(4.5);
  });

  test("a select's trigger and its list each have one", async () => {
    await render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    await expect.element(page.getByRole("listbox")).toBeVisible();
    const trigger = style(document.querySelector(".nuv-select") as Element);
    const list = style(page.getByRole("listbox").element());

    expect(contrast(trigger.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(list.borderTopStyle).toBe("solid");
    expect(contrast(list.borderTopColor, canvas())).toBeGreaterThan(3);
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

describe("accordion", () => {
  test("keeps the lines between items, and a chevron that can be seen", async () => {
    await render(
      <Accordion type="single" defaultValue="a">
        <AccordionItem value="a">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Two working days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Returns</AccordionTrigger>
          <AccordionContent>Within 30 days.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const item = document.querySelector(".nuv-accordion__item") as Element;
    const chevron = document.querySelector(
      ".nuv-accordion__chevron",
    ) as Element;

    expect(contrast(style(item).borderBottomColor, canvas())).toBeGreaterThan(
      3,
    );
    // The chevron is drawn in the current text color.
    expect(contrast(style(chevron).color, canvas())).toBeGreaterThan(3);
    expect(style(chevron).stroke).toBe(style(chevron).color);
  });

  test("the open item is told apart by its chevron, not by a color", async () => {
    await render(
      <Accordion type="single" defaultValue="a">
        <AccordionItem value="a">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Two working days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Returns</AccordionTrigger>
          <AccordionContent>Within 30 days.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const turn = (name: string) =>
      style(
        page
          .getByRole("button", { name })
          .element()
          .querySelector(".nuv-accordion__chevron") as Element,
      ).transform;

    expect(turn("Shipping")).not.toBe("none");
    expect(turn("Returns")).toBe("none");
  });

  test("the answer's text can be read", async () => {
    await render(
      <Accordion type="single" defaultValue="a">
        <AccordionItem value="a">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Two working days.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const content = document.querySelector(
      ".nuv-accordion__content",
    ) as Element;

    expect(contrast(style(content).color, canvas())).toBeGreaterThan(4.5);
  });
});

describe("dialog", () => {
  async function openDialog() {
    await render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Delete this project?</DialogTitle>
          <DialogDescription>This can't be undone.</DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button intent="secondary">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await expect.element(page.getByRole("dialog")).toBeVisible();
    return page.getByRole("dialog").element();
  }

  test("the panel has an edge to set it apart from the page", async () => {
    const panel = style(await openDialog());

    expect(panel.borderTopStyle).toBe("solid");
    expect(contrast(panel.borderTopColor, canvas())).toBeGreaterThan(3);
  });

  test("the text and the close button can be seen", async () => {
    const panel = await openDialog();
    const close = page.getByRole("button", { name: "Close", exact: true });
    const description = panel.querySelector(
      ".nuv-dialog__description",
    ) as Element;

    expect(
      contrast(style(panel).color, style(panel).backgroundColor),
    ).toBeGreaterThan(4.5);
    expect(
      contrast(style(description).color, style(panel).backgroundColor),
    ).toBeGreaterThan(4.5);
    // The cross is drawn in the button's text color.
    expect(
      contrast(style(close.element()).color, style(panel).backgroundColor),
    ).toBeGreaterThan(3);
  });

  test("the layer behind it doesn't hide the panel", async () => {
    const panel = await openDialog();
    const { left, top, width } = panel.getBoundingClientRect();

    expect(document.elementFromPoint(left + width / 2, top + 4)).toBe(panel);
  });
});

describe("popover", () => {
  async function openPopover() {
    await render(
      <div style={{ padding: 80 }}>
        <Popover defaultOpen>
          <PopoverTrigger>Share</PopoverTrigger>
          <PopoverContent showArrow aria-label="Share this page">
            Anyone with the link can view.
          </PopoverContent>
        </Popover>
      </div>,
    );
    await expect.element(page.getByRole("dialog")).toBeVisible();
    return page.getByRole("dialog").element();
  }

  test("the panel has an edge to set it apart from the page", async () => {
    const panel = style(await openPopover());

    expect(panel.borderTopStyle).toBe("solid");
    expect(contrast(panel.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(contrast(panel.color, panel.backgroundColor)).toBeGreaterThan(4.5);
  });

  test("the arrow is drawn in the colors the panel was given", async () => {
    const panel = style(await openPopover());
    const arrow = style(
      document.querySelector(".nuv-popover__arrow") as Element,
    );

    expect(arrow.fill).toBe(panel.backgroundColor);
    expect(contrast(arrow.stroke, panel.backgroundColor)).toBeGreaterThan(3);
  });
});

describe("toast", () => {
  afterEach(async () => {
    await cleanup();
    toast.dismiss();
  });

  async function show(options: Parameters<typeof toast>[1] = {}) {
    await render(<Toaster />);
    toast("File deleted", {
      duration: Number.POSITIVE_INFINITY,
      description: "report.pdf is in the trash.",
      action: { label: "Undo", altText: "Undo with Ctrl+Z", onClick() {} },
      ...options,
    });
    await expect
      .poll(() => document.querySelector(".nuv-toast"))
      .not.toBeNull();
    return document.querySelector(".nuv-toast") as Element;
  }

  test("has an edge to set it apart from the page", async () => {
    const element = style(await show());

    expect(element.borderTopStyle).toBe("solid");
    expect(contrast(element.borderTopColor, canvas())).toBeGreaterThan(3);
  });

  test("its text and its buttons can be seen", async () => {
    const element = await show();
    const background = style(element).backgroundColor;
    const part = (selector: string) =>
      style(element.querySelector(selector) as Element);

    expect(contrast(style(element).color, background)).toBeGreaterThan(4.5);
    expect(
      contrast(part(".nuv-toast__description").color, background),
    ).toBeGreaterThan(4.5);
    expect(
      contrast(part(".nuv-toast__action").borderTopColor, background),
    ).toBeGreaterThan(3);
    expect(
      contrast(part(".nuv-toast__action").color, background),
    ).toBeGreaterThan(4.5);
    // The cross is drawn in the button's text color.
    expect(
      contrast(part(".nuv-toast__close").color, background),
    ).toBeGreaterThan(3);
  });

  test("an intent still has its thicker edge", async () => {
    const element = style(await show({ intent: "danger" }));

    expect(element.borderInlineStartWidth).toBe("4px");
    expect(contrast(element.borderInlineStartColor, canvas())).toBeGreaterThan(
      3,
    );
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

import "../src/styles/index.scss";
import { afterEach, describe, expect, test } from "vitest";
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
  DialogContent,
  DialogDescription,
  DialogTitle,
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
  Toaster,
  toast,
} from "../src";
import { emulateMedia } from "./media";
import { hitAt } from "./themed";

// This file runs in a browser context of its own, one that reports a touch
// screen. vitest.config.ts sets that up and says why. What a control measures
// on a touch screen is checked here. What it shrinks to with a mouse is
// checked next to each component.

const box = (element: Element) => element.getBoundingClientRect();

// Room around a control, so that a point just outside it is still on the
// page.
const padded = { padding: 40 };

test("the browser reports a touch screen", () => {
  expect(matchMedia("(pointer: coarse)").matches).toBe(true);
  expect(matchMedia("(hover: none)").matches).toBe(true);
});

describe("button", () => {
  test.each([
    ["sm", 44],
    ["md", 44],
    ["lg", 48],
  ] as const)(
    "size %s is %ipx tall and at least 44px wide",
    async (size, height) => {
      await render(<Button size={size}>A</Button>);
      const button = box(page.getByRole("button").element());

      expect(button.height).toBe(height);
      expect(button.width).toBeGreaterThanOrEqual(44);
    },
  );

  test("doesn't change color under a finger that has moved on", async () => {
    await render(<Button>Save</Button>);
    const button = page.getByRole("button");
    const before = getComputedStyle(button.element()).backgroundColor;

    // A touch screen leaves :hover set on the last thing tapped.
    await userEvent.hover(button);

    expect(button.element().matches(":hover")).toBe(true);
    expect(getComputedStyle(button.element()).backgroundColor).toBe(before);
  });
});

describe("checkbox", () => {
  test("a tap just outside the box still lands on it", async () => {
    await render(
      <div style={padded}>
        <Checkbox aria-label="Terms" />
      </div>,
    );
    const element = page.getByRole("checkbox").element();

    // The box is 20px. 18px up from its center is outside the box and
    // inside a 44px target.
    expect(box(element).width).toBe(20);
    expect(hitAt(element, 0, -18)).toBe(element);
  });
});

describe("switch", () => {
  test("is 44px wide, with a tap area 44px tall", async () => {
    await render(
      <div style={padded}>
        <Switch aria-label="Updates" />
      </div>,
    );
    const element = page.getByRole("switch").element();

    expect(box(element).width).toBe(44);
    expect(box(element).height).toBe(24);
    // 20px above the center is outside the 24px track.
    expect(hitAt(element, 0, -20)).toBe(element);
  });
});

describe("tabs", () => {
  test("a tab is at least 44px tall", async () => {
    await render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Sections">
          <TabsTrigger value="a">Account</TabsTrigger>
          <TabsTrigger value="b">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="a">One</TabsContent>
        <TabsContent value="b">Two</TabsContent>
      </Tabs>,
    );

    expect(
      box(page.getByRole("tab", { name: "Account" }).element()).height,
    ).toBeGreaterThanOrEqual(44);
  });
});

describe("accordion", () => {
  test("a trigger is at least 44px tall", async () => {
    await render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Two working days.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(
      box(page.getByRole("button", { name: "Shipping" }).element()).height,
    ).toBeGreaterThanOrEqual(44);
  });
});

describe("dialog", () => {
  test("the close button is at least 44px each way", async () => {
    await render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Changes are saved to your account.
          </DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const close = box(
      page.getByRole("button", { name: "Close", exact: true }).element(),
    );

    expect(close.width).toBeGreaterThanOrEqual(44);
    expect(close.height).toBeGreaterThanOrEqual(44);
  });
});

describe("dropdown menu", () => {
  test("a row is 44px tall", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const row = page.getByRole("menuitem", { name: "Rename" });
    await expect.element(row).toBeVisible();

    expect(box(row.element()).height).toBe(44);
  });
});

describe("select", () => {
  function Fruit({ defaultOpen = false }: { defaultOpen?: boolean }) {
    return (
      <Select defaultOpen={defaultOpen}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  test("the trigger is 44px tall", async () => {
    await render(<Fruit />);

    expect(box(page.getByRole("combobox").element()).height).toBe(44);
  });

  test("an option is 44px tall", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Fruit defaultOpen />);
    const option = page.getByRole("option", { name: "Apple" });
    await expect.element(option).toBeVisible();

    expect(box(option.element()).height).toBe(44);
  });
});

describe("toast", () => {
  // The list of toasts lives outside React, so it outlasts a test's render.
  afterEach(async () => {
    await cleanup();
    toast.dismiss();
  });

  test("the action and the close button are 44px each way", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Toaster />);
    toast("File deleted", {
      duration: Number.POSITIVE_INFINITY,
      action: { label: "Undo", altText: "Undo with Ctrl+Z", onClick() {} },
    });
    await expect
      .element(page.getByRole("button", { name: "Undo" }))
      .toBeVisible();

    for (const name of ["Undo", "Close"]) {
      const button = box(page.getByRole("button", { name }).element());
      expect(button.width).toBeGreaterThanOrEqual(44);
      expect(button.height).toBe(44);
    }
  });
});

// Density makes controls shorter or taller with a mouse. A finger is the
// same size whatever the layout, so nothing here may drop under 44px.
describe.each([
  ["compact", { "data-density": "compact" }],
  ["comfortable", { "data-density": "comfortable" }],
  ["the compact preset", { "data-preset": "ledger" }],
] as const)("with %s density", (_name, attributes) => {
  function setOnPage() {
    for (const [name, value] of Object.entries(attributes)) {
      document.documentElement.setAttribute(name, value);
    }
  }

  test.each(["sm", "md", "lg"] as const)(
    "a %s button is at least 44px tall",
    async (size) => {
      setOnPage();
      await render(<Button size={size}>A</Button>);

      expect(
        box(page.getByRole("button").element()).height,
      ).toBeGreaterThanOrEqual(44);
    },
  );

  test("a select and its options are 44px tall", async () => {
    setOnPage();
    await emulateMedia({ reducedMotion: "reduce" });
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
    const option = page.getByRole("option", { name: "Apple" });
    await expect.element(option).toBeVisible();

    expect(box(option.element()).height).toBe(44);
    expect(box(document.querySelector(".nuv-select") as Element).height).toBe(
      44,
    );
  });

  test("a menu row and a tab are at least 44px tall", async () => {
    setOnPage();
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <>
        <Tabs defaultValue="one">
          <TabsList aria-label="Sections">
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First</TabsContent>
        </Tabs>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Rename</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>,
    );
    const row = page.getByRole("menuitem", { name: "Rename" });
    await expect.element(row).toBeVisible();

    expect(box(row.element()).height).toBe(44);
    expect(
      box(document.querySelector(".nuv-tabs__trigger") as Element).height,
    ).toBeGreaterThanOrEqual(44);
  });
});

import "../src/styles/index.scss";
import { afterEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanup, render } from "vitest-browser-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  Button,
  Checkbox,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FileUpload,
  Input,
  InputGroup,
  InputGroupButton,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  NativeSelect,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  OtpField,
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PasswordInput,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toaster,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
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

describe("fields", () => {
  test("an input, a native select and a password input are 44px tall", async () => {
    await render(
      <>
        <Input aria-label="Name" />
        <NativeSelect aria-label="Country">
          <option>Norway</option>
        </NativeSelect>
        <PasswordInput aria-label="Password" />
      </>,
    );

    for (const name of ["Name", "Country"]) {
      expect(box(page.getByLabelText(name).element()).height).toBe(44);
    }
    expect(
      box(document.querySelector(".nuv-password-input") as Element).height,
    ).toBe(44);
  });

  // Under 16px, iOS zooms the page in when a field takes focus.
  test("their text is 16px", async () => {
    await render(
      <>
        <Input aria-label="Name" />
        <Textarea aria-label="Notes" />
        <NativeSelect aria-label="Country">
          <option>Norway</option>
        </NativeSelect>
        <PasswordInput aria-label="Password" />
        <OtpField aria-label="Code" length={1} />
      </>,
    );

    for (const field of document.querySelectorAll(
      'input:not([type="hidden"]), textarea, select',
    )) {
      expect(
        Number.parseFloat(getComputedStyle(field).fontSize),
      ).toBeGreaterThanOrEqual(16);
    }
  });

  test("a one-time code box is 44px each way", async () => {
    await render(<OtpField aria-label="Code" />);
    const first = box(page.getByRole("textbox").first().element());

    expect(first.width).toBe(44);
    expect(first.height).toBe(44);
  });

  test("six boxes still fit a narrow phone", async () => {
    await render(
      <div style={{ inlineSize: 280 }}>
        <OtpField aria-label="Code" />
      </div>,
    );
    const group = box(page.getByRole("group").element());

    expect(group.width).toBeLessThanOrEqual(280);
    expect(box(page.getByRole("textbox").first().element()).height).toBe(44);
  });

  test("a button inside a field takes a tap from just outside it", async () => {
    await render(
      <div style={padded}>
        <InputGroup>
          <Input aria-label="Site" />
          <InputGroupButton>Copy</InputGroupButton>
        </InputGroup>
        <PasswordInput aria-label="Password" />
      </div>,
    );

    for (const name of ["Copy", "Show password"]) {
      const element = page.getByRole("button", { name }).element();
      // Drawn 36px tall. 20px up from its center is outside it and inside
      // a 44px target.
      expect(box(element).height).toBe(36);
      expect(hitAt(element, 0, -20)).toBe(element);
    }
  });
});

describe("radio group", () => {
  test("a tap just outside the circle still lands on it", async () => {
    await render(
      <div style={padded}>
        <RadioGroup aria-label="Plan">
          <RadioGroupItem value="free" aria-label="Free" />
        </RadioGroup>
      </div>,
    );
    const element = page.getByRole("radio").element();

    expect(box(element).width).toBe(20);
    expect(hitAt(element, 0, -18)).toBe(element);
  });

  test("the rows are far enough apart that two tap areas don't overlap", async () => {
    await render(
      <div style={padded}>
        <RadioGroup aria-label="Plan">
          <RadioGroupItem value="free" aria-label="Free" />
          <RadioGroupItem value="team" aria-label="Team" />
        </RadioGroup>
      </div>,
    );
    const first = page.getByRole("radio", { name: "Free" }).element();
    const second = page.getByRole("radio", { name: "Team" }).element();

    expect(box(second).top - box(first).top).toBe(44);
    // The halfway point between them is 22px down from the first.
    expect(hitAt(first, 0, 21)).toBe(first);
    expect(hitAt(first, 0, 23)).toBe(second);
  });
});

describe("slider", () => {
  test("a tap just outside the handle still lands on it", async () => {
    await render(
      <div style={padded}>
        <Slider aria-label="Volume" defaultValue={[50]} />
      </div>,
    );
    const element = page.getByRole("slider").element();

    expect(box(element).width).toBe(20);
    expect(hitAt(element, 0, -18)).toBe(element);
    expect(hitAt(element, 18, 0)).toBe(element);
  });
});

describe("toggle", () => {
  test.each([
    ["sm", 44],
    ["md", 44],
    ["lg", 48],
  ] as const)(
    "size %s is %ipx tall and at least 44px wide",
    async (size, height) => {
      await render(<Toggle size={size}>B</Toggle>);
      const toggle = box(page.getByRole("button").element());

      expect(toggle.height).toBe(height);
      expect(toggle.width).toBeGreaterThanOrEqual(44);
    },
  );

  test("a button in a toggle group is 44px tall", async () => {
    await render(
      <ToggleGroup type="single" aria-label="Alignment" size="sm">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(box(page.getByRole("radio").element()).height).toBe(44);
  });

  test("doesn't change color under a finger that has moved on", async () => {
    await render(<Toggle>Bold</Toggle>);
    const toggle = page.getByRole("button");
    const before = getComputedStyle(toggle.element()).backgroundColor;

    await userEvent.hover(toggle);

    expect(getComputedStyle(toggle.element()).backgroundColor).toBe(before);
  });
});

describe("file upload", () => {
  test("a file's row is 44px tall, and its button takes a tap from just outside", async () => {
    await render(
      <div style={padded}>
        <FileUpload aria-label="Attachments" />
      </div>,
    );
    await userEvent.upload(
      page.getByLabelText("Attachments"),
      new File(["x"], "a.txt", { type: "text/plain" }),
    );
    await expect
      .element(page.getByRole("button", { name: "Remove a.txt" }))
      .toBeVisible();
    const button = page.getByRole("button", { name: "Remove a.txt" }).element();

    expect(
      box(document.querySelector(".nuv-file-upload__item") as Element).height,
    ).toBe(44);
    expect(hitAt(button, 0, -20)).toBe(button);
  });
});

describe("sheet", () => {
  test("the close button is at least 44px each way", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down the list of orders.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    const close = box(
      page.getByRole("button", { name: "Close", exact: true }).element(),
    );

    expect(close.width).toBeGreaterThanOrEqual(44);
    expect(close.height).toBeGreaterThanOrEqual(44);
  });
});

describe("context menu", () => {
  // There's no right click on a touch screen. Radix opens the menu when a
  // finger stays down for 700ms.
  test("a long press opens it, with rows 44px tall", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <ContextMenu>
        <ContextMenuTrigger
          data-testid="area"
          style={{ display: "block", inlineSize: 240, blockSize: 120 }}
        >
          report.pdf
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File">
          <ContextMenuItem>Rename</ContextMenuItem>
          <ContextMenuItem>Duplicate</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    const area = page.getByTestId("area").element();
    const press = (type: string) =>
      area.dispatchEvent(
        new PointerEvent(type, {
          pointerType: "touch",
          bubbles: true,
          clientX: 60,
          clientY: 40,
        }),
      );

    press("pointerdown");
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(page.getByRole("menu").query()).toBeNull();

    const row = page.getByRole("menuitem", { name: "Rename" });
    await expect.element(row).toBeVisible();
    press("pointerup");

    expect(box(row.element()).height).toBe(44);
  });

  test("a finger that lifts early opens nothing", async () => {
    await render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="area">report.pdf</ContextMenuTrigger>
        <ContextMenuContent aria-label="File">
          <ContextMenuItem>Rename</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    const area = page.getByTestId("area").element();
    const press = (type: string) =>
      area.dispatchEvent(
        new PointerEvent(type, { pointerType: "touch", bubbles: true }),
      );

    press("pointerdown");
    await new Promise((resolve) => setTimeout(resolve, 200));
    press("pointerup");
    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(page.getByRole("menu").query()).toBeNull();
  });
});

describe("menubar", () => {
  test("an entry and a row are each 44px tall", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Menubar defaultValue="file" aria-label="Document">
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New tab</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    const row = page.getByRole("menu").getByRole("menuitem");
    await expect.element(row).toBeVisible();
    const entry = box(
      document.querySelector(".nuv-menubar__trigger") as Element,
    );

    expect(entry.height).toBe(44);
    expect(entry.width).toBeGreaterThanOrEqual(44);
    expect(box(row.element()).height).toBe(44);
  });
});

describe("navigation menu", () => {
  test("a button, a link and a link in the panel are each at least 44px tall", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <NavigationMenu defaultValue="products">
        <NavigationMenuList>
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#billing">Billing</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    await expect
      .element(page.getByRole("link", { name: "Billing" }))
      .toBeVisible();

    expect(box(page.getByRole("button").element()).height).toBe(44);
    for (const name of ["Docs", "Billing"]) {
      expect(
        box(page.getByRole("link", { name }).element()).height,
      ).toBeGreaterThanOrEqual(44);
    }
  });

  test("a tap on a button shows its panel", async () => {
    await render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#billing">Billing</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    await page.getByRole("button").click();

    await expect
      .element(page.getByRole("link", { name: "Billing" }))
      .toBeVisible();
  });
});

describe("breadcrumb", () => {
  test("a link is 44px tall, and its text hasn't moved off the line", async () => {
    await render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#home">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <span data-testid="plain">Atlas</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const link = box(page.getByRole("link").element());
    const plain = box(page.getByTestId("plain").element());

    expect(link.height).toBe(44);
    // Centered on the same line as the text beside it.
    expect(link.top + link.height / 2).toBeCloseTo(
      plain.top + plain.height / 2,
      0,
    );
  });
});

describe("pagination", () => {
  test("a page link and Next are each 44px each way", async () => {
    await render(
      <Pagination>
        <PaginationList>
          <PaginationItem>
            <PaginationLink href="#1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#2" />
          </PaginationItem>
        </PaginationList>
      </Pagination>,
    );

    for (const link of page.getByRole("link").elements()) {
      expect(box(link).width).toBeGreaterThanOrEqual(44);
      expect(box(link).height).toBe(44);
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

  test("fields and toggles are at least 44px tall", async () => {
    setOnPage();
    await render(
      <>
        <Input aria-label="Name" />
        <NativeSelect aria-label="Country">
          <option>Norway</option>
        </NativeSelect>
        <OtpField aria-label="Code" length={1} />
        <Toggle size="sm">Bold</Toggle>
      </>,
    );

    for (const control of document.querySelectorAll(
      'input:not([type="hidden"]), select, button',
    )) {
      expect(box(control).height).toBeGreaterThanOrEqual(44);
    }
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

  test("the entries of a menu bar, a navigation menu and a row of page links are at least 44px tall", async () => {
    setOnPage();
    await render(
      <>
        <Menubar aria-label="Document">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New tab</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>Text</NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <Pagination>
          <PaginationList>
            <PaginationItem>
              <PaginationLink href="#1">1</PaginationLink>
            </PaginationItem>
          </PaginationList>
        </Pagination>
      </>,
    );

    for (const selector of [
      ".nuv-menubar__trigger",
      ".nuv-navigation-menu__trigger",
      ".nuv-navigation-menu__link",
      ".nuv-pagination__link",
    ]) {
      expect(
        box(document.querySelector(selector) as Element).height,
      ).toBeGreaterThanOrEqual(44);
    }
  });
});

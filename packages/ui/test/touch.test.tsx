import "../src/styles/index.scss";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { hitAt } from "@nuvui/tooling/test/themed";
import { afterEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanup, render } from "vitest-browser-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ActionBar,
  ActionBarSelection,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  Button,
  Checkbox,
  CheckboxCard,
  ChoiceCardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
  Command,
  CommandInput,
  CommandItem,
  CommandList,
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
  HoldToConfirm,
  Input,
  InputGroup,
  InputGroupButton,
  Item,
  ItemContent,
  ItemTitle,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  NativeSelect,
  Navbar,
  NavbarActions,
  NavbarLink,
  NavbarMenu,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NumberField,
  OtpField,
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PasswordInput,
  RadioGroup,
  RadioGroupItem,
  Rating,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHandle,
  SheetTitle,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  Slider,
  Switch,
  TableOfContents,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toaster,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  Tree,
  TreeItem,
  toast,
} from "../src";

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

describe("toolbar", () => {
  test("a button, a link and a toggle are each 44px each way", async () => {
    await render(
      <Toolbar aria-label="Formatting">
        <ToolbarToggleGroup type="multiple" aria-label="Text style">
          <ToolbarToggleItem value="bold">B</ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarLink href="#help">?</ToolbarLink>
        <ToolbarButton>S</ToolbarButton>
      </Toolbar>,
    );

    for (const selector of [
      ".nuv-toolbar__toggle-item",
      ".nuv-toolbar__link",
      ".nuv-toolbar__button",
    ]) {
      const control = box(document.querySelector(selector) as Element);
      expect(control.height).toBe(44);
      expect(control.width).toBeGreaterThanOrEqual(44);
    }
  });

  test("a row of them wraps and doesn't widen the page", async () => {
    await render(
      <Toolbar aria-label="Formatting">
        {["Undo", "Redo", "Cut", "Copy", "Paste", "Find", "Print"].map(
          (name) => (
            <ToolbarButton key={name}>{name}</ToolbarButton>
          ),
        )}
      </Toolbar>,
    );

    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("doesn't change color under a finger that has moved on", async () => {
    await render(
      <Toolbar aria-label="Formatting">
        <ToolbarButton>Share</ToolbarButton>
      </Toolbar>,
    );
    const button = page.getByRole("button");
    const before = getComputedStyle(button.element()).backgroundColor;

    await userEvent.hover(button);

    expect(getComputedStyle(button.element()).backgroundColor).toBe(before);
  });
});

describe("scroll area", () => {
  test("a finger scrolls the content, and the scrollbar keeps out of the way of taps", async () => {
    await render(
      <ScrollArea aria-label="Releases" style={{ height: 120 }}>
        <div style={{ height: 600 }}>Tall content</div>
      </ScrollArea>,
    );
    const viewport = document.querySelector(
      ".nuv-scroll-area__viewport",
    ) as HTMLElement;
    await expect
      .poll(() => document.querySelector(".nuv-scroll-area__thumb"))
      .not.toBeNull();

    // Scrolling is the browser's own, so a swipe works as it does anywhere.
    expect(getComputedStyle(viewport).overflowY).toBe("scroll");
    expect(getComputedStyle(viewport).touchAction).toBe("auto");
    expect(
      box(document.querySelector(".nuv-scroll-area__scrollbar") as Element)
        .width,
    ).toBe(10);
  });
});

describe("collapsible", () => {
  test("a Button as its trigger is 44px tall", async () => {
    await render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button size="sm">Show details</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>Text</CollapsibleContent>
      </Collapsible>,
    );

    expect(box(page.getByRole("button").element()).height).toBe(44);
  });
});

describe("combobox", () => {
  function Fruit({ defaultOpen = false }: { defaultOpen?: boolean }) {
    return (
      <Combobox defaultOpen={defaultOpen}>
        <ComboboxTrigger aria-label="Fruit">
          <ComboboxValue placeholder="Pick a fruit" />
        </ComboboxTrigger>
        <ComboboxContent label="Search fruit">
          <ComboboxItem value="Apple">Apple</ComboboxItem>
          <ComboboxItem value="Banana">Banana</ComboboxItem>
        </ComboboxContent>
      </Combobox>
    );
  }

  test("the trigger is 44px tall", async () => {
    await render(<Fruit />);

    expect(
      box(page.getByRole("combobox", { name: "Fruit", exact: true }).element())
        .height,
    ).toBe(44);
  });

  test("an option and the search field are 44px tall, and the field's text is 16px", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Fruit defaultOpen />);
    const option = page.getByRole("option", { name: "Apple" });
    await expect.element(option).toBeVisible();
    const field = page.getByRole("combobox", { name: "Search fruit" });

    expect(box(option.element()).height).toBe(44);
    expect(box(field.element()).height).toBe(44);
    // iOS zooms the page in when a field with smaller text takes focus.
    expect(getComputedStyle(field.element()).fontSize).toBe("16px");
  });
});

describe("command", () => {
  test("an item and the search field are 44px tall, and the field's text is 16px", async () => {
    await render(
      <Command label="Commands">
        <CommandInput />
        <CommandList>
          <CommandItem>Open file</CommandItem>
        </CommandList>
      </Command>,
    );
    const field = page.getByRole("combobox", { name: "Commands" });

    expect(box(page.getByRole("option").element()).height).toBe(44);
    expect(box(field.element()).height).toBe(44);
    expect(getComputedStyle(field.element()).fontSize).toBe("16px");
  });
});

describe("sidebar", () => {
  function Layout({ defaultOpen = true }: { defaultOpen?: boolean }) {
    return (
      <SidebarProvider
        cookieName={null}
        defaultOpen={defaultOpen}
        style={{ "--nuv-sidebar-height": "400px" } as never}
      >
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <svg aria-hidden="true" viewBox="0 0 16 16" />
                    <span>Inbox</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#today">
                        Today
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarMain>
          <SidebarTrigger />
        </SidebarMain>
      </SidebarProvider>
    );
  }
  const trigger = () => page.getByRole("button", { name: "Toggle sidebar" });
  const inbox = () => page.getByRole("button", { name: "Inbox" });

  test("the trigger is 44px each way", async () => {
    await render(<Layout />);

    expect(box(trigger().element()).width).toBe(44);
    expect(box(trigger().element()).height).toBe(44);
  });

  test("in the panel a phone gets, the rows and the close button are 44px", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Layout />);
    await trigger().click();
    await expect.element(inbox()).toBeVisible();
    const close = box(page.getByRole("button", { name: "Close" }).element());

    expect(box(inbox().element()).height).toBe(44);
    expect(
      box(page.getByRole("link", { name: "Today" }).element()).height,
    ).toBe(44);
    expect(close.width).toBe(44);
    expect(close.height).toBe(44);
  });

  test("on a wide touch screen the rows are 44px, and so is what's left of one on the strip of icons", async () => {
    await setViewport("desktop");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Layout defaultOpen={false} />);
    const button = box(inbox().element());
    const icon = box(inbox().element().querySelector("svg") as Element);

    expect(button.width).toBe(44);
    expect(button.height).toBe(44);
    expect(icon.left + icon.width / 2).toBe(button.left + 22);
    expect(box(document.querySelector(".nuv-sidebar") as Element).width).toBe(
      44 + 16 + 1,
    );
  });

  test("a row doesn't change color under a finger that has moved on", async () => {
    await setViewport("desktop");
    await render(<Layout />);
    const before = getComputedStyle(inbox().element()).backgroundColor;

    await userEvent.hover(inbox());

    expect(inbox().element().matches(":hover")).toBe(true);
    expect(getComputedStyle(inbox().element()).backgroundColor).toBe(before);
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

  test("a command's rows and a sidebar's are at least 44px tall", async () => {
    setOnPage();
    await setViewport("desktop");
    await render(
      <>
        <Command label="Commands">
          <CommandInput />
          <CommandList>
            <CommandItem>Open file</CommandItem>
          </CommandList>
        </Command>
        <SidebarProvider cookieName={null}>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Inbox</SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="#today">
                      Today
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
          <SidebarMain>
            <SidebarTrigger />
          </SidebarMain>
        </SidebarProvider>
      </>,
    );

    for (const selector of [
      ".nuv-command__input",
      ".nuv-command__item",
      ".nuv-sidebar__menu-button",
      ".nuv-sidebar__menu-sub-button",
      ".nuv-sidebar__trigger",
    ]) {
      expect(
        box(document.querySelector(selector) as Element).height,
      ).toBeGreaterThanOrEqual(44);
    }
  });

  test("what's in a toolbar is at least 44px tall", async () => {
    setOnPage();
    await render(
      <Toolbar aria-label="Formatting">
        <ToolbarToggleGroup type="multiple" aria-label="Text style">
          <ToolbarToggleItem value="bold">B</ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarLink href="#help">?</ToolbarLink>
        <ToolbarButton>S</ToolbarButton>
      </Toolbar>,
    );

    for (const selector of [
      ".nuv-toolbar__toggle-item",
      ".nuv-toolbar__link",
      ".nuv-toolbar__button",
    ]) {
      expect(
        box(document.querySelector(selector) as Element).height,
      ).toBeGreaterThanOrEqual(44);
    }
  });
});

describe("item", () => {
  test("a row that's a link or a button is at least 44px tall, at either size", async () => {
    await render(
      <div style={padded}>
        <Item asChild>
          <a href="#billing">
            <ItemContent>
              <ItemTitle>Billing</ItemTitle>
            </ItemContent>
          </a>
        </Item>
        <Item asChild size="sm">
          <button type="button">
            <ItemContent>
              <ItemTitle>Export</ItemTitle>
            </ItemContent>
          </button>
        </Item>
      </div>,
    );

    expect(
      box(page.getByRole("link", { name: "Billing" }).element()).height,
    ).toBeGreaterThanOrEqual(44);
    expect(
      box(page.getByRole("button", { name: "Export" }).element()).height,
    ).toBeGreaterThanOrEqual(44);
  });
});

describe("number field", () => {
  test("is 44px tall, with 16px text, and each button takes a tap 44px wide", async () => {
    await render(
      <div style={padded}>
        <NumberField aria-label="Seats" defaultValue={5} />
      </div>,
    );
    const field = page.getByRole("spinbutton").element();
    const up = page.getByRole("button", { name: "Increase" }).element();

    expect(box(field.parentElement as Element).height).toBe(44);
    expect(getComputedStyle(field).fontSize).toBe("16px");
    // The button is drawn smaller than a finger. The area around it that
    // answers is not.
    expect(box(up).height).toBeLessThan(44);
    expect(hitAt(up, 0, 20)).toBe(up);
    expect(hitAt(up, 0, -20)).toBe(up);
  });
});

describe("rating", () => {
  test("each star is at least 44px each way, and they don't overlap", async () => {
    await render(
      <div style={padded}>
        <Rating aria-label="Delivery" />
      </div>,
    );
    const stars = page.getByRole("radio").elements();

    for (const star of stars) {
      expect(box(star).width).toBeGreaterThanOrEqual(44);
      expect(box(star).height).toBeGreaterThanOrEqual(44);
    }
    expect(box(stars[1] as Element).left).toBeGreaterThanOrEqual(
      box(stars[0] as Element).right,
    );
  });

  test("a rating that only shows takes no extra room", async () => {
    await render(<Rating readOnly value={3} />);
    const item = page
      .getByRole("img")
      .element()
      .querySelector(".nuv-rating__item") as Element;

    expect(box(item).width).toBe(28);
  });
});

describe("choice card", () => {
  test("the whole card takes the tap, and is at least 44px tall", async () => {
    await render(
      <div style={padded}>
        <CheckboxCard>
          <ChoiceCardTitle>Audit log</ChoiceCardTitle>
        </CheckboxCard>
      </div>,
    );
    const control = page.getByRole("checkbox", { name: "Audit log" });
    const card = control.element().closest(".nuv-choice-card") as Element;

    expect(box(card).height).toBeGreaterThanOrEqual(44);
    await page.getByText("Audit log").click();
    await expect.element(control).toBeChecked();
  });
});

describe("hold to confirm", () => {
  test("is 44px tall, as any button is", async () => {
    await render(
      <div style={padded}>
        <HoldToConfirm onConfirm={() => {}}>Hold to delete</HoldToConfirm>
      </div>,
    );

    expect(box(page.getByRole("button").element()).height).toBe(44);
  });
});

describe("table of contents", () => {
  test("each link is at least 44px tall", async () => {
    await render(
      <div style={padded}>
        <TableOfContents
          aria-label="On this page"
          items={[
            { id: "install", title: "Install" },
            { id: "usage", title: "Usage", depth: 2 },
          ]}
        />
      </div>,
    );

    for (const link of page.getByRole("link").elements()) {
      expect(box(link).height).toBeGreaterThanOrEqual(44);
    }
  });
});

describe("action bar", () => {
  test("its buttons keep their touch size, and wrap on a phone", async () => {
    await render(
      <ActionBar open aria-label="Selected messages">
        <ActionBarSelection>12 selected</ActionBarSelection>
        <Button intent="secondary" size="sm">
          Archive
        </Button>
        <Button intent="secondary" size="sm">
          Mark as read
        </Button>
        <Button intent="danger" size="sm">
          Delete
        </Button>
      </ActionBar>,
    );
    const bar = page.getByRole("group").element();

    for (const button of page.getByRole("button").elements()) {
      expect(box(button).height).toBeGreaterThanOrEqual(44);
    }
    expect(box(bar).left).toBeGreaterThanOrEqual(0);
    expect(box(bar).right).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
    expect(Math.round(box(bar).bottom)).toBeLessThanOrEqual(window.innerHeight);
  });
});

describe("a select in a sentence", () => {
  test("is drawn the size of the text, and takes a tap 44px tall", async () => {
    await render(
      <p style={{ ...padded, fontSize: 16 }}>
        From{" "}
        <Select defaultValue="30">
          <SelectTrigger variant="inline" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">the last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </p>,
    );
    const trigger = page.getByRole("combobox").element();

    expect(box(trigger).height).toBeLessThan(30);
    expect(hitAt(trigger, 0, 20)).toBe(trigger);
    expect(hitAt(trigger, 0, -20)).toBe(trigger);
  });
});

describe("navbar", () => {
  test("the button for the menu is 44px square, and each link in the panel is 44px tall", async () => {
    await render(
      <Navbar>
        <NavbarActions>
          <NavbarMenu>
            <NavbarLink href="#orders">Orders</NavbarLink>
            <NavbarLink href="#reports">Reports</NavbarLink>
          </NavbarMenu>
        </NavbarActions>
      </Navbar>,
    );
    const toggle = page.getByRole("button", { name: "Menu" });

    expect(box(toggle.element()).width).toBe(44);
    expect(box(toggle.element()).height).toBe(44);

    await toggle.click();
    await expect.element(page.getByRole("dialog")).toBeVisible();
    for (const link of page.getByRole("link").elements()) {
      expect(box(link).height).toBeGreaterThanOrEqual(44);
    }
  });
});

describe("a sheet's handle", () => {
  test("is drawn thin, and takes a press 44px tall", async () => {
    await render(
      <Sheet defaultOpen>
        <SheetContent side="bottom" swipe aria-describedby={undefined}>
          <SheetHandle />
          <SheetTitle>Filters</SheetTitle>
          <p>Line</p>
        </SheetContent>
      </Sheet>,
    );
    const handle = page.getByRole("button", { name: "Dismiss" }).element();
    const around = getComputedStyle(handle, "::after");

    expect(box(handle).height).toBe(4);
    expect(Number.parseFloat(around.height)).toBeGreaterThanOrEqual(44);
    expect(Number.parseFloat(around.width)).toBeGreaterThanOrEqual(44);
  });
});

describe("tree", () => {
  test("every row is 44px tall, and a tap on one opens it", async () => {
    await render(
      <Tree aria-label="Files">
        <TreeItem value="src" label="src">
          <TreeItem value="a" label="a.txt" />
        </TreeItem>
        <TreeItem value="b" label="b.txt" />
      </Tree>,
    );
    const row = (name: string) =>
      page
        .getByRole("treeitem", { name })
        .element()
        .querySelector(".nuv-tree__row") as HTMLElement;

    expect(box(row("src")).height).toBe(44);
    expect(box(row("b.txt")).height).toBe(44);

    await userEvent.click(row("src"));
    await expect
      .element(page.getByRole("treeitem", { name: "a.txt" }))
      .toBeVisible();
    expect(box(row("a.txt")).height).toBe(44);
  });

  test("with several to select, a tap adds a row and another takes it out", async () => {
    await render(
      <Tree aria-label="Files" selectionMode="multiple">
        <TreeItem value="a" label="a.txt" />
        <TreeItem value="b" label="b.txt" />
      </Tree>,
    );
    const item = (name: string) => page.getByRole("treeitem", { name });
    const row = (name: string) =>
      item(name).element().querySelector(".nuv-tree__row") as HTMLElement;

    await userEvent.click(row("a.txt"));
    await userEvent.click(row("b.txt"));
    await expect
      .element(item("a.txt"))
      .toHaveAttribute("aria-selected", "true");
    await expect
      .element(item("b.txt"))
      .toHaveAttribute("aria-selected", "true");

    await userEvent.click(row("a.txt"));
    await expect
      .element(item("a.txt"))
      .toHaveAttribute("aria-selected", "false");
  });
});

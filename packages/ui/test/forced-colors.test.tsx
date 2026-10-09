import "../src/styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanup, render } from "vitest-browser-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
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
  Empty,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
  FileUpload,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputGroup,
  Kbd,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toaster,
  Toggle,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from "../src";

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

describe("fields", () => {
  test("every kind of field keeps an edge", async () => {
    await render(
      <>
        <Input aria-label="Name" />
        <Textarea aria-label="Notes" />
        <NativeSelect aria-label="Country">
          <option>Norway</option>
        </NativeSelect>
        <InputGroup>
          <Input aria-label="Site" />
        </InputGroup>
        <PasswordInput aria-label="Password" />
        <OtpField aria-label="Code" length={1} />
        <FileUpload aria-label="Attachments" />
      </>,
    );
    const edged = [
      page.getByLabelText("Name").element(),
      page.getByLabelText("Notes").element(),
      page.getByLabelText("Country").element(),
      document.querySelector(".nuv-input-group"),
      document.querySelector(".nuv-password-input"),
      document.querySelector(".nuv-otp-field__input"),
      document.querySelector(".nuv-file-upload__dropzone"),
    ] as Element[];

    for (const element of edged) {
      expect(style(element).borderTopStyle).not.toBe("none");
      expect(contrast(style(element).borderTopColor, canvas())).toBeGreaterThan(
        3,
      );
    }
  });

  test("the arrow of a native select and the eye of a password input can be seen", async () => {
    await render(
      <>
        <NativeSelect aria-label="Country">
          <option>Norway</option>
        </NativeSelect>
        <PasswordInput aria-label="Password" />
      </>,
    );
    const drawn = [
      document.querySelector(".nuv-native-select__icon"),
      document.querySelector(".nuv-password-input__toggle"),
    ] as Element[];

    for (const element of drawn) {
      expect(contrast(style(element).color, canvas())).toBeGreaterThan(3);
    }
  });

  test("the dash in a one-time code is still drawn", async () => {
    await render(<OtpField aria-label="Code" length={4} groupSize={2} />);
    const dash = style(
      document.querySelector(".nuv-otp-field__separator") as Element,
    );

    expect(dash.borderTopStyle).toBe("solid");
    expect(contrast(dash.borderTopColor, canvas())).toBeGreaterThan(3);
  });

  test("a field's error can be read", async () => {
    await render(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldError>Enter an email address.</FieldError>
      </Field>,
    );

    expect(
      contrast(
        style(page.getByText("Enter an email address.").element()).color,
        canvas(),
      ),
    ).toBeGreaterThan(4.5);
  });

  test("the drop area is marked in the system's color while files are over it", async () => {
    await render(<FileUpload aria-label="Attachments" />);
    const zone = document.querySelector(
      ".nuv-file-upload__dropzone",
    ) as HTMLElement;

    zone.dispatchEvent(
      new DragEvent("dragenter", {
        dataTransfer: new DataTransfer(),
        bubbles: true,
      }),
    );
    await expect.poll(() => zone.hasAttribute("data-dragging")).toBe(true);

    expect(style(zone).borderTopStyle).toBe("solid");
    expect(style(zone).borderTopColor).toBe(system("highlight"));
  });
});

describe("radio group", () => {
  test("keeps its edge, and its dot when picked", async () => {
    await render(
      <RadioGroup aria-label="Plan" defaultValue="team">
        <RadioGroupItem value="free" aria-label="Free" />
        <RadioGroupItem value="team" aria-label="Team" />
      </RadioGroup>,
    );
    const free = style(page.getByRole("radio", { name: "Free" }).element());
    const team = style(page.getByRole("radio", { name: "Team" }).element());

    expect(contrast(free.borderTopColor, canvas())).toBeGreaterThan(3);
    // The dot is drawn in the current text color.
    expect(contrast(team.color, team.backgroundColor)).toBeGreaterThan(3);
    expect(document.querySelectorAll(".nuv-radio-group__dot")).toHaveLength(1);
  });
});

describe("slider", () => {
  test("the track has an edge, and the filled part and the handle stand out", async () => {
    await render(<Slider aria-label="Volume" defaultValue={[50]} />);
    const part = (name: string) =>
      style(document.querySelector(`.nuv-slider__${name}`) as Element);

    expect(part("track").outlineStyle).toBe("solid");
    expect(contrast(part("track").outlineColor, canvas())).toBeGreaterThan(3);
    expect(part("range").backgroundColor).toBe(system("highlight"));
    expect(contrast(part("thumb").borderTopColor, canvas())).toBeGreaterThan(3);
    expect(part("thumb").backgroundColor).toBe(canvas());
  });
});

describe("toggle", () => {
  test("a pressed one is filled with the system's color for something selected", async () => {
    await render(
      <>
        <Toggle>Off</Toggle>
        <Toggle defaultPressed>On</Toggle>
        <Toggle variant="outline" defaultPressed>
          Outlined
        </Toggle>
      </>,
    );
    const look = (name: string) =>
      style(page.getByRole("button", { name, exact: true }).element());

    expect(look("On").backgroundColor).toBe(system("highlight"));
    expect(look("On").color).toBe(system("highlighttext"));
    expect(look("On").backgroundColor).not.toBe(look("Off").backgroundColor);
    expect(look("Outlined").borderTopColor).toBe(system("highlight"));
  });

  test("one that isn't pressed keeps a visible edge", async () => {
    await render(<Toggle>Off</Toggle>);
    const toggle = style(page.getByRole("button").element());

    expect(contrast(toggle.borderTopColor, canvas())).toBeGreaterThan(3);
  });
});

describe("alert dialog and sheet", () => {
  test("an alert dialog has an edge, and text that can be read", async () => {
    await render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction intent="danger">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await expect.element(page.getByRole("alertdialog")).toBeVisible();
    const panel = page.getByRole("alertdialog").element();
    const description = panel.querySelector(
      ".nuv-alert-dialog__description",
    ) as Element;

    expect(style(panel).borderTopStyle).toBe("solid");
    expect(contrast(style(panel).borderTopColor, canvas())).toBeGreaterThan(3);
    expect(
      contrast(style(description).color, style(panel).backgroundColor),
    ).toBeGreaterThan(4.5);
    // Both buttons keep an edge, so they read as buttons.
    for (const button of panel.querySelectorAll("button")) {
      expect(
        contrast(style(button).borderTopColor, style(panel).backgroundColor),
      ).toBeGreaterThan(3);
    }
  });

  test("a sheet has an edge on the side that faces the page, and a close button that can be seen", async () => {
    await render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down the list of orders.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await expect.element(page.getByRole("dialog")).toBeVisible();
    const panel = page.getByRole("dialog").element();
    const close = page.getByRole("button", { name: "Close", exact: true });

    expect(style(panel).borderInlineStartStyle).toBe("solid");
    expect(
      contrast(style(panel).borderInlineStartColor, canvas()),
    ).toBeGreaterThan(3);
    expect(
      contrast(style(panel).color, style(panel).backgroundColor),
    ).toBeGreaterThan(4.5);
    // The cross is drawn in the button's text color.
    expect(
      contrast(style(close.element()).color, style(panel).backgroundColor),
    ).toBeGreaterThan(3);
  });
});

describe("hover card", () => {
  test("has an edge to set it apart from the page", async () => {
    await render(
      <div style={{ padding: 80 }}>
        <HoverCard defaultOpen>
          <HoverCardTrigger href="#ada">@ada</HoverCardTrigger>
          <HoverCardContent>
            Wrote the first published program.
          </HoverCardContent>
        </HoverCard>
      </div>,
    );
    await expect
      .poll(() => document.querySelector(".nuv-hover-card"))
      .not.toBeNull();
    const card = style(document.querySelector(".nuv-hover-card") as Element);

    expect(card.borderTopStyle).toBe("solid");
    expect(contrast(card.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(contrast(card.color, card.backgroundColor)).toBeGreaterThan(4.5);
  });
});

describe("context menu and menu bar", () => {
  test("a context menu has an edge, and its focused row an outline", async () => {
    await render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="area">report.pdf</ContextMenuTrigger>
        <ContextMenuContent aria-label="File">
          <ContextMenuItem>Rename</ContextMenuItem>
          <ContextMenuItem>Duplicate</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    await userEvent.click(page.getByTestId("area"), { button: "right" });
    await expect.element(page.getByRole("menu")).toBeVisible();
    const menu = style(page.getByRole("menu").element());
    const item = page.getByRole("menuitem", { name: "Rename" });
    await userEvent.hover(item);
    await expect.element(item).toHaveAttribute("data-highlighted");

    expect(menu.borderTopStyle).toBe("solid");
    expect(contrast(menu.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(style(item.element()).outlineStyle).toBe("solid");
    expect(
      contrast(style(item.element()).outlineColor, canvas()),
    ).toBeGreaterThan(3);
    expect(
      style(page.getByRole("menuitem", { name: "Duplicate" }).element())
        .outlineStyle,
    ).toBe("none");
  });

  test("a menu bar and its menu each have an edge, and the focused row an outline", async () => {
    await render(
      <Menubar defaultValue="file" aria-label="Document">
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New tab</MenubarItem>
            <MenubarItem>New window</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    await expect.element(page.getByRole("menu")).toBeVisible();
    const bar = style(page.getByRole("menubar").element());
    const menu = style(page.getByRole("menu").element());
    const item = page.getByRole("menuitem", { name: "New tab" });
    await userEvent.hover(item);
    await expect.element(item).toHaveAttribute("data-highlighted");

    expect(contrast(bar.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(contrast(menu.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(style(item.element()).outlineStyle).toBe("solid");
    expect(
      contrast(style(item.element()).outlineColor, canvas()),
    ).toBeGreaterThan(3);
  });

  test("an entry of a menu bar has a focus ring", async () => {
    await render(
      <Menubar aria-label="Document">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New tab</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await userEvent.keyboard("{Tab}");

    const entry = style(page.getByRole("menuitem", { name: "File" }).element());
    expect(entry.outlineStyle).toBe("solid");
    expect(contrast(entry.outlineColor, canvas())).toBeGreaterThan(3);
  });
});

describe("navigation menu", () => {
  function Site() {
    return (
      <NavigationMenu defaultValue="products">
        <NavigationMenuList>
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#billing">Billing</NavigationMenuLink>
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
    );
  }

  test("the panel has an edge, and its links can be read", async () => {
    await render(<Site />);
    await expect
      .element(page.getByRole("link", { name: "Billing" }))
      .toBeVisible();
    const panel = style(
      document.querySelector(".nuv-navigation-menu__viewport") as Element,
    );

    expect(panel.borderTopStyle).toBe("solid");
    expect(contrast(panel.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(
      contrast(
        style(page.getByRole("link", { name: "Billing" }).element()).color,
        panel.backgroundColor,
      ),
    ).toBeGreaterThan(4.5);
  });

  test("the open button is told apart by its arrow, and the current page by its weight", async () => {
    await render(<Site />);
    const chevron = style(
      document.querySelector(".nuv-navigation-menu__chevron") as Element,
    );
    const weight = (name: string) =>
      Number(style(page.getByRole("link", { name }).element()).fontWeight);

    expect(chevron.transform).not.toBe("none");
    expect(contrast(chevron.color, canvas())).toBeGreaterThan(3);
    expect(weight("Pricing")).toBeGreaterThan(weight("Docs"));
  });
});

describe("breadcrumb and pagination", () => {
  test("a breadcrumb's links, arrows and current page can all be seen", async () => {
    await render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#home">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Atlas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const seen = [
      page.getByRole("link").element(),
      document.querySelector(".nuv-breadcrumb__separator"),
      page.getByText("Atlas").element(),
    ] as Element[];

    for (const element of seen) {
      expect(contrast(style(element).color, canvas())).toBeGreaterThan(4.5);
    }
  });

  test("the current page link is filled with the system's color for something selected", async () => {
    await render(
      <Pagination>
        <PaginationList>
          <PaginationItem>
            <PaginationLink href="#1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#2" active>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#3" />
          </PaginationItem>
        </PaginationList>
      </Pagination>,
    );
    const look = (name: string) =>
      style(page.getByRole("link", { name, exact: true }).element());

    expect(look("2").backgroundColor).toBe(system("highlight"));
    expect(look("2").color).toBe(system("highlighttext"));
    expect(look("2").backgroundColor).not.toBe(look("1").backgroundColor);
    expect(contrast(look("1").color, canvas())).toBeGreaterThan(4.5);
    // The arrow is drawn in the link's text color.
    expect(contrast(look("Next").color, canvas())).toBeGreaterThan(3);
  });
});

describe("badge, alert and card", () => {
  test("a filled badge has an edge in place of its fill, whatever the intent", async () => {
    await render(
      <>
        {(["neutral", "primary", "success", "warning", "danger"] as const).map(
          (intent) => (
            <Badge key={intent} intent={intent}>
              {intent}
            </Badge>
          ),
        )}
        <Badge variant="outline">outline</Badge>
      </>,
    );

    for (const name of [
      "neutral",
      "primary",
      "success",
      "warning",
      "danger",
      "outline",
    ]) {
      const badge = style(page.getByText(name, { exact: true }).element());
      expect(contrast(badge.borderTopColor, canvas()), name).toBeGreaterThan(3);
      expect(contrast(badge.color, canvas()), name).toBeGreaterThan(4.5);
    }
  });

  test("an alert keeps its edge and its icon", async () => {
    await render(
      <Alert intent="danger" data-testid="alert">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>The card was declined.</AlertDescription>
      </Alert>,
    );
    const alert = page.getByTestId("alert").element();
    const icon = alert.querySelector(".nuv-alert__icon") as Element;

    expect(contrast(style(alert).borderTopColor, canvas())).toBeGreaterThan(3);
    // The icon is drawn in the current text color.
    expect(contrast(style(icon).color, canvas())).toBeGreaterThan(3);
    expect(
      contrast(
        style(page.getByText("The card was declined.").element()).color,
        canvas(),
      ),
    ).toBeGreaterThan(4.5);
  });

  test("a card and an empty state keep their edges", async () => {
    await render(
      <>
        <Card data-testid="card">
          <CardContent>Text</CardContent>
        </Card>
        <Empty data-testid="empty">
          <EmptyMedia data-testid="media" />
          <EmptyTitle>Nothing here</EmptyTitle>
        </Empty>
      </>,
    );
    const edge = (id: string) =>
      style(page.getByTestId(id).element()).borderTopColor;

    expect(contrast(edge("card"), canvas())).toBeGreaterThan(3);
    expect(contrast(edge("empty"), canvas())).toBeGreaterThan(3);
    // The box behind the picture is a fill, so it gets an edge here.
    expect(contrast(edge("media"), canvas())).toBeGreaterThan(3);
  });
});

describe("avatar, skeleton and key", () => {
  test("an avatar's initials have an edge around them", async () => {
    await render(
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    const fallback = style(page.getByText("AL").element());

    expect(contrast(fallback.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(contrast(fallback.color, canvas())).toBeGreaterThan(4.5);
  });

  test("a skeleton is an outline, in each shape", async () => {
    await render(
      <>
        <Skeleton data-testid="block" />
        <Skeleton shape="circle" data-testid="circle" />
        <Skeleton shape="text" data-testid="text" />
      </>,
    );
    const edge = (id: string, pseudo?: string) =>
      getComputedStyle(page.getByTestId(id).element(), pseudo).borderTopColor;

    expect(contrast(edge("block"), canvas())).toBeGreaterThan(3);
    expect(contrast(edge("circle"), canvas())).toBeGreaterThan(3);
    expect(contrast(edge("text", "::before"), canvas())).toBeGreaterThan(3);
  });

  test("a key keeps its edge", async () => {
    await render(<Kbd>Esc</Kbd>);
    const key = style(page.getByText("Esc").element());

    expect(contrast(key.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(contrast(key.color, canvas())).toBeGreaterThan(4.5);
  });

  test("a spinner is drawn in the text color", async () => {
    await render(<Spinner />);
    const ring = document.querySelector(".nuv-spinner__ring") as Element;

    expect(contrast(style(ring).stroke, canvas())).toBeGreaterThan(3);
  });
});

describe("progress, separator and scroll area", () => {
  test("a progress bar has an edge, and its filled part is the system's color for something selected", async () => {
    await render(<Progress aria-label="Upload" value={40} />);
    const bar = page.getByRole("progressbar").element();
    const indicator = bar.querySelector(".nuv-progress__indicator") as Element;

    expect(contrast(style(bar).borderTopColor, canvas())).toBeGreaterThan(3);
    expect(style(indicator).backgroundColor).toBe(system("highlight"));
  });

  test("a separator is still a line, both ways", async () => {
    await render(
      <div style={{ display: "flex", height: 40 }}>
        <Separator data-testid="flat" />
        <Separator orientation="vertical" data-testid="upright" />
      </div>,
    );
    const flat = style(page.getByTestId("flat").element());
    const upright = style(page.getByTestId("upright").element());

    expect(flat.borderTopWidth).toBe("1px");
    expect(contrast(flat.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(upright.borderInlineStartWidth).toBe("1px");
    expect(contrast(upright.borderInlineStartColor, canvas())).toBeGreaterThan(
      3,
    );
  });

  test("a scroll area's thumb is drawn", async () => {
    await render(
      <ScrollArea aria-label="Releases" style={{ height: 100 }}>
        <div style={{ height: 500 }}>Tall content</div>
      </ScrollArea>,
    );
    await expect
      .poll(() => document.querySelector(".nuv-scroll-area__thumb"))
      .not.toBeNull();
    const thumb = style(
      document.querySelector(".nuv-scroll-area__thumb") as Element,
    );

    expect(contrast(thumb.backgroundColor, canvas())).toBeGreaterThan(3);
  });
});

describe("toolbar", () => {
  test("has an edge, and a pressed toggle is the system's color for something selected", async () => {
    await render(
      <Toolbar aria-label="Formatting">
        <ToolbarToggleGroup
          type="multiple"
          aria-label="Text style"
          defaultValue={["bold"]}
        >
          <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
          <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarButton>Share</ToolbarButton>
      </Toolbar>,
    );
    const look = (name: string) =>
      style(page.getByRole("button", { name }).element());

    expect(
      contrast(
        style(page.getByRole("toolbar").element()).borderTopColor,
        canvas(),
      ),
    ).toBeGreaterThan(3);
    expect(look("Bold").backgroundColor).toBe(system("highlight"));
    expect(look("Bold").color).toBe(system("highlighttext"));
    expect(look("Italic").backgroundColor).not.toBe(
      look("Bold").backgroundColor,
    );
    // A control that isn't pressed keeps an edge, so it reads as a button.
    expect(contrast(look("Share").borderTopColor, canvas())).toBeGreaterThan(3);
    expect(
      contrast(
        style(page.getByRole("separator").element()).borderInlineStartColor,
        canvas(),
      ),
    ).toBeGreaterThan(3);
  });
});

describe("command and combobox", () => {
  test("a command's active row has an outline, its field shows focus, and its separator is still a line", async () => {
    await render(
      <Command label="Commands">
        <CommandInput />
        <CommandList>
          <CommandItem>Open file</CommandItem>
          <CommandSeparator />
          <CommandItem>Print</CommandItem>
        </CommandList>
      </Command>,
    );
    await userEvent.keyboard("{Tab}");
    const active = page.getByRole("option", { name: "Open file" });
    await expect.element(active).toHaveAttribute("aria-selected", "true");
    const row = style(active.element());
    const other = style(page.getByRole("option", { name: "Print" }).element());
    const field = style(
      document.querySelector(".nuv-command__search") as Element,
    );
    const line = style(
      document.querySelector(".nuv-command__separator") as Element,
    );

    // The fill is gone. The outline is what's left to say which row it is.
    expect(row.outlineStyle).toBe("solid");
    expect(contrast(row.outlineColor, canvas())).toBeGreaterThan(3);
    expect(other.outlineStyle).toBe("none");
    expect(field.outlineStyle).toBe("solid");
    expect(contrast(field.outlineColor, canvas())).toBeGreaterThan(3);
    expect(contrast(line.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(line.borderTopWidth).toBe("1px");
  });

  test("a combobox keeps its edge, and its popup has one, with an outline on the active row", async () => {
    await render(
      <Combobox defaultOpen defaultValue="Apple">
        <ComboboxTrigger aria-label="Fruit">
          <ComboboxValue />
        </ComboboxTrigger>
        <ComboboxContent label="Search fruit">
          <ComboboxItem value="Apple">Apple</ComboboxItem>
          <ComboboxSeparator />
          <ComboboxItem value="Banana">Banana</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    const popup = page.getByRole("dialog", { name: "Search fruit" });
    await expect.element(popup).toBeVisible();
    const picked = page.getByRole("option", { name: "Apple" });
    await expect.element(picked).toHaveAttribute("aria-selected", "true");
    const trigger = style(
      page.getByRole("combobox", { name: "Fruit", exact: true }).element(),
    );
    const row = style(picked.element());

    expect(contrast(trigger.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(
      contrast(style(popup.element()).borderTopColor, canvas()),
    ).toBeGreaterThan(3);
    expect(row.outlineStyle).toBe("solid");
    expect(contrast(row.outlineColor, canvas())).toBeGreaterThan(3);
    // The check is drawn in the row's text color.
    expect(contrast(row.color, canvas())).toBeGreaterThan(3);
    expect(
      contrast(
        style(document.querySelector(".nuv-combobox__separator") as Element)
          .borderTopColor,
        canvas(),
      ),
    ).toBeGreaterThan(3);
  });
});

describe("sidebar", () => {
  test("has an edge, a line for its separator, and a bar on the open page", async () => {
    await setViewport("desktop");
    await render(
      <SidebarProvider
        cookieName={null}
        style={{ "--nuv-sidebar-height": "300px" } as never}
      >
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Mail</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton active>Inbox</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>Sent</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
          </SidebarContent>
        </Sidebar>
        <SidebarMain>
          <SidebarTrigger />
        </SidebarMain>
      </SidebarProvider>,
    );
    const bar = style(document.querySelector(".nuv-sidebar") as Element);
    const open = page.getByRole("button", { name: "Inbox" }).element();
    const other = page.getByRole("button", { name: "Sent" }).element();
    const marker = getComputedStyle(open, "::before");

    expect(contrast(bar.borderRightColor, canvas())).toBeGreaterThan(3);
    // The fill that marks the open page is gone. The bar is a border,
    // which stays.
    expect(marker.borderLeftWidth).toBe("3px");
    expect(contrast(marker.borderLeftColor, canvas())).toBeGreaterThan(3);
    expect(getComputedStyle(other, "::before").content).toBe("none");
    expect(contrast(style(open).color, canvas())).toBeGreaterThan(3);
    expect(
      contrast(
        style(document.querySelector(".nuv-sidebar__separator") as Element)
          .borderTopColor,
        canvas(),
      ),
    ).toBeGreaterThan(3);
    expect(
      contrast(
        style(page.getByRole("button", { name: "Toggle sidebar" }).element())
          .color,
        canvas(),
      ),
    ).toBeGreaterThan(3);
  });

  test("a row shows a focus ring", async () => {
    await setViewport("desktop");
    await render(
      <SidebarProvider cookieName={null}>
        <Sidebar>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Inbox</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
        <SidebarMain />
      </SidebarProvider>,
    );

    await userEvent.keyboard("{Tab}");

    const row = style(page.getByRole("button", { name: "Inbox" }).element());
    expect(row.outlineStyle).toBe("solid");
    expect(contrast(row.outlineColor, canvas())).toBeGreaterThan(3);
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

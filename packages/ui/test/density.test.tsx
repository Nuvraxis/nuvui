import "../src/styles/index.scss";
import { afterEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanup, render } from "vitest-browser-react";
import {
  Button,
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
  PasswordInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Sidebar,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
  Toggle,
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  toast,
} from "../src";
import { emulateMedia, setViewport } from "./media";

// What controls measure with a mouse at each density. Their sizes on a touch
// screen are in touch.test.tsx, and don't change with density.

const height = (element: Element | null) =>
  element?.getBoundingClientRect().height;

// The three control heights, in pixels.
const densities = [
  ["compact", 28, 36, 44],
  ["default", 32, 40, 48],
  ["comfortable", 36, 44, 52],
] as const;

describe.each(densities)("density %s", (density, small, medium, large) => {
  test("sets the height of each button size", async () => {
    const screen = await render(
      <div data-density={density}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>,
    );
    const button = (name: string) =>
      height(screen.getByRole("button", { name }).element());

    expect(button("Small")).toBe(small);
    expect(button("Medium")).toBe(medium);
    expect(button("Large")).toBe(large);
  });

  test("sets the height of a select and a tab", async () => {
    await render(
      <div data-density={density}>
        <Select>
          <SelectTrigger aria-label="Fruit">
            <SelectValue placeholder="Pick a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
        <Tabs defaultValue="one">
          <TabsList aria-label="Sections">
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First</TabsContent>
        </Tabs>
      </div>,
    );

    expect(height(page.getByRole("combobox").element())).toBe(medium);
    expect(height(page.getByRole("tab").element())).toBe(medium);
  });

  test("sets the height of every kind of field", async () => {
    await render(
      <div data-density={density}>
        <Input aria-label="Name" />
        <NativeSelect aria-label="Country">
          <option>Norway</option>
        </NativeSelect>
        <PasswordInput aria-label="Password" />
        <InputGroup>
          <Input aria-label="Site" />
          <InputGroupButton>Copy</InputGroupButton>
        </InputGroup>
        <OtpField aria-label="Code" length={1} />
      </div>,
    );

    expect(height(page.getByLabelText("Name").element())).toBe(medium);
    expect(height(page.getByLabelText("Country").element())).toBe(medium);
    expect(height(document.querySelector(".nuv-password-input"))).toBe(medium);
    expect(height(document.querySelector(".nuv-input-group"))).toBe(medium);
    expect(height(document.querySelector(".nuv-otp-field__input"))).toBe(
      medium,
    );
    // The buttons inside a field keep 4px clear of its edge all round.
    expect(height(page.getByRole("button", { name: "Copy" }).element())).toBe(
      medium - 8,
    );
    expect(
      height(page.getByRole("button", { name: "Show password" }).element()),
    ).toBe(medium - 8);
  });

  test("sets the height of each toggle size", async () => {
    const screen = await render(
      <div data-density={density}>
        <Toggle size="sm">Small</Toggle>
        <Toggle size="md">Medium</Toggle>
        <Toggle size="lg">Large</Toggle>
      </div>,
    );
    const toggle = (name: string) =>
      height(screen.getByRole("button", { name }).element());

    expect(toggle("Small")).toBe(small);
    expect(toggle("Medium")).toBe(medium);
    expect(toggle("Large")).toBe(large);
  });

  test("sets the height of what's in a menu bar, a navigation menu and a row of page links", async () => {
    await render(
      <div data-density={density}>
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
      </div>,
    );
    const part = (name: string) =>
      height(document.querySelector(`.nuv-${name}`));

    expect(part("menubar__trigger")).toBe(small);
    expect(part("navigation-menu__trigger")).toBe(medium);
    expect(part("navigation-menu__link")).toBe(medium);
    expect(part("pagination__link")).toBe(medium);
  });

  test("sets the height of what's in a toolbar", async () => {
    await render(
      <div data-density={density}>
        <Toolbar aria-label="Formatting">
          <ToolbarToggleGroup type="multiple" aria-label="Text style">
            <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
          </ToolbarToggleGroup>
          <ToolbarLink href="#help">Help</ToolbarLink>
          <ToolbarButton>Share</ToolbarButton>
        </Toolbar>
      </div>,
    );
    const part = (name: string) =>
      height(document.querySelector(`.nuv-toolbar__${name}`));

    // A toolbar is a dense row, so its controls take the small height.
    expect(part("toggle-item")).toBe(small);
    expect(part("link")).toBe(small);
    expect(part("button")).toBe(small);
  });

  test("sets the height of a command's field and rows", async () => {
    await render(
      <div data-density={density}>
        <Command label="Commands">
          <CommandInput />
          <CommandList>
            <CommandItem>Open file</CommandItem>
          </CommandList>
        </Command>
      </div>,
    );
    const part = (name: string) =>
      height(document.querySelector(`.nuv-command__${name}`));

    expect(part("input")).toBe(medium);
    expect(part("item")).toBe(small);
  });

  test("sets the height of a sidebar's rows, and the width of its strip of icons", async () => {
    await setViewport("desktop");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <div data-density={density}>
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
      </div>,
    );
    const part = (name: string) =>
      height(document.querySelector(`.nuv-sidebar__${name}`));

    expect(part("menu-button")).toBe(medium);
    expect(part("menu-sub-button")).toBe(small);
    expect(part("trigger")).toBe(small);

    await page.getByRole("button", { name: "Toggle sidebar" }).click();
    expect(
      document.querySelector(".nuv-sidebar")?.getBoundingClientRect().width,
    ).toBe(medium + 16 + 1);
  });

  // These render at the end of <body>, so the density has to be on the page.
  describe("in a portal", () => {
    afterEach(async () => {
      await cleanup();
      toast.dismiss();
    });

    test("sets the height of a menu row", async () => {
      document.documentElement.setAttribute("data-density", density);
      await emulateMedia({ reducedMotion: "reduce" });
      await render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Rename</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      const row = page.getByRole("menuitem", { name: "Rename" });
      await expect.element(row).toBeVisible();

      expect(height(row.element())).toBe(small);
    });

    test("sets the size of a dialog's close button", async () => {
      document.documentElement.setAttribute("data-density", density);
      await emulateMedia({ reducedMotion: "reduce" });
      await setViewport("desktop");
      await render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>,
      );
      const close = page.getByRole("button", { name: "Close" });
      await expect.element(close).toBeVisible();

      expect(height(close.element())).toBe(small);
    });

    test("sets the height of a row in a context menu and in a menu bar's menu", async () => {
      document.documentElement.setAttribute("data-density", density);
      await emulateMedia({ reducedMotion: "reduce" });
      await render(
        <>
          <Menubar defaultValue="file" aria-label="Document">
            <MenubarMenu value="file">
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>New tab</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          <ContextMenu modal={false}>
            <ContextMenuTrigger data-testid="area">
              report.pdf
            </ContextMenuTrigger>
            <ContextMenuContent aria-label="File">
              <ContextMenuItem>Rename</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </>,
      );
      const inBar = page.getByRole("menuitem", { name: "New tab" });
      await expect.element(inBar).toBeVisible();
      expect(height(inBar.element())).toBe(small);
      // The open menu is lying over the area the next one opens from.
      await userEvent.keyboard("{Escape}");
      await expect.element(inBar).not.toBeInTheDocument();

      await userEvent.click(page.getByTestId("area"), { button: "right" });
      const row = page.getByRole("menuitem", { name: "Rename" });
      await expect.element(row).toBeVisible();
      expect(height(row.element())).toBe(small);
    });

    test("sets the size of a sheet's close button", async () => {
      document.documentElement.setAttribute("data-density", density);
      await emulateMedia({ reducedMotion: "reduce" });
      await render(
        <Sheet defaultOpen>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetContent>
        </Sheet>,
      );
      const close = page.getByRole("button", { name: "Close" });
      await expect.element(close).toBeVisible();

      expect(height(close.element())).toBe(small);
    });

    test("sets the height of a combobox, its search field and its options", async () => {
      document.documentElement.setAttribute("data-density", density);
      await emulateMedia({ reducedMotion: "reduce" });
      await render(
        <Combobox defaultOpen>
          <ComboboxTrigger aria-label="Fruit">
            <ComboboxValue placeholder="Pick a fruit" />
          </ComboboxTrigger>
          <ComboboxContent label="Search fruit">
            <ComboboxItem value="Apple">Apple</ComboboxItem>
          </ComboboxContent>
        </Combobox>,
      );
      const option = page.getByRole("option", { name: "Apple" });
      await expect.element(option).toBeVisible();

      expect(
        height(
          page.getByRole("combobox", { name: "Fruit", exact: true }).element(),
        ),
      ).toBe(medium);
      expect(
        height(page.getByRole("combobox", { name: "Search fruit" }).element()),
      ).toBe(medium);
      expect(height(option.element())).toBe(small);
    });

    test("sets the size of a toast's buttons", async () => {
      document.documentElement.setAttribute("data-density", density);
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
        expect(height(page.getByRole("button", { name }).element())).toBe(
          small,
        );
      }
    });
  });
});

describe("nesting", () => {
  test("the nearest data-density wins, and default puts the heights back", async () => {
    const screen = await render(
      <div data-density="compact">
        <Button>Outer</Button>
        <div data-density="default">
          <Button>Reset</Button>
          <div data-density="comfortable">
            <Button>Inner</Button>
          </div>
        </div>
      </div>,
    );
    const button = (name: string) =>
      height(screen.getByRole("button", { name }).element());

    expect(button("Outer")).toBe(36);
    expect(button("Reset")).toBe(40);
    expect(button("Inner")).toBe(44);
  });

  test("a component's own variable still wins over the density", async () => {
    const screen = await render(
      <div
        data-density="compact"
        style={{ "--nuv-button-height": "50px" } as never}
      >
        <Button>Save</Button>
      </div>,
    );

    expect(height(screen.getByRole("button").element())).toBe(50);
  });
});

describe("the tokens behind the sizes", () => {
  test("one variable moves every control of that size", async () => {
    const screen = await render(
      <div style={{ "--nuv-control-height-md": "30px" } as never}>
        <Button>Save</Button>
        <Select>
          <SelectTrigger aria-label="Fruit">
            <SelectValue placeholder="Pick a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      </div>,
    );

    expect(height(screen.getByRole("button", { name: "Save" }).element())).toBe(
      30,
    );
    expect(height(screen.getByRole("combobox").element())).toBe(30);
  });

  test("the border width and the disabled opacity are tokens too", async () => {
    const screen = await render(
      <div
        style={
          {
            "--nuv-border-width": "3px",
            "--nuv-disabled-opacity": "0.25",
          } as never
        }
      >
        <Button intent="secondary" disabled>
          Save
        </Button>
      </div>,
    );
    const style = getComputedStyle(screen.getByRole("button").element());

    expect(style.borderTopWidth).toBe("3px");
    expect(style.opacity).toBe("0.25");
  });
});

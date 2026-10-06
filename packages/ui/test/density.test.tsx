import "../src/styles/index.scss";
import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { cleanup, render } from "vitest-browser-react";
import {
  Button,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
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

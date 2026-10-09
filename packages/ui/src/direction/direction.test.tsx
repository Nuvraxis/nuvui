import "../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { Slider } from "../components/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";
import { type Direction, DirectionProvider, useDirection } from "./direction";

// Radix moves focus a moment after an arrow key goes down. See the same
// helper in the radio group's tests.
async function arrow(key: string) {
  await userEvent.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await userEvent.keyboard(`{/${key}}`);
}

function Sections() {
  return (
    <Tabs defaultValue="one">
      <TabsList aria-label="Sections">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        <TabsTrigger value="three">Three</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First</TabsContent>
      <TabsContent value="two">Second</TabsContent>
      <TabsContent value="three">Third</TabsContent>
    </Tabs>
  );
}

const tab = (name: string) => page.getByRole("tab", { name });

function Reader({ dir }: { dir?: Direction }) {
  return <output>{useDirection(dir)}</output>;
}

const read = () => page.getByRole("status");

describe("useDirection", () => {
  test("is left to right when nothing says otherwise", async () => {
    await render(<Reader />);

    await expect.element(read()).toHaveTextContent("ltr");
  });

  test("reads the nearest provider", async () => {
    await render(
      <DirectionProvider dir="ltr">
        <DirectionProvider dir="rtl">
          <Reader />
        </DirectionProvider>
      </DirectionProvider>,
    );

    await expect.element(read()).toHaveTextContent("rtl");
  });

  test("a direction passed to it wins over the provider", async () => {
    await render(
      <DirectionProvider dir="rtl">
        <Reader dir="ltr" />
      </DirectionProvider>,
    );

    await expect.element(read()).toHaveTextContent("ltr");
  });
});

describe("DirectionProvider", () => {
  test("adds no element of its own", async () => {
    const screen = await render(
      <DirectionProvider dir="rtl">
        <p>Text</p>
      </DirectionProvider>,
    );

    expect(screen.container.innerHTML).toBe("<p>Text</p>");
  });

  test("without it, the dir attribute alone leaves the arrow keys as they were", async () => {
    await render(
      <div dir="rtl">
        <Sections />
      </div>,
    );
    await userEvent.keyboard("{Tab}");

    // The tabs are laid out from the right, and the left arrow still goes
    // back, which here means it wraps to the last tab. This is the mismatch
    // the provider is for.
    await arrow("ArrowLeft");

    await expect.element(tab("Three")).toHaveFocus();
  });

  test("with it, the left arrow moves to the next tab", async () => {
    await render(
      <DirectionProvider dir="rtl">
        <div dir="rtl">
          <Sections />
        </div>
      </DirectionProvider>,
    );
    await userEvent.keyboard("{Tab}");

    await arrow("ArrowLeft");

    await expect.element(tab("Two")).toHaveFocus();
    // And the next tab is the one drawn to the left.
    expect(tab("Two").element().getBoundingClientRect().right).toBeLessThan(
      tab("One").element().getBoundingClientRect().right,
    );
  });

  test("with it, a slider's low end is on the right", async () => {
    await render(
      <DirectionProvider dir="rtl">
        <div dir="rtl" style={{ width: 200 }}>
          <Slider aria-label="Volume" defaultValue={[10]} />
        </div>
      </DirectionProvider>,
    );
    const handle = page.getByRole("slider");
    const track = document.querySelector(".nuv-slider") as Element;

    const fromRight =
      track.getBoundingClientRect().right -
      handle.element().getBoundingClientRect().right;
    expect(fromRight).toBeLessThan(30);

    await userEvent.keyboard("{Tab}");
    await arrow("ArrowLeft");

    await expect.element(handle).toHaveAttribute("aria-valuenow", "11");
  });

  test("with it, the left arrow opens a submenu", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <DirectionProvider dir="rtl">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </DirectionProvider>,
    );
    const share = page.getByRole("menuitem", { name: "Share" });
    await expect.element(share).toBeVisible();
    // A menu in a portal takes its direction from the provider.
    expect(
      (document.querySelector(".nuv-dropdown-menu") as Element).getAttribute(
        "dir",
      ),
    ).toBe("rtl");

    await arrow("ArrowDown");
    await expect.element(share).toHaveFocus();
    await arrow("ArrowLeft");

    await expect
      .element(page.getByRole("menuitem", { name: "Email" }))
      .toBeVisible();
  });

  test("a part of the page can go back to left to right", async () => {
    await render(
      <DirectionProvider dir="rtl">
        <DirectionProvider dir="ltr">
          <div dir="ltr">
            <Sections />
          </div>
        </DirectionProvider>
      </DirectionProvider>,
    );
    await userEvent.keyboard("{Tab}");

    await arrow("ArrowRight");

    await expect.element(tab("Two")).toHaveFocus();
  });
});

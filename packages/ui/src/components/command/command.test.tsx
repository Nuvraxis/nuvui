import "../../styles/index.scss";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import {
  type ComponentProps,
  createRef,
  type ReactNode,
  useState,
} from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
} from "./command";

function Parts({ onSelect }: { onSelect?: (value: string) => void }) {
  return (
    <>
      <CommandInput placeholder="Type a command" />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Files">
          <CommandItem onSelect={onSelect}>
            New file
            <CommandShortcut>Ctrl+N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={onSelect}>Open file</CommandItem>
          <CommandItem onSelect={onSelect} disabled>
            Save file
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="View">
          <CommandItem onSelect={onSelect} keywords={["dark", "light"]}>
            Toggle theme
          </CommandItem>
          <CommandItem onSelect={onSelect}>Zoom in</CommandItem>
        </CommandGroup>
      </CommandList>
    </>
  );
}

function Example({
  onSelect,
  children = <Parts onSelect={onSelect} />,
  ...props
}: ComponentProps<typeof Command> & { onSelect?: (value: string) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <Command label="Commands" {...props}>
        {children}
      </Command>
    </div>
  );
}

function Palette({
  onSelect,
  children = <Parts onSelect={onSelect} />,
  ...props
}: ComponentProps<typeof CommandDialog> & {
  onSelect?: (value: string) => void;
}) {
  return (
    <>
      <Button>Before</Button>
      <CommandDialog label="Commands" {...props}>
        {children}
      </CommandDialog>
    </>
  );
}

const field = () => page.getByRole("combobox", { name: "Commands" });
const list = () => page.getByRole("listbox");
const option = (name: string) => page.getByRole("option", { name });
const options = () =>
  page
    .getByRole("option")
    .elements()
    .map((element) => element.firstChild?.textContent);
const dialog = () => page.getByRole("dialog", { name: "Command palette" });
const status = () => document.querySelector(".nuv-command__status");
const rect = (element: Element) => element.getBoundingClientRect();

// The option the search field says the arrow keys are on.
const active = () =>
  document.getElementById(
    field().element().getAttribute("aria-activedescendant") ?? "",
  )?.firstChild?.textContent ?? null;

async function openStill(node: ReactNode) {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await expect.element(dialog()).toBeVisible();
  return dialog().element();
}

describe("rendering", () => {
  test("renders a search field over a list", async () => {
    await render(<Example />);

    await expect.element(field()).toBeVisible();
    await expect
      .element(field())
      .toHaveAttribute("placeholder", "Type a command");
    await expect.element(list()).toBeVisible();
    expect(options()).toEqual([
      "New file",
      "Open file",
      "Save file",
      "Toggle theme",
      "Zoom in",
    ]);
  });

  test("forwards refs and keeps class names", async () => {
    const root = createRef<HTMLDivElement>();
    const input = createRef<HTMLInputElement>();
    const listRef = createRef<HTMLDivElement>();
    const item = createRef<HTMLDivElement>();
    await render(
      <Command ref={root} className="mine" label="Commands">
        <CommandInput ref={input} className="yours" />
        <CommandList ref={listRef} className="theirs">
          <CommandItem ref={item} className="ours">
            Only
          </CommandItem>
        </CommandList>
      </Command>,
    );

    expect(root.current?.className).toBe("nuv-command mine");
    expect(input.current).toBe(field().element());
    await expect.element(field()).toHaveClass("nuv-command__input", "yours");
    expect(listRef.current).toBe(list().element());
    await expect.element(list()).toHaveClass("nuv-command__list", "theirs");
    expect(item.current).toBe(option("Only").element());
    await expect
      .element(option("Only"))
      .toHaveClass("nuv-command__item", "ours");
  });

  test("the field, the list and the groups have names", async () => {
    const first = await render(<Example />);
    await expect
      .element(page.getByRole("listbox", { name: "Suggestions" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("group", { name: "Files" }))
      .toBeVisible();
    await expect
      .element(field())
      .toHaveAttribute("aria-controls", list().element().id);
    await first.unmount();

    await render(
      <Command>
        <CommandInput />
        <CommandList label="Results">
          <CommandItem>Only</CommandItem>
        </CommandList>
      </Command>,
    );
    // The names the parts have when they're given none.
    await expect
      .element(page.getByRole("combobox", { name: "Search" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("listbox", { name: "Results" }))
      .toBeVisible();
  });

  test("a shortcut is at the far end of its row and hidden from screen readers", async () => {
    await render(<Example />);
    const row = option("New file").element();
    const keys = row.querySelector(".nuv-command__shortcut") as Element;

    expect(keys.getAttribute("aria-hidden")).toBe("true");
    expect(rect(row).right - rect(keys).right).toBe(12);
    // So the row is named by its text alone.
    await expect
      .element(page.getByRole("option", { name: "New file", exact: true }))
      .toBeVisible();
  });
});

describe("keyboard", () => {
  test("the arrow keys move through the list while focus stays in the field", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.element(field()).toHaveFocus();
    await expect.poll(active).toBe("New file");

    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(active).toBe("Open file");

    // Save file is disabled.
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(active).toBe("Toggle theme");

    await userEvent.keyboard("{End}");
    await expect.poll(active).toBe("Zoom in");

    await userEvent.keyboard("{Home}");
    await expect.poll(active).toBe("New file");
    await expect.element(field()).toHaveFocus();
  });

  test("Alt and an arrow key move to the first item of the next or previous group", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.poll(active).toBe("New file");

    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect.poll(active).toBe("Toggle theme");

    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(active).toBe("Zoom in");

    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await expect.poll(active).toBe("New file");
  });

  test("Enter runs the active item", async () => {
    const onSelect = vi.fn();
    await render(<Example onSelect={onSelect} />);
    await userEvent.keyboard("{Tab}");
    await expect.poll(active).toBe("New file");

    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("Open file");
  });

  // cmdk works this attribute out too early. Without the fix in
  // use-active-option.ts it's empty in the first two steps and names
  // Zoom in in the last.
  test("the field always says which item is active", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.poll(active).toBe("New file");

    await userEvent.keyboard("zo");
    await expect.poll(options).toEqual(["Zoom in"]);
    await expect.poll(active).toBe("Zoom in");

    await userEvent.keyboard("{Backspace}{Backspace}");
    await expect.poll(options).toHaveLength(5);
    await expect.poll(active).toBe("New file");
  });

  test("Ctrl+J and Ctrl+K only move through the list when asked to", async () => {
    const first = await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.poll(active).toBe("New file");
    await userEvent.keyboard("{Control>}j{/Control}");
    await expect.poll(active).toBe("New file");
    await first.unmount();

    await render(<Example vimBindings />);
    await userEvent.keyboard("{Tab}");
    await expect.poll(active).toBe("New file");
    await userEvent.keyboard("{Control>}j{/Control}");
    await expect.poll(active).toBe("Open file");
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect.poll(active).toBe("New file");
  });

  test("the active row is filled, and the field shows it has focus", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.poll(active).toBe("New file");
    const row = getComputedStyle(option("New file").element());
    const panel = getComputedStyle(
      document.querySelector(".nuv-command") as Element,
    );

    // 3:1 against the panel to be seen as a state, 4.5:1 for its own text.
    expect(
      contrast(row.backgroundColor, panel.backgroundColor),
    ).toBeGreaterThanOrEqual(3);
    expect(contrast(row.color, row.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
    // Kept for forced-colors mode, where the fill isn't drawn.
    expect(row.outlineColor).toBe("rgba(0, 0, 0, 0)");
    // The shortcut takes the row's color there, and not the muted one.
    expect(
      getComputedStyle(
        document.querySelector(".nuv-command__shortcut") as Element,
      ).color,
    ).toBe(row.color);

    expect(
      getComputedStyle(
        document.querySelector(".nuv-command__search") as Element,
      ).boxShadow,
    ).not.toBe("none");
  });
});

describe("pointer", () => {
  test("a click runs an item", async () => {
    const onSelect = vi.fn();
    await render(<Example onSelect={onSelect} />);

    await option("Zoom in").click();

    expect(onSelect).toHaveBeenCalledWith("Zoom in");
  });

  test("a disabled item can't be run", async () => {
    const onSelect = vi.fn();
    await render(<Example onSelect={onSelect} />);

    await expect
      .element(option("Save file"))
      .toHaveAttribute("aria-disabled", "true");
    await option("Save file").click({ force: true });

    expect(onSelect).not.toHaveBeenCalled();
  });

  test("the item under the pointer becomes the active one", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.poll(active).toBe("New file");

    await userEvent.hover(option("Zoom in"));

    await expect.poll(active).toBe("Zoom in");
  });
});

describe("searching", () => {
  test("matches loosely, and puts the best match first", async () => {
    await render(
      <Example>
        <CommandInput />
        <CommandList>
          <CommandItem>Open settings</CommandItem>
          <CommandItem>Print</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandList>
      </Example>,
    );
    await userEvent.keyboard("{Tab}");

    // Letters in order are enough: s, t, g.
    await userEvent.keyboard("stg");
    await expect.poll(options).toEqual(["Settings", "Open settings"]);
    await expect.poll(active).toBe("Settings");
  });

  test("looks through keywords", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");

    await userEvent.keyboard("dark");

    await expect.poll(options).toEqual(["Toggle theme"]);
  });

  test("a group goes when none of its items match, and a separator while searching", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    const groups = () =>
      [...document.querySelectorAll<HTMLElement>(".nuv-command__group")]
        .filter((group) => !group.hidden)
        .map(
          (group) => group.querySelector(".nuv-command__label")?.textContent,
        );
    expect(groups()).toEqual(["Files", "View"]);
    expect(document.querySelectorAll(".nuv-command__separator")).toHaveLength(
      1,
    );

    await userEvent.keyboard("zoom");

    await expect.poll(groups).toEqual(["View"]);
    expect(document.querySelectorAll(".nuv-command__separator")).toHaveLength(
      0,
    );
  });

  test("says so when nothing matches, on screen and to a screen reader", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    expect(status()?.getAttribute("role")).toBe("status");
    expect(status()?.textContent).toBe("");

    await userEvent.keyboard("qqq");

    const empty = () => document.querySelector(".nuv-command__empty");
    await expect.poll(() => status()?.textContent).toBe("No commands found.");
    expect(empty()?.textContent).toBe("No commands found.");
    // The copy in the list is for the eye. The list may only hold options.
    expect(empty()?.getAttribute("aria-hidden")).toBe("true");
    await expect.element(field()).not.toHaveAttribute("aria-activedescendant");
  });

  test("shows that items are on their way, in place of saying there are none", async () => {
    await render(
      <Example shouldFilter={false}>
        <CommandInput />
        <CommandList>
          <CommandEmpty>No commands found.</CommandEmpty>
          <CommandLoading />
        </CommandList>
      </Example>,
    );

    const loading = document.querySelector(".nuv-command__loading");
    expect(loading?.textContent).toBe("Loading");
    expect(loading?.getAttribute("aria-hidden")).toBe("true");
    await expect.poll(() => status()?.textContent).toBe("Loading");
    expect(document.querySelector(".nuv-command__empty")).toBeNull();
  });

  test("the search text can be controlled", async () => {
    const onValueChange = vi.fn();
    function Controlled() {
      const [text, setText] = useState("zoom");
      return (
        <Command label="Commands">
          <CommandInput
            value={text}
            onValueChange={(next) => {
              setText(next);
              onValueChange(next);
            }}
          />
          <CommandList>
            <CommandItem>Zoom in</CommandItem>
            <CommandItem>Print</CommandItem>
          </CommandList>
        </Command>
      );
    }
    await render(<Controlled />);

    await expect.element(field()).toHaveValue("zoom");
    await expect.poll(options).toEqual(["Zoom in"]);

    await field().click();
    await userEvent.keyboard("{Backspace}");

    expect(onValueChange).toHaveBeenCalledWith("zoo");
  });
});

describe("in a dialog", () => {
  test("is closed until it's opened, and has no shortcut unless given one", async () => {
    await render(<Palette />);

    await expect.element(dialog()).not.toBeInTheDocument();
    await userEvent.keyboard("{Control>}k{/Control}");
    await new Promise((resolve) => setTimeout(resolve, 100));

    await expect.element(dialog()).not.toBeInTheDocument();
  });

  test.each(["Control", "Meta"])(
    "%s and the key open it, and close it again",
    async (modifier) => {
      const onOpenChange = vi.fn();
      await render(<Palette shortcut="k" onOpenChange={onOpenChange} />);

      await userEvent.keyboard(`{${modifier}>}k{/${modifier}}`);

      await expect.element(dialog()).toBeVisible();
      await expect.element(field()).toHaveFocus();
      expect(onOpenChange).toHaveBeenLastCalledWith(true);

      await userEvent.keyboard(`{${modifier}>}k{/${modifier}}`);

      await expect.element(dialog()).not.toBeInTheDocument();
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    },
  );

  test("the key is matched whatever its case", async () => {
    await render(<Palette shortcut="K" />);

    await userEvent.keyboard("{Control>}k{/Control}");

    await expect.element(dialog()).toBeVisible();
  });

  test("the key alone, or with Shift or Alt as well, does nothing", async () => {
    await render(<Palette shortcut="k" />);
    await page.getByRole("button", { name: "Before" }).click();

    await userEvent.keyboard("k");
    await userEvent.keyboard("{Control>}{Shift>}k{/Shift}{/Control}");
    await userEvent.keyboard("{Control>}{Alt>}k{/Alt}{/Control}");
    await new Promise((resolve) => setTimeout(resolve, 100));

    await expect.element(dialog()).not.toBeInTheDocument();
  });

  test("text that's edited in place keeps the keys", async () => {
    await render(
      <>
        {/* biome-ignore lint/a11y/useSemanticElements: an editor is what's being tested */}
        <div
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          tabIndex={0}
          aria-label="Notes"
        >
          Notes
        </div>
        <Palette shortcut="k" />
      </>,
    );
    await page.getByRole("textbox", { name: "Notes" }).click();

    await userEvent.keyboard("{Control>}k{/Control}");
    await new Promise((resolve) => setTimeout(resolve, 100));

    await expect.element(dialog()).not.toBeInTheDocument();
  });

  test("something that has already used the keys keeps them", async () => {
    await render(
      <>
        <input
          aria-label="Editor"
          onKeyDown={(event) => {
            if (event.ctrlKey && event.key === "k") event.preventDefault();
          }}
        />
        <Palette shortcut="k" />
      </>,
    );
    await page.getByRole("textbox", { name: "Editor" }).click();

    await userEvent.keyboard("{Control>}k{/Control}");
    await new Promise((resolve) => setTimeout(resolve, 100));

    await expect.element(dialog()).not.toBeInTheDocument();
  });

  test("the shortcut stops the browser acting on the keys", async () => {
    await render(<Palette shortcut="k" />);
    const prevented: boolean[] = [];
    const record = (event: KeyboardEvent) => {
      // After the component's own listener, which is on the page too.
      queueMicrotask(() => prevented.push(event.defaultPrevented));
    };
    window.addEventListener("keydown", record);
    try {
      await userEvent.keyboard("{Control>}k{/Control}");
      await expect.element(dialog()).toBeVisible();
    } finally {
      window.removeEventListener("keydown", record);
    }

    // Control going down, and then k.
    expect(prevented).toEqual([false, true]);
  });

  test("can be controlled", async () => {
    const onOpenChange = vi.fn();
    await render(<Palette open onOpenChange={onOpenChange} />);

    await expect.element(dialog()).toBeVisible();
    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Still open, because the parent hasn't changed the prop.
    await expect.element(dialog()).toBeVisible();
  });

  test("Escape closes it and gives focus back", async () => {
    await render(<Palette shortcut="k" />);
    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("button", { name: "Before" }))
      .toHaveFocus();
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect.element(field()).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    await expect.element(dialog()).not.toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "Before" }))
      .toHaveFocus();
  });

  test("the search starts empty each time it opens", async () => {
    await render(<Palette shortcut="k" />);
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect.element(field()).toHaveFocus();
    await userEvent.keyboard("zoom");
    await expect.poll(options).toEqual(["Zoom in"]);

    await userEvent.keyboard("{Escape}");
    await expect.element(dialog()).not.toBeInTheDocument();
    await userEvent.keyboard("{Control>}k{/Control}");

    await expect.element(field()).toHaveValue("");
    await expect.poll(options).toHaveLength(5);
  });

  test("has a name that isn't drawn, which can be changed", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const first = await render(<Palette defaultOpen />);
    await expect.element(dialog()).toBeVisible();
    const title = dialog().element().querySelector(".nuv-command__title");
    expect(title?.textContent).toBe("Command palette");
    expect(rect(title as Element).width).toBe(1);
    await first.unmount();

    await render(<Palette defaultOpen title="Go to" />);
    await expect
      .element(page.getByRole("dialog", { name: "Go to" }))
      .toBeVisible();
  });

  test("forwards its ref and class name to the command inside", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Palette defaultOpen ref={ref} className="mine" />);

    await expect.element(dialog()).toBeVisible();
    expect(ref.current?.className).toBe("nuv-command mine");
    expect(dialog().element().contains(ref.current)).toBe(true);
  });

  test("renders into a container when given one", async () => {
    function InSection() {
      const [section, setSection] = useState<HTMLElement | null>(null);
      return (
        <section ref={setSection} data-theme="dark" data-testid="section">
          <Palette defaultOpen container={section} />
        </section>
      );
    }
    await render(<InSection />);

    await expect.element(dialog()).toBeVisible();
    expect(
      page.getByTestId("section").element().contains(dialog().element()),
    ).toBe(true);
  });

  test("on a phone it sits at the top of the screen, clear of the edges", async () => {
    await setViewport("phone");
    const panel = rect(await openStill(<Palette defaultOpen />));

    expect(panel.top).toBe(16);
    expect(panel.left).toBe(16);
    expect(panel.right).toBe(window.innerWidth - 16);
    expect(panel.bottom).toBeLessThanOrEqual(window.innerHeight - 16);
  });

  test("on a wider screen it's in the middle, 36rem wide, towards the top", async () => {
    await setViewport("desktop");
    const panel = rect(await openStill(<Palette defaultOpen />));

    expect(panel.width).toBe(576);
    expect(Math.round(panel.left)).toBe(
      Math.round((window.innerWidth - 576) / 2),
    );
    expect(panel.top).toBe(window.innerHeight * 0.15);
  });

  test("a long list scrolls inside the dialog, under the field", async () => {
    await setViewport("phone");
    const panel = await openStill(
      <Palette defaultOpen>
        <CommandInput />
        <CommandList>
          {Array.from({ length: 60 }, (_, index) => `Command ${index + 1}`).map(
            (name) => (
              <CommandItem key={name}>{name}</CommandItem>
            ),
          )}
        </CommandList>
      </Palette>,
    );
    const box = list().element();

    expect(rect(panel).bottom).toBeLessThanOrEqual(window.innerHeight - 16);
    expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
    expect(rect(field().element()).bottom).toBeLessThanOrEqual(rect(box).top);
    expect(rect(box).height).toBeLessThanOrEqual(320);

    await userEvent.keyboard("{End}");
    await expect
      .poll(() => {
        const row = rect(option("Command 60").element());
        return row.bottom <= rect(box).bottom;
      })
      .toBe(true);
  });

  test("pops in when motion is fine, and not when it's reduced", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const first = await render(<Palette defaultOpen />);
    await expect.element(dialog()).toBeVisible();
    expect(getComputedStyle(dialog().element()).animationName).toBe(
      "nuv-command-pop-in",
    );
    await first.unmount();

    const panel = await openStill(<Palette defaultOpen />);
    expect(getComputedStyle(panel).animationName).toBe("none");
  });
});

describe("layout", () => {
  test("rows are 32px tall with a mouse, and the field is 40px", async () => {
    await render(<Example />);

    expect(rect(option("Open file").element()).height).toBe(32);
    expect(rect(field().element()).height).toBe(40);
    expect(getComputedStyle(field().element()).fontSize).toBe("14px");
  });

  test("a variable sets how tall the list may get", async () => {
    await render(
      <div style={{ "--nuv-command-list-height": "80px" } as never}>
        <Example />
      </div>,
    );

    expect(rect(list().element()).height).toBe(80);
    expect(list().element().scrollHeight).toBeGreaterThan(80);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe in the page", async () => {
    setPageTheme(theme);
    await render(
      <main>
        <Example />
      </main>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.poll(active).toBe("New file");

    const results = await axe(document.body);

    expect(results).toHaveNoViolations();
    const checked = results.passes.find((rule) => rule.id === "color-contrast");
    // The headings, the field and the enabled items.
    expect(checked?.nodes.length).toBeGreaterThanOrEqual(6);
  });

  test("passes axe with nothing found", async () => {
    setPageTheme(theme);
    await render(
      <main>
        <Example />
      </main>,
    );
    await userEvent.keyboard("{Tab}qqq");
    await expect.poll(() => status()?.textContent).toBe("No commands found.");

    expect(await axe(document.body)).toHaveNoViolations();
  });

  test("passes axe in a dialog", async () => {
    setPageTheme(theme);
    await openStill(
      <main>
        <Palette defaultOpen />
      </main>,
    );
    await expect.poll(active).toBe("New file");

    expect(await axe(document.body, outsideLandmarks)).toHaveNoViolations();
  });
});

import "../../styles/index.scss";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport, wheel } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import {
  type ComponentProps,
  type CSSProperties,
  createRef,
  type ReactNode,
  useState,
} from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { DirectionProvider } from "../../direction";
import { Button } from "../button";
import { Dialog, DialogContent, DialogTitle } from "../dialog";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../field";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLoading,
  ComboboxSeparator,
  type ComboboxSingleProps,
  ComboboxTrigger,
  ComboboxValue,
  comboboxFilter,
} from "./combobox";

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry", disabled: true },
  { value: "durian", label: "Durian" },
  { value: "acai", label: "Açaí", keywords: ["berry"] },
];
const labelOf = (value: string) =>
  fruits.find((fruit) => fruit.value === value)?.label;

function Items() {
  return (
    <>
      {fruits.map(({ value, label, ...rest }) => (
        <ComboboxItem key={value} value={value} {...rest}>
          {label}
        </ComboboxItem>
      ))}
    </>
  );
}

function Example({
  trigger,
  content,
  children = <Items />,
  wrapper = { padding: 16 },
  ...props
}: Omit<ComboboxSingleProps, "children"> & {
  trigger?: ComponentProps<typeof ComboboxTrigger>;
  // ComponentProps and not ComboboxContentProps, so a test can pass a ref.
  content?: ComponentProps<typeof ComboboxContent>;
  children?: ReactNode;
  wrapper?: CSSProperties;
}) {
  const [own, setOwn] = useState(props.defaultValue ?? "");
  const value = props.value ?? own;

  return (
    <div style={wrapper}>
      <Combobox
        {...props}
        value={value}
        onValueChange={(next) => {
          setOwn(next);
          props.onValueChange?.(next);
        }}
      >
        <ComboboxTrigger aria-label="Fruit" {...trigger}>
          <ComboboxValue placeholder="Pick a fruit">
            {labelOf(value)}
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent
          label="Search fruit"
          searchPlaceholder="Type to search"
          {...content}
        >
          <ComboboxEmpty>No fruit found.</ComboboxEmpty>
          {children}
        </ComboboxContent>
      </Combobox>
      <Button intent="ghost">After</Button>
    </div>
  );
}

const many = Array.from({ length: 60 }, (_, index) => `Option ${index + 1}`);

function Long(props: Omit<ComboboxSingleProps, "children">) {
  return (
    <div style={{ padding: 16 }}>
      <Combobox {...props}>
        <ComboboxTrigger aria-label="Fruit">
          <ComboboxValue placeholder="Pick one" />
        </ComboboxTrigger>
        <ComboboxContent label="Search fruit">
          {many.map((name) => (
            <ComboboxItem key={name} value={name}>
              {name}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

const trigger = () =>
  page.getByRole("combobox", { name: "Fruit", exact: true });
const popup = () => page.getByRole("dialog", { name: "Search fruit" });
const search = () => page.getByRole("combobox", { name: "Search fruit" });
const list = () => page.getByRole("listbox", { name: "Options" });
const option = (name: string) =>
  page.getByRole("option", { name, exact: true });
const options = () =>
  page
    .getByRole("option")
    .elements()
    .map((element) => element.textContent);
const status = () => document.querySelector(".nuv-combobox__status");
const rect = (element: Element) => element.getBoundingClientRect();

// The option the search field says the arrow keys are on.
const active = () =>
  document.getElementById(
    search().element().getAttribute("aria-activedescendant") ?? "",
  )?.textContent ?? null;

// The animation scales the popup, which would make measurements depend on
// timing.
async function openStill(node: ReactNode) {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await expect.element(popup()).toBeVisible();
  return popup().element();
}

describe("rendering", () => {
  test("is closed until the trigger is pressed", async () => {
    await render(<Example />);

    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");

    await trigger().click();

    await expect.element(popup()).toBeVisible();
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(trigger())
      .toHaveAttribute("aria-controls", popup().element().id);
  });

  test("shows the placeholder until something is picked", async () => {
    await render(<Example />);

    await expect.element(trigger()).toHaveTextContent("Pick a fruit");
    expect(
      trigger()
        .element()
        .querySelector(".nuv-combobox__value")
        ?.hasAttribute("data-placeholder"),
    ).toBe(true);
  });

  test("shows the children of the value part for what's picked", async () => {
    await render(<Example defaultValue="banana" />);

    await expect.element(trigger()).toHaveTextContent("Banana");
    expect(
      trigger()
        .element()
        .querySelector(".nuv-combobox__value")
        ?.hasAttribute("data-placeholder"),
    ).toBe(false);
  });

  test("shows the value itself when the value part has no children", async () => {
    await render(<Long defaultValue="Option 7" />);

    await expect.element(trigger()).toHaveTextContent("Option 7");
  });

  test("renders at the end of body, outside the component tree", async () => {
    const screen = await render(<Example defaultOpen />);

    await expect.element(popup()).toBeVisible();
    expect(screen.container.contains(popup().element())).toBe(false);
    // Radix wraps the popup in the element it positions.
    expect(popup().element().parentElement?.parentElement).toBe(document.body);
  });

  test("renders into a container when given one", async () => {
    function InSection() {
      const [section, setSection] = useState<HTMLElement | null>(null);
      return (
        <section ref={setSection} data-theme="dark" data-testid="section">
          <Example defaultOpen content={{ container: section }} />
        </section>
      );
    }
    await render(<InSection />);

    await expect.element(popup()).toBeVisible();
    expect(
      page.getByTestId("section").element().contains(popup().element()),
    ).toBe(true);
  });

  test("forwards refs and keeps class names", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();
    await render(
      <Example
        defaultOpen
        trigger={{ ref: triggerRef, className: "mine" }}
        content={{ ref: contentRef, className: "yours" }}
      >
        <ComboboxItem ref={itemRef} value="kiwi" className="theirs">
          Kiwi
        </ComboboxItem>
      </Example>,
    );

    await expect.element(trigger()).toHaveClass("nuv-combobox", "mine");
    await expect.element(popup()).toHaveClass("nuv-combobox__content", "yours");
    await expect
      .element(option("Kiwi"))
      .toHaveClass("nuv-combobox__item", "theirs");
    expect(triggerRef.current).toBe(trigger().element());
    expect(contentRef.current).toBe(popup().element());
    expect(itemRef.current).toBe(option("Kiwi").element());
  });

  test("the value can be controlled", async () => {
    const onValueChange = vi.fn();
    await render(
      <Example defaultOpen value="apple" onValueChange={onValueChange} />,
    );

    await option("Banana").click();

    expect(onValueChange).toHaveBeenCalledWith("banana");
    // Still Apple, because the parent hasn't changed the prop.
    await expect.element(trigger()).toHaveTextContent("Apple");
  });

  test("the list can be controlled", async () => {
    const onOpenChange = vi.fn();
    await render(<Example open onOpenChange={onOpenChange} />);

    await expect.element(popup()).toBeVisible();
    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    await expect.element(popup()).toBeVisible();
  });

  test("works without being controlled", async () => {
    await render(<Long defaultValue="Option 2" />);

    await trigger().click();
    await option("Option 3").click();

    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveTextContent("Option 3");
  });

  test("a disabled combobox can't be opened", async () => {
    await render(<Example disabled />);

    await expect.element(trigger()).toBeDisabled();
    expect(getComputedStyle(trigger().element()).opacity).toBe("0.5");
  });

  test("a part outside a Combobox says what's wrong", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<ComboboxValue />)).rejects.toThrow(
      "ComboboxValue has to be inside a Combobox.",
    );
    quiet.mockRestore();
  });
});

describe("several values", () => {
  function Several({
    onValueChange,
    ...props
  }: {
    defaultValue?: string[];
    name?: string;
    onValueChange?: (value: string[]) => void;
  }) {
    return (
      <div style={{ padding: 16 }}>
        <Combobox multiple onValueChange={onValueChange} {...props}>
          <ComboboxTrigger aria-label="Fruit">
            <ComboboxValue placeholder="Pick fruit" />
          </ComboboxTrigger>
          <ComboboxContent label="Search fruit">
            <Items />
          </ComboboxContent>
        </Combobox>
      </div>
    );
  }

  test("picking adds to the value and leaves the list open", async () => {
    const onValueChange = vi.fn();
    await render(<Several onValueChange={onValueChange} />);

    await trigger().click();
    await option("Apple").click();
    await option("Durian").click();

    expect(onValueChange).toHaveBeenLastCalledWith(["apple", "durian"]);
    await expect.element(popup()).toBeVisible();
    await expect.element(trigger()).toHaveTextContent("apple, durian");
  });

  test("picking a picked option takes it out again", async () => {
    const onValueChange = vi.fn();
    await render(
      <Several
        defaultValue={["apple", "banana"]}
        onValueChange={onValueChange}
      />,
    );

    await trigger().click();
    await option("Apple").click();

    expect(onValueChange).toHaveBeenLastCalledWith(["banana"]);
    await expect.element(trigger()).toHaveTextContent("banana");
  });

  test("every option says whether it's picked", async () => {
    await render(<Several defaultValue={["banana"]} />);
    await trigger().click();

    await expect
      .element(option("Banana"))
      .toHaveAttribute("aria-checked", "true");
    await expect
      .element(option("Apple"))
      .toHaveAttribute("aria-checked", "false");
    await expect
      .element(option("Banana"))
      .toHaveAttribute("data-state", "checked");
  });

  test("Enter picks and the keyboard stays in the list", async () => {
    await render(<Several />);
    await userEvent.keyboard("{Tab}{Enter}");
    await expect.element(search()).toHaveFocus();

    await userEvent.keyboard("{Enter}{ArrowDown}{Enter}");

    await expect.element(trigger()).toHaveTextContent("apple, banana");
    await expect.element(search()).toHaveFocus();
  });
});

describe("in a form", () => {
  const data = (form: HTMLFormElement) =>
    [...new FormData(form).entries()].map(([key, value]) => `${key}=${value}`);

  test("sends its value under its name", async () => {
    await render(
      <form data-testid="form">
        <Example name="fruit" defaultValue="banana" />
      </form>,
    );
    const form = page.getByTestId("form").element() as HTMLFormElement;
    expect(data(form)).toEqual(["fruit=banana"]);

    await trigger().click();
    await option("Durian").click();

    expect(data(form)).toEqual(["fruit=durian"]);
  });

  test("sends an empty value while nothing is picked, as a select does", async () => {
    await render(
      <form data-testid="form">
        <Example name="fruit" />
      </form>,
    );

    expect(data(page.getByTestId("form").element() as HTMLFormElement)).toEqual(
      ["fruit="],
    );
  });

  test("sends each of several values", async () => {
    await render(
      <form data-testid="form">
        <Combobox multiple name="fruit" defaultValue={["apple", "durian"]}>
          <ComboboxTrigger aria-label="Fruit">
            <ComboboxValue />
          </ComboboxTrigger>
        </Combobox>
      </form>,
    );

    expect(data(page.getByTestId("form").element() as HTMLFormElement)).toEqual(
      ["fruit=apple", "fruit=durian"],
    );
  });

  test("sends nothing without a name, or while disabled", async () => {
    await render(
      <form data-testid="form">
        <Example defaultValue="apple" />
        <Example name="other" defaultValue="apple" disabled />
      </form>,
    );

    expect(data(page.getByTestId("form").element() as HTMLFormElement)).toEqual(
      [],
    );
  });

  test("the trigger doesn't submit the form", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Example />
      </form>,
    );

    await trigger().click();
    await expect.element(popup()).toBeVisible();
    await userEvent.keyboard("{Enter}");

    await expect.element(popup()).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("keyboard", () => {
  test("Enter on the trigger opens the list with focus in the search field", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");
    await expect.element(trigger()).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect.element(search()).toHaveFocus();
    await expect
      .element(search())
      .toHaveAttribute("placeholder", "Type to search");
  });

  test.each(["ArrowDown", "ArrowUp"])(
    "%s on the trigger opens the list",
    async (key) => {
      await render(<Example />);
      await userEvent.keyboard("{Tab}");

      await userEvent.keyboard(`{${key}}`);

      await expect.element(search()).toHaveFocus();
    },
  );

  test("the arrow keys move through the options and skip a disabled one", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}{Enter}");
    await expect.poll(active).toBe("Apple");

    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(active).toBe("Banana");

    // Cherry is disabled.
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(active).toBe("Durian");

    await userEvent.keyboard("{ArrowUp}");
    await expect.poll(active).toBe("Banana");

    await userEvent.keyboard("{End}");
    await expect.poll(active).toBe("Açaí");

    await userEvent.keyboard("{Home}");
    await expect.poll(active).toBe("Apple");
    // Focus never leaves the field.
    await expect.element(search()).toHaveFocus();
  });

  test("the arrow keys stop at the ends unless loop is set", async () => {
    const first = await render(<Example defaultOpen />);
    await expect.poll(active).toBe("Apple");
    await userEvent.keyboard("{ArrowUp}");
    await expect.poll(active).toBe("Apple");
    await first.unmount();

    await render(<Example defaultOpen content={{ loop: true }} />);
    await expect.poll(active).toBe("Apple");
    await userEvent.keyboard("{ArrowUp}");
    await expect.poll(active).toBe("Açaí");
  });

  // cmdk works this attribute out too early. Without the fix in
  // use-active-option.ts it's empty in the first two steps and names
  // Banana in the last.
  test("the search field always says which option is active", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}{Enter}");
    await expect.poll(active).toBe("Apple");

    await userEvent.keyboard("an");
    await expect.poll(options).toEqual(["Banana", "Durian"]);
    await expect.poll(active).toBe("Banana");

    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(active).toBe("Durian");

    await userEvent.keyboard("{Backspace}{Backspace}");
    await expect.poll(options).toHaveLength(5);
    await expect.poll(active).toBe("Apple");

    await userEvent.keyboard("zzz");
    await expect.poll(options).toEqual([]);
    await expect.element(search()).not.toHaveAttribute("aria-activedescendant");
  });

  test("the active option is the one marked selected", async () => {
    await render(<Example defaultOpen />);
    await expect.poll(active).toBe("Apple");

    await userEvent.keyboard("{ArrowDown}");

    await expect
      .element(option("Banana"))
      .toHaveAttribute("aria-selected", "true");
    await expect
      .element(option("Apple"))
      .toHaveAttribute("aria-selected", "false");
  });

  test("Enter picks the active option, closes the list and goes back to the trigger", async () => {
    const onValueChange = vi.fn();
    await render(<Example onValueChange={onValueChange} />);
    await userEvent.keyboard("{Tab}{Enter}");
    await expect.poll(active).toBe("Apple");

    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("banana");
    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveTextContent("Banana");
    await expect.element(trigger()).toHaveFocus();
  });

  test("Escape closes the list and keeps the old value", async () => {
    await render(<Example defaultValue="apple" />);
    await userEvent.keyboard("{Tab}{Enter}");
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(active).toBe("Banana");

    await userEvent.keyboard("{Escape}");

    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveTextContent("Apple");
    await expect.element(trigger()).toHaveFocus();
  });

  test.each(["{Tab}", "{Shift>}{Tab}{/Shift}"])(
    "%s closes the list and goes back to the trigger",
    async (keys) => {
      await render(<Example defaultValue="apple" />);
      await userEvent.keyboard("{Tab}{Enter}");
      await expect.element(search()).toHaveFocus();

      await userEvent.keyboard(keys);

      await expect.element(popup()).not.toBeInTheDocument();
      await expect.element(trigger()).toHaveFocus();
      await expect.element(trigger()).toHaveTextContent("Apple");
    },
  );

  test("the list opens with the picked option active and in view", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Long defaultValue="Option 45" />);
    await trigger().click();

    await expect.poll(active).toBe("Option 45");
    const row = rect(option("Option 45").element());
    const box = rect(list().element());
    expect(row.top).toBeGreaterThanOrEqual(box.top);
    expect(row.bottom).toBeLessThanOrEqual(box.bottom);
  });

  test("an arrow key brings the active option into view", async () => {
    await openStill(<Long defaultOpen />);
    await expect.poll(active).toBe("Option 1");

    await userEvent.keyboard("{End}");

    await expect.poll(active).toBe("Option 60");
    await expect
      .poll(() => {
        const row = rect(option("Option 60").element());
        return row.bottom <= rect(list().element()).bottom;
      })
      .toBe(true);
  });

  test("Home and End move through the list, and leave the caret in the field alone", async () => {
    await render(<Example defaultOpen />);
    await expect.element(search()).toHaveFocus();
    await userEvent.keyboard("a");
    await expect.poll(active).toBe("Apple");

    await userEvent.keyboard("{End}");
    await expect.poll(active).toBe("Açaí");
    await userEvent.keyboard("{Home}");
    await expect.poll(active).toBe("Apple");

    // Had Home moved the caret to the start, this would read "na".
    await userEvent.keyboard("n");
    await expect.element(search()).toHaveValue("an");
  });

  test("the list is filled where the keyboard is, and the field shows it has focus", async () => {
    await openStill(<Example defaultOpen />);
    await expect.poll(active).toBe("Apple");
    const row = getComputedStyle(option("Apple").element());
    const panel = getComputedStyle(popup().element());

    // 3:1 against the popup to be seen as a state, 4.5:1 for its own text.
    expect(
      contrast(row.backgroundColor, panel.backgroundColor),
    ).toBeGreaterThanOrEqual(3);
    expect(contrast(row.color, row.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
    // Kept for forced-colors mode, where the fill isn't drawn.
    expect(row.outlineColor).toBe("rgba(0, 0, 0, 0)");

    const field = popup().element().querySelector(".nuv-combobox__search");
    expect(getComputedStyle(field as Element).boxShadow).not.toBe("none");
  });

  test("shows a focus ring on the trigger", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");

    expect(getComputedStyle(trigger().element()).outlineStyle).toBe("solid");
  });
});

describe("pointer", () => {
  test("a click on an option picks it", async () => {
    const onValueChange = vi.fn();
    await render(<Example defaultOpen onValueChange={onValueChange} />);

    await option("Durian").click();

    expect(onValueChange).toHaveBeenCalledWith("durian");
    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveTextContent("Durian");
  });

  test("picking the picked option again keeps it", async () => {
    const onValueChange = vi.fn();
    await render(
      <Example
        defaultOpen
        defaultValue="durian"
        onValueChange={onValueChange}
      />,
    );

    await option("Durian").click();

    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveTextContent("Durian");
  });

  test("a disabled option can't be picked", async () => {
    const onValueChange = vi.fn();
    await render(<Example defaultOpen onValueChange={onValueChange} />);

    await expect
      .element(option("Cherry"))
      .toHaveAttribute("aria-disabled", "true");
    expect(getComputedStyle(option("Cherry").element()).pointerEvents).toBe(
      "none",
    );
    await option("Cherry").click({ force: true });

    expect(onValueChange).not.toHaveBeenCalled();
    await expect.element(popup()).toBeVisible();
  });

  test("the option under the pointer becomes the active one", async () => {
    await openStill(<Example defaultOpen />);
    await expect.poll(active).toBe("Apple");

    await userEvent.hover(option("Durian"));

    await expect.poll(active).toBe("Durian");
  });

  test("a click outside closes the list", async () => {
    await render(<Example defaultOpen />);
    await expect.element(popup()).toBeVisible();

    await page.getByRole("button", { name: "After" }).click();

    await expect.element(popup()).not.toBeInTheDocument();
  });

  test("an item's own onSelect is called with its value", async () => {
    const onSelect = vi.fn();
    await render(
      <Example defaultOpen>
        <ComboboxItem value="kiwi" onSelect={onSelect}>
          Kiwi
        </ComboboxItem>
      </Example>,
    );

    await option("Kiwi").click();

    expect(onSelect).toHaveBeenCalledWith("kiwi");
  });
});

describe("searching", () => {
  test("keeps the options that contain what was typed, in their order", async () => {
    await render(<Example defaultOpen />);
    await expect.element(search()).toHaveFocus();

    await userEvent.keyboard("a");
    // Every one but Cherry has an a, and they're as they were written.
    await expect.poll(options).toEqual(["Apple", "Banana", "Durian", "Açaí"]);

    await userEvent.keyboard("n");
    await expect.poll(options).toEqual(["Banana", "Durian"]);
  });

  test("matches letters in a row, not scattered ones", async () => {
    await render(<Example defaultOpen />);
    await expect.element(search()).toHaveFocus();

    // "bnn" would match Banana letter by letter.
    await userEvent.keyboard("bnn");

    await expect.poll(options).toEqual([]);
  });

  test("ignores case and accents", async () => {
    await render(<Example defaultOpen />);
    await expect.element(search()).toHaveFocus();

    await userEvent.keyboard("ACAI");

    await expect.poll(options).toEqual(["Açaí"]);
  });

  test("looks through keywords, and not through the value", async () => {
    await render(
      <Example defaultOpen>
        <ComboboxItem value="id-9f3" keywords={["citrus"]}>
          Orange
        </ComboboxItem>
        <ComboboxItem value="id-771">Plum</ComboboxItem>
      </Example>,
    );
    await expect.element(search()).toHaveFocus();

    await userEvent.keyboard("citrus");
    await expect.poll(options).toEqual(["Orange"]);

    await userEvent.keyboard("{Control>}a{/Control}{Backspace}id");
    await expect.poll(options).toEqual([]);
  });

  test("textValue is what's searched when the children aren't text", async () => {
    await render(
      <Example defaultOpen>
        <ComboboxItem value="de" textValue="Germany">
          <span>🇩🇪</span>
          <span>Deutschland</span>
        </ComboboxItem>
        <ComboboxItem value="fr" textValue="France">
          <span>France</span>
        </ComboboxItem>
      </Example>,
    );
    await expect.element(search()).toHaveFocus();

    await userEvent.keyboard("germ");

    await expect.poll(() => page.getByRole("option").elements().length).toBe(1);
    expect(page.getByRole("option").element().textContent).toContain(
      "Deutschland",
    );
  });

  test("says so when nothing matches, on screen and to a screen reader", async () => {
    await render(<Example defaultOpen />);
    await expect.element(search()).toHaveFocus();
    // The region is there before it has anything to say.
    expect(status()?.getAttribute("role")).toBe("status");
    expect(status()?.textContent).toBe("");

    await userEvent.keyboard("zzz");

    const empty = popup().element().querySelector(".nuv-combobox__empty");
    await expect.poll(() => status()?.textContent).toBe("No fruit found.");
    expect(empty?.textContent).toBe("No fruit found.");
    // The copy in the list is for the eye. The list may only hold options.
    expect(empty?.getAttribute("aria-hidden")).toBe("true");

    await userEvent.keyboard("{Backspace}{Backspace}{Backspace}");
    await expect.poll(() => status()?.textContent).toBe("");
  });

  test("a group goes when none of its options match, and a separator while searching", async () => {
    await render(
      <Example defaultOpen>
        <ComboboxGroup heading="Sweet">
          <ComboboxItem value="mango">Mango</ComboboxItem>
        </ComboboxGroup>
        <ComboboxSeparator />
        <ComboboxGroup heading="Sour">
          <ComboboxItem value="lemon">Lemon</ComboboxItem>
        </ComboboxGroup>
      </Example>,
    );
    await expect.element(search()).toHaveFocus();
    const groups = () =>
      [...popup().element().querySelectorAll(".nuv-combobox__group")].filter(
        (group) => !(group as HTMLElement).hidden,
      );
    const separators = () =>
      popup().element().querySelectorAll(".nuv-combobox__separator").length;
    expect(groups()).toHaveLength(2);
    expect(separators()).toBe(1);
    await expect
      .element(page.getByRole("group", { name: "Sweet" }))
      .toBeVisible();

    await userEvent.keyboard("lem");

    await expect.poll(() => groups().length).toBe(1);
    expect(groups()[0]?.textContent).toBe("SourLemon");
    expect(separators()).toBe(0);
  });

  test("calls onSearchChange, and the text can be controlled", async () => {
    const onSearchChange = vi.fn();
    function Controlled() {
      const [text, setText] = useState("dur");
      return (
        <Example
          defaultOpen
          content={{
            search: text,
            onSearchChange: (next) => {
              setText(next);
              onSearchChange(next);
            },
          }}
        />
      );
    }
    await render(<Controlled />);

    await expect.element(search()).toHaveValue("dur");
    await expect.poll(options).toEqual(["Durian"]);

    // The text is selected when the list opens, so that typing replaces
    // it. This puts the caret after it.
    await userEvent.keyboard("{ArrowRight}i");

    expect(onSearchChange).toHaveBeenCalledWith("duri");
    await expect.element(search()).toHaveValue("duri");
  });

  test("the search starts empty each time the list opens", async () => {
    await render(<Example />);
    await trigger().click();
    await userEvent.keyboard("ban");
    await expect.poll(options).toEqual(["Banana"]);

    await userEvent.keyboard("{Escape}");
    await expect.element(popup()).not.toBeInTheDocument();
    await trigger().click();

    await expect.element(search()).toHaveValue("");
    await expect.poll(options).toHaveLength(5);
  });

  test("takes a filter of its own", async () => {
    await render(
      <Example
        defaultOpen
        content={{
          // Only the first letter counts.
          filter: (_value, text, keywords) =>
            keywords?.[0]?.toLowerCase().startsWith(text.toLowerCase()) ? 1 : 0,
        }}
      />,
    );
    await expect.element(search()).toHaveFocus();

    await userEvent.keyboard("a");

    await expect.poll(options).toEqual(["Apple", "Açaí"]);
  });

  test("with shouldFilter off, every option given is shown", async () => {
    await render(<Example defaultOpen content={{ shouldFilter: false }} />);
    await expect.element(search()).toHaveFocus();

    await userEvent.keyboard("zzz");

    await expect.element(search()).toHaveValue("zzz");
    expect(options()).toHaveLength(5);
  });

  test("shows that options are on their way, and tells a screen reader", async () => {
    await render(
      <Example defaultOpen content={{ shouldFilter: false }}>
        <ComboboxLoading label="Loading fruit" />
      </Example>,
    );
    await expect.element(popup()).toBeVisible();

    const loading = popup().element().querySelector(".nuv-combobox__loading");
    expect(loading?.textContent).toBe("Loading fruit");
    expect(loading?.getAttribute("aria-hidden")).toBe("true");
    // "No fruit found" waits. Nothing has been found yet, which isn't the
    // same thing.
    await expect.poll(() => status()?.textContent).toBe("Loading fruit");
    expect(popup().element().querySelector(".nuv-combobox__empty")).toBeNull();
  });

  test("comboboxFilter is the default filter", () => {
    expect(comboboxFilter("x", "app", ["Apple"])).toBe(1);
    expect(comboboxFilter("x", "  APP ", ["Apple"])).toBe(1);
    expect(comboboxFilter("x", "x", ["Apple"])).toBe(0);
    expect(comboboxFilter("x", "red", ["Apple", "red"])).toBe(1);
    // With no text and no keywords, the value is all there is.
    expect(comboboxFilter("apple", "pp")).toBe(1);
    expect(comboboxFilter("José", "jose")).toBe(1);
    expect(comboboxFilter("Apple", "")).toBe(1);
  });
});

describe("what a screen reader is told", () => {
  test("the parts have names", async () => {
    await render(
      <Example defaultOpen content={{ listLabel: "Fruit" }}>
        <ComboboxGroup heading="Sweet">
          <ComboboxItem value="mango">Mango</ComboboxItem>
        </ComboboxGroup>
      </Example>,
    );

    await expect.element(popup()).toBeVisible();
    await expect.element(search()).toBeVisible();
    await expect
      .element(page.getByRole("listbox", { name: "Fruit" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("group", { name: "Sweet" }))
      .toBeVisible();
    await expect
      .element(search())
      .toHaveAttribute(
        "aria-controls",
        page.getByRole("listbox", { name: "Fruit" }).element().id,
      );
  });

  test("the popup can have a name of its own", async () => {
    await render(<Example defaultOpen content={{ "aria-label": "Fruit" }} />);

    await expect
      .element(page.getByRole("dialog", { name: "Fruit", exact: true }))
      .toBeVisible();
    await expect.element(search()).toBeVisible();
  });

  test("only the picked option says it's picked", async () => {
    await render(<Example defaultOpen defaultValue="banana" />);

    await expect
      .element(option("Banana"))
      .toHaveAttribute("aria-checked", "true");
    await expect.element(option("Apple")).not.toHaveAttribute("aria-checked");
    // The check is a drawing. The attribute is what says it.
    expect(
      option("Banana")
        .element()
        .querySelector("svg")
        ?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(option("Apple").element().querySelector("svg")).toBeNull();
  });

  test("in a field, the label names it and its text is still its value", async () => {
    function InField({ error }: { error?: string }) {
      return (
        <Field required>
          <FieldLabel>Fruit</FieldLabel>
          <Combobox defaultValue="Banana">
            <FieldControl>
              <ComboboxTrigger>
                <ComboboxValue placeholder="Pick a fruit" />
              </ComboboxTrigger>
            </FieldControl>
            <ComboboxContent label="Search fruit">
              <ComboboxItem value="Banana">Banana</ComboboxItem>
            </ComboboxContent>
          </Combobox>
          <FieldDescription>One a day.</FieldDescription>
          <FieldError>{error}</FieldError>
        </Field>
      );
    }
    const screen = await render(<InField />);
    const field = page.getByRole("combobox", { name: "Fruit" });

    await expect.element(field).toHaveTextContent("Banana");
    await expect.element(field).toHaveAccessibleDescription("One a day.");
    await expect.element(field).toHaveAttribute("aria-required", "true");
    // A button has no such attribute.
    await expect.element(field).not.toHaveAttribute("required");

    expect(document.querySelector("label")?.htmlFor).toBe(field.element().id);

    await screen.rerender(<InField error="Pick another." />);
    await expect.element(field).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(field)
      .toHaveAccessibleDescription("One a day. Pick another.");
  });
});

describe("in a dialog", () => {
  function InDialog() {
    return (
      <Dialog defaultOpen>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Settings</DialogTitle>
          <Long />
          <Button intent="ghost">Save</Button>
        </DialogContent>
      </Dialog>
    );
  }
  const dialog = () => page.getByRole("dialog", { name: "Settings" });

  async function openBoth() {
    await setViewport("desktop");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<InDialog />);
    await expect.element(dialog()).toBeVisible();
    await trigger().click();
    await expect.element(search()).toHaveFocus();
  }

  test("Escape closes the list and leaves the dialog open", async () => {
    await openBoth();

    await userEvent.keyboard("{Escape}");

    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(dialog()).toBeVisible();
    await expect.element(trigger()).toHaveFocus();
  });

  test("an option can be picked with the pointer and with the keyboard", async () => {
    await openBoth();

    await option("Option 3").click();
    await expect.element(trigger()).toHaveTextContent("Option 3");
    await expect.element(dialog()).toBeVisible();

    await userEvent.keyboard("{Enter}");
    await expect.element(search()).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect.element(trigger()).toHaveTextContent("Option 4");
    await expect.element(dialog()).toBeVisible();
  });

  test("a click elsewhere in the dialog closes the list and not the dialog", async () => {
    await openBoth();

    await page.getByRole("heading", { name: "Settings" }).click();

    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(dialog()).toBeVisible();
  });

  // A dialog stops the page behind it from scrolling, and the list is
  // rendered outside the dialog.
  test("the mouse wheel scrolls the list", async () => {
    await openBoth();
    expect(list().element().scrollTop).toBe(0);

    await wheel(".nuv-combobox__list", 300);

    await expect.poll(() => list().element().scrollTop).toBeGreaterThan(0);
  });

  test("nothing around the list is hidden from screen readers", async () => {
    await openBoth();
    const hidden: Element[] = [];
    for (
      let node: Element | null = search().element();
      node;
      node = node.parentElement
    ) {
      if (
        node.getAttribute("aria-hidden") === "true" ||
        node.hasAttribute("inert")
      ) {
        hidden.push(node);
      }
    }

    expect(hidden).toEqual([]);
  });
});

describe("layout", () => {
  test("the trigger is 40px tall with a mouse", async () => {
    await render(<Example />);

    expect(rect(trigger().element()).height).toBe(40);
  });

  test("the trigger is 12rem wide unless a variable says otherwise", async () => {
    const first = await render(<Example />);
    expect(rect(trigger().element()).width).toBe(192);
    await first.unmount();

    await render(
      <Example
        trigger={{ style: { "--nuv-combobox-width": "100%" } as never }}
      />,
    );
    const element = trigger().element();
    const parent = element.parentElement as Element;
    expect(rect(element).width).toBe(rect(parent).width - 32);
  });

  test("a long value is cut short instead of widening the trigger", async () => {
    await render(
      <div style={{ inlineSize: 200 }}>
        <Combobox defaultValue="The plan with every feature we have ever shipped">
          <ComboboxTrigger aria-label="Fruit">
            <ComboboxValue />
          </ComboboxTrigger>
        </Combobox>
      </div>,
    );
    const element = trigger().element();
    const value = element.querySelector(".nuv-combobox__value") as Element;

    expect(rect(element).width).toBe(200);
    expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
  });

  test("the popup opens under the trigger and is at least as wide", async () => {
    const panel = rect(await openStill(<Example defaultOpen />));
    const button = rect(trigger().element());

    expect(panel.top - button.bottom).toBe(6);
    expect(panel.left).toBe(button.left);
    expect(panel.width).toBeGreaterThanOrEqual(button.width);
  });

  test("in a right-to-left layout it lines up with the trigger's right edge", async () => {
    document.documentElement.dir = "rtl";
    try {
      const panel = rect(
        await openStill(
          <DirectionProvider dir="rtl">
            <Example
              defaultOpen
              trigger={{ style: { "--nuv-combobox-width": "8rem" } as never }}
            />
          </DirectionProvider>,
        ),
      );
      const button = rect(trigger().element());

      expect(Math.round(panel.right)).toBe(Math.round(button.right));
      expect(panel.width).toBeGreaterThanOrEqual(button.width);
    } finally {
      document.documentElement.removeAttribute("dir");
    }
  });

  test("rows are 32px tall with a mouse, and the field is 40px", async () => {
    const panel = await openStill(<Example defaultOpen />);

    expect(rect(option("Apple").element()).height).toBe(32);
    expect(rect(search().element()).height).toBe(40);
    expect(getComputedStyle(search().element()).fontSize).toBe("14px");
    expect(panel.querySelector(".nuv-combobox__search-icon")).not.toBeNull();
  });

  test("the check is at the far end of its row", async () => {
    await openStill(<Example defaultOpen defaultValue="banana" />);
    const row = rect(option("Banana").element());
    const check = rect(
      option("Banana")
        .element()
        .querySelector(".nuv-combobox__indicator") as Element,
    );

    expect(row.right - check.right).toBe(12);
  });

  test("a long list stays on the screen and scrolls inside itself", async () => {
    await setViewport("phone");
    const panel = await openStill(<Long defaultOpen />);
    const box = list().element();

    expect(rect(panel).top).toBeGreaterThanOrEqual(0);
    expect(rect(panel).bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(rect(panel).right).toBeLessThanOrEqual(window.innerWidth);
    expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
    // The field stays put above the list.
    expect(rect(search().element()).bottom).toBeLessThanOrEqual(rect(box).top);
    expect(rect(box).height).toBeLessThanOrEqual(288);
  });

  test("a variable sets how tall the list may get", async () => {
    await setViewport("desktop");
    await openStill(
      <div style={{ "--nuv-combobox-list-height": "100px" } as never}>
        <Long defaultOpen />
      </div>,
    );
    // The popup is at the end of body, so the variable has to be set where
    // it can inherit from.
    document.body.style.setProperty("--nuv-combobox-list-height", "100px");
    try {
      await expect.poll(() => rect(list().element()).height).toBe(100);
    } finally {
      document.body.style.removeProperty("--nuv-combobox-list-height");
    }
  });

  test("aria-invalid turns the edge to the danger color", async () => {
    await render(
      <>
        <Example trigger={{ "aria-invalid": true }} />
        <span data-testid="probe" style={{ color: "var(--color-danger)" }} />
      </>,
    );

    expect(getComputedStyle(trigger().element()).borderColor).toBe(
      getComputedStyle(page.getByTestId("probe").element()).color,
    );
  });
});

describe("motion", () => {
  test("pops in when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultOpen />);

    await expect.element(popup()).toBeVisible();
    expect(getComputedStyle(popup().element()).animationName).toBe(
      "nuv-combobox-content-in",
    );
  });

  test("doesn't animate when reduced motion is on", async () => {
    const panel = await openStill(<Example defaultOpen />);

    expect(getComputedStyle(panel).animationName).toBe("none");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe closed, with and without a value", async () => {
    setPageTheme(theme);
    await render(
      <main>
        <Example />
        <Combobox defaultValue="Big">
          <ComboboxTrigger aria-label="Size">
            <ComboboxValue />
          </ComboboxTrigger>
        </Combobox>
      </main>,
    );

    expect(await axe(document.body)).toHaveNoViolations();
  });

  test("the open list passes axe", async () => {
    setPageTheme(theme);
    await openStill(
      <main>
        <Example defaultOpen defaultValue="banana">
          <ComboboxGroup heading="Sweet">
            <Items />
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxGroup heading="Sour">
            <ComboboxItem value="lemon">Lemon</ComboboxItem>
          </ComboboxGroup>
        </Example>
      </main>,
    );
    await expect.poll(active).toBe("Banana");

    const results = await axe(document.body, outsideLandmarks);

    expect(results).toHaveNoViolations();
    const checked = results.passes.find((rule) => rule.id === "color-contrast");
    // The heading, the field and the enabled options.
    expect(checked?.nodes.length).toBeGreaterThanOrEqual(5);
  });

  test("the list with nothing in it passes axe", async () => {
    setPageTheme(theme);
    await openStill(
      <main>
        <Example defaultOpen />
      </main>,
    );
    await userEvent.keyboard("zzz");
    await expect.poll(() => status()?.textContent).toBe("No fruit found.");

    expect(await axe(document.body, outsideLandmarks)).toHaveNoViolations();
  });
});

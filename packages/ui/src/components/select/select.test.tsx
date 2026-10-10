import "../../styles/index.scss";
import { axe, behindOpenList } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  type SelectProps,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

interface ExampleProps extends SelectProps {
  // ComponentProps and not the exported props types, so a test can pass a ref.
  trigger?: ComponentProps<typeof SelectTrigger>;
  content?: ComponentProps<typeof SelectContent>;
}

function Example({ trigger, content, ...props }: ExampleProps) {
  return (
    <div style={{ padding: 40 }}>
      <label htmlFor="fruit">Fruit</label>
      <div>
        <Select {...props}>
          <SelectTrigger id="fruit" {...trigger}>
            <SelectValue placeholder="Pick a fruit" />
          </SelectTrigger>
          <SelectContent {...content}>
            <SelectGroup>
              <SelectLabel>Common</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="cherry" disabled>
                Cherry
              </SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value="durian">Durian</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Long(props: SelectProps) {
  return (
    <Select {...props}>
      <SelectTrigger aria-label="Number">
        <SelectValue placeholder="Pick a number" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 60 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static filler
          <SelectItem key={index} value={`${index}`}>
            Number {index}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// The trigger is held as an element in a few places, because the open list
// hides the rest of the page from the accessibility tree and a role query
// can't find it then.
const trigger = () => page.getByRole("combobox", { name: "Fruit" });
const list = () => page.getByRole("listbox");
const option = (name: string) => page.getByRole("option", { name });

// Opens the list without the mouse, for tests that are about something other
// than how it opens. Headless Firefox on Linux drops a click that comes
// straight after the browser's own "fill in this field" bubble, or after a
// change to the emulated media, before any event reaches the page.
async function openFromKeyboard() {
  trigger().element().focus();
  await userEvent.keyboard("{Enter}");
}
const rect = (element: Element) => element.getBoundingClientRect();

// The animation scales the list, which would make measurements depend on
// timing.
async function openStill(node: React.ReactNode) {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await expect.element(list()).toBeVisible();
  return list().element();
}

describe("rendering", () => {
  test("shows the placeholder until something is chosen", async () => {
    await render(<Example />);

    await expect.element(trigger()).toHaveTextContent("Pick a fruit");
    await expect.element(trigger()).toHaveAttribute("data-placeholder");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
    await expect.element(list()).not.toBeInTheDocument();
  });

  test("a click opens the list, with its group named by the label", async () => {
    await render(<Example />);

    await trigger().click();

    await expect.element(list()).toBeVisible();
    await expect
      .element(page.getByRole("group", { name: "Common" }))
      .toBeVisible();
    await expect.element(option("Apple")).toBeVisible();
  });

  test("a click on the label opens the list", async () => {
    await render(<Example />);

    await page.getByText("Fruit", { exact: true }).click();

    await expect.element(list()).toBeVisible();
  });

  test("choosing an option closes the list and shows it in the trigger", async () => {
    const onValueChange = vi.fn();
    await render(<Example onValueChange={onValueChange} />);
    await trigger().click();

    await option("Banana").click();

    expect(onValueChange).toHaveBeenCalledWith("banana");
    await expect.element(list()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveTextContent("Banana");
    await expect.element(trigger()).not.toHaveAttribute("data-placeholder");
    await expect.element(trigger()).toHaveFocus();
  });

  test("only the chosen option has a check", async () => {
    await render(<Example defaultValue="banana" defaultOpen />);
    await expect.element(list()).toBeVisible();
    const check = (name: string) =>
      option(name).element().querySelector(".nuv-select__indicator");

    expect(check("Banana")).not.toBeNull();
    expect(check("Apple")).toBeNull();
    await expect
      .element(option("Banana"))
      .toHaveAttribute("data-state", "checked");
  });

  test("the check isn't copied into the trigger with the text", async () => {
    await render(<Example defaultValue="banana" />);

    await expect.poll(() => trigger().element().textContent).toBe("Banana");
    // One svg: the trigger's own arrow.
    expect(trigger().element().querySelectorAll("svg")).toHaveLength(1);
  });

  test("a disabled option can't be chosen", async () => {
    const onValueChange = vi.fn();
    await render(<Example defaultOpen onValueChange={onValueChange} />);
    await expect.element(list()).toBeVisible();

    await expect
      .element(option("Cherry"))
      .toHaveAttribute("aria-disabled", "true");
    await option("Cherry").click({ force: true });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("can be controlled", async () => {
    const onValueChange = vi.fn();
    await render(<Example value="apple" onValueChange={onValueChange} />);
    await trigger().click();

    await option("Banana").click();

    expect(onValueChange).toHaveBeenCalledWith("banana");
    // Still Apple, because the parent hasn't changed the prop.
    await expect.element(trigger()).toHaveTextContent("Apple");
  });

  test("a disabled select can't be opened", async () => {
    await render(<Example disabled />);

    await expect.element(trigger()).toBeDisabled();
  });

  test("forwards refs and keeps classNames", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    await render(
      <Example
        defaultOpen
        trigger={{ ref: triggerRef, className: "mine" }}
        content={{ ref: contentRef, className: "panel" }}
      />,
    );

    await expect.element(list()).toHaveClass("nuv-select__content", "panel");
    expect(contentRef.current).toBe(list().element());
    expect(triggerRef.current?.classList.contains("nuv-select")).toBe(true);
    expect(triggerRef.current?.classList.contains("mine")).toBe(true);
  });

  test("renders at the end of body, or in a container when given one", async () => {
    function InSection() {
      const [section, setSection] = useState<HTMLElement | null>(null);
      return (
        <section ref={setSection} data-testid="section">
          <Example defaultOpen content={{ container: section }} />
        </section>
      );
    }
    const first = await render(<Example defaultOpen />);
    await expect.element(list()).toBeVisible();
    expect(first.container.contains(list().element())).toBe(false);
    await first.unmount();

    await render(<InSection />);
    await expect.element(list()).toBeVisible();
    expect(
      page.getByTestId("section").element().contains(list().element()),
    ).toBe(true);
  });
});

describe("forms", () => {
  test("submits its value under its name", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Example name="fruit" defaultValue="banana" />
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();

    expect(submitted?.get("fruit")).toBe("banana");
  });

  test("required blocks the form until something is chosen", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Example name="fruit" required />
        <button type="submit">Send</button>
      </form>,
    );
    const send = page.getByRole("button", { name: "Send" });

    await expect.element(trigger()).toHaveAttribute("aria-required", "true");
    await send.click();
    expect(onSubmit).not.toHaveBeenCalled();

    // Enter opens the list on its first option, and Enter again picks it.
    await openFromKeyboard();
    await expect.element(option("Apple")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(trigger()).toHaveTextContent("Apple");

    // Submitted from script, for the same reason the list was opened from
    // the keyboard. requestSubmit runs the validation a click would.
    send.element().closest("form")?.requestSubmit();
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe("keyboard", () => {
  test("Enter, Space and the down arrow all open the list", async () => {
    for (const key of ["{Enter}", " ", "{ArrowDown}"]) {
      const screen = await render(<Example />);
      await userEvent.keyboard("{Tab}");
      await expect.element(trigger()).toHaveFocus();

      await userEvent.keyboard(key);

      await expect.element(list()).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await expect.element(list()).not.toBeInTheDocument();
      await screen.unmount();
    }
  });

  test("opens on the chosen option, and arrows skip disabled ones", async () => {
    await render(<Example defaultValue="banana" />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(option("Banana")).toHaveFocus();

    // Cherry is disabled.
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(option("Durian")).toHaveFocus();

    await userEvent.keyboard("{Home}");
    await expect.element(option("Apple")).toHaveFocus();

    await userEvent.keyboard("{End}");
    await expect.element(option("Durian")).toHaveFocus();
  });

  test("Enter chooses the focused option", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(option("Apple")).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");

    await expect.element(list()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveTextContent("Banana");
  });

  test("Escape closes the list and keeps the old value", async () => {
    await render(<Example defaultValue="apple" />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(option("Banana")).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    await expect.element(list()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveTextContent("Apple");
    await expect.element(trigger()).toHaveFocus();
  });

  test("typing a letter in the open list jumps to a matching option", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(option("Apple")).toHaveFocus();

    await userEvent.keyboard("d");

    await expect.element(option("Durian")).toHaveFocus();
  });

  test("typing a letter on the closed trigger changes the value", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");

    await userEvent.keyboard("b");

    await expect.element(trigger()).toHaveTextContent("Banana");
    await expect.element(list()).not.toBeInTheDocument();
  });

  test("shows a focus ring on the trigger, and fills the option the keyboard is on", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    expect(getComputedStyle(trigger().element()).outlineStyle).toBe("solid");

    await userEvent.keyboard("{Enter}");
    await expect.element(option("Apple")).toHaveFocus();
    const row = getComputedStyle(option("Apple").element());
    const panel = getComputedStyle(list().element());

    // 3:1 against the list to be seen as a state, 4.5:1 for its own text.
    expect(
      contrast(row.backgroundColor, panel.backgroundColor),
    ).toBeGreaterThanOrEqual(3);
    expect(contrast(row.color, row.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
    // Kept for forced-colors mode, where the fill isn't drawn.
    expect(row.outlineColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("the option under the pointer is filled the same way", async () => {
    await openStill(<Example defaultOpen />);
    const style = getComputedStyle(option("Banana").element());
    const before = style.backgroundColor;

    await userEvent.hover(option("Banana"));

    await expect.element(option("Banana")).toHaveAttribute("data-highlighted");
    expect(style.backgroundColor).not.toBe(before);
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
        trigger={{ style: { "--nuv-select-width": "100%" } as never }}
      />,
    );
    const element = trigger().element();
    expect(rect(element).width).toBe(
      rect(element.parentElement as Element).width,
    );
  });

  test("a long value is cut short instead of widening the trigger", async () => {
    await render(
      <div style={{ inlineSize: 200 }}>
        <Select defaultValue="long">
          <SelectTrigger aria-label="Plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="long">
              The plan with every feature we have ever shipped
            </SelectItem>
          </SelectContent>
        </Select>
      </div>,
    );
    const element = page.getByRole("combobox", { name: "Plan" }).element();
    const value = element.querySelector(".nuv-select__value") as Element;

    expect(rect(element).width).toBe(200);
    expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
  });

  test("the list opens under the trigger and is at least as wide", async () => {
    const element = await (async () => {
      await render(<Example />);
      return trigger().element();
    })();
    await emulateMedia({ reducedMotion: "reduce" });
    await openFromKeyboard();
    await expect.element(list()).toBeVisible();
    const panel = rect(list().element());

    expect(panel.top - rect(element).bottom).toBe(6);
    expect(panel.left).toBe(rect(element).left);
    expect(panel.width).toBeGreaterThanOrEqual(rect(element).width);
  });

  test("rows are 32px tall with a mouse", async () => {
    await openStill(<Example defaultOpen />);

    expect(rect(option("Apple").element()).height).toBe(32);
  });

  test("a long list stays on the screen and scrolls inside itself", async () => {
    await setViewport("phone");
    const panel = await openStill(<Long defaultOpen />);
    const viewport = panel.querySelector(".nuv-select__viewport") as Element;

    expect(rect(panel).top).toBeGreaterThanOrEqual(0);
    expect(rect(panel).bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    // With the scrollbar hidden, this is the sign that there's more below.
    await expect
      .poll(() => panel.querySelectorAll(".nuv-select__scroll-button").length)
      .toBe(1);
  });

  test("position=item-aligned lays the list over the trigger", async () => {
    await setViewport("desktop");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Example defaultValue="banana" content={{ position: "item-aligned" }} />,
    );
    const element = trigger().element();
    await openFromKeyboard();
    await expect.element(option("Banana")).toBeVisible();

    const chosen = rect(option("Banana").element());
    const button = rect(element);
    // The chosen option sits where the trigger is.
    expect(chosen.top).toBeLessThan(button.bottom);
    expect(chosen.bottom).toBeGreaterThan(button.top);
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

    await expect.element(list()).toBeVisible();
    expect(getComputedStyle(list().element()).animationName).toBe(
      "nuv-select-content-in",
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
        <Select defaultValue="b">
          <SelectTrigger aria-label="Size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="b">Big</SelectItem>
          </SelectContent>
        </Select>
      </main>,
    );

    expect(await axe(document.body)).toHaveNoViolations();
  });

  test("the open list passes axe", async () => {
    setPageTheme(theme);
    await openStill(
      <main>
        <Example defaultOpen defaultValue="banana" />
      </main>,
    );

    const results = await axe(document.body, behindOpenList);

    expect(results).toHaveNoViolations();
    const checked = results.passes.find((rule) => rule.id === "color-contrast");
    // The label and the enabled options.
    expect(checked?.nodes.length).toBeGreaterThanOrEqual(4);
  });
});

function Sentence({ dir }: { dir?: "rtl" }) {
  return (
    <p data-testid="sentence" dir={dir} style={{ fontSize: 20, padding: 40 }}>
      Showing orders from{" "}
      <Select defaultValue="30">
        <SelectTrigger variant="inline" aria-label="Period">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">the last 7 days</SelectItem>
          <SelectItem value="30">the last 30 days</SelectItem>
          <SelectItem value="365">the last year</SelectItem>
        </SelectContent>
      </Select>
      , newest first.
    </p>
  );
}

describe("in a sentence", () => {
  const period = () => page.getByRole("combobox", { name: "Period" });
  const style = (element: Element) => getComputedStyle(element);

  test("the inline variant has no box, and takes the size and color of the text around it", async () => {
    await render(<Sentence />);
    const element = period().element();
    const around = style(page.getByTestId("sentence").element());

    expect(element.className).toBe("nuv-select nuv-select--inline");
    expect(style(element).borderTopWidth).toBe("0px");
    expect(style(element).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style(element).fontSize).toBe("20px");
    expect(style(element).color).toBe(around.color);
    expect(style(element).paddingLeft).toBe("0px");
  });

  test("it's as wide as what it shows, and sits on the line of the sentence", async () => {
    // Wide enough for the sentence to be one line in any font.
    await setViewport("desktop");
    await render(<Sentence />);
    const element = period().element();
    const sentence = page.getByTestId("sentence").element();
    const value = element.querySelector(".nuv-select__value") as Element;
    const icon = element.querySelector(".nuv-select__icon") as Element;

    // No wider than its words, the gap and the chevron. How wide that is
    // depends on the font, so it's measured and not written down. And not
    // held to the 12rem a select in a field is at least.
    expect(style(element).minWidth).toBe("0px");
    expect(rect(value).width).toBeGreaterThan(0);
    expect(rect(element).width).toBeLessThanOrEqual(
      rect(value).width + rect(icon).width + 4 + 1,
    );
    // One line of text between the paragraph's 40px above and below, and
    // the select doesn't make that line taller.
    const line = rect(sentence).height - 80;
    expect(line).toBeLessThan(20 * 2);
    expect(rect(element).height).toBeLessThanOrEqual(line + 0.5);
  });

  test("a line under it says it can be pressed, and the chevron is still there", async () => {
    await render(<Sentence />);
    const element = period().element();

    expect(style(element).textDecorationLine).toBe("underline");
    expect(element.querySelector(".nuv-select__icon svg")).not.toBeNull();
    expect(style(element).cursor).toBe("pointer");
  });

  test("it opens and chooses as any select does, and grows to fit the new value", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Sentence />);
    const before = rect(period().element()).width;

    await period().click();
    await page.getByRole("option", { name: "the last 7 days" }).click();

    await expect.element(period()).toHaveTextContent("the last 7 days");
    expect(rect(period().element()).width).not.toBe(before);
  });

  test("the keyboard opens it and moves through it", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Sentence />);

    await userEvent.tab();
    await expect.element(period()).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByRole("listbox")).toBeVisible();
    // The list takes focus a moment after it's drawn, and a key pressed
    // before then goes nowhere.
    await expect
      .element(page.getByRole("option", { name: "the last 30 days" }))
      .toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(page.getByRole("option", { name: "the last year" }))
      .toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect.element(period()).toHaveTextContent("the last year");
  });

  test("an invalid one has a red line that's thicker, not a red line alone", async () => {
    await render(
      <p>
        From{" "}
        <Select>
          <SelectTrigger
            variant="inline"
            aria-label="Period"
            aria-invalid="true"
          >
            <SelectValue placeholder="choose a period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">the last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </p>,
    );

    expect(style(period().element()).textDecorationThickness).toBe("2px");
  });

  test("the list is at least as wide as its longest option, not as narrow as the trigger", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Sentence />);

    await period().click();
    const list = page.getByRole("listbox").element();

    expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
  });
});

describe.each(themes)("in a sentence, accessibility in %s", (theme) => {
  test("passes axe, and the line under it reaches 3:1", async () => {
    setPageTheme(theme);
    await render(
      <main>
        <Sentence />
      </main>,
    );
    const element = page.getByRole("combobox", { name: "Period" }).element();

    expect(await axe(document.body)).toHaveNoViolations();
    expect(
      contrast(
        getComputedStyle(element).textDecorationColor,
        getComputedStyle(document.body).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});

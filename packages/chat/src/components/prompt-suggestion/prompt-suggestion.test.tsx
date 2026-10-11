import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { PromptSuggestion, PromptSuggestions } from ".";

const starters = [
  "Summarize last month's invoices",
  "Who hasn't paid yet?",
  "Draft a reminder",
];

function Starters({
  onPick = () => {},
  width = 360,
}: {
  onPick?: (text: string) => void;
  width?: number;
}) {
  return (
    <div data-testid="around" style={{ width }}>
      <PromptSuggestions>
        {starters.map((text) => (
          <PromptSuggestion key={text} onClick={() => onPick(text)}>
            {text}
          </PromptSuggestion>
        ))}
      </PromptSuggestions>
    </div>
  );
}

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const one = (name: string) => page.getByRole("button", { name });

describe("rendering", () => {
  test("they're a named group of buttons, each named by its text", async () => {
    await render(<Starters />);
    const group = page.getByRole("group", { name: "Suggestions" });

    await expect.element(group).toBeVisible();
    expect(group.element().className).toBe("nuv-prompt-suggestions");
    expect(group.getByRole("button").elements().length).toBe(3);
    expect(one("Draft a reminder").element().className).toBe(
      "nuv-prompt-suggestion",
    );
  });

  test("a press is yours to handle, and the button doesn't send a form it's in", async () => {
    const onPick = vi.fn();
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    await render(
      <form onSubmit={onSubmit as never}>
        <Starters onPick={onPick} />
      </form>,
    );

    await one("Who hasn't paid yet?").click();

    expect(onPick).toHaveBeenCalledWith("Who hasn't paid yet?");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(one("Who hasn't paid yet?").element().getAttribute("type")).toBe(
      "button",
    );
  });

  test("the group's name is yours, and both take a ref, a class and other attributes", async () => {
    const group = createRef<HTMLDivElement>();
    const button = createRef<HTMLButtonElement>();
    await render(
      <PromptSuggestions
        ref={group}
        label="Vorschläge"
        className="a"
        data-kind="a"
      >
        <PromptSuggestion ref={button} className="b" data-kind="b">
          Wer hat nicht bezahlt?
        </PromptSuggestion>
      </PromptSuggestions>,
    );

    await expect
      .element(page.getByRole("group", { name: "Vorschläge" }))
      .toBeVisible();
    expect(group.current?.className).toBe("nuv-prompt-suggestions a");
    expect(group.current?.dataset.kind).toBe("a");
    expect(button.current?.className).toBe("nuv-prompt-suggestion b");
    expect(button.current?.dataset.kind).toBe("b");
  });

  test("a disabled one can't be pressed, and is faded", async () => {
    const onClick = vi.fn();
    await render(
      <PromptSuggestions>
        <PromptSuggestion disabled onClick={onClick}>
          Draft a reminder
        </PromptSuggestion>
      </PromptSuggestions>,
    );
    const element = one("Draft a reminder").element() as HTMLButtonElement;

    element.click();

    expect(onClick).not.toHaveBeenCalled();
    expect(Number(style(element).opacity)).toBeLessThan(1);
  });

  test("Tab goes from one to the next, and Enter presses", async () => {
    const onPick = vi.fn();
    await render(<Starters onPick={onPick} />);

    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(one("Who hasn't paid yet?").element());
    await userEvent.keyboard("{Enter}");

    expect(onPick).toHaveBeenCalledWith("Who hasn't paid yet?");
  });
});

describe("layout", () => {
  test("they sit in rows in the middle, 8px apart, and wrap to the next row", async () => {
    await render(<Starters />);
    const around = rect(page.getByTestId("around").element());
    const first = rect(one("Summarize last month's invoices").element());
    const second = rect(one("Who hasn't paid yet?").element());
    const third = rect(one("Draft a reminder").element());

    // The first is alone in its row, in the middle of it.
    expect(second.top).toBeGreaterThan(first.top);
    expect(
      Math.abs(first.left + first.width / 2 - (around.left + around.width / 2)),
    ).toBeLessThanOrEqual(1);
    expect(second.top - first.bottom).toBe(8);
    expect(third.top).toBe(second.top);
    expect(third.left - second.right).toBe(8);
  });

  test("one that's longer than the row wraps its text and makes nothing wider", async () => {
    await render(
      <div data-testid="around" style={{ width: 200 }}>
        <PromptSuggestions>
          <PromptSuggestion>
            Draft a reminder for every customer with an invoice more than thirty
            days overdue
          </PromptSuggestion>
        </PromptSuggestions>
      </div>,
    );
    const around = page.getByTestId("around").element();
    const button = rect(page.getByRole("button").element());

    expect(around.scrollWidth).toBe(200);
    expect(button.width).toBeLessThanOrEqual(200);
    expect(button.height).toBeGreaterThan(60);
  });
});

describe("styles", () => {
  test("with a mouse one is 36px tall, a pill with an edge", async () => {
    await setViewport("desktop");
    await render(<Starters />);
    const element = one("Draft a reminder").element();

    expect(rect(element).height).toBe(36);
    expect(
      Number.parseFloat(style(element).borderTopLeftRadius),
    ).toBeGreaterThan(17);
    expect(style(element).borderTopStyle).toBe("solid");
    expect(style(element).fontSize).toBe("14px");
  });

  test("one shows a ring when it has focus from the keyboard", async () => {
    await render(<Starters />);

    await userEvent.tab();

    expect(style(document.activeElement as Element).outlineStyle).toBe("solid");
  });

  test("component variables change the colors, the corners, the space and where they sit", async () => {
    await render(
      <div
        data-testid="around"
        style={
          {
            width: 360,
            "--nuv-prompt-suggestion-bg": "rgb(1, 2, 3)",
            "--nuv-prompt-suggestion-fg": "rgb(250, 250, 250)",
            "--nuv-prompt-suggestion-border": "rgb(4, 5, 6)",
            "--nuv-prompt-suggestion-radius": "3px",
            "--nuv-prompt-suggestion-gap": "20px",
            "--nuv-prompt-suggestion-justify": "start",
          } as never
        }
      >
        <PromptSuggestions>
          {starters.map((text) => (
            <PromptSuggestion key={text}>{text}</PromptSuggestion>
          ))}
        </PromptSuggestions>
      </div>,
    );
    const first = one("Summarize last month's invoices").element();
    const second = rect(one("Who hasn't paid yet?").element());
    const third = rect(one("Draft a reminder").element());

    expect(style(first).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style(first).color).toBe("rgb(250, 250, 250)");
    expect(style(first).borderTopColor).toBe("rgb(4, 5, 6)");
    expect(style(first).borderTopLeftRadius).toBe("3px");
    expect(rect(first).left).toBe(
      rect(page.getByTestId("around").element()).left,
    );
    expect(second.top - rect(first).bottom).toBe(20);
    expect(third.left - second.right).toBe(20);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, and a suggestion's edge can be seen", async () => {
    const { container } = await renderThemed(theme, <Starters />);
    const ground = style(
      container.querySelector("main") as Element,
    ).backgroundColor;

    expect(await axe(container)).toHaveNoViolations();
    expect(
      contrast(style(one("Draft a reminder").element()).borderTopColor, ground),
    ).toBeGreaterThanOrEqual(3);
  });
});

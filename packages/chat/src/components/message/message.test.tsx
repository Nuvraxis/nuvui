import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageCopyAction,
  MessageMeta,
} from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const message = (from: "user" | "assistant") =>
  document.querySelector(`.nuv-message[data-from="${from}"]`) as HTMLElement;
const content = (from: "user" | "assistant") =>
  message(from).querySelector(".nuv-message__content") as HTMLElement;

// Two messages in a column 400px wide.
function Pair() {
  return (
    <div data-testid="column" style={{ display: "grid", gap: 16, width: 400 }}>
      <Message from="user">
        <MessageContent>Is it ready?</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>It is. Two invoices are overdue.</MessageContent>
      </Message>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rendering", () => {
  test("the person's own is at the end of the row in a bubble, and the assistant's at the start", async () => {
    await render(<Pair />);
    const column = rect(page.getByTestId("column").element());

    expect(message("user").className).toBe("nuv-message");
    expect(rect(content("user")).right).toBe(column.right);
    expect(rect(content("user")).left).toBeGreaterThan(column.left + 100);
    expect(rect(content("assistant")).left).toBe(column.left);
    // A bubble has a fill and round corners. The other has neither.
    expect(style(content("user")).backgroundColor).not.toBe(
      style(content("assistant")).backgroundColor,
    );
    expect(
      Number.parseFloat(style(content("user")).borderTopLeftRadius),
    ).toBeGreaterThan(8);
    expect(style(content("assistant")).backgroundColor).toBe(
      "rgba(0, 0, 0, 0)",
    );
  });

  test("who it's from is said before it, and seen by nobody", async () => {
    await render(<Pair />);
    const said = (from: "user" | "assistant") =>
      message(from).querySelector(".nuv-message__label") as HTMLElement;

    expect(message("user").textContent).toBe("You: Is it ready?");
    expect(message("assistant").textContent).toBe(
      "Assistant: It is. Two invoices are overdue.",
    );
    expect(rect(said("user")).width).toBe(1);
    expect(rect(said("user")).height).toBe(1);
    expect(style(said("user")).position).toBe("absolute");
  });

  test("the unseen words stay with their message, and don't make the page scroll", async () => {
    // Out of the flow, they're placed against whatever around them is
    // positioned. That has to be the message: against the page they'd be
    // far below the screen, where a message is in a long conversation.
    await render(
      <div style={{ height: 200, overflow: "auto" }}>
        {Array.from({ length: 40 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the list never changes
          <Message key={index} from="assistant">
            <MessageContent>Message {index + 1}</MessageContent>
            <MessageActions>
              <MessageCopyAction text="x" />
            </MessageActions>
          </Message>
        ))}
      </div>,
    );

    expect(style(message("assistant")).position).toBe("relative");
    expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(
      window.innerHeight,
    );
  });

  test("the words for who it's from are yours, or left out", async () => {
    const screen = await render(
      <Message from="assistant" label="Assistent">
        <MessageContent>Fertig.</MessageContent>
      </Message>,
    );
    expect(message("assistant").textContent).toBe("Assistent: Fertig.");

    await screen.rerender(
      <Message from="assistant" label={null}>
        <MessageContent>Fertig.</MessageContent>
      </Message>,
    );
    expect(message("assistant").querySelector(".nuv-message__label")).toBe(
      null,
    );
    expect(message("assistant").textContent).toBe("Fertig.");
  });

  test("a picture sits beside the message, on the far side for the person's own, hidden from screen readers", async () => {
    await render(
      <div style={{ display: "grid", gap: 16, width: 400 }}>
        <Message from="user" avatar={<span data-testid="mine">AL</span>}>
          <MessageContent>Is it ready?</MessageContent>
        </Message>
        <Message from="assistant" avatar={<span data-testid="theirs">N</span>}>
          <MessageContent>It is.</MessageContent>
        </Message>
      </div>,
    );
    const mine = page.getByTestId("mine").element();
    const theirs = page.getByTestId("theirs").element();

    expect(mine.parentElement?.className).toBe("nuv-message__avatar");
    expect(mine.parentElement?.getAttribute("aria-hidden")).toBe("true");
    expect(rect(mine).left).toBeGreaterThan(rect(content("user")).right);
    expect(rect(theirs).right).toBeLessThan(rect(content("assistant")).left);
    // 12px between the two.
    expect(
      Math.round(rect(content("assistant")).left - rect(theirs).right),
    ).toBe(12);
  });

  test("without a picture there's no room kept for one", async () => {
    await render(<Pair />);

    expect(document.querySelector(".nuv-message__avatar")).toBe(null);
  });

  test("while it's being written it's marked as busy, and not after", async () => {
    const screen = await render(
      <Message from="assistant" streaming>
        <MessageContent>Two inv</MessageContent>
      </Message>,
    );
    expect(message("assistant").getAttribute("aria-busy")).toBe("true");
    expect(message("assistant").hasAttribute("data-streaming")).toBe(true);

    await screen.rerender(
      <Message from="assistant">
        <MessageContent>Two invoices are overdue.</MessageContent>
      </Message>,
    );
    expect(message("assistant").hasAttribute("aria-busy")).toBe(false);
    expect(message("assistant").hasAttribute("data-streaming")).toBe(false);
  });

  test("each part takes a ref, a class and other attributes", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      meta: createRef<HTMLDivElement>(),
      actions: createRef<HTMLDivElement>(),
      action: createRef<HTMLButtonElement>(),
      copy: createRef<HTMLButtonElement>(),
    };
    await render(
      <Message ref={refs.root} from="assistant" className="a" data-kind="a">
        <MessageMeta ref={refs.meta} className="b" data-kind="b">
          09:41
        </MessageMeta>
        <MessageContent ref={refs.content} className="c" data-kind="c">
          Done.
        </MessageContent>
        <MessageActions ref={refs.actions} className="d" data-kind="d">
          <MessageAction
            ref={refs.action}
            label="Try again"
            className="e"
            data-kind="e"
          >
            R
          </MessageAction>
          <MessageCopyAction
            ref={refs.copy}
            text="Done."
            className="f"
            data-kind="f"
          />
        </MessageActions>
      </Message>,
    );

    expect(refs.root.current?.className).toBe("nuv-message a");
    expect(refs.root.current?.dataset.kind).toBe("a");
    expect(refs.meta.current?.className).toBe("nuv-message__meta b");
    expect(refs.meta.current?.dataset.kind).toBe("b");
    expect(refs.content.current?.className).toBe("nuv-message__content c");
    expect(refs.content.current?.dataset.kind).toBe("c");
    expect(refs.actions.current?.className).toBe("nuv-message__actions d");
    expect(refs.actions.current?.dataset.kind).toBe("d");
    expect(refs.action.current?.className).toBe("nuv-message__action e");
    expect(refs.action.current?.dataset.kind).toBe("e");
    expect(refs.copy.current?.className).toBe("nuv-message__action f");
    expect(refs.copy.current?.dataset.kind).toBe("f");
  });
});

describe("what it says", () => {
  test("line breaks are kept", async () => {
    await render(
      <div style={{ width: 400 }}>
        <Message from="assistant">
          <MessageContent>{"One\nTwo\nThree"}</MessageContent>
        </Message>
      </div>,
    );

    expect(style(content("assistant")).whiteSpace).toBe("pre-wrap");
    // Three lines of 24px.
    expect(rect(content("assistant")).height).toBe(72);
  });

  test("a word longer than the row breaks, and the row is no wider for it", async () => {
    await render(
      <div data-testid="column" style={{ width: 200 }}>
        <Message from="assistant">
          <MessageContent>
            {`https://example.com/${"a".repeat(120)}`}
          </MessageContent>
        </Message>
        <Message from="user">
          <MessageContent>{"b".repeat(120)}</MessageContent>
        </Message>
      </div>,
    );
    const column = page.getByTestId("column").element();

    expect(column.scrollWidth).toBe(200);
    expect(rect(content("assistant")).width).toBeLessThanOrEqual(200);
    expect(rect(content("assistant")).height).toBeGreaterThan(48);
    expect(rect(content("user")).right).toBeLessThanOrEqual(rect(column).right);
  });

  test("the person's own takes 85% of the row at most", async () => {
    await render(
      <div style={{ width: 400 }}>
        <Message from="user">
          <MessageContent>{"word ".repeat(60)}</MessageContent>
        </Message>
      </div>,
    );

    expect(rect(content("user")).width).toBe(340);
  });

  test("a line of details is small and muted", async () => {
    await render(
      <Message from="assistant" label={null}>
        <MessageMeta>Northwind assistant · 09:41</MessageMeta>
        <MessageContent>Done.</MessageContent>
      </Message>,
    );
    const meta = document.querySelector(".nuv-message__meta") as HTMLElement;

    expect(style(meta).fontSize).toBe("12px");
    expect(style(meta).color).not.toBe(style(content("assistant")).color);
    expect(rect(meta).bottom).toBeLessThanOrEqual(
      rect(content("assistant")).top,
    );
  });
});

describe("actions", () => {
  function Actions({
    onRetry = () => {},
    onCopy,
    onCopyError,
  }: {
    onRetry?: () => void;
    onCopy?: (text: string) => void;
    onCopyError?: (error: unknown) => void;
  }) {
    return (
      <Message from="assistant">
        <MessageContent>Two invoices are overdue.</MessageContent>
        <MessageActions>
          <MessageCopyAction
            text="Two invoices are overdue."
            onCopy={onCopy}
            onCopyError={onCopyError}
          />
          <MessageAction label="Try again" onClick={onRetry}>
            <svg aria-hidden="true" width="16" height="16" />
          </MessageAction>
        </MessageActions>
      </Message>
    );
  }
  const copy = () => page.getByRole("button", { name: "Copy" });
  const status = () =>
    document.querySelector('.nuv-message__actions [role="status"]');

  test("they're a named group of buttons, each named by its label", async () => {
    const onRetry = vi.fn();
    await render(<Actions onRetry={onRetry} />);
    const group = page.getByRole("group", { name: "Message actions" });

    await expect.element(group).toBeVisible();
    expect(group.getByRole("button").elements().length).toBe(2);
    const retry = page.getByRole("button", { name: "Try again" });
    expect(retry.element().getAttribute("type")).toBe("button");
    await retry.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("the group's name is yours", async () => {
    await render(
      <MessageActions label="Aktionen">
        <MessageAction label="Nochmal">R</MessageAction>
      </MessageActions>,
    );

    await expect
      .element(page.getByRole("group", { name: "Aktionen" }))
      .toBeVisible();
  });

  test("a button's label is its tooltip, with focus from the keyboard as well", async () => {
    await render(<Actions />);

    await userEvent.tab();
    expect(document.activeElement).toBe(copy().element());
    await expect.element(page.getByRole("tooltip")).toHaveTextContent("Copy");

    await userEvent.tab();
    await expect
      .element(page.getByRole("tooltip"))
      .toHaveTextContent("Try again");
  });

  test("copying puts the text on the clipboard, shows a tick, and says so", async () => {
    const written = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const onCopy = vi.fn();
    await render(<Actions onCopy={onCopy} />);
    expect(status()?.textContent).toBe("");

    await copy().click();

    const copied = page.getByRole("button", { name: "Copied" });
    await expect.element(copied).toBeVisible();
    expect(written).toHaveBeenCalledWith("Two invoices are overdue.");
    expect(onCopy).toHaveBeenCalledWith("Two invoices are overdue.");
    expect(copied.element().hasAttribute("data-copied")).toBe(true);
    expect(status()?.textContent).toBe("Copied");
  });

  test("two seconds later it's the button to copy again", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    await render(<Actions />);
    await copy().click();
    await expect
      .element(page.getByRole("button", { name: "Copied" }))
      .toBeVisible();

    await expect.element(copy(), { timeout: 4000 }).toBeVisible();
    expect(copy().element().hasAttribute("data-copied")).toBe(false);
    expect(status()?.textContent).toBe("");
  });

  test("where the browser won't copy, you're told, and nothing is shown as copied", async () => {
    const refused = new Error("NotAllowedError");
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(refused);
    const onCopy = vi.fn();
    const onCopyError = vi.fn();
    await render(<Actions onCopy={onCopy} onCopyError={onCopyError} />);

    await copy().click();

    await expect.poll(() => onCopyError.mock.calls.length).toBe(1);
    expect(onCopyError).toHaveBeenCalledWith(refused);
    expect(onCopy).not.toHaveBeenCalled();
    await expect.element(copy()).toBeVisible();
    expect(status()?.textContent).toBe("");
  });

  test("the words for copying are yours, and a press you've handled copies nothing", async () => {
    const written = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const screen = await render(
      <MessageActions>
        <MessageCopyAction text="x" label="Kopieren" copiedLabel="Kopiert" />
      </MessageActions>,
    );
    await page.getByRole("button", { name: "Kopieren" }).click();
    await expect
      .element(page.getByRole("button", { name: "Kopiert" }))
      .toBeVisible();
    expect(written).toHaveBeenCalledTimes(1);

    await screen.rerender(
      <MessageActions>
        <MessageCopyAction
          key="other"
          text="x"
          onClick={(event) => event.preventDefault()}
        />
      </MessageActions>,
    );
    await copy().click();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(written).toHaveBeenCalledTimes(1);
    await expect.element(copy()).toBeVisible();
  });

  test("a disabled action can't be pressed, and is faded", async () => {
    const onClick = vi.fn();
    await render(
      <MessageActions>
        <MessageAction label="Try again" disabled onClick={onClick}>
          R
        </MessageAction>
      </MessageActions>,
    );
    const element = page.getByRole("button", { name: "Try again" }).element();

    (element as HTMLButtonElement).click();
    expect(onClick).not.toHaveBeenCalled();
    expect(Number(style(element).opacity)).toBeLessThan(1);
  });
});

describe("styles", () => {
  test("with a mouse an action is 32px square, 4px from the next", async () => {
    await setViewport("desktop");
    await render(
      <MessageActions>
        <MessageAction label="One">1</MessageAction>
        <MessageAction label="Two">2</MessageAction>
      </MessageActions>,
    );
    const one = rect(page.getByRole("button", { name: "One" }).element());
    const two = rect(page.getByRole("button", { name: "Two" }).element());

    expect(one.width).toBe(32);
    expect(one.height).toBe(32);
    expect(two.left - one.right).toBe(4);
  });

  test("an action shows a ring when it has focus from the keyboard", async () => {
    await render(
      <MessageActions>
        <MessageAction label="One">1</MessageAction>
      </MessageActions>,
    );

    await userEvent.tab();

    expect(style(document.activeElement as Element).outlineStyle).toBe("solid");
  });

  test("component variables change the colors, the sizes and the space", async () => {
    await render(
      <div
        style={
          {
            width: 400,
            "--nuv-message-fg": "rgb(1, 2, 3)",
            "--nuv-message-font-size": "20px",
            "--nuv-message-gap": "30px",
            "--nuv-message-meta-fg": "rgb(4, 5, 6)",
            "--nuv-message-user-bg": "rgb(7, 8, 9)",
            "--nuv-message-user-fg": "rgb(250, 250, 250)",
            "--nuv-message-user-max-width": "50%",
            "--nuv-message-user-radius": "3px",
            "--nuv-message-action-fg": "rgb(10, 11, 12)",
          } as never
        }
      >
        <Message from="user" avatar={<span data-testid="mine">AL</span>}>
          <MessageMeta>09:41</MessageMeta>
          <MessageContent>{"word ".repeat(60)}</MessageContent>
          <MessageActions>
            <MessageAction label="One">1</MessageAction>
          </MessageActions>
        </Message>
        <Message from="assistant">
          <MessageContent>Done.</MessageContent>
        </Message>
      </div>,
    );
    const mine = rect(page.getByTestId("mine").element());

    expect(style(content("assistant")).color).toBe("rgb(1, 2, 3)");
    expect(style(content("assistant")).fontSize).toBe("20px");
    expect(Math.round(mine.left - rect(content("user")).right)).toBe(30);
    expect(
      style(document.querySelector(".nuv-message__meta") as Element).color,
    ).toBe("rgb(4, 5, 6)");
    expect(style(content("user")).backgroundColor).toBe("rgb(7, 8, 9)");
    expect(style(content("user")).color).toBe("rgb(250, 250, 250)");
    expect(style(content("user")).borderTopLeftRadius).toBe("3px");
    // Half of the column beside the picture.
    expect(Math.round(rect(content("user")).width)).toBe(
      Math.round((400 - 30 - mine.width) / 2),
    );
    expect(
      style(page.getByRole("button", { name: "One" }).element()).color,
    ).toBe("rgb(10, 11, 12)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with a picture, a line of details and actions", async () => {
    const { container } = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 16, width: 360 }}>
        <Message from="user" avatar={<span>AL</span>}>
          <MessageMeta>Ada Lovelace · 09:41</MessageMeta>
          <MessageContent>Is the March report ready?</MessageContent>
        </Message>
        <Message from="assistant" streaming>
          <MessageContent>It is. Two invoices are overdue.</MessageContent>
          <MessageActions>
            <MessageCopyAction text="It is." />
            <MessageAction label="Try again">
              <svg aria-hidden="true" width="16" height="16" />
            </MessageAction>
          </MessageActions>
        </Message>
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  test("an action's icon and the small line can be seen", async () => {
    const { container } = await renderThemed(
      theme,
      <Message from="assistant">
        <MessageMeta>09:41</MessageMeta>
        <MessageContent>Done.</MessageContent>
        <MessageActions>
          <MessageAction label="One">1</MessageAction>
        </MessageActions>
      </Message>,
    );
    const ground = style(
      container.querySelector("main") as Element,
    ).backgroundColor;

    expect(
      contrast(
        style(page.getByRole("button", { name: "One" }).element()).color,
        ground,
      ),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast(
        style(document.querySelector(".nuv-message__meta") as Element).color,
        ground,
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

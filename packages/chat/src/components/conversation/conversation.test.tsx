import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef, type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationScrollButton,
  type ConversationState,
  useConversation,
} from ".";

// A conversation 300px tall with so many messages, each 80px tall, and
// something under the messages where a prompt box would be.
function Chat({
  count,
  height = 300,
  children,
}: {
  count: number;
  height?: number;
  children?: ReactNode;
}) {
  return (
    <Conversation data-testid="root" style={{ width: 320, height }}>
      <ConversationContent aria-label="Support">
        {Array.from({ length: count }, (_, index) => (
          <div
            // Messages are only ever added at the end.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            key={index}
            style={{ flex: "none", height: 80 }}
          >
            Message {index + 1}
          </div>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
      <div data-testid="under" style={{ flex: "none", height: 40 }}>
        {children}
      </div>
    </Conversation>
  );
}

const log = () => page.getByRole("log").element() as HTMLElement;
// How far the end of the messages is below what's in view.
const gap = () => {
  const box = log();
  return Math.round(box.scrollHeight - box.scrollTop - box.clientHeight);
};
const button = () =>
  page.getByRole("button", { name: "Go to the latest message" });
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

// Moves the messages the way a reader would, and waits for the box to
// have heard of it.
async function scrollTo(top: number) {
  log().scrollTop = top;
  await expect.poll(() => Math.round(log().scrollTop)).toBe(top);
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

describe("rendering", () => {
  test("the messages are a log that scrolls and can take focus, in a column with what's under them", async () => {
    await render(<Chat count={2} />);
    const root = page.getByTestId("root").element();

    expect(root.className).toBe("nuv-conversation");
    expect(log().className).toBe("nuv-conversation__viewport");
    expect(log().getAttribute("aria-label")).toBe("Support");
    expect(log().tabIndex).toBe(0);
    expect(log().firstElementChild?.className).toBe(
      "nuv-conversation__content",
    );
    expect(style(log()).overflowY).toBe("auto");
    // 300px less the 40px under the messages.
    expect(rect(log()).height).toBe(260);
    expect(rect(page.getByTestId("under").element()).bottom).toBe(
      rect(root).bottom,
    );
  });

  test("each part takes a ref, a class and other attributes", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      empty: createRef<HTMLDivElement>(),
    };
    await render(
      <Conversation ref={refs.root} className="a" data-kind="a">
        <ConversationContent
          ref={refs.content}
          className="b"
          data-kind="b"
          aria-label="Support"
        >
          <ConversationEmpty ref={refs.empty} className="c" data-kind="c">
            Nothing yet
          </ConversationEmpty>
        </ConversationContent>
      </Conversation>,
    );

    expect(refs.root.current?.className).toBe("nuv-conversation a");
    expect(refs.root.current?.dataset.kind).toBe("a");
    expect(refs.content.current).toBe(log());
    expect(refs.content.current?.className).toBe(
      "nuv-conversation__viewport b",
    );
    expect(refs.content.current?.dataset.kind).toBe("b");
    expect(refs.empty.current?.className).toBe("nuv-conversation__empty c");
    expect(refs.empty.current?.dataset.kind).toBe("c");
  });

  test("a part outside a conversation says so", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      render(<ConversationContent aria-label="Support" />),
    ).rejects.toThrow("ConversationContent has to be inside a Conversation.");
    await expect(render(<ConversationScrollButton />)).rejects.toThrow(
      "ConversationScrollButton has to be inside a Conversation.",
    );
    quiet.mockRestore();
  });
});

describe("following the latest message", () => {
  test("it starts at the end", async () => {
    await render(<Chat count={10} />);

    expect(log().scrollHeight).toBeGreaterThan(log().clientHeight);
    expect(gap()).toBe(0);
    await expect.element(button()).not.toBeInTheDocument();
  });

  test("a message added while the end is in view keeps the end in view", async () => {
    const screen = await render(<Chat count={10} />);

    await screen.rerender(<Chat count={11} />);
    await expect.poll(gap).toBe(0);
    await screen.rerender(<Chat count={14} />);
    await expect.poll(gap).toBe(0);
    // The newest is inside the box, not below its edge.
    expect(
      rect(page.getByText("Message 14").element()).bottom,
    ).toBeLessThanOrEqual(rect(log()).bottom);
  });

  test("once the reader scrolls up it stops, and a new message doesn't move what they're reading", async () => {
    const screen = await render(<Chat count={10} />);
    await scrollTo(100);
    await expect.element(button()).toBeVisible();

    await screen.rerender(<Chat count={12} />);
    await expect.element(page.getByText("Message 12")).toBeInTheDocument();
    // Long enough for the box to have moved, if it were going to.
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(Math.round(log().scrollTop)).toBe(100);
    expect(gap()).toBeGreaterThan(160);
  });

  test("scrolled back to the end, it follows again", async () => {
    const screen = await render(<Chat count={10} />);
    await scrollTo(100);
    await expect.element(button()).toBeVisible();

    await scrollTo(log().scrollHeight - log().clientHeight);
    await expect.element(button()).not.toBeInTheDocument();
    await screen.rerender(<Chat count={12} />);

    await expect.poll(gap).toBe(0);
  });

  test("back at the end and a message added before the browser has told of the scroll, it follows", async () => {
    const screen = await render(<Chat count={10} />);
    await scrollTo(100);
    await expect.element(button()).toBeVisible();

    // No wait between the two: the scroll event comes after the message.
    log().scrollTop = log().scrollHeight - log().clientHeight;
    await screen.rerender(<Chat count={12} />);

    await expect.poll(gap).toBe(0);
    await expect.element(button()).not.toBeInTheDocument();
  });

  test("scrolled up and a message added before the browser has told of the scroll, the reader is left there", async () => {
    const screen = await render(<Chat count={10} />);
    await expect.poll(gap).toBe(0);

    // No wait between the two: the scroll event comes after the message.
    log().scrollTop = 100;
    await screen.rerender(<Chat count={12} />);

    expect(Math.round(log().scrollTop)).toBe(100);
    await expect.element(button()).toBeVisible();
    // And through the messages after it.
    await screen.rerender(<Chat count={14} />);
    expect(Math.round(log().scrollTop)).toBe(100);
  });

  test("a little short of the end still counts as the end", async () => {
    const screen = await render(<Chat count={10} />);
    await scrollTo(log().scrollHeight - log().clientHeight - 20);

    await expect.element(button()).not.toBeInTheDocument();
    await screen.rerender(<Chat count={11} />);
    await expect.poll(gap).toBe(0);
  });

  test("when the box gets shorter, as when a keyboard opens, the end stays in view", async () => {
    const screen = await render(<Chat count={10} />);

    await screen.rerender(<Chat count={10} height={200} />);

    await expect.poll(() => rect(log()).height).toBe(160);
    await expect.poll(gap).toBe(0);
  });

  test("messages that fit need no scrolling, and there's no button", async () => {
    await render(<Chat count={2} />);

    expect(log().scrollHeight).toBe(log().clientHeight);
    await expect.element(button()).not.toBeInTheDocument();
  });
});

describe("the button to the latest message", () => {
  test("is only there while the end is out of view, and a press goes to the end", async () => {
    await render(<Chat count={10} />);
    await scrollTo(0);

    await button().click();

    await expect.poll(gap, { timeout: 3000 }).toBe(0);
    await expect.element(button()).not.toBeInTheDocument();
    // Focus was on the button, which is gone. It's on the messages.
    expect(document.activeElement).toBe(log());
  });

  test("after a press it follows new messages again", async () => {
    const screen = await render(<Chat count={10} />);
    await scrollTo(0);
    await button().click();
    await expect.poll(gap, { timeout: 3000 }).toBe(0);

    await screen.rerender(<Chat count={12} />);

    await expect.poll(gap).toBe(0);
  });

  test("it sits over the end of the messages and takes no room in the column", async () => {
    await render(<Chat count={10} />);
    const without = rect(log()).height;
    await scrollTo(0);
    await expect.element(button()).toBeVisible();
    const box = rect(button().element());
    const messages = rect(log());

    // The messages are as tall with it as without it.
    expect(messages.height).toBe(without);
    expect(box.bottom).toBeLessThanOrEqual(messages.bottom);
    expect(box.top).toBeGreaterThan(messages.top);
    // 12px above their end, and in the middle.
    expect(Math.round(messages.bottom - box.bottom)).toBe(12);
    expect(
      Math.abs(box.left + box.width / 2 - (messages.left + messages.width / 2)),
    ).toBeLessThanOrEqual(1);
    // And clear of what's under the messages.
    expect(box.bottom).toBeLessThanOrEqual(
      rect(page.getByTestId("under").element()).top,
    );
  });

  test("its name and what's drawn in it are yours, and it takes a ref and a class", async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(
      <Conversation style={{ width: 320, height: 200 }}>
        <ConversationContent aria-label="Support">
          <div style={{ flex: "none", height: 900 }}>Long</div>
        </ConversationContent>
        <ConversationScrollButton
          ref={ref}
          label="Zum Ende"
          className="mine"
          data-kind="end"
        >
          <span data-testid="own">v</span>
        </ConversationScrollButton>
      </Conversation>,
    );
    await scrollTo(0);
    const own = page.getByRole("button", { name: "Zum Ende" });

    await expect.element(own).toBeVisible();
    expect(ref.current).toBe(own.element());
    expect(ref.current?.className).toBe("nuv-conversation__scroll-button mine");
    expect(ref.current?.dataset.kind).toBe("end");
    expect(ref.current?.getAttribute("type")).toBe("button");
    await expect.element(page.getByTestId("own")).toBeVisible();
    expect(ref.current?.querySelector("svg")).toBe(null);
  });

  test("a press you've handled yourself goes nowhere", async () => {
    await render(
      <Conversation style={{ width: 320, height: 200 }}>
        <ConversationContent aria-label="Support">
          <div style={{ flex: "none", height: 900 }}>Long</div>
        </ConversationContent>
        <ConversationScrollButton onClick={(event) => event.preventDefault()} />
      </Conversation>,
    );
    await scrollTo(0);

    await button().click();
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(Math.round(log().scrollTop)).toBe(0);
  });

  test("it's reached with Tab after the messages, and Enter presses it", async () => {
    await render(<Chat count={10} />);
    await scrollTo(0);
    // The button is drawn a moment after the scroll is heard of. Tab
    // pressed before that finds nothing after the messages.
    await expect.element(button()).toBeVisible();

    log().focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(button().element());
    await userEvent.keyboard("{Enter}");

    await expect.poll(gap, { timeout: 3000 }).toBe(0);
  });
});

describe("from a part of your own", () => {
  test("useConversation says whether the end is in view, and goes there", async () => {
    let state: ConversationState | undefined;
    function Probe() {
      state = useConversation();
      return <output data-testid="at">{String(state.atBottom)}</output>;
    }
    await render(
      <Chat count={10}>
        <Probe />
      </Chat>,
    );
    await expect.element(page.getByTestId("at")).toHaveTextContent("true");

    await scrollTo(0);
    await expect.element(page.getByTestId("at")).toHaveTextContent("false");

    state?.scrollToBottom({ behavior: "auto" });
    await expect.poll(gap).toBe(0);
    await expect.element(page.getByTestId("at")).toHaveTextContent("true");
  });

  test("outside a conversation it says so", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    function Probe() {
      useConversation();
      return null;
    }

    await expect(render(<Probe />)).rejects.toThrow(
      "useConversation has to be used inside a Conversation.",
    );
    quiet.mockRestore();
  });
});

describe("before any message", () => {
  test("what's shown sits in the middle of the room the messages would take", async () => {
    await render(
      <Conversation style={{ width: 320, height: 300 }}>
        <ConversationContent aria-label="Support">
          <ConversationEmpty>
            <p data-testid="hello" style={{ margin: 0 }}>
              Hello
            </p>
          </ConversationEmpty>
        </ConversationContent>
      </Conversation>,
    );
    const box = rect(log());
    const hello = rect(page.getByTestId("hello").element());

    expect(
      Math.abs(box.top + box.height / 2 - (hello.top + hello.height / 2)),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(box.left + box.width / 2 - (hello.left + hello.width / 2)),
    ).toBeLessThanOrEqual(1);
    expect(log().scrollHeight).toBe(log().clientHeight);
  });
});

describe("styles", () => {
  test("messages are 24px apart with 16px around them, and no wider than 48rem", async () => {
    await setViewport("desktop");
    await render(
      <Conversation style={{ width: 1000, height: 300 }}>
        <ConversationContent aria-label="Support">
          <div data-testid="one" style={{ flex: "none", height: 40 }}>
            One
          </div>
          <div data-testid="two" style={{ flex: "none", height: 40 }}>
            Two
          </div>
        </ConversationContent>
      </Conversation>,
    );
    const one = rect(page.getByTestId("one").element());
    const two = rect(page.getByTestId("two").element());

    expect(two.top - one.bottom).toBe(24);
    expect(one.top - rect(log()).top).toBe(16);
    // 48rem less the space on both sides, in the middle of the box.
    expect(one.width).toBe(768 - 32);
    expect(Math.round(one.left - rect(log()).left)).toBe((1000 - 768) / 2 + 16);
  });

  test("with a mouse the button is 36px and round, with an edge", async () => {
    await setViewport("desktop");
    await render(<Chat count={10} />);
    await scrollTo(0);
    await expect.element(button()).toBeVisible();
    const element = button().element();

    expect(rect(element).width).toBe(36);
    expect(rect(element).height).toBe(36);
    expect(
      Number.parseFloat(style(element).borderTopLeftRadius),
    ).toBeGreaterThan(17);
    expect(style(element).borderTopStyle).toBe("solid");
  });

  test("the messages and the button show a ring when they have focus from the keyboard", async () => {
    await render(<Chat count={10} />);
    await scrollTo(0);

    await userEvent.tab();
    expect(document.activeElement).toBe(log());
    expect(style(log()).outlineStyle).toBe("solid");
    await userEvent.tab();
    expect(style(button().element()).outlineStyle).toBe("solid");
  });

  test("component variables change the spacing, the width and the button", async () => {
    await setViewport("desktop");
    await render(
      <div
        style={
          {
            "--nuv-conversation-fg": "rgb(1, 2, 3)",
            "--nuv-conversation-gap": "10px",
            "--nuv-conversation-padding": "8px",
            "--nuv-conversation-max-width": "200px",
            "--nuv-conversation-scroll-button-bg": "rgb(4, 5, 6)",
            "--nuv-conversation-scroll-button-fg": "rgb(7, 8, 9)",
            "--nuv-conversation-scroll-button-border": "rgb(10, 11, 12)",
            "--nuv-conversation-scroll-button-offset": "20px",
            "--nuv-conversation-scroll-button-size": "50px",
          } as never
        }
      >
        <Conversation data-testid="root" style={{ width: 400, height: 200 }}>
          <ConversationContent aria-label="Support">
            <div data-testid="one" style={{ flex: "none", height: 300 }}>
              One
            </div>
            <div data-testid="two" style={{ flex: "none", height: 300 }}>
              Two
            </div>
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>,
    );
    await scrollTo(0);
    await expect.element(button()).toBeVisible();
    const one = rect(page.getByTestId("one").element());
    const element = button().element();

    expect(style(page.getByTestId("root").element()).color).toBe(
      "rgb(1, 2, 3)",
    );
    expect(one.width).toBe(200 - 16);
    expect(one.top - rect(log()).top).toBe(8);
    expect(rect(page.getByTestId("two").element()).top - one.bottom).toBe(10);
    expect(rect(element).width).toBe(50);
    expect(rect(element).height).toBe(50);
    expect(Math.round(rect(log()).bottom - rect(element).bottom)).toBe(20);
    expect(style(element).backgroundColor).toBe("rgb(4, 5, 6)");
    expect(style(element).color).toBe("rgb(7, 8, 9)");
    expect(style(element).borderTopColor).toBe("rgb(10, 11, 12)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with messages out of view and the button showing", async () => {
    const { container } = await renderThemed(theme, <Chat count={10} />);
    await scrollTo(0);
    await expect.element(button()).toBeVisible();

    expect(await axe(container)).toHaveNoViolations();
  });
});

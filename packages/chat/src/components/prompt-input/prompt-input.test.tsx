import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { Button } from "@nuvui/react/button";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Conversation, ConversationContent } from "../conversation";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from ".";

type BoxProps = ComponentProps<typeof PromptInput> & {
  field?: ComponentProps<typeof PromptInputTextarea>;
  submit?: ComponentProps<typeof PromptInputSubmit>;
};

function Box({ field, submit, ...props }: BoxProps) {
  return (
    <PromptInput data-testid="box" style={{ width: 320 }} {...props}>
      <PromptInputTextarea
        aria-label="Message"
        placeholder="Ask anything"
        {...field}
      />
      <PromptInputToolbar>
        <PromptInputTools>
          {/* The library's own button: the browser's is too faint in
              WebKit's dark themes to pass axe. */}
          <Button type="button" intent="ghost" size="sm">
            Attach
          </Button>
        </PromptInputTools>
        <PromptInputSubmit {...submit} />
      </PromptInputToolbar>
    </PromptInput>
  );
}

const box = () => page.getByTestId("box").element() as HTMLFormElement;
const field = () =>
  page
    .getByRole("textbox", { name: "Message" })
    .element() as HTMLTextAreaElement;
const send = () => page.getByRole("button", { name: "Send" });
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element, pseudo?: string) =>
  getComputedStyle(element, pseudo);

async function type(text: string) {
  field().focus();
  await userEvent.keyboard(text);
}

describe("rendering", () => {
  test("it's a form with a field a line tall, and a row under it with the button to send at its end", async () => {
    await render(<Box />);

    expect(box().tagName).toBe("FORM");
    expect(box().className).toBe("nuv-prompt-input");
    expect(field().tagName).toBe("TEXTAREA");
    expect(field().rows).toBe(1);
    expect(field().placeholder).toBe("Ask anything");
    expect(send().element().getAttribute("type")).toBe("submit");
    const row = rect(
      document.querySelector(".nuv-prompt-input__toolbar") as Element,
    );
    expect(row.top).toBeGreaterThanOrEqual(rect(field()).bottom);
    expect(rect(send().element()).right).toBe(row.right);
    expect(
      rect(page.getByRole("button", { name: "Attach" }).element()).left,
    ).toBe(row.left);
  });

  test("alone in its row, the button to send is still at the end", async () => {
    await render(
      <PromptInput data-testid="box" style={{ width: 320 }}>
        <PromptInputTextarea aria-label="Message" />
        <PromptInputToolbar>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>,
    );
    const row = rect(
      document.querySelector(".nuv-prompt-input__toolbar") as Element,
    );

    expect(rect(send().element()).right).toBe(row.right);
  });

  test("each part takes a ref, a class and other attributes", async () => {
    const refs = {
      box: createRef<HTMLFormElement>(),
      field: createRef<HTMLTextAreaElement>(),
      row: createRef<HTMLDivElement>(),
      tools: createRef<HTMLDivElement>(),
      submit: createRef<HTMLButtonElement>(),
    };
    await render(
      <PromptInput ref={refs.box} className="a" data-kind="a">
        <PromptInputTextarea
          ref={refs.field}
          aria-label="Message"
          className="b"
          data-kind="b"
          name="prompt"
        />
        <PromptInputToolbar ref={refs.row} className="c" data-kind="c">
          <PromptInputTools ref={refs.tools} className="d" data-kind="d" />
          <PromptInputSubmit ref={refs.submit} className="e" data-kind="e" />
        </PromptInputToolbar>
      </PromptInput>,
    );

    expect(refs.box.current?.className).toBe("nuv-prompt-input a");
    expect(refs.box.current?.dataset.kind).toBe("a");
    expect(refs.field.current?.className).toBe("nuv-prompt-input__textarea b");
    expect(refs.field.current?.dataset.kind).toBe("b");
    expect(refs.field.current?.name).toBe("prompt");
    expect(refs.row.current?.className).toBe("nuv-prompt-input__toolbar c");
    expect(refs.row.current?.dataset.kind).toBe("c");
    expect(refs.tools.current?.className).toBe("nuv-prompt-input__tools d");
    expect(refs.tools.current?.dataset.kind).toBe("d");
    expect(refs.submit.current?.className).toBe("nuv-prompt-input__submit e");
    expect(refs.submit.current?.dataset.kind).toBe("e");
  });

  test("a part outside the box says so", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      render(<PromptInputTextarea aria-label="Message" />),
    ).rejects.toThrow("PromptInputTextarea has to be inside a PromptInput.");
    await expect(render(<PromptInputSubmit />)).rejects.toThrow(
      "PromptInputSubmit has to be inside a PromptInput.",
    );
    quiet.mockRestore();
  });
});

describe("sending", () => {
  test("Enter sends what's typed, empties the box, and leaves focus in the field", async () => {
    const onSubmit = vi.fn();
    await render(<Box onSubmit={onSubmit} />);

    await type("Who hasn't paid?{Enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toBe("Who hasn't paid?");
    expect(field().value).toBe("");
    expect(document.activeElement).toBe(field());
  });

  test("Shift with Enter starts a new line, and both lines are sent", async () => {
    const onSubmit = vi.fn();
    await render(<Box onSubmit={onSubmit} />);

    await type("One{Shift>}{Enter}{/Shift}Two");
    expect(field().value).toBe("One\nTwo");
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.keyboard("{Enter}");
    expect(onSubmit.mock.calls[0]?.[0]).toBe("One\nTwo");
  });

  test("the button sends as well, and puts focus back in the field", async () => {
    const onSubmit = vi.fn();
    await render(<Box onSubmit={onSubmit} />);
    await type("Hello");

    await send().click();

    expect(onSubmit.mock.calls[0]?.[0]).toBe("Hello");
    expect(field().value).toBe("");
    expect(document.activeElement).toBe(field());
  });

  test("nothing, or only spaces, isn't sent, and stays as it was", async () => {
    const onSubmit = vi.fn();
    await render(<Box onSubmit={onSubmit} />);

    await type("{Enter}");
    await type("   {Enter}");
    await send().click({ force: true });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(field().value).toBe("   ");
  });

  test("Enter that picks a word from an input method's list doesn't send", async () => {
    const onSubmit = vi.fn();
    await render(<Box onSubmit={onSubmit} defaultValue="こんにちは" />);

    field().dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    expect(field().value).toBe("こんにちは");
  });

  test("Enter with Control, Alt or Meta is left alone", async () => {
    const onSubmit = vi.fn();
    await render(<Box onSubmit={onSubmit} defaultValue="Hello" />);
    field().focus();

    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    await userEvent.keyboard("{Alt>}{Enter}{/Alt}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("with submitOnEnter off, Enter starts a new line and the button sends", async () => {
    const onSubmit = vi.fn();
    await render(<Box onSubmit={onSubmit} field={{ submitOnEnter: false }} />);

    await type("One{Enter}Two");
    expect(field().value).toBe("One\nTwo");
    expect(onSubmit).not.toHaveBeenCalled();

    await send().click();
    expect(onSubmit.mock.calls[0]?.[0]).toBe("One\nTwo");
  });

  test("a key you've handled yourself doesn't send", async () => {
    const onSubmit = vi.fn();
    await render(
      <Box
        onSubmit={onSubmit}
        field={{ onKeyDown: (event) => event.preventDefault() }}
        defaultValue="Hello"
      />,
    );
    field().focus();

    await userEvent.keyboard("{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("sending never loads the page again, with or without a handler", async () => {
    const left = vi.fn();
    window.addEventListener("beforeunload", left);
    await render(<Box defaultValue="Hello" />);
    field().focus();

    await userEvent.keyboard("{Enter}");

    expect(left).not.toHaveBeenCalled();
    expect(field().value).toBe("");
    window.removeEventListener("beforeunload", left);
  });
});

describe("the button to send", () => {
  test("with nothing to send it's marked as disabled and stays in the tab order", async () => {
    await render(<Box />);
    const button = send().element() as HTMLButtonElement;

    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.disabled).toBe(false);
    expect(Number(style(button).opacity)).toBeLessThan(1);
    field().focus();
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
  });

  test("with something to send it isn't", async () => {
    await render(<Box />);

    await type("Hello");

    expect(send().element().hasAttribute("aria-disabled")).toBe(false);
    expect(style(send().element()).opacity).toBe("1");
  });

  test("its name and what's drawn in it are yours", async () => {
    await render(
      <Box submit={{ label: "Senden", children: <span>Go</span> }} />,
    );
    const button = page.getByRole("button", { name: "Senden" });

    await expect.element(button).toBeVisible();
    expect(button.element().textContent).toBe("Go");
    expect(button.element().querySelector("svg")).toBe(null);
  });
});

describe("keeping the text", () => {
  test("it starts with defaultValue when it's kept here", async () => {
    await render(<Box defaultValue="A draft" />);

    expect(field().value).toBe("A draft");
    expect(send().element().hasAttribute("aria-disabled")).toBe(false);
  });

  test("when you keep it, you're told what's typed, and told it's empty after a send", async () => {
    const changes: string[] = [];
    const onSubmit = vi.fn();
    function Kept() {
      const [text, setText] = useState("");
      return (
        <Box
          value={text}
          onValueChange={(next) => {
            changes.push(next);
            setText(next);
          }}
          onSubmit={onSubmit}
        />
      );
    }
    await render(<Kept />);

    await type("Hi{Enter}");

    expect(changes).toEqual(["H", "Hi", ""]);
    expect(onSubmit.mock.calls[0]?.[0]).toBe("Hi");
    expect(field().value).toBe("");
  });

  test("when you keep it and don't change it, it doesn't change", async () => {
    await render(<Box value="Fixed" onValueChange={() => {}} />);

    await type("x");

    expect(field().value).toBe("Fixed");
  });

  test("text put in from outside can be sent", async () => {
    const onSubmit = vi.fn();
    function Suggested() {
      const [text, setText] = useState("");
      return (
        <>
          <button type="button" onClick={() => setText("Draft a reminder")}>
            Suggest
          </button>
          <Box value={text} onValueChange={setText} onSubmit={onSubmit} />
        </>
      );
    }
    await render(<Suggested />);

    await page.getByRole("button", { name: "Suggest" }).click();
    expect(field().value).toBe("Draft a reminder");
    await send().click();

    expect(onSubmit.mock.calls[0]?.[0]).toBe("Draft a reminder");
  });

  test("your own onChange on the field is called as well", async () => {
    const onChange = vi.fn();
    await render(<Box field={{ onChange }} />);

    await type("ab");

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(field().value).toBe("ab");
  });
});

describe("while a reply is on its way", () => {
  test("nothing is sent, and what's typed is kept", async () => {
    const onSubmit = vi.fn();
    await render(<Box busy onSubmit={onSubmit} />);

    await type("Next question{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(field().value).toBe("Next question");
    expect(field().disabled).toBe(false);
    expect(box().hasAttribute("data-busy")).toBe(true);
  });

  test("without onStop the button is the one to send, marked as disabled", async () => {
    await render(<Box busy defaultValue="Next" />);

    expect(send().element().getAttribute("aria-disabled")).toBe("true");
    expect(send().element().getAttribute("type")).toBe("submit");
  });

  test("with onStop the button stops, and isn't the kind that sends", async () => {
    const onStop = vi.fn();
    const onSubmit = vi.fn();
    await render(
      <Box busy onStop={onStop} onSubmit={onSubmit} defaultValue="Next" />,
    );
    const stop = page.getByRole("button", { name: "Stop" });

    expect(stop.element().getAttribute("type")).toBe("button");
    expect(stop.element().hasAttribute("aria-disabled")).toBe(false);
    expect(stop.element().hasAttribute("data-stop")).toBe(true);
    await stop.click();

    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("the press that stops doesn't go on to send what's waiting in the field", async () => {
    // Stopping makes the button the one that sends again before the
    // press is over.
    const onSubmit = vi.fn();
    function Replying() {
      const [busy, setBusy] = useState(true);
      return (
        <Box
          busy={busy}
          onStop={() => setBusy(false)}
          onSubmit={onSubmit}
          defaultValue="Next question"
        />
      );
    }
    await render(<Replying />);

    await page.getByRole("button", { name: "Stop" }).click();

    await expect.element(send()).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(field().value).toBe("Next question");
  });

  test("when it's over, what was typed meanwhile can be sent", async () => {
    const onSubmit = vi.fn();
    const screen = await render(<Box busy onSubmit={onSubmit} />);
    await type("Next question");

    await screen.rerender(<Box onSubmit={onSubmit} />);
    await userEvent.keyboard("{Enter}");

    expect(onSubmit.mock.calls[0]?.[0]).toBe("Next question");
  });

  test("the name of the button that stops is yours", async () => {
    await render(
      <Box busy onStop={() => {}} submit={{ stopLabel: "Anhalten" }} />,
    );

    await expect
      .element(page.getByRole("button", { name: "Anhalten" }))
      .toBeVisible();
  });
});

describe("disabled", () => {
  test("nothing can be typed or sent, and the box is faded", async () => {
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    await render(
      <Box
        disabled
        busy
        onStop={onStop}
        onSubmit={onSubmit}
        defaultValue="Hello"
      />,
    );

    expect(field().disabled).toBe(true);
    expect(box().hasAttribute("data-disabled")).toBe(true);
    expect(Number(style(box()).opacity)).toBeLessThan(1);
    // Not the button that stops either.
    expect(send().element().getAttribute("aria-disabled")).toBe("true");
    await send().click({ force: true });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onStop).not.toHaveBeenCalled();
  });

  test("the field alone can be disabled", async () => {
    await render(<Box field={{ disabled: true }} />);

    expect(field().disabled).toBe(true);
    expect(box().hasAttribute("data-disabled")).toBe(false);
  });
});

describe("growing", () => {
  test("the field gets taller with each line, and shorter again", async () => {
    await setViewport("desktop");
    await render(<Box />);
    const one = rect(field()).height;

    await type("One{Shift>}{Enter}{/Shift}Two{Shift>}{Enter}{/Shift}Three");
    // 14px text on a 20px line.
    expect(rect(field()).height).toBe(one + 40);
    expect(field().scrollHeight).toBe(field().clientHeight);

    await userEvent.clear(page.getByRole("textbox", { name: "Message" }));
    expect(rect(field()).height).toBe(one);
  });

  test("it stops at 12rem and scrolls after that", async () => {
    await render(<Box defaultValue={"line\n".repeat(40)} />);

    expect(rect(field()).height).toBe(192);
    expect(field().scrollHeight).toBeGreaterThan(field().clientHeight);
    expect(style(field()).overflowY).toBe("auto");
  });

  test("text put in from outside is measured too", async () => {
    const screen = await render(<Box value="" onValueChange={() => {}} />);
    const one = rect(field()).height;

    await screen.rerender(
      <Box value={"One\nTwo\nThree"} onValueChange={() => {}} />,
    );

    expect(rect(field()).height).toBeGreaterThan(one + 30);
  });

  test("the field can't be dragged to another size", async () => {
    await render(<Box />);

    expect(style(field()).resize).toBe("none");
  });
});

describe("a press on the box", () => {
  test("on its edge or between its buttons puts the caret in the field", async () => {
    await render(<Box />);
    const row = document.querySelector(
      ".nuv-prompt-input__toolbar",
    ) as HTMLElement;

    await userEvent.click(row, { position: { x: 150, y: 10 } });

    expect(document.activeElement).toBe(field());
  });

  test("on a button in the row presses the button, and leaves focus on it", async () => {
    await render(<Box />);
    const attach = page.getByRole("button", { name: "Attach" });

    await attach.click();

    expect(document.activeElement).toBe(attach.element());
  });

  test("that you've handled yourself is left alone", async () => {
    await render(<Box onClick={(event) => event.preventDefault()} />);
    const row = document.querySelector(
      ".nuv-prompt-input__toolbar",
    ) as HTMLElement;

    await userEvent.click(row, { position: { x: 150, y: 10 } });

    expect(document.activeElement).not.toBe(field());
  });
});

describe("in a conversation", () => {
  test("sending goes to the latest message, wherever the reader was", async () => {
    await render(
      <Conversation style={{ width: 320, height: 300 }}>
        <ConversationContent aria-label="Support">
          <div style={{ flex: "none", height: 900 }}>Long</div>
        </ConversationContent>
        <Box defaultValue="Hello" />
      </Conversation>,
    );
    const log = page.getByRole("log").element();
    log.scrollTop = 0;
    await expect.poll(() => log.scrollTop).toBe(0);

    field().focus();
    await userEvent.keyboard("{Enter}");

    await expect
      .poll(() =>
        Math.round(log.scrollHeight - log.scrollTop - log.clientHeight),
      )
      .toBe(0);
  });

  test("it takes its own height and leaves the rest to the messages", async () => {
    await render(
      <Conversation style={{ width: 320, height: 300 }}>
        <ConversationContent aria-label="Support">
          <div style={{ flex: "none", height: 900 }}>Long</div>
        </ConversationContent>
        <Box />
      </Conversation>,
    );
    const log = rect(page.getByRole("log").element());

    expect(Math.round(log.height + rect(box()).height)).toBe(300);
    expect(rect(box()).top).toBe(log.bottom);
  });
});

describe("styles", () => {
  test("the frame is the box's, and the field has none of its own", async () => {
    await render(<Box />);

    expect(style(box()).borderTopStyle).toBe("solid");
    expect(Number.parseFloat(style(box()).borderTopLeftRadius)).toBeGreaterThan(
      8,
    );
    expect(style(field()).borderTopWidth).toBe("0px");
    expect(style(field()).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("with focus from the keyboard in the field, the ring goes round the whole box", async () => {
    await render(<Box />);
    expect(style(box()).outlineStyle).toBe("none");

    await userEvent.tab();

    expect(document.activeElement).toBe(field());
    expect(style(box()).outlineStyle).toBe("solid");
    expect(style(field()).outlineStyle).toBe("none");
  });

  test("with a mouse the text is 14px and the button to send 36px and round", async () => {
    await setViewport("desktop");
    await render(<Box />);
    const button = send().element();

    expect(style(field()).fontSize).toBe("14px");
    expect(rect(button).width).toBe(36);
    expect(rect(button).height).toBe(36);
    expect(
      Number.parseFloat(style(button).borderTopLeftRadius),
    ).toBeGreaterThan(17);
  });

  test("the button to send shows a ring when it has focus from the keyboard", async () => {
    await render(<Box defaultValue="Hello" />);

    field().focus();
    await userEvent.tab();
    await userEvent.tab();

    expect(document.activeElement).toBe(send().element());
    expect(style(send().element()).outlineStyle).toBe("solid");
  });

  test("component variables change the frame, the text, the height and the button", async () => {
    await setViewport("desktop");
    await render(
      <div
        style={
          {
            "--nuv-prompt-input-bg": "rgb(1, 2, 3)",
            "--nuv-prompt-input-fg": "rgb(250, 250, 250)",
            "--nuv-prompt-input-border": "rgb(4, 5, 6)",
            "--nuv-prompt-input-radius": "3px",
            "--nuv-prompt-input-font-size": "18px",
            "--nuv-prompt-input-max-height": "60px",
            "--nuv-prompt-input-placeholder": "rgb(200, 201, 202)",
            "--nuv-prompt-input-submit-bg": "rgb(7, 8, 9)",
            "--nuv-prompt-input-submit-fg": "rgb(10, 11, 12)",
          } as never
        }
      >
        <Box defaultValue={"line\n".repeat(20)} />
      </div>,
    );

    expect(style(box()).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style(field()).color).toBe("rgb(250, 250, 250)");
    expect(style(box()).borderTopColor).toBe("rgb(4, 5, 6)");
    expect(style(box()).borderTopLeftRadius).toBe("3px");
    expect(style(field()).fontSize).toBe("18px");
    expect(rect(field()).height).toBe(60);
    expect(style(field(), "::placeholder").color).toBe("rgb(200, 201, 202)");
    expect(style(send().element()).backgroundColor).toBe("rgb(7, 8, 9)");
    expect(style(send().element()).color).toBe("rgb(10, 11, 12)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe empty, with text, and while it stops a reply", async () => {
    const { container } = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 16 }}>
        <Box />
        <Box
          data-testid="other"
          field={{ "aria-label": "Second message" }}
          defaultValue="Who hasn't paid?"
        />
        <Box
          data-testid="third"
          busy
          onStop={() => {}}
          field={{ "aria-label": "Third message" }}
        />
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  test("the frame, the placeholder and the button's arrow can be seen", async () => {
    const { container } = await renderThemed(theme, <Box defaultValue="Hi" />);
    const ground = style(
      container.querySelector("main") as Element,
    ).backgroundColor;
    const button = style(send().element());

    expect(
      contrast(style(box()).borderTopColor, ground),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast(
        style(field(), "::placeholder").color,
        style(box()).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(button.color, button.backgroundColor),
    ).toBeGreaterThanOrEqual(3);
    expect(contrast(button.backgroundColor, ground)).toBeGreaterThanOrEqual(3);
  });
});

import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  ToolCall,
  ToolCallApproval,
  ToolCallContent,
  ToolCallError,
  ToolCallInput,
  ToolCallOutput,
  type ToolCallStatus,
  ToolCallTrigger,
} from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const one = (selector: string) =>
  document.querySelector(selector) as HTMLElement;
const trigger = () => one(".nuv-tool-call__trigger") as HTMLButtonElement;

type CardProps = Partial<ComponentProps<typeof ToolCall>> & {
  approval?: Partial<ComponentProps<typeof ToolCallApproval>>;
};

function Card({ approval, status = "done", ...props }: CardProps) {
  return (
    <div style={{ width: 360 }}>
      <ToolCall status={status} {...props}>
        <ToolCallTrigger>Search invoices</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput value={{ status: "overdue" }} />
          <ToolCallOutput value="Two found." />
        </ToolCallContent>
        <ToolCallApproval {...approval}>Search the invoices?</ToolCallApproval>
      </ToolCall>
    </div>
  );
}

describe("the card", () => {
  test("its top line is a button named by the tool and where the call stands", async () => {
    await render(<Card />);

    expect(one(".nuv-tool-call").dataset.status).toBe("done");
    expect(trigger().getAttribute("type")).toBe("button");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    await expect
      .element(page.getByRole("button", { name: "Search invoices Done" }))
      .toBeVisible();
    // The icon is for the eye. The words say the same.
    expect(one(".nuv-tool-call__icon").getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(rect(trigger()).width).toBe(rect(one(".nuv-tool-call")).width - 2);
    expect(rect(trigger()).height).toBeGreaterThanOrEqual(44);
  });

  test.each([
    ["running", "Running"],
    ["approval", "Needs approval"],
    ["done", "Done"],
    ["error", "Failed"],
    ["denied", "Denied"],
  ] as const)("a call that's %s says %s", async (status, words) => {
    await render(<Card status={status} />);

    expect(one(".nuv-tool-call__status").textContent).toBe(words);
    expect(one(".nuv-tool-call").dataset.status).toBe(status);
    // Only a call that's running turns.
    expect(one(".nuv-tool-call__icon").querySelector(".nuv-spinner")).toEqual(
      status === "running" ? expect.anything() : null,
    );
  });

  test("statusLabel changes the words", async () => {
    await render(
      <ToolCall status="done">
        <ToolCallTrigger statusLabel="Done in 2 seconds">
          Search
        </ToolCallTrigger>
      </ToolCall>,
    );

    expect(one(".nuv-tool-call__status").textContent).toBe("Done in 2 seconds");
  });

  test("a press opens it, and the keyboard does too", async () => {
    const onOpenChange = vi.fn();
    await render(<Card onOpenChange={onOpenChange} />);
    expect(document.querySelector(".nuv-tool-call__body")).toBeNull();

    await userEvent.click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(one(".nuv-tool-call__body")).not.toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await expect
      .poll(() => document.querySelector(".nuv-tool-call__body"))
      .toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test("a part outside a card says so", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      render(<ToolCallTrigger>Search</ToolCallTrigger>),
    ).rejects.toThrow("ToolCallTrigger has to be inside a ToolCall.");
    await expect(
      render(<ToolCallApproval>Search?</ToolCallApproval>),
    ).rejects.toThrow("ToolCallApproval has to be inside a ToolCall.");
    quiet.mockRestore();
  });

  test("each part takes a ref, a class and other attributes", async () => {
    const refs = {
      card: createRef<HTMLDivElement>(),
      trigger: createRef<HTMLButtonElement>(),
      content: createRef<HTMLDivElement>(),
      input: createRef<HTMLDivElement>(),
      error: createRef<HTMLDivElement>(),
      approval: createRef<HTMLDivElement>(),
    };
    await render(
      <ToolCall ref={refs.card} status="approval" defaultOpen className="a">
        <ToolCallTrigger ref={refs.trigger} className="b" data-kind="b">
          Search
        </ToolCallTrigger>
        <ToolCallContent ref={refs.content} className="c">
          <ToolCallInput ref={refs.input} className="d" value="x" />
          <ToolCallError ref={refs.error} className="e">
            No.
          </ToolCallError>
        </ToolCallContent>
        <ToolCallApproval ref={refs.approval} className="f">
          Search?
        </ToolCallApproval>
      </ToolCall>,
    );

    expect(refs.card.current?.className).toContain("nuv-tool-call a");
    expect(refs.trigger.current?.className).toContain(
      "nuv-tool-call__trigger b",
    );
    expect(refs.trigger.current?.dataset.kind).toBe("b");
    expect(refs.content.current?.className).toBe("nuv-tool-call__body c");
    expect(refs.input.current?.className).toBe("nuv-tool-call__section d");
    expect(refs.error.current?.className).toBe("nuv-tool-call__section e");
    expect(refs.approval.current?.className).toBe("nuv-tool-call__approval f");
  });
});

describe("what was asked and what came back", () => {
  test("text is shown as it is, and anything else as indented JSON", async () => {
    await render(<Card defaultOpen />);
    const asked = page.getByRole("group", { name: "Request" }).element();
    const answered = page.getByRole("group", { name: "Result" }).element();

    expect(asked.textContent).toBe('{\n  "status": "overdue"\n}');
    expect(answered.textContent).toBe("Two found.");
    expect(
      asked.closest(".nuv-tool-call__section")?.getAttribute("data-kind"),
    ).toBe("input");
    expect(
      answered.closest(".nuv-tool-call__section")?.getAttribute("data-kind"),
    ).toBe("output");
  });

  test("something JSON can't write is still shown", async () => {
    const loop: Record<string, unknown> = {};
    loop.self = loop;
    await render(
      <ToolCall status="done" defaultOpen>
        <ToolCallTrigger>Search</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput value={loop} />
          <ToolCallOutput value={undefined} />
        </ToolCallContent>
      </ToolCall>,
    );

    expect(
      page.getByRole("group", { name: "Request" }).element().textContent,
    ).toBe("[object Object]");
    expect(
      page.getByRole("group", { name: "Result" }).element().textContent,
    ).toBe("undefined");
  });

  test("the heading is yours, and children take the place of the value", async () => {
    await render(
      <ToolCall status="done" defaultOpen>
        <ToolCallTrigger>Search</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallOutput label="Rows">
            <table data-testid="mine">
              <tbody>
                <tr>
                  <td>INV-1042</td>
                </tr>
              </tbody>
            </table>
          </ToolCallOutput>
        </ToolCallContent>
      </ToolCall>,
    );

    expect(one(".nuv-tool-call__label").textContent).toBe("Rows");
    expect(document.querySelector(".nuv-tool-call__code")).toBeNull();
    await expect.element(page.getByTestId("mine")).toBeVisible();
  });

  test("a long answer scrolls inside its box, which the keyboard can reach, and long lines wrap", async () => {
    await render(
      <div style={{ width: 300 }}>
        <ToolCall status="done" defaultOpen>
          <ToolCallTrigger>Search</ToolCallTrigger>
          <ToolCallContent>
            <ToolCallOutput
              value={`${"line\n".repeat(60)}${"x".repeat(400)}`}
            />
          </ToolCallContent>
        </ToolCall>
      </div>,
    );
    const box = page.getByRole("group", { name: "Result" }).element();

    expect(rect(box).height).toBe(256);
    expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
    expect(box.scrollWidth).toBe(box.clientWidth);
    expect(box.getAttribute("tabindex")).toBe("0");
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(box);
    expect(style(box).outlineStyle).toBe("solid");
  });

  test("what went wrong is under its own heading", async () => {
    await render(
      <ToolCall status="error" defaultOpen>
        <ToolCallTrigger>Read the bank feed</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallError>The bank didn't answer.</ToolCallError>
        </ToolCallContent>
      </ToolCall>,
    );
    const section = one('.nuv-tool-call__section[data-kind="error"]');

    expect(section.querySelector(".nuv-tool-call__label")?.textContent).toBe(
      "Error",
    );
    expect(one(".nuv-tool-call__error").textContent).toBe(
      "The bank didn't answer.",
    );
    expect(style(one(".nuv-tool-call__error")).color).not.toBe(
      style(one(".nuv-tool-call__label")).color,
    );
  });
});

describe("asking first", () => {
  const group = () => page.getByRole("group", { name: "Approval" });

  test("the question and its buttons are drawn only while the call waits, with the card closed", async () => {
    const screen = await render(<Card status="approval" />);

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    await expect.element(group()).toBeVisible();
    expect(one(".nuv-tool-call__question").textContent).toBe(
      "Search the invoices?",
    );
    expect(group().getByRole("button").elements()).toHaveLength(2);

    for (const status of ["running", "done", "error", "denied"] as const) {
      await screen.rerender(<Card status={status} />);
      expect(document.querySelector(".nuv-tool-call__approval")).toBeNull();
    }
  });

  test("each button calls its own handler, and neither sends a form", async () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    await render(
      <form onSubmit={onSubmit as never}>
        <Card status="approval" approval={{ onApprove, onDeny }} />
      </form>,
    );

    await group().getByRole("button", { name: "Approve" }).click();
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onDeny).not.toHaveBeenCalled();

    await group().getByRole("button", { name: "Deny" }).click();
    expect(onDeny).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("when the buttons go, focus is on the card's top line and not dropped", async () => {
    function Live() {
      const [status, setStatus] = useState<ToolCallStatus>("approval");
      return (
        <Card
          status={status}
          approval={{
            onApprove: () => setStatus("running"),
            onDeny: () => setStatus("denied"),
          }}
        />
      );
    }
    await render(<Live />);

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe("Approve");
    await userEvent.keyboard("{Enter}");

    expect(one(".nuv-tool-call__status").textContent).toBe("Running");
    expect(document.querySelector(".nuv-tool-call__approval")).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  test("the words on the buttons and the group's name are yours", async () => {
    await render(
      <Card
        status="approval"
        approval={{
          approveLabel: "Erlauben",
          denyLabel: "Ablehnen",
          label: "Freigabe",
        }}
      />,
    );
    const named = page.getByRole("group", { name: "Freigabe" });

    await expect
      .element(named.getByRole("button", { name: "Erlauben" }))
      .toBeVisible();
    await expect
      .element(named.getByRole("button", { name: "Ablehnen" }))
      .toBeVisible();
  });

  test("in a narrow card the buttons go under the question, inside the card", async () => {
    await render(
      <div style={{ width: 220 }}>
        <ToolCall status="approval">
          <ToolCallTrigger>Send a reminder</ToolCallTrigger>
          <ToolCallApproval>
            Send a reminder for INV-1042 to Contoso?
          </ToolCallApproval>
        </ToolCall>
      </div>,
    );
    const card = rect(one(".nuv-tool-call"));
    const question = rect(one(".nuv-tool-call__question"));
    const choices = rect(one(".nuv-tool-call__choices"));

    expect(choices.top).toBeGreaterThanOrEqual(question.bottom);
    expect(choices.right).toBeLessThanOrEqual(card.right);
    expect(choices.left).toBeGreaterThanOrEqual(card.left);
  });
});

describe("styles", () => {
  test("component variables change the card", async () => {
    await render(
      <div
        style={
          {
            "--nuv-tool-call-bg": "rgb(1, 2, 3)",
            "--nuv-tool-call-fg": "rgb(250, 250, 250)",
            "--nuv-tool-call-border": "rgb(4, 5, 6)",
            "--nuv-tool-call-radius": "3px",
            "--nuv-tool-call-status-fg": "rgb(7, 8, 9)",
            "--nuv-tool-call-label-fg": "rgb(10, 11, 12)",
            "--nuv-tool-call-code-bg": "rgb(13, 14, 15)",
            "--nuv-tool-call-code-fg": "rgb(16, 17, 18)",
            "--nuv-tool-call-code-max-height": "40px",
          } as never
        }
      >
        <ToolCall status="done" defaultOpen>
          <ToolCallTrigger>Search</ToolCallTrigger>
          <ToolCallContent>
            <ToolCallOutput value={"line\n".repeat(20)} />
          </ToolCallContent>
        </ToolCall>
      </div>,
    );
    const card = one(".nuv-tool-call");
    const code = one(".nuv-tool-call__code");

    expect(style(card).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style(card).color).toBe("rgb(250, 250, 250)");
    expect(style(card).borderTopColor).toBe("rgb(4, 5, 6)");
    expect(style(card).borderTopLeftRadius).toBe("3px");
    expect(style(one(".nuv-tool-call__status")).color).toBe("rgb(7, 8, 9)");
    expect(style(one(".nuv-tool-call__label")).color).toBe("rgb(10, 11, 12)");
    expect(style(code).backgroundColor).toBe("rgb(13, 14, 15)");
    expect(style(code).color).toBe("rgb(16, 17, 18)");
    expect(rect(code).height).toBe(40);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe in every state, closed and open", async () => {
    const { container } = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 16 }}>
        <Card status="running" />
        <Card status="approval" />
        <Card status="done" defaultOpen />
        <Card status="denied" />
        <ToolCall status="error" defaultOpen>
          <ToolCallTrigger>Read the bank feed</ToolCallTrigger>
          <ToolCallContent>
            <ToolCallError>The bank didn't answer.</ToolCallError>
          </ToolCallContent>
        </ToolCall>
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  test("the status, a heading, the code and what went wrong can be read", async () => {
    await renderThemed(
      theme,
      <ToolCall status="error" defaultOpen>
        <ToolCallTrigger>Read the bank feed</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput value={{ account: "Operating" }} />
          <ToolCallError>The bank didn't answer.</ToolCallError>
        </ToolCallContent>
      </ToolCall>,
    );
    const ground = style(one(".nuv-tool-call")).backgroundColor;
    const code = style(one(".nuv-tool-call__code"));

    expect(
      contrast(style(one(".nuv-tool-call__label")).color, ground),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(style(one(".nuv-tool-call__error")).color, ground),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrast(code.color, code.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
    // The icon of a call that failed is a shape, which needs 3:1.
    expect(
      contrast(style(one(".nuv-tool-call__icon")).color, ground),
    ).toBeGreaterThanOrEqual(3);
  });
});

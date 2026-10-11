import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Reasoning,
  ReasoningContent,
  ReasoningStep,
  ReasoningSteps,
  ReasoningTrigger,
} from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const one = (selector: string) =>
  document.querySelector(selector) as HTMLElement;
const trigger = () => one(".nuv-reasoning__trigger") as HTMLButtonElement;
const expanded = () => trigger().getAttribute("aria-expanded");
const steps = () => page.getByRole("listitem").elements();

type StepsProps = ComponentProps<typeof Reasoning> & { words?: string };

function Steps({ words, ...props }: StepsProps) {
  return (
    <div style={{ width: 360 }}>
      <Reasoning {...props}>
        <ReasoningTrigger>{words}</ReasoningTrigger>
        <ReasoningContent>
          <ReasoningSteps>
            <ReasoningStep label="Looked up the invoices">
              Two are late.
            </ReasoningStep>
            <ReasoningStep label="Checked the terms" status="active" />
          </ReasoningSteps>
        </ReasoningContent>
      </Reasoning>
    </div>
  );
}

describe("opening", () => {
  test("it starts closed, and a press opens it", async () => {
    const onOpenChange = vi.fn();
    await render(<Steps onOpenChange={onOpenChange} />);

    expect(trigger().getAttribute("type")).toBe("button");
    expect(trigger().textContent).toBe("Reasoning");
    expect(expanded()).toBe("false");
    expect(steps()).toHaveLength(0);

    await userEvent.click(trigger());

    expect(expanded()).toBe("true");
    expect(steps()).toHaveLength(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  test("Enter and Space open and close it", async () => {
    await render(<Steps />);

    await userEvent.tab();
    expect(document.activeElement).toBe(trigger());
    expect(style(trigger()).outlineStyle).toBe("solid");
    await userEvent.keyboard("{Enter}");
    expect(expanded()).toBe("true");
    await userEvent.keyboard(" ");
    expect(expanded()).toBe("false");
  });

  test("defaultOpen starts it open, and what the line says is yours", async () => {
    await render(<Steps defaultOpen words="Thought for 6 seconds" />);

    expect(expanded()).toBe("true");
    expect(trigger().textContent).toBe("Thought for 6 seconds");
  });

  test("the trigger outside a Reasoning says so", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(render(<ReasoningTrigger />)).rejects.toThrow(
      "ReasoningTrigger has to be inside a Reasoning.",
    );
    quiet.mockRestore();
  });
});

describe("while the assistant works", () => {
  test("it's open, says Thinking in text that shimmers, and closes when it's done", async () => {
    const screen = await render(<Steps streaming />);

    expect(expanded()).toBe("true");
    expect(trigger().textContent).toBe("Thinking");
    expect(trigger().querySelector(".nuv-text-shimmer")).not.toBeNull();
    expect(one(".nuv-reasoning").hasAttribute("data-streaming")).toBe(true);

    await screen.rerender(<Steps streaming={false} />);

    await expect.poll(expanded).toBe("false");
    expect(trigger().textContent).toBe("Reasoning");
    expect(trigger().querySelector(".nuv-text-shimmer")).toBeNull();
    expect(one(".nuv-reasoning").hasAttribute("data-streaming")).toBe(false);
  });

  test("it opens when the assistant starts, having been closed", async () => {
    const screen = await render(<Steps />);
    expect(expanded()).toBe("false");

    await screen.rerender(<Steps streaming />);

    await expect.poll(expanded).toBe("true");
  });

  test("closed by the reader meanwhile, it isn't opened again", async () => {
    const screen = await render(<Steps streaming />);

    await userEvent.click(trigger());
    expect(expanded()).toBe("false");
    await screen.rerender(<Steps streaming={false} />);
    await screen.rerender(<Steps streaming />);

    // Long enough for an effect to have opened it, if one were going to.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(expanded()).toBe("false");
  });

  test("opened again by the reader meanwhile, it stays open when it's done", async () => {
    const screen = await render(<Steps streaming />);

    await userEvent.click(trigger());
    await userEvent.click(trigger());
    expect(expanded()).toBe("true");
    await screen.rerender(<Steps streaming={false} />);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(expanded()).toBe("true");
  });

  test("when you keep whether it's open, you're asked and it's yours to say", async () => {
    const onOpenChange = vi.fn();
    const screen = await render(
      <Steps open={false} onOpenChange={onOpenChange} />,
    );

    await screen.rerender(
      <Steps open={false} streaming onOpenChange={onOpenChange} />,
    );

    await expect.poll(() => onOpenChange.mock.calls.length).toBe(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(expanded()).toBe("false");
  });
});

describe("steps", () => {
  test("are an ordered list, and the one being taken is the current step with a spinner", async () => {
    await render(<Steps defaultOpen />);
    const [done, active] = steps();

    expect(page.getByRole("list").element().tagName).toBe("OL");
    expect(done?.dataset.status).toBe("done");
    expect(done?.hasAttribute("aria-current")).toBe(false);
    expect(done?.querySelector(".nuv-reasoning__label")?.textContent).toBe(
      "Looked up the invoices",
    );
    expect(done?.querySelector(".nuv-reasoning__detail")?.textContent).toBe(
      "Two are late.",
    );
    expect(done?.querySelector(".nuv-spinner")).toBeNull();
    expect(active?.dataset.status).toBe("active");
    expect(active?.getAttribute("aria-current")).toBe("step");
    expect(active?.querySelector(".nuv-spinner")).not.toBeNull();
    // A step with nothing more to say has no second line.
    expect(active?.querySelector(".nuv-reasoning__detail")).toBeNull();
    for (const step of [done, active]) {
      expect(
        step
          ?.querySelector(".nuv-reasoning__marker")
          ?.getAttribute("aria-hidden"),
      ).toBe("true");
    }
  });

  test("text goes in as well as steps, and long words wrap", async () => {
    await render(
      <div data-testid="box" style={{ width: 200 }}>
        <Reasoning defaultOpen>
          <ReasoningTrigger />
          <ReasoningContent>{"a".repeat(200)}</ReasoningContent>
        </Reasoning>
      </div>,
    );
    const body = one(".nuv-reasoning__body");

    expect(rect(body).right).toBeLessThanOrEqual(
      rect(page.getByTestId("box").element()).right,
    );
    expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
    // A line down its side sets it apart from the reply.
    expect(style(body).borderInlineStartStyle).toBe("solid");
  });

  test("each part takes a ref, a class and other attributes", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      trigger: createRef<HTMLButtonElement>(),
      content: createRef<HTMLDivElement>(),
      steps: createRef<HTMLOListElement>(),
      step: createRef<HTMLLIElement>(),
    };
    await render(
      <Reasoning ref={refs.root} defaultOpen className="a">
        <ReasoningTrigger ref={refs.trigger} className="b" data-kind="b" />
        <ReasoningContent ref={refs.content} className="c">
          <ReasoningSteps ref={refs.steps} className="d">
            <ReasoningStep ref={refs.step} label="One" className="e" />
          </ReasoningSteps>
        </ReasoningContent>
      </Reasoning>,
    );

    expect(refs.root.current?.className).toContain("nuv-reasoning a");
    expect(refs.trigger.current?.className).toContain(
      "nuv-reasoning__trigger b",
    );
    expect(refs.trigger.current?.dataset.kind).toBe("b");
    expect(refs.content.current?.className).toBe("nuv-reasoning__body c");
    expect(refs.steps.current?.className).toBe("nuv-reasoning__steps d");
    expect(refs.step.current?.className).toBe("nuv-reasoning__step e");
  });
});

describe("styles", () => {
  test("with a mouse the line is 32px tall", async () => {
    await setViewport("desktop");
    await render(<Steps />);

    expect(rect(trigger()).height).toBe(32);
  });

  test("component variables change the colors", async () => {
    await render(
      <div
        style={
          {
            "--nuv-reasoning-trigger-fg": "rgb(1, 2, 3)",
            "--nuv-reasoning-fg": "rgb(4, 5, 6)",
            "--nuv-reasoning-label-fg": "rgb(7, 8, 9)",
            "--nuv-reasoning-line": "rgb(10, 11, 12)",
          } as never
        }
      >
        <Steps defaultOpen />
      </div>,
    );

    expect(style(trigger()).color).toBe("rgb(1, 2, 3)");
    expect(style(one(".nuv-reasoning__detail")).color).toBe("rgb(4, 5, 6)");
    expect(style(one(".nuv-reasoning__label")).color).toBe("rgb(7, 8, 9)");
    expect(style(one(".nuv-reasoning__body")).borderInlineStartColor).toBe(
      "rgb(10, 11, 12)",
    );
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe closed, open, and while the assistant works", async () => {
    const { container } = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 16 }}>
        <Steps />
        <Steps defaultOpen words="Thought for 6 seconds" />
        <Steps streaming />
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  test("the line and a step's detail can be read", async () => {
    const { container } = await renderThemed(theme, <Steps defaultOpen />);
    const ground = style(
      container.querySelector("main") as Element,
    ).backgroundColor;

    expect(contrast(style(trigger()).color, ground)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(
      contrast(style(one(".nuv-reasoning__detail")).color, ground),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

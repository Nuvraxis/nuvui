import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  hitAt,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const row = { display: "flex", gap: 8, alignItems: "center" };

function Plans(props: ComponentProps<typeof RadioGroup>) {
  return (
    <div style={{ padding: 40 }}>
      <RadioGroup aria-label="Plan" {...props}>
        <div style={row}>
          <RadioGroupItem value="free" id="free" />
          <label htmlFor="free">Free</label>
        </div>
        <div style={row}>
          <RadioGroupItem value="team" id="team" />
          <label htmlFor="team">Team</label>
        </div>
        <div style={row}>
          <RadioGroupItem value="company" id="company" disabled />
          <label htmlFor="company">Company</label>
        </div>
      </RadioGroup>
    </div>
  );
}

const group = () => page.getByRole("radiogroup", { name: "Plan" });
const radio = (name: string) => page.getByRole("radio", { name });
const box = (name: string) => radio(name).element().getBoundingClientRect();
const style = (name: string) => getComputedStyle(radio(name).element());

// Radix picks the option that an arrow key moves focus to, and it moves
// focus a moment after the key goes down. A key that's let go of in the same
// instant, as a scripted press is, has gone before the focus arrives. A
// finger holds it longer than that.
async function arrow(key: "ArrowDown" | "ArrowLeft") {
  await userEvent.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await userEvent.keyboard(`{/${key}}`);
}

describe("rendering", () => {
  test("starts with nothing picked, and a click picks one", async () => {
    await render(<Plans />);

    await expect.element(radio("Free")).not.toBeChecked();
    await radio("Team").click();
    await expect.element(radio("Team")).toBeChecked();

    await radio("Free").click();
    await expect.element(radio("Free")).toBeChecked();
    await expect.element(radio("Team")).not.toBeChecked();
  });

  test("a click on a label picks its option", async () => {
    await render(<Plans />);

    await page.getByText("Team").click();

    await expect.element(radio("Team")).toBeChecked();
  });

  test("the picked option has a dot and the others don't", async () => {
    await render(<Plans defaultValue="team" />);
    const dot = (name: string) =>
      radio(name).element().querySelector(".nuv-radio-group__dot");

    expect(dot("Team")).not.toBeNull();
    expect(dot("Free")).toBeNull();
    expect(dot("Team")?.getBoundingClientRect().width).toBe(18);
  });

  test("can be controlled", async () => {
    const onValueChange = vi.fn();
    await render(<Plans value="free" onValueChange={onValueChange} />);

    await radio("Team").click();

    expect(onValueChange).toHaveBeenCalledWith("team");
    await expect.element(radio("Free")).toBeChecked();
  });

  test("submits with a form", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Plans name="plan" defaultValue="team" />
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();

    expect(submitted?.get("plan")).toBe("team");
  });

  test("required blocks the form until one is picked", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Plans name="plan" required />
      </form>,
    );
    const form = group().element().closest("form");

    await expect.element(group()).toHaveAttribute("aria-required", "true");
    form?.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();

    await radio("Free").click();
    form?.requestSubmit();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test("forwards refs and keeps class names", async () => {
    const root = createRef<HTMLDivElement>();
    const item = createRef<HTMLButtonElement>();
    await render(
      <RadioGroup ref={root} className="mine" aria-label="Plan">
        <RadioGroupItem
          ref={item}
          value="free"
          aria-label="Free"
          className="yours"
        />
      </RadioGroup>,
    );

    expect(root.current?.className).toBe("nuv-radio-group mine");
    expect(item.current?.className).toBe("nuv-radio-group__item yours");
  });
});

describe("keyboard", () => {
  test("Tab enters the group once, and the arrow keys move and pick", async () => {
    await render(
      <>
        <Plans />
        <button type="button">Next</button>
      </>,
    );

    await userEvent.keyboard("{Tab}");
    await expect.element(radio("Free")).toHaveFocus();

    await arrow("ArrowDown");
    await expect.element(radio("Team")).toHaveFocus();
    await expect.element(radio("Team")).toBeChecked();

    // The disabled one is skipped, so it wraps around to the first.
    await arrow("ArrowDown");
    await expect.element(radio("Free")).toBeChecked();

    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("button", { name: "Next" }))
      .toHaveFocus();
  });

  test("Space picks the option that has focus", async () => {
    await render(<Plans />);

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard(" ");

    await expect.element(radio("Free")).toBeChecked();
  });

  test("the left and right arrows swap in a right-to-left group", async () => {
    await render(<Plans dir="rtl" defaultValue="free" />);

    await userEvent.keyboard("{Tab}");
    await arrow("ArrowLeft");

    await expect.element(radio("Team")).toBeChecked();
  });

  test("a disabled group is skipped", async () => {
    await render(
      <>
        <Plans disabled />
        <button type="button">Next</button>
      </>,
    );

    await userEvent.keyboard("{Tab}");

    await expect
      .element(page.getByRole("button", { name: "Next" }))
      .toHaveFocus();
    await expect.element(radio("Free")).toBeDisabled();
  });
});

describe("styles", () => {
  test("options are 20px circles, one per row", async () => {
    await render(<Plans />);

    expect(box("Free").width).toBe(20);
    expect(box("Free").height).toBe(20);
    expect(style("Free").borderRadius).not.toBe("0px");
    expect(box("Team").left).toBe(box("Free").left);
    // 12px apart with a mouse. A touch screen gets more.
    expect(box("Team").top - box("Free").bottom).toBe(12);
  });

  test("a horizontal group puts them side by side", async () => {
    await render(<Plans orientation="horizontal" />);

    expect(box("Team").top).toBe(box("Free").top);
    expect(box("Team").left).toBeGreaterThan(box("Free").right);
  });

  test("a horizontal group starts from the right in a right-to-left layout", async () => {
    await render(<Plans orientation="horizontal" dir="rtl" />);

    expect(box("Team").right).toBeLessThan(box("Free").left);
  });

  test("fills with the primary color when picked", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Plans defaultValue="team" />);

    expect(style("Team").backgroundColor).not.toBe(
      style("Free").backgroundColor,
    );
    expect(style("Team").borderTopColor).toBe(style("Team").backgroundColor);
  });

  test("shows a focus ring for keyboard focus", async () => {
    await render(<Plans />);

    await userEvent.keyboard("{Tab}");

    expect(style("Free").outlineStyle).toBe("solid");
  });

  test("a disabled option fades", async () => {
    await render(<Plans />);

    expect(style("Company").opacity).toBe("0.5");
    expect(style("Company").cursor).toBe("not-allowed");
  });

  test("the tap area doesn't reach past the circle with a mouse", async () => {
    await render(<Plans />);
    const element = radio("Free").element();

    expect(hitAt(element, 0, -18)).not.toBe(element);
  });

  test("variables change the size and the gap", async () => {
    await render(
      <Plans
        style={
          {
            "--nuv-radio-group-size": "32px",
            "--nuv-radio-group-gap": "40px",
          } as never
        }
      />,
    );

    expect(box("Free").width).toBe(32);
    expect(box("Team").top - box("Free").bottom).toBe(40);
  });

  test("only animates when motion is fine", async () => {
    await render(<Plans />);

    await emulateMedia({ reducedMotion: "no-preference" });
    expect(style("Free").transitionDuration).not.toBe("0s");
    await emulateMedia({ reducedMotion: "reduce" });
    expect(style("Free").transitionDuration).toBe("0s");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with one picked and one disabled", async () => {
    const screen = await renderThemed(
      theme,
      <RadioGroup aria-label="Plan" defaultValue="team">
        <div style={row}>
          <RadioGroupItem value="free" id="a" />
          <label htmlFor="a">Free</label>
        </div>
        <div style={row}>
          <RadioGroupItem value="team" id="b" />
          <label htmlFor="b">Team</label>
        </div>
        <div style={row}>
          <RadioGroupItem value="company" id="c" disabled />
          <label htmlFor="c">Company</label>
        </div>
      </RadioGroup>,
    );

    await expectNoViolations(screen.container);
  });

  // axe has no rule for a control's edge, or for a mark that isn't text.
  test("the circle, the fill and the dot can be seen", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(
      theme,
      <RadioGroup aria-label="Plan" defaultValue="team">
        <RadioGroupItem value="free" aria-label="Free" />
        <RadioGroupItem value="team" aria-label="Team" />
      </RadioGroup>,
    );
    const pageColor = getComputedStyle(
      screen.container.firstElementChild as Element,
    ).backgroundColor;

    expect(
      contrast(style("Free").borderTopColor, pageColor),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast(style("Team").backgroundColor, pageColor),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast(style("Team").color, style("Team").backgroundColor),
    ).toBeGreaterThanOrEqual(3);
  });
});

import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "@nuvui/tooling/test/themed";
import { Component, createRef, type ReactNode, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { RadioGroup } from "../radio-group";
import {
  CheckboxCard,
  type CheckboxCardProps,
  ChoiceCardDescription,
  ChoiceCardTitle,
  RadioCard,
} from "./choice-card";

function Audit(props: CheckboxCardProps) {
  return (
    <CheckboxCard {...props}>
      <ChoiceCardTitle>Audit log</ChoiceCardTitle>
      <ChoiceCardDescription>
        Who changed what, kept for a year.
      </ChoiceCardDescription>
    </CheckboxCard>
  );
}

function Plans({ disabled = false }: { disabled?: boolean }) {
  return (
    <RadioGroup aria-label="Plan" defaultValue="team" disabled={disabled}>
      <RadioCard value="starter">
        <ChoiceCardTitle>Starter</ChoiceCardTitle>
        <ChoiceCardDescription>Up to 5 people.</ChoiceCardDescription>
      </RadioCard>
      <RadioCard value="team">
        <ChoiceCardTitle>Team</ChoiceCardTitle>
        <ChoiceCardDescription>Up to 50 people.</ChoiceCardDescription>
      </RadioCard>
      <RadioCard value="enterprise">
        <ChoiceCardTitle>Enterprise</ChoiceCardTitle>
      </RadioCard>
    </RadioGroup>
  );
}

const checkbox = (name = "Audit log") =>
  page.getByRole("checkbox", { name, exact: true });
const radio = (name: string) => page.getByRole("radio", { name, exact: true });
const card = (control: Element) =>
  control.closest(".nuv-choice-card") as Element;
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();

// Radix picks the option that an arrow key moves focus to, and it moves
// focus a moment after the key goes down. A key that's let go of in the same
// instant, as a scripted press is, has gone before the focus arrives.
async function arrow(key: "ArrowDown" | "ArrowUp") {
  await userEvent.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await userEvent.keyboard(`{/${key}}`);
}

describe("a checkbox card", () => {
  test("is a label around a checkbox, named by its title and described by its description", async () => {
    await render(<Audit />);
    const control = checkbox().element();

    expect(card(control).tagName).toBe("LABEL");
    expect(card(control).className).toBe("nuv-choice-card");
    expect(control.className).toBe("nuv-checkbox nuv-choice-card__control");
    await expect
      .element(checkbox())
      .toHaveAccessibleDescription("Who changed what, kept for a year.");
  });

  test("with no title, it's named by everything in the card", async () => {
    await render(<CheckboxCard>Send me the weekly digest</CheckboxCard>);
    const control = page.getByRole("checkbox", {
      name: "Send me the weekly digest",
    });

    await expect.element(control).toBeVisible();
    expect(control.element().hasAttribute("aria-labelledby")).toBe(false);
    expect(control.element().hasAttribute("aria-describedby")).toBe(false);
  });

  test("a description that comes and goes is pointed at only while it's there", async () => {
    function Example({ described }: { described: boolean }) {
      return (
        <CheckboxCard>
          <ChoiceCardTitle>Audit log</ChoiceCardTitle>
          {described ? (
            <ChoiceCardDescription>Kept for a year.</ChoiceCardDescription>
          ) : null}
        </CheckboxCard>
      );
    }
    const screen = await render(<Example described={false} />);
    await expect.element(checkbox()).toBeVisible();
    expect(checkbox().element().hasAttribute("aria-describedby")).toBe(false);

    await screen.rerender(<Example described />);
    await expect
      .element(checkbox())
      .toHaveAccessibleDescription("Kept for a year.");

    await screen.rerender(<Example described={false} />);
    await expect.element(checkbox()).toHaveAccessibleDescription("");
  });

  test("pressing anywhere on the card ticks it", async () => {
    const onCheckedChange = vi.fn();
    await render(<Audit onCheckedChange={onCheckedChange} />);

    await page.getByText("Who changed what, kept for a year.").click();
    await expect.element(checkbox()).toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);

    await page.getByText("Audit log", { exact: true }).click();
    await expect.element(checkbox()).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
  });

  test("Space ticks it from the keyboard", async () => {
    await render(<Audit />);

    await userEvent.tab();
    await expect.element(checkbox()).toHaveFocus();
    await userEvent.keyboard(" ");

    await expect.element(checkbox()).toBeChecked();
  });

  test("two cards have two sets of ids", async () => {
    await render(
      <>
        <Audit />
        <CheckboxCard>
          <ChoiceCardTitle>Single sign-on</ChoiceCardTitle>
          <ChoiceCardDescription>Through your provider.</ChoiceCardDescription>
        </CheckboxCard>
      </>,
    );

    await expect
      .element(checkbox("Single sign-on"))
      .toHaveAccessibleDescription("Through your provider.");
    await expect
      .element(checkbox("Audit log"))
      .toHaveAccessibleDescription("Who changed what, kept for a year.");
    expect(
      new Set(
        [...document.querySelectorAll("[id]")].map((element) => element.id),
      ).size,
    ).toBe(document.querySelectorAll("[id]").length);
  });

  test("the class name goes on the card, and everything else on the checkbox", async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(
      <CheckboxCard ref={ref} className="mine" id="audit" data-thing="yes">
        <ChoiceCardTitle>Audit log</ChoiceCardTitle>
      </CheckboxCard>,
    );

    expect(ref.current).toBe(checkbox().element());
    expect(ref.current?.id).toBe("audit");
    expect(ref.current?.dataset.thing).toBe("yes");
    expect(card(checkbox().element()).className).toBe("nuv-choice-card mine");
  });

  test("controlled, it shows what it's given", async () => {
    function Controlled() {
      const [checked, setChecked] = useState(true);
      return (
        <>
          <Audit
            checked={checked}
            onCheckedChange={(next) => setChecked(next === true)}
          />
          <output>{String(checked)}</output>
        </>
      );
    }
    await render(<Controlled />);
    await expect.element(checkbox()).toBeChecked();

    await checkbox().click();
    await expect.element(page.getByRole("status")).toHaveTextContent("false");
    await expect.element(checkbox()).not.toBeChecked();
  });

  test("with a name, it's submitted when it's ticked", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Audit name="audit" defaultChecked />
        <CheckboxCard name="sso">
          <ChoiceCardTitle>Single sign-on</ChoiceCardTitle>
        </CheckboxCard>
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();

    expect([...(submitted?.keys() ?? [])]).toEqual(["audit"]);
  });

  test("a disabled card can't be pressed, and fades as a whole", async () => {
    const onCheckedChange = vi.fn();
    await render(<Audit disabled onCheckedChange={onCheckedChange} />);

    await expect.element(checkbox()).toBeDisabled();
    (
      page.getByText("Audit log", { exact: true }).element() as HTMLElement
    ).click();
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(Number(style(card(checkbox().element())).opacity)).toBeLessThan(1);
    // Once, not twice: the checkbox doesn't fade again inside the card.
    expect(style(checkbox().element()).opacity).toBe("1");
    expect(style(card(checkbox().element())).cursor).toBe("not-allowed");
  });
});

describe("radio cards", () => {
  test("are radio buttons in the group, each named by its title", async () => {
    await render(<Plans />);

    await expect
      .element(page.getByRole("radiogroup", { name: "Plan" }))
      .toBeVisible();
    expect(page.getByRole("radio").elements()).toHaveLength(3);
    await expect.element(radio("Team")).toBeChecked();
    await expect
      .element(radio("Team"))
      .toHaveAccessibleDescription("Up to 50 people.");
    await expect.element(radio("Enterprise")).toHaveAccessibleDescription("");
    expect(radio("Team").element().className).toBe(
      "nuv-radio-group__item nuv-choice-card__control",
    );
  });

  test("pressing a card chooses it, and only it", async () => {
    await render(<Plans />);

    await page.getByText("Up to 5 people.").click();

    await expect.element(radio("Starter")).toBeChecked();
    await expect.element(radio("Team")).not.toBeChecked();
  });

  test("Tab reaches the chosen card, and the arrows move the choice", async () => {
    await render(<Plans />);

    await userEvent.tab();
    await expect.element(radio("Team")).toHaveFocus();

    await arrow("ArrowDown");
    await expect.element(radio("Enterprise")).toBeChecked();
    await arrow("ArrowUp");
    await arrow("ArrowUp");
    await expect.element(radio("Starter")).toBeChecked();
  });

  test("a disabled group's cards all fade", async () => {
    await render(<Plans disabled />);

    for (const name of ["Starter", "Team", "Enterprise"]) {
      await expect.element(radio(name)).toBeDisabled();
      expect(
        Number(style(card(radio(name).element())).opacity),
        name,
      ).toBeLessThan(1);
    }
  });

  test("forwards its ref to the radio button", async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(
      <RadioGroup aria-label="Plan">
        <RadioCard ref={ref} value="team" className="mine">
          <ChoiceCardTitle>Team</ChoiceCardTitle>
        </RadioCard>
      </RadioGroup>,
    );

    expect(ref.current).toBe(radio("Team").element());
    expect(card(radio("Team").element()).className).toBe(
      "nuv-choice-card mine",
    );
  });
});

describe("layout", () => {
  test("the control is at the start, level with the title, and the text takes the rest", async () => {
    await render(
      <div style={{ width: 360 }}>
        <Audit />
      </div>,
    );
    const control = rect(checkbox().element());
    const title = rect(page.getByText("Audit log", { exact: true }).element());
    const box = rect(card(checkbox().element()));

    expect(box.width).toBe(360);
    // 16 pixels of padding and a 1 pixel edge.
    expect(control.left - box.left).toBe(17);
    expect(title.left).toBeGreaterThan(control.right);
    expect(
      Math.abs(
        control.top + control.height / 2 - (title.top + title.height / 2),
      ),
    ).toBeLessThanOrEqual(1);
  });

  test('indicator="end" puts the control at the far end', async () => {
    await render(
      <div style={{ width: 360 }}>
        <Audit indicator="end" />
      </div>,
    );
    const control = rect(checkbox().element());
    const title = rect(page.getByText("Audit log", { exact: true }).element());
    const box = rect(card(checkbox().element()));

    expect(card(checkbox().element()).className).toBe(
      "nuv-choice-card nuv-choice-card--end",
    );
    expect(box.right - control.right).toBe(17);
    expect(title.right).toBeLessThan(control.left);
    expect(title.left - box.left).toBe(17);
  });

  test("a card with one line in it is at least 44 pixels tall", async () => {
    await render(
      <CheckboxCard>
        <ChoiceCardTitle>Audit log</ChoiceCardTitle>
      </CheckboxCard>,
    );

    expect(rect(card(checkbox().element())).height).toBeGreaterThanOrEqual(44);
  });

  test("long text wraps inside a narrow card", async () => {
    await render(
      <div style={{ width: 180 }}>
        <CheckboxCard>
          <ChoiceCardTitle>Averyveryverylongwordthatwillnotfit</ChoiceCardTitle>
        </CheckboxCard>
      </div>,
    );
    const box = card(page.getByRole("checkbox").element());

    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
  });
});

describe("styles", () => {
  test("a chosen card has a thicker edge in another color, and its content doesn't move", async () => {
    await render(<Audit />);
    const box = () => card(checkbox().element());
    const before = {
      edge: style(box()).borderTopColor,
      shadow: style(box()).boxShadow,
      title: rect(page.getByText("Audit log", { exact: true }).element()).left,
      height: rect(box()).height,
    };

    await checkbox().click();
    await expect.element(checkbox()).toBeChecked();

    await expect.poll(() => style(box()).borderTopColor).not.toBe(before.edge);
    await expect.poll(() => style(box()).boxShadow).not.toBe(before.shadow);
    expect(style(box()).borderTopWidth).toBe("1px");
    expect(
      rect(page.getByText("Audit log", { exact: true }).element()).left,
    ).toBe(before.title);
    expect(rect(box()).height).toBe(before.height);
  });

  test("the pointer fills the card on hover, and shows it can be pressed", async () => {
    await render(<Audit />);
    const box = card(checkbox().element());
    const before = style(box).backgroundColor;

    expect(style(box).cursor).toBe("pointer");
    await userEvent.hover(page.getByText("Audit log", { exact: true }));

    await expect.poll(() => style(box).backgroundColor).not.toBe(before);
  });

  test("the checkbox inside keeps its own focus ring", async () => {
    await render(<Audit />);

    await userEvent.tab();

    expect(style(checkbox().element()).outlineStyle).toBe("solid");
    expect(style(checkbox().element()).outlineWidth).toBe("2px");
  });

  test("component variables change the look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-choice-card-bg": "rgb(10, 20, 30)",
            "--nuv-choice-card-fg": "rgb(200, 210, 220)",
            "--nuv-choice-card-muted-fg": "rgb(150, 160, 170)",
            "--nuv-choice-card-border": "rgb(40, 50, 60)",
            "--nuv-choice-card-checked-border": "rgb(70, 80, 90)",
            "--nuv-choice-card-radius": "2px",
            "--nuv-choice-card-padding": "7px",
            "--nuv-choice-card-gap": "9px",
          } as never
        }
      >
        <Audit />
        <CheckboxCard defaultChecked>
          <ChoiceCardTitle>Single sign-on</ChoiceCardTitle>
        </CheckboxCard>
      </div>,
    );
    const box = style(card(checkbox().element()));

    expect(box.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(box.color).toBe("rgb(200, 210, 220)");
    expect(box.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(box.borderTopLeftRadius).toBe("2px");
    expect(box.paddingTop).toBe("7px");
    expect(box.columnGap).toBe("9px");
    expect(
      style(page.getByText("Who changed what, kept for a year.").element())
        .color,
    ).toBe("rgb(150, 160, 170)");
    expect(
      style(card(checkbox("Single sign-on").element())).borderTopColor,
    ).toBe("rgb(70, 80, 90)");
  });

  test("a hover color of your own is used", async () => {
    await render(
      <div style={{ "--nuv-choice-card-hover-bg": "rgb(9, 8, 7)" } as never}>
        <Audit />
      </div>,
    );

    await userEvent.hover(page.getByText("Audit log", { exact: true }));

    await expect
      .poll(() => style(card(checkbox().element())).backgroundColor)
      .toBe("rgb(9, 8, 7)");
  });
});

describe("a part outside a card", () => {
  test("says where it belongs", async () => {
    class Boundary extends Component<
      { children: ReactNode },
      { message: string }
    > {
      override state = { message: "" };
      static getDerivedStateFromError(error: Error) {
        return { message: error.message };
      }
      override render() {
        return this.state.message || this.props.children;
      }
    }
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await render(
      <Boundary>
        <ChoiceCardTitle>Lost</ChoiceCardTitle>
      </Boundary>,
    );

    await expect
      .element(
        page.getByText(
          "ChoiceCardTitle has to be inside a CheckboxCard or a RadioCard.",
        ),
      )
      .toBeVisible();
    quiet.mockRestore();
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, as checkboxes and as radio buttons, chosen, not and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Audit />
        <Audit defaultChecked indicator="end" />
        <Audit disabled />
        <Plans />
      </>,
    );

    await expectNoViolations(screen.container);
  });

  test("the card's edge reaches 3:1 against the page, chosen and not", async () => {
    await render(
      <div
        data-testid="page"
        {...themeAttributes(theme)}
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Plans />
      </div>,
    );
    const background = style(
      page.getByTestId("page").element(),
    ).backgroundColor;

    for (const name of ["Starter", "Team"]) {
      expect(
        contrast(style(card(radio(name).element())).borderTopColor, background),
        name,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});

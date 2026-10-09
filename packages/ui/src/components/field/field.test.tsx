import "../../styles/index.scss";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import {
  Component,
  type ComponentProps,
  createRef,
  type ReactNode,
  useState,
} from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Checkbox } from "../checkbox/checkbox";
import { FileUpload } from "../file-upload/file-upload";
import { Input } from "../input/input";
import { NativeSelect } from "../native-select/native-select";
import { OtpField } from "../otp-field/otp-field";
import { PasswordInput } from "../password-input/password-input";
import { RadioGroup, RadioGroupItem } from "../radio-group/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select/select";
import { Slider } from "../slider/slider";
import { Switch } from "../switch/switch";
import { Textarea } from "../textarea/textarea";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group/toggle-group";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "./field";

function Email({
  error,
  hint = "We only use it for receipts.",
  ...props
}: ComponentProps<typeof Field> & { error?: ReactNode; hint?: ReactNode }) {
  return (
    <Field {...props}>
      <FieldLabel>Email</FieldLabel>
      <FieldControl>
        <Input type="email" />
      </FieldControl>
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

const input = () => page.getByRole("textbox", { name: "Email" });
const ids = (attribute: string) =>
  (input().element().getAttribute(attribute) ?? "").split(" ").filter(Boolean);
const text = (id: string | undefined) =>
  document.getElementById(id ?? "")?.textContent;

describe("naming and describing", () => {
  test("the label names the control, and a click on it focuses the control", async () => {
    await render(<Email />);

    await page.getByText("Email").click();

    await expect.element(input()).toHaveFocus();
    const label = page.getByText("Email").element();
    expect(label.getAttribute("for")).toBe(input().element().id);
    expect(ids("aria-labelledby")).toEqual([label.id]);
  });

  test("the description is what the control is described by", async () => {
    await render(<Email />);

    await expect
      .element(input())
      .toHaveAccessibleDescription("We only use it for receipts.");
  });

  test("an error is added after the description", async () => {
    await render(<Email error="Enter an email address." />);

    await expect.poll(() => ids("aria-describedby")).toHaveLength(2);
    expect(ids("aria-describedby").map(text)).toEqual([
      "We only use it for receipts.",
      "Enter an email address.",
    ]);
  });

  test("nothing is pointed at that isn't on the page", async () => {
    await render(<Email hint={null} />);

    await expect.element(input()).not.toHaveAttribute("aria-describedby");
    expect(document.querySelector(".nuv-field__error")).toBeNull();
  });

  test("a description the control came with is kept, in front", async () => {
    await render(
      <>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <FieldControl>
            <Input aria-describedby="own" />
          </FieldControl>
          <FieldDescription>From the field.</FieldDescription>
        </Field>
        <p id="own">From the page.</p>
      </>,
    );

    await expect
      .element(input())
      .toHaveAccessibleDescription("From the page. From the field.");
  });

  test("controlId sets the id every part goes by", async () => {
    await render(<Email controlId="billing-email" error="Wrong." />);

    await expect.element(input()).toHaveAttribute("id", "billing-email");
    expect(page.getByText("Email").element().id).toBe("billing-email-label");
    await expect
      .poll(() => ids("aria-describedby"))
      .toEqual(["billing-email-description", "billing-email-error"]);
  });

  test("two fields don't share an id", async () => {
    await render(
      <>
        <Email />
        <Email />
      </>,
    );
    const all = [...document.querySelectorAll("[id]")].map(({ id }) => id);

    expect(new Set(all).size).toBe(all.length);
  });
});

describe("invalid", () => {
  test("the control is invalid while there's an error to show", async () => {
    function Form() {
      const [error, setError] = useState("");
      return (
        <>
          <Email error={error} />
          <button type="button" onClick={() => setError("Enter an email.")}>
            Check
          </button>
          <button type="button" onClick={() => setError("")}>
            Fix
          </button>
        </>
      );
    }
    await render(<Form />);
    await expect.element(input()).not.toHaveAttribute("aria-invalid");

    await page.getByRole("button", { name: "Check" }).click();
    await expect.element(input()).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(input())
      .toHaveAccessibleDescription(
        "We only use it for receipts. Enter an email.",
      );

    await page.getByRole("button", { name: "Fix" }).click();
    await expect.element(input()).not.toHaveAttribute("aria-invalid");
    await expect
      .element(input())
      .toHaveAccessibleDescription("We only use it for receipts.");
  });

  test("invalid can be set without a message, and unset with one", async () => {
    const screen = await render(<Email invalid />);
    await expect.element(input()).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.container
        .querySelector(".nuv-field")
        ?.hasAttribute("data-invalid"),
    ).toBe(true);

    await screen.rerender(
      <Email invalid={false} error="Not yet shown as wrong." />,
    );
    await expect.element(input()).not.toHaveAttribute("aria-invalid");
  });

  test("the error is drawn in the danger color", async () => {
    await render(<Email error="Enter an email address." />);
    const probe = document.createElement("span");
    probe.style.color = "var(--color-danger)";
    document.body.append(probe);

    expect(
      getComputedStyle(page.getByText("Enter an email address.").element())
        .color,
    ).toBe(getComputedStyle(probe).color);
    probe.remove();
  });
});

describe("required and disabled", () => {
  test("required reaches the control and puts a mark after the label", async () => {
    await render(<Email required />);
    const mark = document.querySelector("label span");

    await expect.element(input()).toBeRequired();
    expect(mark?.textContent).toBe("*");
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
    // The mark isn't part of the name. "Required" comes from the control.
    await expect.element(input()).toHaveAccessibleName("Email");
  });

  test("the mark can be replaced or left out", async () => {
    await render(
      <>
        <Field required>
          <FieldLabel requiredIndicator="(required)">Name</FieldLabel>
          <FieldControl>
            <Input />
          </FieldControl>
        </Field>
        <Field required>
          <FieldLabel requiredIndicator={null}>City</FieldLabel>
          <FieldControl>
            <Input />
          </FieldControl>
        </Field>
      </>,
    );

    await expect.element(page.getByText("(required)")).toBeVisible();
    expect(page.getByText("City").element().querySelector("span")).toBeNull();
  });

  test("required blocks the form until the control is filled in", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Email required />
      </form>,
    );
    const form = input().element().closest("form");

    form?.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();

    await input().fill("ada@example.com");
    form?.requestSubmit();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test("disabled reaches the control and fades the label", async () => {
    await render(<Email disabled />);

    await expect.element(input()).toBeDisabled();
    expect(getComputedStyle(page.getByText("Email").element()).opacity).toBe(
      "0.5",
    );
  });
});

describe("with other controls", () => {
  test("a textarea, a native select and a password input", async () => {
    await render(
      <>
        <Field invalid>
          <FieldLabel>Notes</FieldLabel>
          <FieldControl>
            <Textarea />
          </FieldControl>
        </Field>
        <Field invalid>
          <FieldLabel>Country</FieldLabel>
          <FieldControl>
            <NativeSelect>
              <option>Norway</option>
            </NativeSelect>
          </FieldControl>
        </Field>
        <Field invalid>
          <FieldLabel>Password</FieldLabel>
          <FieldControl>
            <PasswordInput />
          </FieldControl>
        </Field>
      </>,
    );

    for (const name of ["Notes", "Country", "Password"]) {
      await expect
        .element(page.getByLabelText(name, { exact: true }))
        .toHaveAttribute("aria-invalid", "true");
    }
  });

  test("a select: the label names the trigger and opens the list", async () => {
    await render(
      <Field>
        <FieldLabel>Plan</FieldLabel>
        <Select>
          <FieldControl>
            <SelectTrigger>
              <SelectValue placeholder="Pick a plan" />
            </SelectTrigger>
          </FieldControl>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>You can change it later.</FieldDescription>
      </Field>,
    );
    const trigger = page.getByRole("combobox", { name: "Plan" });

    await expect
      .element(trigger)
      .toHaveAccessibleDescription("You can change it later.");
    await page.getByText("Plan", { exact: true }).click();
    await expect
      .element(page.getByRole("option", { name: "Free" }))
      .toBeVisible();
  });

  test("a checkbox, with the label beside it", async () => {
    await render(
      <Field orientation="horizontal">
        <FieldControl>
          <Checkbox />
        </FieldControl>
        <FieldLabel>Email me updates</FieldLabel>
        <FieldDescription>About once a month.</FieldDescription>
      </Field>,
    );
    const checkbox = page.getByRole("checkbox", { name: "Email me updates" });
    const box = checkbox.element().getBoundingClientRect();
    const label = page
      .getByText("Email me updates")
      .element()
      .getBoundingClientRect();
    const hint = page
      .getByText("About once a month.")
      .element()
      .getBoundingClientRect();

    await page.getByText("Email me updates").click();
    await expect.element(checkbox).toBeChecked();
    await expect
      .element(checkbox)
      .toHaveAccessibleDescription("About once a month.");

    expect(label.left).toBeGreaterThan(box.right);
    // Centered on each other, and the description lines up with the label.
    expect(label.top + label.height / 2).toBeCloseTo(
      box.top + box.height / 2,
      0,
    );
    expect(hint.left).toBe(label.left);
    expect(hint.top).toBeGreaterThanOrEqual(label.bottom);
  });

  test("the side-by-side layout turns around in a right-to-left page", async () => {
    await render(
      <div dir="rtl">
        <Field orientation="horizontal">
          <FieldControl>
            <Switch />
          </FieldControl>
          <FieldLabel>Updates</FieldLabel>
        </Field>
      </div>,
    );
    const control = page.getByRole("switch").element().getBoundingClientRect();
    const label = page.getByText("Updates").element().getBoundingClientRect();

    expect(label.right).toBeLessThan(control.left);
  });

  test("a radio group, named by a label that isn't a label element", async () => {
    await render(
      <Field required>
        <FieldLabel asChild>
          <span>Plan</span>
        </FieldLabel>
        <FieldControl>
          <RadioGroup>
            <RadioGroupItem value="free" aria-label="Free" />
            <RadioGroupItem value="team" aria-label="Team" />
          </RadioGroup>
        </FieldControl>
        <FieldError>Pick a plan.</FieldError>
      </Field>,
    );
    const group = page.getByRole("radiogroup", { name: "Plan" });

    await expect.element(group).toBeVisible();
    await expect.element(group).toHaveAccessibleDescription("Pick a plan.");
    await expect.element(group).toHaveAttribute("aria-required", "true");
    await expect.element(group).toHaveAttribute("aria-invalid", "true");
    const label = document.querySelector(".nuv-label");
    expect(label?.tagName).toBe("SPAN");
    expect(label?.hasAttribute("for")).toBe(false);
  });

  test("a select trigger and a toggle group don't get a required attribute they can't have", async () => {
    await render(
      <>
        <Field required>
          <FieldLabel>Plan</FieldLabel>
          <Select>
            <FieldControl>
              <SelectTrigger>
                <SelectValue placeholder="Pick a plan" />
              </SelectTrigger>
            </FieldControl>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field required>
          <FieldLabel asChild>
            <span>View</span>
          </FieldLabel>
          <FieldControl>
            <ToggleGroup type="single">
              <ToggleGroupItem value="list">List</ToggleGroupItem>
            </ToggleGroup>
          </FieldControl>
        </Field>
      </>,
    );
    const trigger = page.getByRole("combobox").element();
    const group = page.getByRole("radiogroup", { name: "View" });

    expect(trigger.hasAttribute("required")).toBe(false);
    expect(group.element().hasAttribute("required")).toBe(false);
    await expect.element(group).toHaveAttribute("aria-required", "true");
  });

  test("a slider: the name and the description go to its handle", async () => {
    await render(
      <Field required>
        <FieldLabel>Volume</FieldLabel>
        <FieldControl>
          <Slider defaultValue={[30]} />
        </FieldControl>
        <FieldDescription>From 0 to 100.</FieldDescription>
      </Field>,
    );
    const handle = page.getByRole("slider", { name: "Volume" });

    await expect.element(handle).toHaveAccessibleDescription("From 0 to 100.");
    // A slider can't be empty, so required has nowhere to go.
    expect(
      document.querySelector(".nuv-slider")?.hasAttribute("required"),
    ).toBe(false);
  });

  test("a one-time code: the label names the group of boxes", async () => {
    await render(
      <Field invalid required>
        <FieldLabel>Code</FieldLabel>
        <FieldControl>
          <OtpField length={4} />
        </FieldControl>
        <FieldDescription>We sent it to your phone.</FieldDescription>
      </Field>,
    );
    const group = page.getByRole("group", { name: "Code" });

    await expect
      .element(group)
      .toHaveAccessibleDescription("We sent it to your phone.");
    for (const box of page.getByRole("textbox").elements()) {
      expect(box.getAttribute("aria-invalid")).toBe("true");
      expect((box as HTMLInputElement).required).toBe(true);
    }
    expect(group.element().hasAttribute("aria-invalid")).toBe(false);
  });

  test("a file upload keeps its own description next to the field's", async () => {
    await render(
      <Field>
        <FieldLabel>Receipts</FieldLabel>
        <FieldControl>
          <FileUpload>Drop receipts here</FileUpload>
        </FieldControl>
        <FieldDescription>PDF, up to 5 MB each.</FieldDescription>
      </Field>,
    );

    await expect
      .element(page.getByLabelText("Receipts"))
      .toHaveAccessibleDescription("PDF, up to 5 MB each. Drop receipts here");
  });
});

describe("structure", () => {
  test("forwards its ref, keeps a className and passes props on", async () => {
    const ref = createRef<HTMLDivElement>();
    const screen = await render(
      <Email ref={ref} className="mine" data-test="x" />,
    );
    const field = screen.container.querySelector(".nuv-field");

    expect(ref.current).toBe(field);
    expect(field?.className).toBe("nuv-field nuv-field--vertical mine");
    expect(field?.getAttribute("data-test")).toBe("x");
  });

  test("the label is only as wide as its text", async () => {
    await render(
      <div style={{ inlineSize: 300 }}>
        <Email />
      </div>,
    );

    expect(
      page.getByText("Email").element().getBoundingClientRect().width,
    ).toBeLessThan(100);
    expect(input().element().getBoundingClientRect().width).toBe(300);
  });

  test("a part outside a field says what's wrong", async () => {
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
        <FieldLabel>Email</FieldLabel>
      </Boundary>,
    );

    await expect
      .element(page.getByText("FieldLabel has to be inside a Field."))
      .toBeVisible();
    quiet.mockRestore();
  });

  test("the keyboard goes from one control to the next", async () => {
    await render(
      <>
        <Email />
        <Field>
          <FieldLabel>Name</FieldLabel>
          <FieldControl>
            <Input />
          </FieldControl>
        </Field>
      </>,
    );

    await userEvent.keyboard("{Tab}");
    await expect.element(input()).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("textbox", { name: "Name" }))
      .toHaveFocus();
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with a description, an error and a required mark", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 24 }}>
        <Email />
        <Email required error="Enter an email address." />
        <Email disabled />
        <Field orientation="horizontal">
          <FieldControl>
            <Checkbox />
          </FieldControl>
          <FieldLabel>Email me updates</FieldLabel>
          <FieldDescription>About once a month.</FieldDescription>
        </Field>
      </div>,
    );
    await expect
      .poll(() => screen.container.querySelectorAll("[aria-invalid]").length)
      .toBe(1);

    await expectNoViolations(screen.container);
  });
});

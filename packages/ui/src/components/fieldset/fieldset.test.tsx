import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import { Button } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { Input } from "../input/input";
import { RadioGroup, RadioGroupItem } from "../radio-group/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select/select";
import { Switch } from "../switch/switch";
import { Toggle } from "../toggle/toggle";
import { Fieldset, FieldsetLegend } from "./fieldset";

describe("rendering", () => {
  test("renders a fieldset that its legend names", async () => {
    await render(
      <Fieldset>
        <FieldsetLegend>Shipping address</FieldsetLegend>
        <Input aria-label="Street" />
      </Fieldset>,
    );
    const group = page.getByRole("group", { name: "Shipping address" });

    await expect.element(group).toBeVisible();
    expect(group.element().tagName).toBe("FIELDSET");
    expect(page.getByText("Shipping address").element().tagName).toBe("LEGEND");
  });

  test("forwards refs, keeps class names and passes props on", async () => {
    const fieldset = createRef<HTMLFieldSetElement>();
    const legend = createRef<HTMLLegendElement>();
    await render(
      <Fieldset ref={fieldset} className="mine" name="address">
        <FieldsetLegend ref={legend} className="yours">
          Address
        </FieldsetLegend>
      </Fieldset>,
    );

    expect(fieldset.current?.className).toBe("nuv-fieldset mine");
    expect(fieldset.current?.name).toBe("address");
    expect(legend.current?.className).toBe("nuv-fieldset__legend yours");
  });

  test("a legend can name a group of radio buttons", async () => {
    await render(
      <Fieldset>
        <FieldsetLegend>Plan</FieldsetLegend>
        <RadioGroup aria-label="Plan">
          <RadioGroupItem value="free" aria-label="Free" />
          <RadioGroupItem value="team" aria-label="Team" />
        </RadioGroup>
      </Fieldset>,
    );

    await expect
      .element(page.getByRole("group", { name: "Plan" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("radio", { name: "Team" }))
      .toBeVisible();
  });
});

describe("disabled", () => {
  test("turns off every control inside, and each one fades", async () => {
    await render(
      <Fieldset disabled>
        <FieldsetLegend>Billing</FieldsetLegend>
        <Input aria-label="Name" />
        <Checkbox aria-label="Terms" />
        <Switch aria-label="Updates" />
        <Toggle aria-label="Bold">B</Toggle>
        <Button>Save</Button>
        <Select>
          <SelectTrigger aria-label="Plan">
            <SelectValue placeholder="Pick a plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
        <RadioGroup aria-label="Size">
          <RadioGroupItem value="s" aria-label="Small" />
        </RadioGroup>
      </Fieldset>,
    );
    const controls = [
      page.getByRole("textbox", { name: "Name" }),
      page.getByRole("checkbox", { name: "Terms" }),
      page.getByRole("switch", { name: "Updates" }),
      page.getByRole("button", { name: "Bold" }),
      page.getByRole("button", { name: "Save" }),
      page.getByRole("combobox", { name: "Plan" }),
      page.getByRole("radio", { name: "Small" }),
    ];

    for (const control of controls) {
      await expect.element(control).toBeDisabled();
      expect(getComputedStyle(control.element()).opacity).toBe("0.5");
    }
  });

  test("the keyboard skips everything inside", async () => {
    await render(
      <>
        <Fieldset disabled>
          <FieldsetLegend>Billing</FieldsetLegend>
          <Input aria-label="Name" />
          <Checkbox aria-label="Terms" />
        </Fieldset>
        <Button>Next</Button>
      </>,
    );

    await userEvent.keyboard("{Tab}");

    await expect
      .element(page.getByRole("button", { name: "Next" }))
      .toHaveFocus();
  });
});

describe("styles", () => {
  test("has no edge or padding of the browser's", async () => {
    const screen = await render(
      <Fieldset>
        <FieldsetLegend>Address</FieldsetLegend>
        <Input aria-label="Street" />
      </Fieldset>,
    );
    const style = getComputedStyle(
      screen.container.querySelector("fieldset") as Element,
    );

    expect(style.borderTopWidth).toBe("0px");
    expect(style.paddingLeft).toBe("0px");
    expect(style.marginLeft).toBe("0px");
    expect(
      getComputedStyle(page.getByText("Address").element()).paddingLeft,
    ).toBe("0px");
  });

  test("leaves a gap under the legend and between what's inside", async () => {
    await render(
      <Fieldset>
        <FieldsetLegend>Address</FieldsetLegend>
        <Input aria-label="Street" />
        <Input aria-label="City" />
      </Fieldset>,
    );
    const legend = page.getByText("Address").element().getBoundingClientRect();
    const street = page
      .getByLabelText("Street")
      .element()
      .getBoundingClientRect();
    const city = page.getByLabelText("City").element().getBoundingClientRect();

    // The legend's own padding makes the first gap: 24px of text and 12px.
    expect(street.top - legend.top).toBe(36);
    expect(city.top - street.bottom).toBe(16);
  });

  test("shrinks with its container instead of holding it open", async () => {
    const screen = await render(
      <div style={{ inlineSize: 200 }}>
        <Fieldset>
          <FieldsetLegend>Address</FieldsetLegend>
          <div style={{ overflow: "auto" }}>
            <div style={{ inlineSize: 600, blockSize: 10 }} />
          </div>
        </Fieldset>
      </div>,
    );

    expect(
      screen.container.querySelector("fieldset")?.getBoundingClientRect().width,
    ).toBe(200);
  });

  test("variables change the gaps", async () => {
    await render(
      <Fieldset
        style={
          {
            "--nuv-fieldset-gap": "40px",
            "--nuv-fieldset-legend-gap": "0px",
          } as never
        }
      >
        <FieldsetLegend>Address</FieldsetLegend>
        <Input aria-label="Street" />
        <Input aria-label="City" />
      </Fieldset>,
    );
    const legend = page.getByText("Address").element().getBoundingClientRect();
    const street = page
      .getByLabelText("Street")
      .element()
      .getBoundingClientRect();
    const city = page.getByLabelText("City").element().getBoundingClientRect();

    expect(street.top).toBe(legend.bottom);
    expect(city.top - street.bottom).toBe(40);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with fields inside", async () => {
    const screen = await renderThemed(
      theme,
      <Fieldset>
        <FieldsetLegend>Shipping address</FieldsetLegend>
        <label htmlFor="street">Street</label>
        <Input id="street" />
        <label htmlFor="city">City</label>
        <Input id="city" />
      </Fieldset>,
    );

    await expectNoViolations(screen.container);
  });
});

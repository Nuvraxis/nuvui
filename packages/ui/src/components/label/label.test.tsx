import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import { Input } from "../input/input";
import { Label } from "./label";

describe("rendering", () => {
  test("renders a label that names the control it points at", async () => {
    await render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>,
    );

    await expect
      .element(page.getByRole("textbox", { name: "Email" }))
      .toBeVisible();
    expect(page.getByText("Email").element().tagName).toBe("LABEL");
  });

  test("a click on it focuses the control", async () => {
    await render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>,
    );

    await page.getByText("Email").click();

    await expect.element(page.getByRole("textbox")).toHaveFocus();
  });

  test("a double click doesn't select its text", async () => {
    await render(
      <>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" />
      </>,
    );

    await userEvent.dblClick(page.getByText("Email address"));

    expect(getSelection()?.toString()).toBe("");
  });

  test("a control inside it still takes the click", async () => {
    await render(
      <Label>
        <input type="checkbox" />
        Remember me
      </Label>,
    );

    await page.getByRole("checkbox").click();

    await expect.element(page.getByRole("checkbox")).toBeChecked();
  });

  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLLabelElement>();
    await render(
      <Label ref={ref} className="mine">
        Email
      </Label>,
    );

    expect(ref.current).toBe(page.getByText("Email").element());
    await expect
      .element(page.getByText("Email"))
      .toHaveClass("nuv-label", "mine");
  });
});

describe("styles", () => {
  test("is small, medium-weight text", async () => {
    await render(<Label>Email</Label>);
    const style = getComputedStyle(page.getByText("Email").element());

    expect(style.fontSize).toBe("14px");
    expect(style.fontWeight).toBe("500");
  });

  test("fades when it's marked as disabled", async () => {
    await render(<Label data-disabled="">Email</Label>);

    expect(getComputedStyle(page.getByText("Email").element()).opacity).toBe(
      "0.5",
    );
  });

  test("a variable changes the size of the text", async () => {
    await render(
      <Label style={{ "--nuv-label-font-size": "20px" } as never}>Email</Label>,
    );

    expect(getComputedStyle(page.getByText("Email").element()).fontSize).toBe(
      "20px",
    );
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe next to its control", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" />
      </>,
    );

    await expectNoViolations(screen.container);
  });
});

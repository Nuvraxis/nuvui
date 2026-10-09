import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { DirectionProvider } from "../../direction";
import { Rating } from "./rating";

const star = (name: string) => page.getByRole("radio", { name, exact: true });
const group = () => page.getByRole("radiogroup");
const filled = () =>
  group().element().querySelectorAll(".nuv-rating__star--on").length;
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();

// Radix picks the star that an arrow key moves focus to, and it moves focus
// a moment after the key goes down. A key that's let go of in the same
// instant, as a scripted press is, has gone before the focus arrives. A
// finger holds it longer than that.
async function arrow(
  key: "ArrowRight" | "ArrowLeft" | "ArrowUp" | "ArrowDown",
) {
  await userEvent.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await userEvent.keyboard(`{/${key}}`);
}

describe("to choose from", () => {
  test("is a radio group with a radio button for each star, named by its number", async () => {
    await render(<Rating aria-label="Delivery" />);

    await expect
      .element(page.getByRole("radiogroup", { name: "Delivery" }))
      .toHaveClass("nuv-rating");
    expect(page.getByRole("radio").elements()).toHaveLength(5);
    expect(
      page
        .getByRole("radio")
        .elements()
        .map((element) => element.getAttribute("aria-label")),
    ).toEqual(["1 star", "2 stars", "3 stars", "4 stars", "5 stars"]);
  });

  test("starts with none chosen, and a click chooses one", async () => {
    const onValueChange = vi.fn();
    await render(
      <Rating aria-label="Delivery" onValueChange={onValueChange} />,
    );
    expect(page.getByRole("radio", { checked: true }).elements()).toHaveLength(
      0,
    );
    expect(filled()).toBe(0);

    await star("4 stars").click();

    await expect.element(star("4 stars")).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith(4);
    // The stars up to the chosen one are filled, and only one is checked.
    expect(filled()).toBe(4);
    expect(page.getByRole("radio", { checked: true }).elements()).toHaveLength(
      1,
    );
  });

  test("defaultValue chooses a star at first", async () => {
    await render(<Rating aria-label="Delivery" defaultValue={2} />);

    await expect.element(star("2 stars")).toBeChecked();
    expect(filled()).toBe(2);
  });

  test("max sets how many stars there are", async () => {
    await render(<Rating aria-label="Out of ten" max={10} defaultValue={7} />);

    expect(page.getByRole("radio").elements()).toHaveLength(10);
    expect(filled()).toBe(7);
  });

  test("controlled, it shows the value it's given", async () => {
    function Controlled() {
      const [value, setValue] = useState(3);
      return (
        <>
          <Rating
            aria-label="Delivery"
            value={value}
            onValueChange={setValue}
          />
          <button type="button" onClick={() => setValue(0)}>
            Clear
          </button>
        </>
      );
    }
    await render(<Controlled />);
    await expect.element(star("3 stars")).toBeChecked();

    await star("5 stars").click();
    await expect.element(star("5 stars")).toBeChecked();

    // Zero is no stars, which a radio group can't get to by itself.
    await page.getByRole("button", { name: "Clear" }).click();
    expect(page.getByRole("radio", { checked: true }).elements()).toHaveLength(
      0,
    );
    expect(filled()).toBe(0);
  });

  test("stays where it's held when the change is refused", async () => {
    const onValueChange = vi.fn();
    await render(
      <Rating aria-label="Delivery" value={2} onValueChange={onValueChange} />,
    );

    await star("5 stars").click();

    expect(onValueChange).toHaveBeenCalledWith(5);
    await expect.element(star("2 stars")).toBeChecked();
  });

  test("the names can be translated", async () => {
    await render(
      <Rating
        aria-label="Lieferung"
        max={3}
        itemLabel={(value, max) => `${value} von ${max} Sternen`}
      />,
    );

    await expect.element(star("2 von 3 Sternen")).toBeVisible();
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Rating ref={ref} aria-label="Delivery" className="mine" id="stars" />,
    );

    expect(ref.current?.className).toBe("nuv-rating mine");
    expect(ref.current?.id).toBe("stars");
    expect(ref.current?.getAttribute("role")).toBe("radiogroup");
  });
});

describe("the keyboard", () => {
  test("Tab goes to the chosen star, or to the first when none is", async () => {
    const screen = await render(<Rating aria-label="Delivery" />);
    await userEvent.tab();
    await expect.element(star("1 star")).toHaveFocus();

    await screen.rerender(
      <Rating key="chosen" aria-label="Delivery" defaultValue={3} />,
    );
    await userEvent.tab();
    await expect.element(star("3 stars")).toHaveFocus();
  });

  test("the arrows move and choose, and go round at the ends", async () => {
    const onValueChange = vi.fn();
    await render(
      <Rating
        aria-label="Delivery"
        defaultValue={4}
        onValueChange={onValueChange}
      />,
    );
    (star("4 stars").element() as HTMLElement).focus();

    await arrow("ArrowRight");
    await expect.element(star("5 stars")).toBeChecked();
    await arrow("ArrowRight");
    await expect.element(star("1 star")).toBeChecked();
    await arrow("ArrowLeft");
    await expect.element(star("5 stars")).toBeChecked();
    await arrow("ArrowUp");
    await expect.element(star("4 stars")).toBeChecked();
    await arrow("ArrowDown");
    await expect.element(star("5 stars")).toBeChecked();
    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([
      5, 1, 5, 4, 5,
    ]);
  });

  test("Space chooses the star that has focus", async () => {
    await render(<Rating aria-label="Delivery" />);

    await userEvent.tab();
    await userEvent.keyboard(" ");

    await expect.element(star("1 star")).toBeChecked();
  });

  test("in a right-to-left page the left arrow goes to the next star", async () => {
    await render(
      <DirectionProvider dir="rtl">
        <div dir="rtl">
          <Rating aria-label="Delivery" defaultValue={2} />
        </div>
      </DirectionProvider>,
    );
    (star("2 stars").element() as HTMLElement).focus();

    await arrow("ArrowLeft");

    await expect.element(star("3 stars")).toBeChecked();
    // And the stars run from the right.
    expect(rect(star("1 star").element()).left).toBeGreaterThan(
      rect(star("5 stars").element()).left,
    );
  });

  test("a star with keyboard focus has a ring", async () => {
    await render(<Rating aria-label="Delivery" />);

    await userEvent.tab();

    const look = style(star("1 star").element());
    expect(look.outlineStyle).toBe("solid");
    expect(look.outlineWidth).toBe("2px");
  });
});

describe("the pointer", () => {
  test("the stars up to the one under it fill, and go back when it leaves", async () => {
    await render(
      <div style={{ padding: 40 }}>
        <Rating aria-label="Delivery" defaultValue={2} />
      </div>,
    );

    await userEvent.hover(star("4 stars"));
    expect(filled()).toBe(4);
    // Nothing was chosen by looking.
    await expect.element(star("2 stars")).toBeChecked();

    await userEvent.unhover(group());
    expect(filled()).toBe(2);
  });

  test("what's chosen with the keyboard is shown, wherever the pointer was left", async () => {
    await render(
      <div style={{ padding: 40 }}>
        <Rating aria-label="Delivery" />
      </div>,
    );

    await star("5 stars").click();
    expect(filled()).toBe(5);
    await arrow("ArrowLeft");

    await expect.element(star("4 stars")).toBeChecked();
    expect(filled()).toBe(4);
  });
});

describe("disabled, and in a form", () => {
  test("a disabled rating can't be changed, and fades", async () => {
    const onValueChange = vi.fn();
    await render(
      <Rating
        aria-label="Delivery"
        defaultValue={2}
        disabled
        onValueChange={onValueChange}
      />,
    );

    await expect.element(star("4 stars")).toBeDisabled();
    (star("4 stars").element() as HTMLElement).click();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(Number(style(group().element()).opacity)).toBeLessThan(1);
  });

  test("with a name, the chosen star's number is submitted", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Rating aria-label="Delivery" name="stars" defaultValue={4} />
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();

    expect(submitted?.get("stars")).toBe("4");
  });
});

describe("read-only", () => {
  const picture = () => page.getByRole("img");
  const widths = () =>
    [...picture().element().querySelectorAll(".nuv-rating__item")].map(
      (item) => {
        const fill = item.querySelector(".nuv-rating__fill");
        return fill ? Math.round(rect(fill).width * 10) / 10 : 0;
      },
    );

  test("is one picture, named by its value, with no controls in it", async () => {
    await render(<Rating readOnly value={4.5} />);

    await expect
      .element(page.getByRole("img", { name: "4.5 out of 5" }))
      .toHaveClass("nuv-rating nuv-rating--read-only");
    expect(page.getByRole("radio").elements()).toHaveLength(0);
    expect(picture().element().querySelectorAll("button")).toHaveLength(0);
  });

  test("fills whole stars, and the part of the next that the value covers", async () => {
    await render(<Rating readOnly value={3.5} />);

    // A star is 24 pixels wide.
    expect(widths()).toEqual([24, 24, 24, 12, 0]);
  });

  test("a quarter and three quarters are what they say", async () => {
    const screen = await render(<Rating readOnly value={0.25} />);
    expect(widths()).toEqual([6, 0, 0, 0, 0]);

    await screen.rerender(<Rating readOnly value={4.75} />);
    expect(widths()).toEqual([24, 24, 24, 24, 18]);
  });

  test("a value outside the stars fills none of them, or all", async () => {
    const screen = await render(<Rating readOnly value={-2} />);
    expect(widths()).toEqual([0, 0, 0, 0, 0]);

    await screen.rerender(<Rating readOnly value={9} />);
    expect(widths()).toEqual([24, 24, 24, 24, 24]);
  });

  test("the filled part starts from the right in a right-to-left page", async () => {
    await render(
      <div dir="rtl">
        <Rating readOnly value={0.5} />
      </div>,
    );
    const item = picture().element().querySelector(".nuv-rating__item");
    const fill = item?.querySelector(".nuv-rating__fill");
    const base = item?.querySelector(".nuv-rating__star");

    expect(rect(fill as Element).right).toBe(rect(base as Element).right);
    expect(rect(fill as Element).width).toBe(12);
  });

  test("a name of your own, or a translated one, replaces the default", async () => {
    const screen = await render(
      <Rating
        readOnly
        value={3}
        max={10}
        valueLabel={(value, max) => `${value} von ${max}`}
      />,
    );
    await expect
      .element(page.getByRole("img", { name: "3 von 10" }))
      .toBeVisible();

    await screen.rerender(
      <Rating readOnly value={3} aria-label="Three stars from 12 reviews" />,
    );
    await expect
      .element(page.getByRole("img", { name: "Three stars from 12 reviews" }))
      .toBeVisible();
  });

  test("takes no room for a finger and shows no pointer", async () => {
    await render(<Rating readOnly value={3} />);
    const item = picture().element().querySelector(".nuv-rating__item");

    // 24 pixels of star and 2 of room each side.
    expect(rect(item as Element).width).toBe(28);
    expect(style(item as Element).cursor).toBe("auto");
  });

  test("forwards its ref, a className and an id", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Rating ref={ref} readOnly value={3} className="mine" id="average" />,
    );

    expect(ref.current?.classList.contains("mine")).toBe(true);
    expect(ref.current?.id).toBe("average");
  });
});

describe("styles", () => {
  test("an empty star is an outline and a chosen one is filled", async () => {
    await render(<Rating aria-label="Delivery" defaultValue={1} />);
    const on = star("1 star").element().querySelector("svg") as Element;
    const off = star("2 stars").element().querySelector("svg") as Element;

    expect(style(off).fill).toBe("none");
    expect(style(on).fill).not.toBe("none");
    expect(style(on).color).not.toBe(style(off).color);
  });

  test("each size has a star of its own", async () => {
    await render(
      <>
        <Rating aria-label="Small" size="sm" />
        <Rating aria-label="Medium" />
        <Rating aria-label="Large" size="lg" />
      </>,
    );
    const width = (name: string) =>
      rect(
        page
          .getByRole("radiogroup", { name })
          .element()
          .querySelector("svg") as Element,
      ).width;

    expect(width("Small")).toBe(16);
    expect(width("Medium")).toBe(24);
    expect(width("Large")).toBe(32);
  });

  test("with a mouse the stars are close together", async () => {
    await render(<Rating aria-label="Delivery" />);

    expect(rect(star("1 star").element()).width).toBe(28);
    expect(rect(star("2 stars").element()).left).toBe(
      rect(star("1 star").element()).right,
    );
  });

  test("component variables change the look", async () => {
    await render(
      <Rating
        aria-label="Delivery"
        defaultValue={1}
        style={
          {
            "--nuv-rating-size": "40px",
            "--nuv-rating-gap": "6px",
            "--nuv-rating-on": "rgb(10, 20, 30)",
            "--nuv-rating-off": "rgb(200, 210, 220)",
          } as never
        }
      />,
    );
    const on = star("1 star").element().querySelector("svg") as Element;
    const off = star("2 stars").element().querySelector("svg") as Element;

    expect(rect(on).width).toBe(40);
    expect(rect(star("1 star").element()).width).toBe(52);
    expect(style(on).color).toBe("rgb(10, 20, 30)");
    expect(style(off).color).toBe("rgb(200, 210, 220)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, to choose from, disabled and read-only", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Rating aria-label="Delivery" defaultValue={3} />
        <Rating aria-label="Packaging" defaultValue={2} disabled />
        <Rating readOnly value={3.5} />
      </>,
    );

    await expectNoViolations(screen.container);
  });

  test("a filled star and an empty one each reach 3:1 against the page", async () => {
    await render(
      <div
        data-testid="page"
        {...themeAttributes(theme)}
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Rating aria-label="Delivery" defaultValue={1} />
      </div>,
    );
    const background = style(
      page.getByTestId("page").element(),
    ).backgroundColor;
    const on = star("1 star").element().querySelector("svg") as Element;
    const off = star("2 stars").element().querySelector("svg") as Element;

    expect(contrast(style(on).color, background)).toBeGreaterThanOrEqual(3);
    expect(contrast(style(off).color, background)).toBeGreaterThanOrEqual(3);
  });
});

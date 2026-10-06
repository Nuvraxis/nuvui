import "../../styles/index.scss";
import { type ComponentProps, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import {
  expectNoViolations,
  hitAt,
  renderThemed,
  themes,
} from "../../../test/themed";
import { Slider } from "./slider";

function Volume({
  dir,
  ...props
}: ComponentProps<typeof Slider> & { dir?: "ltr" | "rtl" }) {
  return (
    <div dir={dir} style={{ padding: 40, inlineSize: 280 }}>
      {/* Radix lays the slider out from this prop, not from the page. */}
      <Slider aria-label="Volume" dir={dir} {...props} />
    </div>
  );
}

const handle = (name = "Volume") => page.getByRole("slider", { name });
const root = () => document.querySelector(".nuv-slider") as HTMLElement;
const part = (name: string) =>
  root().querySelector(`.nuv-slider__${name}`) as HTMLElement;
const box = (element: Element) => element.getBoundingClientRect();
const center = (element: Element) => box(element).left + box(element).width / 2;

describe("rendering", () => {
  test("renders one handle that reports its value and its range", async () => {
    await render(<Volume defaultValue={[30]} />);

    await expect.element(handle()).toHaveAttribute("aria-valuenow", "30");
    await expect.element(handle()).toHaveAttribute("aria-valuemin", "0");
    await expect.element(handle()).toHaveAttribute("aria-valuemax", "100");
    expect(root().getAttribute("role")).toBeNull();
  });

  test("starts at the minimum when no value is given", async () => {
    await render(<Volume min={10} max={50} />);

    await expect.element(handle()).toHaveAttribute("aria-valuenow", "10");
  });

  test("the filled part ends where the handle is", async () => {
    await render(<Volume defaultValue={[50]} />);
    const track = box(part("track"));
    const range = box(part("range"));

    expect(range.left).toBe(track.left);
    expect(range.width).toBeCloseTo(track.width / 2, 0);
    expect(center(handle().element())).toBeCloseTo(range.right, 0);
  });

  test("two values draw two handles, named for each end", async () => {
    await render(<Volume aria-label="Price" defaultValue={[20, 80]} />);

    await expect
      .element(page.getByRole("group", { name: "Price" }))
      .toBeVisible();
    await expect
      .element(handle("Minimum"))
      .toHaveAttribute("aria-valuenow", "20");
    await expect
      .element(handle("Maximum"))
      .toHaveAttribute("aria-valuenow", "80");
  });

  test("the handles' names can be replaced", async () => {
    await render(
      <Volume
        aria-label="Preis"
        defaultValue={[20, 80]}
        thumbLabels={["Von", "Bis"]}
      />,
    );

    await expect.element(handle("Von")).toBeVisible();
    await expect.element(handle("Bis")).toBeVisible();
  });

  test("a description goes to the handle", async () => {
    await render(
      <>
        <Volume defaultValue={[30]} aria-describedby="hint" />
        <p id="hint">Loud above 80.</p>
      </>,
    );

    await expect
      .element(handle())
      .toHaveAccessibleDescription("Loud above 80.");
  });

  test("with two handles, the description goes to the group", async () => {
    await render(
      <>
        <Volume defaultValue={[30, 60]} aria-describedby="hint" />
        <p id="hint">Loud above 80.</p>
      </>,
    );

    await expect
      .element(page.getByRole("group", { name: "Volume" }))
      .toHaveAccessibleDescription("Loud above 80.");
    await expect
      .element(handle("Minimum"))
      .not.toHaveAttribute("aria-describedby");
  });

  test("valueText gives a screen reader words in place of the bare number", async () => {
    await render(
      <Volume defaultValue={[30]} valueText={(value) => `${value} percent`} />,
    );
    await expect
      .element(handle())
      .toHaveAttribute("aria-valuetext", "30 percent");

    handle().element().focus();
    await userEvent.keyboard("{ArrowRight}");

    await expect
      .element(handle())
      .toHaveAttribute("aria-valuetext", "31 percent");
  });

  test("each handle gets its own, with its position", async () => {
    await render(
      <Volume
        defaultValue={[20, 80]}
        valueText={(value, index) => `${index === 0 ? "from" : "to"} ${value}`}
      />,
    );

    await expect
      .element(handle("Minimum"))
      .toHaveAttribute("aria-valuetext", "from 20");
    await expect
      .element(handle("Maximum"))
      .toHaveAttribute("aria-valuetext", "to 80");
  });

  test("a controlled slider draws a handle for each value it's given", async () => {
    const screen = await render(<Volume value={[30]} />);
    expect(page.getByRole("slider").elements()).toHaveLength(1);

    await screen.rerender(<Volume value={[30, 60]} />);
    await expect.poll(() => page.getByRole("slider").elements().length).toBe(2);
  });

  test("can be controlled", async () => {
    const onValueChange = vi.fn();
    await render(<Volume value={[30]} onValueChange={onValueChange} />);

    handle().element().focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(onValueChange).toHaveBeenCalledWith([31]);
    await expect.element(handle()).toHaveAttribute("aria-valuenow", "30");
  });

  test("submits with a form, one value per handle", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Volume name="price" defaultValue={[20, 80]} />
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();

    expect(submitted?.getAll("price[]")).toEqual(["20", "80"]);
  });

  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(<Volume ref={ref} className="mine" />);

    expect(ref.current).toBe(root());
    expect(root().className).toBe("nuv-slider mine");
  });
});

describe("keyboard", () => {
  test("the arrow keys change the value by one step", async () => {
    await render(<Volume defaultValue={[30]} step={5} />);

    await userEvent.keyboard("{Tab}");
    await expect.element(handle()).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    await expect.element(handle()).toHaveAttribute("aria-valuenow", "35");
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(handle()).toHaveAttribute("aria-valuenow", "40");
    await userEvent.keyboard("{ArrowLeft}{ArrowDown}");
    await expect.element(handle()).toHaveAttribute("aria-valuenow", "30");
  });

  test("Home and End go to the ends, and Page Up takes a bigger step", async () => {
    await render(<Volume defaultValue={[30]} />);

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{PageUp}");
    await expect.element(handle()).toHaveAttribute("aria-valuenow", "40");
    await userEvent.keyboard("{End}");
    await expect.element(handle()).toHaveAttribute("aria-valuenow", "100");
    await userEvent.keyboard("{Home}");
    await expect.element(handle()).toHaveAttribute("aria-valuenow", "0");
  });

  test("the left and right arrows swap in a right-to-left slider", async () => {
    await render(<Volume dir="rtl" defaultValue={[30]} />);

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{ArrowLeft}");

    await expect.element(handle()).toHaveAttribute("aria-valuenow", "31");
  });

  test("each handle is a tab stop, and one can't pass the other", async () => {
    await render(<Volume defaultValue={[49, 50]} minStepsBetweenThumbs={1} />);

    await userEvent.keyboard("{Tab}");
    await expect.element(handle("Minimum")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(handle("Minimum"))
      .toHaveAttribute("aria-valuenow", "49");

    await userEvent.keyboard("{Tab}");
    await expect.element(handle("Maximum")).toHaveFocus();
  });

  test("a disabled slider is skipped and fades", async () => {
    await render(
      <>
        <Volume disabled />
        <button type="button">Next</button>
      </>,
    );

    await userEvent.keyboard("{Tab}");

    await expect
      .element(page.getByRole("button", { name: "Next" }))
      .toHaveFocus();
    expect(getComputedStyle(root()).opacity).toBe("0.5");
  });
});

describe("pointer", () => {
  test("a press on the track moves the handle there", async () => {
    const onValueCommit = vi.fn();
    await render(<Volume defaultValue={[0]} onValueCommit={onValueCommit} />);

    await userEvent.click(part("track"), { position: { x: 210, y: 3 } });

    // 210px along a 280px track, less the room the handle keeps at each end.
    await expect
      .poll(() => Number(handle().element().getAttribute("aria-valuenow")))
      .toBeGreaterThan(70);
    expect(onValueCommit).toHaveBeenCalledOnce();
  });
});

describe("styles", () => {
  test("fills the width it's given, with a 6px track and a 20px handle", async () => {
    await render(<Volume defaultValue={[30]} />);

    expect(box(root()).width).toBe(280);
    expect(box(root()).height).toBe(20);
    expect(box(part("track")).height).toBe(6);
    expect(box(handle().element()).width).toBe(20);
    expect(box(handle().element()).height).toBe(20);
  });

  test("a vertical slider is tall, and fills from the bottom", async () => {
    await render(<Volume orientation="vertical" defaultValue={[25]} />);
    const track = box(part("track"));
    const range = box(part("range"));

    await expect
      .element(handle())
      .toHaveAttribute("aria-orientation", "vertical");
    expect(box(root()).height).toBe(160);
    expect(box(root()).width).toBe(20);
    expect(track.width).toBe(6);
    expect(range.bottom).toBe(track.bottom);
    expect(range.height).toBeCloseTo(track.height / 4, 0);
  });

  test("fills from the right in a right-to-left slider", async () => {
    await render(<Volume dir="rtl" defaultValue={[25]} />);
    const track = box(part("track"));
    const range = box(part("range"));

    expect(range.right).toBe(track.right);
    expect(center(handle().element())).toBeGreaterThan(
      track.left + track.width / 2,
    );
  });

  test("shows a focus ring for keyboard focus", async () => {
    await render(<Volume />);

    await userEvent.keyboard("{Tab}");

    expect(getComputedStyle(handle().element()).outlineStyle).toBe("solid");
  });

  test("the tap area doesn't reach past the handle with a mouse", async () => {
    await render(<Volume defaultValue={[50]} />);
    const element = handle().element();

    expect(hitAt(element, 0, -18)).not.toBe(element);
  });

  test("variables change the sizes", async () => {
    await render(
      <Volume
        defaultValue={[50]}
        style={
          {
            "--nuv-slider-thumb-size": "32px",
            "--nuv-slider-track-size": "12px",
            "--nuv-slider-width": "200px",
          } as never
        }
      />,
    );

    expect(box(root()).width).toBe(200);
    expect(box(part("track")).height).toBe(12);
    expect(box(handle().element()).width).toBe(32);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with one handle, two, and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 24 }}>
        <Slider aria-label="Volume" defaultValue={[30]} />
        <Slider aria-label="Price" defaultValue={[20, 80]} />
        <Slider aria-label="Locked" defaultValue={[50]} disabled />
      </div>,
    );

    await expectNoViolations(screen.container);
  });

  // None of this is text, so axe doesn't measure it.
  test("the track, the filled part and the handle can be seen", async () => {
    const screen = await renderThemed(
      theme,
      <Slider aria-label="Volume" defaultValue={[50]} />,
    );
    const pageColor = getComputedStyle(
      screen.container.firstElementChild as Element,
    ).backgroundColor;
    const color = (
      name: string,
      property: "backgroundColor" | "borderTopColor",
    ) => getComputedStyle(part(name))[property];

    expect(
      contrast(color("track", "backgroundColor"), pageColor),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast(color("range", "backgroundColor"), pageColor),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast(color("thumb", "borderTopColor"), pageColor),
    ).toBeGreaterThanOrEqual(3);
    // The handle's edge against its own fill, which is what's left of it
    // where it sits on the track.
    expect(
      contrast(
        color("thumb", "borderTopColor"),
        color("thumb", "backgroundColor"),
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});

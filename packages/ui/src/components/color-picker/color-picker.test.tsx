import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  setPageTheme,
  themes,
} from "@nuvui/tooling/test/themed";
import { Component, createRef, type ReactNode, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerPanel,
  type ColorPickerProps,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "./color-picker";

// The whole picker, in the page. It starts on a blue whose hue is 221, with
// 84% saturation and 92% brightness.
function Picker(props: ColorPickerProps) {
  return (
    <ColorPicker defaultValue="#2563eb" {...props}>
      <ColorPickerPanel>
        <ColorPickerArea />
        <ColorPickerHue />
        <ColorPickerInput />
        <ColorPickerSwatches aria-label="Presets">
          <ColorPickerSwatch value="#dc2626" aria-label="Red" />
          <ColorPickerSwatch value="#16A34A" aria-label="Green" />
          <ColorPickerSwatch value="#2563eb" aria-label="Blue" />
        </ColorPickerSwatches>
      </ColorPickerPanel>
    </ColorPicker>
  );
}

// The same parts behind a button.
function Popup(props: ColorPickerProps) {
  return (
    <ColorPicker defaultValue="#2563eb" {...props}>
      <ColorPickerTrigger aria-label="Brand color" />
      <ColorPickerContent>
        <ColorPickerArea />
        <ColorPickerHue />
        <ColorPickerInput />
      </ColorPickerContent>
    </ColorPicker>
  );
}

const area = () =>
  page.getByRole("slider", { name: "Saturation and brightness" });
const hue = () => page.getByRole("slider", { name: "Hue" });
const field = () => page.getByRole("textbox", { name: "Hex color" });
const swatch = (name: string) =>
  page.getByRole("button", { name, exact: true });
const el = (locator: { element(): Element }) =>
  locator.element() as HTMLElement;
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();
const said = () => el(area()).getAttribute("aria-valuetext");

describe("rendering", () => {
  test("the area and the hue are sliders, and say where they are", async () => {
    await render(<Picker />);

    await expect.element(area()).toBeVisible();
    expect(said()).toBe("Saturation 84%, brightness 92%");
    expect(el(area()).getAttribute("aria-valuenow")).toBe("84");
    expect(el(area()).getAttribute("aria-valuemin")).toBe("0");
    expect(el(area()).getAttribute("aria-valuemax")).toBe("100");
    expect(el(hue()).getAttribute("aria-valuenow")).toBe("221");
    expect(el(hue()).getAttribute("aria-valuemax")).toBe("360");
  });

  test("the field shows the color, and the preset that's the color is pressed", async () => {
    await render(<Picker />);

    await expect.element(field()).toHaveValue("#2563eb");
    expect(el(swatch("Blue")).getAttribute("aria-pressed")).toBe("true");
    expect(el(swatch("Red")).getAttribute("aria-pressed")).toBe("false");
  });

  test("a preset written in capitals is the same color", async () => {
    await render(<Picker defaultValue="#16a34a" />);

    expect(el(swatch("Green")).getAttribute("aria-pressed")).toBe("true");
  });

  test("the presets are a group with a name, and one without a name is its hex", async () => {
    await render(
      <ColorPicker>
        <ColorPickerSwatches aria-label="Presets">
          <ColorPickerSwatch value="#DC2626" />
        </ColorPickerSwatches>
      </ColorPicker>,
    );

    await expect
      .element(page.getByRole("group", { name: "Presets" }))
      .toBeVisible();
    await expect.element(swatch("#dc2626")).toBeVisible();
  });

  test("with no color given it starts on black", async () => {
    await render(
      <ColorPicker>
        <ColorPickerInput />
      </ColorPicker>,
    );

    await expect.element(field()).toHaveValue("#000000");
  });

  test("a color that isn't one is shown as black", async () => {
    await render(
      <ColorPicker value="blue">
        <ColorPickerInput />
      </ColorPicker>,
    );

    await expect.element(field()).toHaveValue("#000000");
  });

  test("the words can be yours", async () => {
    await render(
      <ColorPicker defaultValue="#2563eb">
        <ColorPickerArea
          aria-label="Sättigung und Helligkeit"
          getValueText={(saturation, brightness) =>
            `Sättigung ${saturation} %, Helligkeit ${brightness} %`
          }
        />
        <ColorPickerHue aria-label="Farbton" />
        <ColorPickerInput aria-label="Hex-Farbe" />
      </ColorPicker>,
    );
    const thumb = page.getByRole("slider", {
      name: "Sättigung und Helligkeit",
    });

    expect(el(thumb).getAttribute("aria-valuetext")).toBe(
      "Sättigung 84 %, Helligkeit 92 %",
    );
    await expect
      .element(page.getByRole("slider", { name: "Farbton" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("textbox", { name: "Hex-Farbe" }))
      .toBeVisible();
  });

  test("forwards refs, class names and other props", async () => {
    const panel = createRef<HTMLDivElement>();
    const areaRef = createRef<HTMLDivElement>();
    const hueRef = createRef<HTMLSpanElement>();
    const input = createRef<HTMLInputElement>();
    const group = createRef<HTMLDivElement>();
    const button = createRef<HTMLButtonElement>();
    await render(
      <ColorPicker>
        <ColorPickerPanel ref={panel} className="a" data-kind="panel">
          <ColorPickerArea ref={areaRef} className="b" data-kind="area" />
          <ColorPickerHue ref={hueRef} className="c" data-kind="hue" />
          <ColorPickerInput ref={input} className="d" data-kind="input" />
          <ColorPickerSwatches ref={group} className="e" aria-label="Presets">
            <ColorPickerSwatch ref={button} className="f" value="#dc2626" />
          </ColorPickerSwatches>
        </ColorPickerPanel>
      </ColorPicker>,
    );

    expect(panel.current?.className).toBe("nuv-color-picker a");
    expect(panel.current?.dataset.kind).toBe("panel");
    expect(areaRef.current?.className).toBe("nuv-color-picker__area b");
    expect(areaRef.current?.dataset.kind).toBe("area");
    expect(hueRef.current?.className).toBe("nuv-color-picker__hue c");
    expect(hueRef.current?.dataset.kind).toBe("hue");
    expect(input.current?.className).toBe(
      "nuv-input nuv-color-picker__input d",
    );
    expect(input.current?.dataset.kind).toBe("input");
    expect(group.current?.className).toBe("nuv-color-picker__swatches e");
    expect(button.current?.className).toBe("nuv-color-picker__swatch f");
  });

  test("a part outside a picker says what's wrong", async () => {
    class Boundary extends Component<
      { children: ReactNode },
      { message: string }
    > {
      override state = { message: "" };
      static getDerivedStateFromError(error: Error) {
        return { message: error.message };
      }
      override render() {
        return this.state.message ? (
          <p role="alert">{this.state.message}</p>
        ) : (
          this.props.children
        );
      }
    }
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await render(
      <Boundary>
        <ColorPickerArea />
      </Boundary>,
    );

    await expect
      .poll(() => page.getByRole("alert").element().textContent)
      .toBe("ColorPickerArea has to be inside a ColorPicker.");
    quiet.mockRestore();
  });
});

describe("the area", () => {
  test("Right and Left change the saturation, Up and Down the brightness", async () => {
    const onValueChange = vi.fn();
    await render(<Picker onValueChange={onValueChange} />);
    el(area()).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(said()).toBe("Saturation 85%, brightness 92%");
    expect(onValueChange).toHaveBeenLastCalledWith("#2362eb");

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(said()).toBe("Saturation 83%, brightness 92%");
    await userEvent.keyboard("{ArrowUp}");
    expect(said()).toBe("Saturation 83%, brightness 93%");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(said()).toBe("Saturation 83%, brightness 91%");
  });

  test("with Shift they go by ten, and Page Up and Page Down do for brightness", async () => {
    const onValueChange = vi.fn();
    await render(<Picker onValueChange={onValueChange} />);
    el(area()).focus();

    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(said()).toBe("Saturation 94%, brightness 92%");
    expect(onValueChange).toHaveBeenLastCalledWith("#0e53eb");

    await userEvent.keyboard("{PageDown}");
    expect(said()).toBe("Saturation 94%, brightness 82%");
    // It stops at the top, not past it.
    await userEvent.keyboard("{PageUp}{PageUp}{PageUp}");
    expect(said()).toBe("Saturation 94%, brightness 100%");
  });

  test("Home takes all the color out, and End puts all of it in", async () => {
    const onValueChange = vi.fn();
    await render(<Picker onValueChange={onValueChange} />);
    el(area()).focus();

    await userEvent.keyboard("{Home}");
    expect(said()).toBe("Saturation 0%, brightness 92%");
    expect(onValueChange).toHaveBeenLastCalledWith("#ebebeb");

    await userEvent.keyboard("{End}");
    expect(said()).toBe("Saturation 100%, brightness 92%");
    // The blue it was, at full strength: the hue wasn't lost in the grey.
    expect(onValueChange).toHaveBeenLastCalledWith("#004aeb");
  });

  test("each key is one settled color", async () => {
    const onValueCommit = vi.fn();
    await render(<Picker onValueCommit={onValueCommit} />);
    el(area()).focus();

    await userEvent.keyboard("{ArrowRight}{Home}");

    expect(onValueCommit.mock.calls).toEqual([["#2362eb"], ["#ebebeb"]]);
  });

  test("a key it has no use for is left alone", async () => {
    const onKeyDown = vi.fn();
    await render(
      // biome-ignore lint/a11y/noStaticElementInteractions: it listens for what the area let through
      <div onKeyDown={(event) => onKeyDown(event.key, event.defaultPrevented)}>
        <Picker />
      </div>,
    );
    el(area()).focus();

    await userEvent.keyboard("{ArrowRight}a");

    expect(onKeyDown.mock.calls).toEqual([
      ["ArrowRight", true],
      ["a", false],
    ]);
  });

  test("a press in the middle picks half of each, and takes focus", async () => {
    const onValueCommit = vi.fn();
    await render(
      <div
        style={
          {
            width: 200,
            "--nuv-color-picker-area-height": "100px",
          } as never
        }
      >
        <Picker onValueCommit={onValueCommit} />
      </div>,
    );
    const box = el(area()).parentElement as HTMLElement;

    await userEvent.click(box);

    await expect.poll(said).toBe("Saturation 50%, brightness 50%");
    expect(document.activeElement).toBe(el(area()));
    // One press is one settled color.
    expect(onValueCommit).toHaveBeenCalledTimes(1);
  });

  test("a press at an edge picks the most or the least there is", async () => {
    await render(
      <div
        style={
          {
            width: 200,
            "--nuv-color-picker-area-height": "100px",
          } as never
        }
      >
        <Picker />
      </div>,
    );
    const box = el(area()).parentElement as HTMLElement;

    // Halfway along an edge and not at a corner: the corners are rounded,
    // and the very corner isn't part of the area.
    await userEvent.click(box, { position: { x: 199, y: 50 } });
    await expect.poll(said).toBe("Saturation 100%, brightness 50%");

    await userEvent.click(box, { position: { x: 100, y: 99 } });
    await expect.poll(said).toBe("Saturation 50%, brightness 1%");

    await userEvent.click(box, { position: { x: 0, y: 50 } });
    await expect.poll(said).toBe("Saturation 0%, brightness 50%");
  });

  test("the thumb is where the color is", async () => {
    await render(
      <div
        style={
          {
            width: 200,
            "--nuv-color-picker-area-height": "100px",
          } as never
        }
      >
        <Picker defaultValue="#804040" />
      </div>,
    );
    const box = rect(el(area()).parentElement as Element);
    const thumb = rect(el(area()));

    // Half the saturation and half the brightness: the middle.
    expect(thumb.left + thumb.width / 2 - box.left).toBeCloseTo(100, 0);
    expect(thumb.top + thumb.height / 2 - box.top).toBeCloseTo(50, 0);
  });

  test("it isn't turned round in a right-to-left page", async () => {
    await render(
      <div dir="rtl" style={{ width: 200 }}>
        <Picker defaultValue="#ff0000" />
      </div>,
    );
    const box = rect(el(area()).parentElement as Element);
    const thumb = rect(el(area()));
    el(area()).focus();

    // All the saturation is at the right, as it's drawn.
    expect(thumb.left + thumb.width / 2).toBeCloseTo(box.right, 0);
    await userEvent.keyboard("{ArrowLeft}");
    expect(said()).toBe("Saturation 99%, brightness 100%");
  });
});

describe("the hue", () => {
  test("the arrow keys go round the hues, and the color follows", async () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    await render(
      <Picker onValueChange={onValueChange} onValueCommit={onValueCommit} />,
    );
    el(hue()).focus();

    await userEvent.keyboard("{ArrowRight}");

    expect(el(hue()).getAttribute("aria-valuenow")).toBe("222");
    expect(onValueChange).toHaveBeenLastCalledWith("#2560eb");
    expect(onValueCommit).toHaveBeenLastCalledWith("#2560eb");
    // The saturation and the brightness stay where they were.
    expect(said()).toBe("Saturation 84%, brightness 92%");
  });

  test("a key settles on the hue it moved to, not the one before", async () => {
    const onValueCommit = vi.fn();
    await render(<Picker onValueCommit={onValueCommit} />);
    el(hue()).focus();

    await userEvent.keyboard("{ArrowRight}{Home}");

    expect(onValueCommit.mock.calls).toEqual([["#2560eb"], ["#eb2525"]]);
  });

  test("Home is red, and so is End", async () => {
    const onValueChange = vi.fn();
    await render(<Picker onValueChange={onValueChange} />);
    el(hue()).focus();

    await userEvent.keyboard("{Home}");
    expect(el(hue()).getAttribute("aria-valuenow")).toBe("0");
    expect(onValueChange).toHaveBeenLastCalledWith("#eb2525");

    await userEvent.keyboard("{End}");
    expect(el(hue()).getAttribute("aria-valuenow")).toBe("360");
    await expect.element(field()).toHaveValue("#eb2525");
  });

  test("on a grey it moves, though the color can't", async () => {
    const onValueChange = vi.fn();
    await render(
      <Picker defaultValue="#808080" onValueChange={onValueChange} />,
    );
    el(hue()).focus();

    await userEvent.keyboard("{ArrowRight}{ArrowRight}");

    expect(el(hue()).getAttribute("aria-valuenow")).toBe("2");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("Right is the next hue in a right-to-left page too", async () => {
    await render(
      <div dir="rtl">
        <Picker />
      </div>,
    );
    el(hue()).focus();

    await userEvent.keyboard("{ArrowRight}");

    expect(el(hue()).getAttribute("aria-valuenow")).toBe("222");
  });
});

describe("the field", () => {
  test("the color follows once six digits are typed, and Enter settles it", async () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    await render(
      <Picker onValueChange={onValueChange} onValueCommit={onValueCommit} />,
    );

    await userEvent.fill(field(), "#16a34a");

    expect(onValueChange.mock.calls).toEqual([["#16a34a"]]);
    expect(onValueCommit).not.toHaveBeenCalled();
    expect(el(swatch("Green")).getAttribute("aria-pressed")).toBe("true");

    await userEvent.keyboard("{Enter}");
    expect(onValueCommit.mock.calls).toEqual([["#16a34a"]]);
  });

  test("capitals and a missing # are put right", async () => {
    await render(<Picker />);

    await userEvent.fill(field(), "DC2626");
    await userEvent.keyboard("{Enter}");

    await expect.element(field()).toHaveValue("#dc2626");
    expect(el(swatch("Red")).getAttribute("aria-pressed")).toBe("true");
  });

  test("three digits wait until the field is left", async () => {
    const onValueChange = vi.fn();
    await render(<Picker onValueChange={onValueChange} />);

    await userEvent.fill(field(), "#fa0");
    expect(onValueChange).not.toHaveBeenCalled();
    await expect.element(field()).not.toHaveAttribute("aria-invalid");

    await userEvent.tab();

    expect(onValueChange.mock.calls).toEqual([["#ffaa00"]]);
    await expect.element(field()).toHaveValue("#ffaa00");
  });

  test("something that isn't a color is marked, and put back when the field is left", async () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    await render(
      <Picker onValueChange={onValueChange} onValueCommit={onValueCommit} />,
    );

    await userEvent.fill(field(), "blue");
    await expect.element(field()).toHaveAttribute("aria-invalid", "true");

    await userEvent.tab();

    await expect.element(field()).toHaveValue("#2563eb");
    await expect.element(field()).not.toHaveAttribute("aria-invalid");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommit).not.toHaveBeenCalled();
  });

  test("Enter in it doesn't send the form it's in", async () => {
    const onSubmit = vi.fn((event: { preventDefault(): void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Picker />
        <button type="submit">Save</button>
      </form>,
    );

    await userEvent.fill(field(), "#16a34a");
    await userEvent.keyboard("{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("it follows the other parts while it isn't being typed in", async () => {
    await render(<Picker />);

    await userEvent.click(swatch("Red"));

    await expect.element(field()).toHaveValue("#dc2626");
  });
});

describe("the presets", () => {
  test("a press picks one, and it's the one that's pressed", async () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    await render(
      <Picker onValueChange={onValueChange} onValueCommit={onValueCommit} />,
    );

    await userEvent.click(swatch("Green"));

    expect(onValueChange.mock.calls).toEqual([["#16a34a"]]);
    expect(onValueCommit.mock.calls).toEqual([["#16a34a"]]);
    expect(el(swatch("Green")).getAttribute("aria-pressed")).toBe("true");
    expect(el(swatch("Blue")).getAttribute("aria-pressed")).toBe("false");
    expect(el(hue()).getAttribute("aria-valuenow")).toBe("142");
  });

  test("a press you stop does nothing", async () => {
    const onValueChange = vi.fn();
    await render(
      <ColorPicker defaultValue="#2563eb" onValueChange={onValueChange}>
        <ColorPickerSwatches aria-label="Presets">
          <ColorPickerSwatch
            value="#dc2626"
            aria-label="Red"
            onClick={(event) => event.preventDefault()}
          />
        </ColorPickerSwatches>
      </ColorPicker>,
    );

    await userEvent.click(swatch("Red"));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("keeping the color yourself", () => {
  test("the parts follow a color you set", async () => {
    function Kept() {
      const [color, setColor] = useState("#2563eb");
      return (
        <>
          <button type="button" onClick={() => setColor("#dc2626")}>
            Make it red
          </button>
          <Picker value={color} onValueChange={setColor} />
        </>
      );
    }
    await render(<Kept />);

    await userEvent.click(swatch("Make it red"));

    await expect.element(field()).toHaveValue("#dc2626");
    expect(el(hue()).getAttribute("aria-valuenow")).toBe("0");
    expect(said()).toBe("Saturation 83%, brightness 86%");
    expect(el(swatch("Red")).getAttribute("aria-pressed")).toBe("true");
  });

  test("a color you don't take isn't shown", async () => {
    await render(<Picker value="#2563eb" onValueChange={() => {}} />);

    await userEvent.click(swatch("Red"));

    await expect.element(field()).toHaveValue("#2563eb");
    expect(el(swatch("Blue")).getAttribute("aria-pressed")).toBe("true");
    expect(said()).toBe("Saturation 84%, brightness 92%");
  });

  test("a grey set from outside keeps the hue the picker was on", async () => {
    function Kept() {
      const [color, setColor] = useState("#2563eb");
      return (
        <>
          <button type="button" onClick={() => setColor("#808080")}>
            Make it grey
          </button>
          <Picker value={color} onValueChange={setColor} />
        </>
      );
    }
    await render(<Kept />);

    await userEvent.click(swatch("Make it grey"));

    await expect.element(field()).toHaveValue("#808080");
    expect(el(hue()).getAttribute("aria-valuenow")).toBe("221");
    expect(said()).toBe("Saturation 0%, brightness 50%");
  });
});

describe("the trigger", () => {
  const trigger = () => page.getByRole("button", { name: "Brand color" });

  test("shows the color as text, and says it after its name", async () => {
    await render(<Popup />);

    await expect.element(trigger()).toBeVisible();
    expect(el(trigger()).textContent).toBe("#2563eb");
    await expect.element(trigger()).toHaveAccessibleDescription("#2563eb");
    const fill = el(trigger()).querySelector(
      ".nuv-color-picker__trigger-swatch",
    ) as Element;
    expect(style(fill).backgroundColor).toBe("rgb(37, 99, 235)");
    expect(fill.getAttribute("aria-hidden")).toBe("true");
  });

  test("with something of your own in it, the color is still said and not drawn", async () => {
    await render(
      <ColorPicker defaultValue="#2563eb">
        <ColorPickerTrigger aria-label="Brand color" aria-describedby="more">
          Blue
        </ColorPickerTrigger>
        <p id="more">Used for links.</p>
      </ColorPicker>,
    );
    const value = el(trigger()).querySelector(
      ".nuv-color-picker__value",
    ) as HTMLElement;

    await expect
      .element(trigger())
      .toHaveAccessibleDescription("Used for links. #2563eb");
    expect(rect(value).width).toBeLessThanOrEqual(1);
    expect(style(value).position).toBe("absolute");
  });

  test("opens the picker, and Escape closes it and gives focus back", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Popup />);

    await userEvent.click(trigger());
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await expect.element(area()).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(el(trigger()));
  });

  test("follows the color as it's picked", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Popup />);
    await userEvent.click(trigger());

    await userEvent.fill(field(), "#16a34a");
    await userEvent.keyboard("{Enter}");

    expect(el(trigger()).textContent).toBe("#16a34a");
  });

  test("the popover is a dialog with a name, which can be yours", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const first = await render(<Popup />);
    await userEvent.click(trigger());
    await expect
      .element(page.getByRole("dialog", { name: "Color picker" }))
      .toBeVisible();
    await first.unmount();

    await render(
      <ColorPicker defaultOpen>
        <ColorPickerTrigger aria-label="Brand color" />
        <ColorPickerContent aria-label="Farbwähler">
          <ColorPickerInput />
        </ColorPickerContent>
      </ColorPicker>,
    );
    await expect
      .element(page.getByRole("dialog", { name: "Farbwähler" }))
      .toBeVisible();
  });

  test("says when it opens and closes", async () => {
    const onOpenChange = vi.fn();
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Popup onOpenChange={onOpenChange} />);

    await userEvent.click(trigger());
    await userEvent.keyboard("{Escape}");

    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  test("forwards its ref, class name and other props", async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(
      <ColorPicker>
        <ColorPickerTrigger
          ref={ref}
          aria-label="Brand color"
          className="mine"
          data-kind="a"
        />
      </ColorPicker>,
    );

    expect(ref.current?.className).toBe("nuv-color-picker__trigger mine");
    expect(ref.current?.dataset.kind).toBe("a");
    expect(ref.current?.type).toBe("button");
  });
});

describe("in a form", () => {
  test("with a name, the color is sent under it", async () => {
    let sent = "";
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sent = String(new FormData(event.currentTarget).get("accent"));
        }}
      >
        <Picker name="accent" />
        <button type="submit">Save</button>
      </form>,
    );

    await userEvent.click(swatch("Red"));
    await userEvent.click(swatch("Save"));

    expect(sent).toBe("#dc2626");
  });

  test("without a name there's nothing in the form", async () => {
    const screen = await render(<Picker />);

    expect(screen.container.querySelector('input[type="hidden"]')).toBe(null);
  });
});

describe("disabled", () => {
  test("nothing in it can be changed or reached", async () => {
    const onValueChange = vi.fn();
    await render(<Picker disabled onValueChange={onValueChange} />);

    expect(el(area()).tabIndex).toBe(-1);
    expect(el(area()).getAttribute("aria-disabled")).toBe("true");
    expect(el(hue()).hasAttribute("data-disabled")).toBe(true);
    await expect.element(field()).toBeDisabled();
    await expect.element(swatch("Red")).toBeDisabled();

    await userEvent.click(el(area()).parentElement as Element, {
      force: true,
    });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(said()).toBe("Saturation 84%, brightness 92%");
  });

  test("the trigger doesn't open, and the color isn't sent", async () => {
    const screen = await render(
      <form>
        <Popup disabled name="accent" />
      </form>,
    );

    await expect
      .element(page.getByRole("button", { name: "Brand color" }))
      .toBeDisabled();
    const hidden = screen.container.querySelector(
      'input[name="accent"]',
    ) as HTMLInputElement;
    expect(hidden.disabled).toBe(true);
  });

  test("the panel is faded", async () => {
    await render(<Picker disabled />);
    const panel = el(area()).closest(".nuv-color-picker") as Element;

    expect(Number(style(panel).opacity)).toBeLessThan(1);
  });
});

describe("layout", () => {
  test("the panel is 240px wide, with the parts one under the other", async () => {
    await render(<Picker />);
    const panel = el(area()).closest(".nuv-color-picker") as Element;
    const box = rect(el(area()).parentElement as Element);

    expect(rect(panel).width).toBe(240);
    expect(box.width).toBe(240);
    expect(box.height).toBe(160);
    expect(rect(el(hue())).top).toBeGreaterThan(box.bottom);
    expect(rect(el(field())).top).toBeGreaterThan(rect(el(hue())).bottom);
    expect(rect(el(swatch("Red"))).top).toBeGreaterThan(
      rect(el(field())).bottom,
    );
  });

  test("it gives way where there's less room", async () => {
    await render(
      <div style={{ width: 180 }}>
        <Picker />
      </div>,
    );
    const panel = el(area()).closest(".nuv-color-picker") as Element;

    expect(rect(panel).width).toBe(180);
  });

  test("a thumb is 20px, round, with a white ring and a dark line round that", async () => {
    await render(<Picker />);

    for (const thumb of [el(area()), el(hue())]) {
      const drawn = style(thumb);
      expect(rect(thumb).width).toBe(20);
      expect(rect(thumb).height).toBe(20);
      expect(drawn.borderTopColor).toBe("rgb(255, 255, 255)");
      expect(drawn.borderTopWidth).toBe("2px");
      expect(drawn.boxShadow).toContain("rgb(0, 0, 0)");
    }
    // The area's thumb is filled with the color, and the hue's with the hue.
    expect(style(el(area())).backgroundColor).toBe("rgb(37, 99, 235)");
    expect(style(el(hue())).backgroundColor).not.toBe("rgb(37, 99, 235)");
  });

  test("the area is the hue, with white from the side and black from below", async () => {
    await render(<Picker defaultValue="#ff0000" />);
    const drawn = style(el(area()).parentElement as Element);

    expect(drawn.backgroundColor).toBe("rgb(255, 0, 0)");
    expect(drawn.backgroundImage).toContain("to top");
    expect(drawn.backgroundImage).toContain("to right");
    expect(drawn.touchAction).toBe("none");
  });

  test("the hue track is every hue", async () => {
    await render(<Picker />);
    const track = el(hue()).parentElement?.parentElement?.querySelector(
      ".nuv-color-picker__hue-track",
    ) as Element;

    expect(style(track).backgroundImage).toContain("rgb(255, 255, 0)");
    expect(style(track).backgroundImage).toContain("rgb(0, 255, 255)");
    expect(rect(track).width).toBe(240);
  });

  test("with a mouse a preset is 24px square, and shows its color", async () => {
    await render(<Picker />);

    expect(rect(el(swatch("Red"))).width).toBe(24);
    expect(rect(el(swatch("Red"))).height).toBe(24);
    expect(style(el(swatch("Red"))).backgroundColor).toBe("rgb(220, 38, 38)");
  });

  test("the preset that's the color has a ring inside it, and the others none", async () => {
    await render(<Picker />);

    expect(style(el(swatch("Blue"))).boxShadow).toContain("inset");
    expect(style(el(swatch("Red"))).boxShadow).toBe("none");
  });

  test("the focus ring is on whichever part has focus", async () => {
    await render(<Picker />);

    await userEvent.tab();
    expect(document.activeElement).toBe(el(area()));
    expect(style(el(area())).outlineStyle).toBe("solid");

    await userEvent.tab();
    expect(document.activeElement).toBe(el(hue()));
    expect(style(el(hue())).outlineStyle).toBe("solid");
    expect(style(el(area())).outlineStyle).toBe("none");
  });

  test("the popover is as wide as the panel and its own padding", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Popup />);
    await userEvent.click(page.getByRole("button", { name: "Brand color" }));
    const dialog = page.getByRole("dialog");
    await expect.element(dialog).toBeVisible();

    const panel = el(area()).closest(".nuv-color-picker") as Element;
    expect(rect(panel).width).toBe(240);
    expect(rect(dialog.element()).width).toBeGreaterThan(240);
  });
});

describe("theming", () => {
  test("its variables change its look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-color-picker-width": "300px",
            "--nuv-color-picker-gap": "7px",
            "--nuv-color-picker-radius": "3px",
            "--nuv-color-picker-area-height": "90px",
            "--nuv-color-picker-thumb-size": "30px",
            "--nuv-color-picker-track-size": "6px",
            "--nuv-color-picker-swatch-size": "36px",
            "--nuv-color-picker-swatch-radius": "5px",
            "--nuv-color-picker-swatch-gap": "9px",
          } as never
        }
      >
        <Picker />
      </div>,
    );
    const panel = el(area()).closest(".nuv-color-picker") as Element;
    const box = el(area()).parentElement as Element;
    const track = panel.querySelector(
      ".nuv-color-picker__hue-track",
    ) as Element;
    const group = page.getByRole("group", { name: "Presets" }).element();

    expect(rect(panel).width).toBe(300);
    expect(style(panel).rowGap).toBe("7px");
    expect(rect(box).height).toBe(90);
    expect(style(box).borderTopLeftRadius).toBe("3px");
    expect(rect(el(area())).width).toBe(30);
    expect(rect(el(hue())).width).toBe(30);
    expect(rect(track).height).toBe(6);
    expect(rect(el(swatch("Red"))).width).toBe(36);
    expect(style(el(swatch("Red"))).borderTopLeftRadius).toBe("5px");
    expect(style(group).columnGap).toBe("9px");
  });

  test("the trigger's variables change it", async () => {
    await render(
      <div
        style={
          {
            "--nuv-color-picker-trigger-bg": "rgb(1, 2, 3)",
            "--nuv-color-picker-trigger-border": "rgb(4, 5, 6)",
            "--nuv-color-picker-radius": "2px",
          } as never
        }
      >
        <Popup />
      </div>,
    );
    const drawn = style(el(page.getByRole("button", { name: "Brand color" })));

    expect(drawn.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(drawn.borderTopColor).toBe("rgb(4, 5, 6)");
    expect(drawn.borderTopLeftRadius).toBe("2px");
  });

  test.each(themes)(
    "the trigger's text and edge can be read in %s",
    async (theme) => {
      await renderThemed(theme, <Popup />);
      const drawn = style(
        el(page.getByRole("button", { name: "Brand color" })),
      );

      expect(
        contrast(drawn.color, drawn.backgroundColor),
      ).toBeGreaterThanOrEqual(4.5);
      // An edge is what says it's a control, so it has to be seen.
      expect(
        contrast(drawn.borderTopColor, drawn.backgroundColor),
      ).toBeGreaterThanOrEqual(3);
    },
  );
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe as a panel in the page", async () => {
    const screen = await renderThemed(theme, <Picker />);

    await expectNoViolations(screen.container);
  });

  test("passes axe as a button, closed and open", async () => {
    // The popover is drawn at the end of the page, so the theme has to be
    // on the page for it to have one.
    setPageTheme(theme);
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Popup />);
    await expectNoViolations(document.body);

    await userEvent.click(page.getByRole("button", { name: "Brand color" }));
    await expect.element(page.getByRole("dialog")).toBeVisible();

    await expectNoViolations(document.body);
  });
});

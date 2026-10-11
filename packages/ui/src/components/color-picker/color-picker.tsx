"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  type ButtonHTMLAttributes,
  type ComponentRef,
  type CSSProperties,
  createContext,
  type FocusEvent,
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import { PopoverContent, type PopoverContentProps } from "../popover";
import { type Hsv, hexToHsv, hsvToHex, parseHex } from "./color";

interface ColorPickerContextValue {
  hex: string;
  hsv: Hsv;
  disabled: boolean;
  /** The id of the text that says the color, for the trigger to point at. */
  valueId: string;
  /** While a thumb is dragged or a field typed in. */
  change: (next: Hsv) => void;
  /** When the drag ends, a key is pressed, or a color is chosen outright. */
  commit: (next?: Hsv) => void;
}

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

function usePicker(part: string) {
  const picker = useContext(ColorPickerContext);
  if (!picker) throw new Error(`${part} has to be inside a ColorPicker.`);
  return picker;
}

// Every hue at full strength, for the track of the hue slider. It's the
// same in every theme, and a color written in the stylesheet wouldn't be.
const hues =
  "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export interface ColorPickerOwnProps {
  /** The color, as `#rrggbb`, when you control it. */
  value?: string;
  /**
   * The color at first, when you don't.
   * @default "#000000"
   */
  defaultValue?: string;
  /** Called with the color as it changes, many times during a drag. */
  onValueChange?: (value: string) => void;
  /**
   * Called with the color once it's settled: when a drag ends, a key is
   * pressed, a preset is chosen, or a typed color is entered. The place to
   * save from.
   */
  onValueCommit?: (value: string) => void;
  /**
   * Stops the color being changed, and the trigger from opening.
   * @default false
   */
  disabled?: boolean;
  /** Puts the color in a form under this name. */
  name?: string;
  /** Whether the popover is open, when you control it. */
  open?: boolean;
  /** Whether it's open at first, when you don't. */
  defaultOpen?: boolean;
  /** Called when the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The trigger and the content, or the panel alone for a picker in the page. */
  children?: ReactNode;
}

export type ColorPickerProps = ColorPickerOwnProps;

/**
 * Picks a color: an area and a slider to pick with, a field to type into,
 * and presets. It keeps the color and draws nothing itself. Put a
 * `ColorPickerTrigger` and a `ColorPickerContent` in it for a button that
 * opens a popover, or a `ColorPickerPanel` for a picker in the page.
 */
export function ColorPicker({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  disabled = false,
  name,
  open,
  defaultOpen,
  onOpenChange,
  children,
}: ColorPickerProps) {
  const [color, setColor] = useControllableState({
    prop: value,
    defaultProp: defaultValue ?? "#000000",
    onChange: onValueChange,
  });
  const hex = parseHex(color ?? "") ?? "#000000";
  const valueId = useId();

  // The color as hue, saturation and brightness, kept beside the hex it
  // makes. Hex alone forgets the hue of a grey and the saturation of black,
  // and the thumbs would jump back to the corner as they reached one.
  const [kept, setKept] = useState(() => ({ hex, hsv: hexToHsv(hex) }));
  let { hsv } = kept;
  if (kept.hex !== hex) {
    // Changed from outside: by you, or by a form being reset.
    const next = hexToHsv(hex);
    hsv = {
      h: next.s === 0 ? kept.hsv.h : next.h,
      s: next.v === 0 ? kept.hsv.s : next.s,
      v: next.v,
    };
    setKept({ hex, hsv });
  }

  // What the last change made, for `commit` to report: a drag ends in an
  // event of its own, after the state it ended on.
  const latest = useRef(hex);
  latest.current = hex;

  const change = useCallback(
    (next: Hsv) => {
      const made = hsvToHex(next);
      latest.current = made;
      setKept({ hex: made, hsv: next });
      setColor(made);
    },
    [setColor],
  );

  const commit = useCallback(
    (next?: Hsv) => {
      if (next) change(next);
      onValueCommit?.(latest.current);
    },
    [change, onValueCommit],
  );

  const context = useMemo<ColorPickerContextValue>(
    () => ({ hex, hsv, disabled, valueId, change, commit }),
    [hex, hsv, disabled, valueId, change, commit],
  );

  return (
    <ColorPickerContext.Provider value={context}>
      <PopoverPrimitive.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        {children}
      </PopoverPrimitive.Root>
      {name ? (
        <input type="hidden" name={name} value={hex} disabled={disabled} />
      ) : null}
    </ColorPickerContext.Provider>
  );
}

export interface ColorPickerTriggerOwnProps {
  /**
   * What the button shows after the swatch. Left out, it's the color as
   * text, `#rrggbb`.
   */
  children?: ReactNode;
}

export interface ColorPickerTriggerProps
  extends ColorPickerTriggerOwnProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "value"> {}

/**
 * The button that opens the picker. It shows the color as a swatch and as
 * text. Name it with `aria-label` or a label: the color is read after the
 * name.
 */
export const ColorPickerTrigger = forwardRef<
  HTMLButtonElement,
  ColorPickerTriggerProps
>(function ColorPickerTrigger(
  { className, children, "aria-describedby": describedBy, ...props },
  ref,
) {
  const picker = usePicker("ColorPickerTrigger");

  return (
    <PopoverPrimitive.Trigger asChild>
      <button
        ref={ref}
        type="button"
        disabled={picker.disabled}
        className={cx("nuv-color-picker__trigger", className)}
        // A name from a label replaces what's in the button, the color
        // with it. As a description it's read whatever the name is.
        aria-describedby={cx(describedBy, picker.valueId)}
        {...props}
      >
        <span
          aria-hidden="true"
          className="nuv-color-picker__trigger-swatch"
          style={{ "--nuv-color-picker-color": picker.hex } as CSSProperties}
        />
        {children}
        <span
          id={picker.valueId}
          className={
            children === undefined
              ? "nuv-color-picker__value"
              : "nuv-color-picker__value nuv-color-picker__value--hidden"
          }
        >
          {picker.hex}
        </span>
      </button>
    </PopoverPrimitive.Trigger>
  );
});

export type ColorPickerPanelProps = HTMLAttributes<HTMLDivElement>;

/**
 * The picker's parts, one under the other. `ColorPickerContent` has one
 * inside it. Use it by itself for a picker that's in the page, not in a
 * popover.
 */
export const ColorPickerPanel = forwardRef<
  HTMLDivElement,
  ColorPickerPanelProps
>(function ColorPickerPanel({ className, ...props }, ref) {
  const picker = usePicker("ColorPickerPanel");

  return (
    <div
      ref={ref}
      data-disabled={picker.disabled ? "" : undefined}
      className={cx("nuv-color-picker", className)}
      {...props}
    />
  );
});

export interface ColorPickerContentOwnProps {
  /**
   * The popover's name for a screen reader. It's a dialog, and a dialog
   * has to have one.
   * @default "Color picker"
   */
  "aria-label"?: string;
}

export interface ColorPickerContentProps
  extends ColorPickerContentOwnProps,
    Omit<PopoverContentProps, "aria-label"> {}

/** The popover the trigger opens, with a `ColorPickerPanel` in it. */
export const ColorPickerContent = forwardRef<
  ComponentRef<typeof PopoverContent>,
  ColorPickerContentProps
>(function ColorPickerContent(
  {
    "aria-label": label,
    "aria-labelledby": labelledBy,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <PopoverContent
      ref={ref}
      align="start"
      // A name of yours from somewhere else in the page takes the place
      // of the one it comes with.
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? label : (label ?? "Color picker")}
      className={cx("nuv-color-picker__content", className)}
      {...props}
    >
      <ColorPickerPanel>{children}</ColorPickerPanel>
    </PopoverContent>
  );
});

export interface ColorPickerAreaOwnProps {
  /**
   * The thumb's name for a screen reader.
   * @default "Saturation and brightness"
   */
  "aria-label"?: string;
  /**
   * What a screen reader says for where the thumb is. It's given the
   * saturation and the brightness, each from 0 to 100.
   * @default "Saturation 50%, brightness 50%"
   */
  getValueText?: (saturation: number, brightness: number) => string;
}

export interface ColorPickerAreaProps
  extends ColorPickerAreaOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, "aria-label"> {}

/**
 * The square to pick from: more color to the right, lighter towards the
 * top. Drag in it, or move its thumb with the arrow keys.
 */
export const ColorPickerArea = forwardRef<HTMLDivElement, ColorPickerAreaProps>(
  function ColorPickerArea(
    {
      "aria-label": label = "Saturation and brightness",
      getValueText = (saturation, brightness) =>
        `Saturation ${saturation}%, brightness ${brightness}%`,
      className,
      style,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      ...props
    },
    ref,
  ) {
    const picker = usePicker("ColorPickerArea");
    const thumb = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const { h, s, v } = picker.hsv;

    // Where a pointer is in the area, as saturation and brightness.
    const at = (event: PointerEvent<HTMLDivElement>): Hsv => {
      const box = event.currentTarget.getBoundingClientRect();
      return {
        h,
        s: clamp(((event.clientX - box.left) / box.width) * 100),
        v: clamp(100 - ((event.clientY - box.top) / box.height) * 100),
      };
    };

    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
      onPointerDown?.(event);
      if (event.defaultPrevented || picker.disabled || event.button !== 0) {
        return;
      }
      // The drag goes on outside the area, and stops at its edge.
      event.currentTarget.setPointerCapture(event.pointerId);
      dragging.current = true;
      // A press would otherwise start selecting the text around it.
      event.preventDefault();
      thumb.current?.focus();
      picker.change(at(event));
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
      onPointerMove?.(event);
      if (dragging.current) picker.change(at(event));
    }

    function handlePointerEnd() {
      if (!dragging.current) return;
      dragging.current = false;
      picker.commit();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      if (picker.disabled || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      const step = event.shiftKey ? 10 : 1;
      // From the whole numbers a screen reader was told, so ten presses
      // of a key are ten of what it said.
      const saturation = Math.round(s);
      const brightness = Math.round(v);
      let next: Hsv;
      switch (event.key) {
        case "ArrowRight":
          next = { h, s: clamp(saturation + step), v };
          break;
        case "ArrowLeft":
          next = { h, s: clamp(saturation - step), v };
          break;
        case "ArrowUp":
          next = { h, s, v: clamp(brightness + step) };
          break;
        case "ArrowDown":
          next = { h, s, v: clamp(brightness - step) };
          break;
        case "PageUp":
          next = { h, s, v: clamp(brightness + 10) };
          break;
        case "PageDown":
          next = { h, s, v: clamp(brightness - 10) };
          break;
        case "Home":
          next = { h, s: 0, v };
          break;
        case "End":
          next = { h, s: 100, v };
          break;
        default:
          return;
      }
      event.preventDefault();
      picker.commit(next);
    }

    return (
      <div
        ref={ref}
        data-disabled={picker.disabled ? "" : undefined}
        className={cx("nuv-color-picker__area", className)}
        style={
          {
            // The hue at full strength, which the white and the black are
            // laid over.
            "--nuv-color-picker-hue": hsvToHex({ h, s: 100, v: 100 }),
            ...style,
          } as CSSProperties
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          handlePointerEnd();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          handlePointerEnd();
        }}
        {...props}
      >
        <div
          ref={thumb}
          role="slider"
          tabIndex={picker.disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(s)}
          aria-valuetext={getValueText(Math.round(s), Math.round(v))}
          aria-disabled={picker.disabled ? true : undefined}
          className="nuv-color-picker__area-thumb"
          style={
            {
              "--nuv-color-picker-color": picker.hex,
              "--nuv-color-picker-x": `${s}%`,
              "--nuv-color-picker-y": `${100 - v}%`,
            } as CSSProperties
          }
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  },
);

export interface ColorPickerHueOwnProps {
  /**
   * The slider's name for a screen reader.
   * @default "Hue"
   */
  "aria-label"?: string;
}

export interface ColorPickerHueProps
  extends ColorPickerHueOwnProps,
    Omit<
      HTMLAttributes<HTMLSpanElement>,
      "aria-label" | "defaultValue" | "dir"
    > {}

/** The slider for the hue: red, round through the rainbow, to red again. */
export const ColorPickerHue = forwardRef<HTMLSpanElement, ColorPickerHueProps>(
  function ColorPickerHue(
    { "aria-label": label = "Hue", className, style, ...props },
    ref,
  ) {
    const picker = usePicker("ColorPickerHue");
    const { h, s, v } = picker.hsv;

    return (
      <SliderPrimitive.Root
        ref={ref}
        // The rainbow is drawn one way round, whichever way the page
        // reads, and the keys go with what's drawn.
        dir="ltr"
        min={0}
        max={360}
        step={1}
        value={[Math.round(h)]}
        disabled={picker.disabled}
        onValueChange={([next]) => picker.change({ h: next ?? 0, s, v })}
        // With the hue it settled on, and not whatever `change` last made:
        // Radix says a key has settled before it says what it changed.
        onValueCommit={([next]) => picker.commit({ h: next ?? 0, s, v })}
        className={cx("nuv-color-picker__hue", className)}
        style={{ "--nuv-color-picker-hues": hues, ...style } as CSSProperties}
        {...props}
      >
        <SliderPrimitive.Track className="nuv-color-picker__hue-track" />
        <SliderPrimitive.Thumb
          aria-label={label}
          className="nuv-color-picker__hue-thumb"
          style={
            {
              "--nuv-color-picker-color": hsvToHex({ h, s: 100, v: 100 }),
            } as CSSProperties
          }
        />
      </SliderPrimitive.Root>
    );
  },
);

export interface ColorPickerInputOwnProps {
  /**
   * The field's name for a screen reader.
   * @default "Hex color"
   */
  "aria-label"?: string;
}

export interface ColorPickerInputProps
  extends ColorPickerInputOwnProps,
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "aria-label" | "value" | "defaultValue" | "type"
    > {}

/**
 * A field to type the color into, as `#rrggbb`. The color follows as soon
 * as six digits are there. Something that isn't a color is put back to
 * what it was when the field is left.
 */
export const ColorPickerInput = forwardRef<
  HTMLInputElement,
  ColorPickerInputProps
>(function ColorPickerInput(
  {
    "aria-label": label = "Hex color",
    className,
    onChange,
    onBlur,
    onKeyDown,
    ...props
  },
  ref,
) {
  const picker = usePicker("ColorPickerInput");
  // What's being typed, while it's being typed. Otherwise it's the color.
  const [draft, setDraft] = useState<string | null>(null);

  function settle() {
    const typed = draft === null ? null : parseHex(draft);
    setDraft(null);
    if (typed) picker.commit(hexToHsv(typed));
  }

  return (
    <input
      ref={ref}
      type="text"
      aria-label={label}
      aria-invalid={
        draft !== null && parseHex(draft) === null ? true : undefined
      }
      disabled={picker.disabled}
      // A color isn't a word.
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      maxLength={7}
      className={cx("nuv-input nuv-color-picker__input", className)}
      value={draft ?? picker.hex}
      onChange={(event) => {
        onChange?.(event);
        const text = event.target.value;
        setDraft(text);
        // Three digits are a color too, and also the start of six. The
        // color waits for all six, so it doesn't flash through another on
        // the way.
        if (/^#?[0-9a-f]{6}$/i.test(text.trim())) {
          const typed = parseHex(text);
          if (typed) picker.change(hexToHsv(typed));
        }
      }}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        onBlur?.(event);
        settle();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === "Enter" && !event.defaultPrevented) {
          // Not the form's to send, if the picker is in one.
          event.preventDefault();
          settle();
        }
      }}
      {...props}
    />
  );
});

export type ColorPickerSwatchesProps = HTMLAttributes<HTMLDivElement>;

/** A set of `ColorPickerSwatch`es. Give it a name with `aria-label`. */
export const ColorPickerSwatches = forwardRef<
  HTMLDivElement,
  ColorPickerSwatchesProps
>(function ColorPickerSwatches({ className, ...props }, ref) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a group of buttons with a name, which a fieldset would draw a box around
    <div
      ref={ref}
      role="group"
      className={cx("nuv-color-picker__swatches", className)}
      {...props}
    />
  );
});

export interface ColorPickerSwatchOwnProps {
  /** The color it picks, as `#rrggbb`. */
  value: string;
}

export interface ColorPickerSwatchProps
  extends ColorPickerSwatchOwnProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "children"> {}

/**
 * A color to pick with one press. Name it with `aria-label`: "Red", or
 * your brand's name for it. Left out, its name is the hex.
 */
export const ColorPickerSwatch = forwardRef<
  HTMLButtonElement,
  ColorPickerSwatchProps
>(function ColorPickerSwatch(
  { value, className, style, onClick, "aria-label": label, ...props },
  ref,
) {
  const picker = usePicker("ColorPickerSwatch");
  const hex = parseHex(value) ?? "#000000";

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label ?? hex}
      aria-pressed={picker.hex === hex}
      disabled={picker.disabled}
      className={cx("nuv-color-picker__swatch", className)}
      style={{ "--nuv-color-picker-color": hex, ...style } as CSSProperties}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) picker.commit(hexToHsv(hex));
      }}
      {...props}
    />
  );
});

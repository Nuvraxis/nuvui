"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { cx } from "../../utils/cx";
import {
  type FormatNumberOptions,
  formatNumber,
} from "../formatted-number/formatted-number";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export interface NumberFieldOwnProps {
  /** The number, when you control it yourself. `null` is an empty field. */
  value?: number | null;
  /** The number at first, when you don't control it. */
  defaultValue?: number | null;
  /**
   * Called with the new number when it changes: on a press of a button or
   * an arrow key, and when typing is finished, which is on Enter and on
   * leaving the field. Not on every key. `null` means the field was
   * emptied.
   */
  onValueChange?: (value: number | null) => void;
  /** The least the number can be. A smaller one is raised to it. */
  min?: number;
  /** The most the number can be. A larger one is lowered to it. */
  max?: number;
  /**
   * How much a button or an arrow key changes the number by.
   * @default 1
   */
  step?: number;
  /**
   * How much Page Up and Page Down change it by. Ten steps unless you say
   * otherwise.
   */
  largeStep?: number;
  /**
   * How the number is written when it isn't being typed: a locale, a
   * currency, a percentage, a number of decimals. What's typed is read by
   * the same rules, so in German `1.234,5` is one number.
   */
  format?: FormatNumberOptions;
  /**
   * Accessible name of the button that raises the number. Translate it
   * with the rest of your interface.
   * @default "Increase"
   */
  incrementLabel?: string;
  /**
   * Accessible name of the button that lowers the number. Translate it
   * with the rest of your interface.
   * @default "Decrease"
   */
  decrementLabel?: string;
  /**
   * The name the number is submitted under in a form. What's sent is the
   * plain number, such as `1234.5`, however it's written on the screen.
   */
  name?: string;
}

export interface NumberFieldProps
  extends NumberFieldOwnProps,
    Omit<
      InputProps,
      | keyof NumberFieldOwnProps
      | "type"
      | "role"
      | "inputMode"
      | "onChange"
      | "children"
    > {}

const decimalsOf = (number: number) => {
  const [, decimals = ""] = String(number).split(".");
  // A number as small as 1e-7 is written with an exponent.
  const exponent = String(number).match(/e-(\d+)$/);
  return exponent ? Number(exponent[1]) : decimals.length;
};

// What a locale writes for a decimal point, a minus and each digit, found
// by asking it to write a number that has them all.
function symbolsOf({ locale = "en-US", options }: FormatNumberOptions) {
  // The digits a format writes are the ones it reads.
  const numberingSystem = options?.numberingSystem;
  const parts = new Intl.NumberFormat(locale, {
    numberingSystem,
  }).formatToParts(-1234567.8);
  const digits = new Intl.NumberFormat(locale, {
    numberingSystem,
    useGrouping: false,
  })
    .format(9876543210)
    .split("")
    .reverse();
  return {
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
    minus: parts.find((part) => part.type === "minusSign")?.value ?? "-",
    digits,
  };
}

/**
 * The number in a piece of text someone typed. `null` when there's none
 * to read, and `undefined` when what's there isn't a number.
 */
function parse(text: string, format: FormatNumberOptions) {
  const { decimal, minus, digits } = symbolsOf(format);
  let plain = "";
  for (const character of text) {
    const digit = digits.indexOf(character);
    if (digit >= 0) plain += digit;
    else if (/[0-9]/.test(character)) plain += character;
    else if (character === decimal) plain += ".";
    else if (character === minus || character === "-" || character === "−") {
      plain += "-";
    }
    // Anything else is a space between thousands, a currency or a unit.
  }
  // Nothing typed is an empty field. Something typed with no digit in it
  // is a mistake.
  if (plain === "") return text.trim() === "" ? null : undefined;
  const number = Number(plain);
  if (!Number.isFinite(number)) return undefined;
  const percent =
    (format.options?.style ?? format.format) === "percent" ? 100 : 1;
  return number / percent;
}

// How many decimals of a value survive being written in this format.
function precisionOf(format: FormatNumberOptions, step: number) {
  const { locale = "en-US", options, ...rest } = format;
  const style =
    options?.style ?? rest.format ?? (rest.currency ? "currency" : "decimal");
  const resolved = new Intl.NumberFormat(locale, {
    style,
    ...(rest.currency ? { currency: rest.currency } : {}),
    ...(rest.minimumFractionDigits === undefined
      ? {}
      : { minimumFractionDigits: rest.minimumFractionDigits }),
    ...(rest.maximumFractionDigits === undefined
      ? {}
      : { maximumFractionDigits: rest.maximumFractionDigits }),
    ...options,
  }).resolvedOptions();
  const shown =
    (resolved.maximumFractionDigits ?? 3) + (style === "percent" ? 2 : 0);
  return Math.min(Math.max(shown, decimalsOf(step)), 20);
}

const noFormat: FormatNumberOptions = {};

// How long a button is held before it starts to repeat, and how often it
// repeats after that, in milliseconds.
const holdDelay = 400;
const holdEvery = 60;

/**
 * A field for a number, with a button at each end to step it. The arrow
 * keys step it too. It's a spinbutton to a screen reader, which reads the
 * number as it's written on the screen.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    {
      value: valueProp,
      defaultValue = null,
      onValueChange,
      min,
      max,
      step = 1,
      largeStep = step * 10,
      format = noFormat,
      incrementLabel = "Increase",
      decrementLabel = "Decrease",
      name,
      form,
      className,
      disabled = false,
      readOnly = false,
      onBlur,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const [ownValue, setOwnValue] = useState(defaultValue);
    const value = valueProp === undefined ? ownValue : valueProp;
    // What's in the field while it's being typed into. `null` the rest of
    // the time, when the field shows the number as the format writes it.
    const [draft, setDraft] = useState<string | null>(null);

    const precision = precisionOf(format, step);
    const fit = (number: number) => {
      const bounded = Math.min(
        max ?? Number.POSITIVE_INFINITY,
        Math.max(min ?? Number.NEGATIVE_INFINITY, number),
      );
      // Rounded to what the format can show, which also takes off the
      // stray digits that adding decimals leaves, as in 0.1 + 0.2.
      return Number(bounded.toFixed(precision));
    };

    const change = (next: number | null) => {
      setDraft(null);
      if (next === value) return;
      setOwnValue(next);
      onValueChange?.(next);
    };

    // The number as it stands, counting what's typed and not yet taken.
    const current = () => {
      if (draft === null) return value;
      const typed = parse(draft, format);
      return typed === undefined ? value : typed;
    };

    const commit = () => {
      if (draft === null) return;
      const typed = parse(draft, format);
      // Text that isn't a number is dropped, and the field goes back to
      // the number it had.
      if (typed === undefined) setDraft(null);
      else change(typed === null ? null : fit(typed));
    };

    const stepBy = (amount: number) => {
      const from = current();
      // From an empty field, the first press gives the nearest end, or zero.
      if (from === null) change(fit(amount > 0 ? (min ?? 0) : (max ?? 0)));
      else change(fit(from + amount));
    };

    // The newest `stepBy`, for a timer that outlives the render it was
    // started in.
    const stepRef = useRef(stepBy);
    stepRef.current = stepBy;
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const release = useCallback(() => {
      clearTimeout(timer.current);
      clearInterval(timer.current);
      timer.current = undefined;
    }, []);
    useEffect(() => release, [release]);
    // A button that reaches the end is disabled, and a disabled button
    // never hears the pointer let go.
    const atEnd =
      value !== null &&
      ((min !== undefined && value <= min) ||
        (max !== undefined && value >= max));
    useEffect(() => {
      if (atEnd) release();
    }, [atEnd, release]);

    const hold = (amount: number) => (event: PointerEvent) => {
      // The main button of a mouse, a finger or a pen.
      if (event.button !== 0) return;
      stepRef.current(amount);
      release();
      timer.current = setTimeout(() => {
        timer.current = setInterval(() => stepRef.current(amount), holdEvery);
      }, holdDelay);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || readOnly) return;
      const moves: Record<string, (() => void) | undefined> = {
        ArrowUp: () => stepBy(step),
        ArrowDown: () => stepBy(-step),
        PageUp: () => stepBy(largeStep),
        PageDown: () => stepBy(-largeStep),
        Home: min === undefined ? undefined : () => change(fit(min)),
        End: max === undefined ? undefined : () => change(fit(max)),
      };
      const move = moves[event.key];
      if (move) {
        event.preventDefault();
        move();
      }
      // Not prevented: Enter still submits the form. The number is taken
      // and drawn at once, because the form reads the hidden input as soon
      // as this handler returns, which in Firefox is before React would
      // otherwise have drawn it.
      if (event.key === "Enter") flushSync(commit);
    };

    const text = draft ?? (value === null ? "" : formatNumber(value, format));
    const still = disabled || readOnly;
    const whole = precision === 0;

    return (
      // The class name goes on the box. Everything else is the input's.
      <span className={cx("nuv-number-field", className)}>
        <button
          type="button"
          // The arrow keys do this from the field, so Tab doesn't stop here.
          tabIndex={-1}
          className="nuv-number-field__button"
          aria-label={decrementLabel}
          disabled={
            still || (value !== null && min !== undefined && value <= min)
          }
          onPointerDown={hold(-step)}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          // A press that didn't come from a pointer: a screen reader's, or
          // a switch's.
          onClick={(event) => {
            if (event.detail === 0) stepBy(-step);
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M3.5 8h9" />
          </svg>
        </button>
        <input
          ref={ref}
          type="text"
          role="spinbutton"
          // A keypad with digits where that's all that can be typed. One
          // with a minus sign is only on the full keyboard.
          inputMode={
            min !== undefined && min >= 0
              ? whole
                ? "numeric"
                : "decimal"
              : "text"
          }
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="nuv-number-field__control"
          aria-valuenow={value ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={
            value === null ? undefined : formatNumber(value, format)
          }
          disabled={disabled}
          readOnly={readOnly}
          value={text}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => {
            commit();
            onBlur?.(event);
          }}
          onKeyDown={handleKeyDown}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          className="nuv-number-field__button"
          aria-label={incrementLabel}
          disabled={
            still || (value !== null && max !== undefined && value >= max)
          }
          onPointerDown={hold(step)}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          onClick={(event) => {
            if (event.detail === 0) stepBy(step);
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M3.5 8h9M8 3.5v9" />
          </svg>
        </button>
        {name ? (
          <input
            type="hidden"
            name={name}
            form={form}
            value={value ?? ""}
            disabled={disabled}
          />
        ) : null}
      </span>
    );
  },
);

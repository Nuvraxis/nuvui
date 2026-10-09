"use client";

import { Input } from "@nuvui/react/input";
import { InputGroup, InputGroupButton } from "@nuvui/react/input-group";
import { Popover, PopoverAnchor, PopoverTrigger } from "@nuvui/react/popover";
import {
  type FocusEvent,
  forwardRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type {
  DateRange,
  Matcher,
  PropsBase,
  PropsRange,
} from "react-day-picker";
import { cx } from "../../utils/cx";
import {
  disabledDays,
  formatDate,
  isDisabled,
  isoDate,
  shortPattern,
} from "../../utils/dates";
import { useControlled } from "../../utils/use-controlled";
import { useDateText } from "../../utils/use-date-text";
import { useIsPhone } from "../../utils/use-is-phone";
import { Calendar, type CalendarLocale } from "../calendar/calendar";
import { Popup } from "./popup";

/**
 * The calendar's own options, for the ones the picker doesn't set itself:
 * `captionLayout`, `showWeekNumber`, `labels` and the rest.
 */
export type DatePickerCalendarProps = Omit<
  PropsBase,
  | "mode"
  | "required"
  | "disabled"
  | "locale"
  | "timeZone"
  | "weekStartsOn"
  | "startMonth"
  | "endMonth"
  | "animate"
  | "autoFocus"
  | "dir"
>;

/**
 * The same for a range, with the three options only a range has: the
 * fewest and the most days it may span, and whether it may run across a
 * day that can't be picked.
 */
export type DateRangePickerCalendarProps = DatePickerCalendarProps &
  Pick<PropsRange, "min" | "max" | "excludeDisabled">;

type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "value"
  | "defaultValue"
  | "onChange"
  | "min"
  | "max"
  | "type"
  | "name"
  | "form"
  | "children"
>;

interface SharedProps {
  /**
   * Whether the calendar is open. Use it with `onOpenChange`.
   */
  open?: boolean;
  /**
   * Whether the calendar starts out open.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the calendar opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The earliest day that can be picked or typed. */
  min?: Date;
  /** The latest day that can be picked or typed. */
  max?: Date;
  /**
   * Days that can't be picked or typed: a date, a list of them, a range,
   * `{ dayOfWeek: [0, 6] }` for weekends, or a function that's given a date.
   */
  disabledDates?: Matcher | Matcher[];
  /**
   * The language of the calendar, and the order a typed date is read in.
   * Take one from `@nuvui/date-picker/locale`.
   * @default enUS
   */
  locale?: CalendarLocale;
  /**
   * The day a week starts on, from 0 for Sunday. Left out, it's the
   * locale's.
   */
  weekStartsOn?: PropsBase["weekStartsOn"];
  /**
   * The time zone the days are in, as an IANA name such as
   * `"Asia/Tokyo"`. Left out, it's the browser's. Dates are then handed
   * back as `TZDate`s.
   */
  timeZone?: string;
  /**
   * The pattern a typed date is read and written in, in date-fns' tokens.
   * `"P"` is the locale's own short date, `MM/dd/yyyy` in the United
   * States.
   * @default "P"
   */
  format?: string;
  /**
   * What the browser is told when the text isn't a date, or is one that
   * can't be picked. It's shown when a form with the field is submitted.
   * @default "Enter a valid date."
   */
  invalidMessage?: string;
  /**
   * Accessible name of the button that opens the calendar. The picked date
   * is read after it.
   * @default "Choose date"
   */
  calendarLabel?: string;
  /**
   * Accessible name of the calendar's panel, and the heading of the sheet
   * it opens in on a phone.
   * @default "Choose date"
   */
  title?: string;
  /**
   * Accessible name of the sheet's close button.
   * @default "Close"
   */
  closeLabel?: string;
  /**
   * The `id` of the form the value belongs to, when the field is outside
   * it.
   */
  form?: string;
  /**
   * The element the calendar is rendered into. Set this when it should pick
   * up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: Element | DocumentFragment | null;
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3m5-3v3" />
    </svg>
  );
}

// "MM/dd/yyyy" as a hint to someone typing: "mm/dd/yyyy".
function hint(format: string, locale: CalendarLocale | undefined) {
  return (format === "P" ? shortPattern(locale) : format).toLowerCase();
}

// A form's reset button puts an uncontrolled field back to how it started.
function useFormReset(
  input: { current: HTMLInputElement | null },
  onReset: () => void,
) {
  const latest = useRef(onReset);
  latest.current = onReset;

  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const reset = () => latest.current();
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [input]);
}

// One ref for the caller and one for the component, on the same element.
function useMergedRef<T>(outer: Ref<T> | undefined, inner: Ref<T>) {
  return useCallback(
    (node: T | null) => {
      for (const ref of [outer, inner]) {
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }
    },
    [outer, inner],
  );
}

function openWithAltDown(
  event: KeyboardEvent<HTMLInputElement>,
  open: () => void,
) {
  if (event.key === "ArrowDown" && event.altKey) {
    event.preventDefault();
    open();
  }
}

export interface DatePickerOwnProps extends SharedProps {
  /**
   * The picked date, or `null` for none. Use it with `onValueChange`.
   */
  value?: Date | null;
  /** The date picked to begin with. */
  defaultValue?: Date | null;
  /** Called with the new date when one is picked or typed. */
  onValueChange?: (date: Date | null) => void;
  /**
   * The name the date is submitted under, as `yyyy-MM-dd`. Without one,
   * nothing is submitted.
   */
  name?: string;
  /**
   * More of the calendar's own options, such as `captionLayout` and
   * `showWeekNumber`.
   */
  calendar?: DatePickerCalendarProps;
}

export interface DatePickerProps extends DatePickerOwnProps, InputProps {}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker(
    {
      value: valueProp,
      defaultValue = null,
      onValueChange,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      min,
      max,
      disabledDates,
      locale,
      weekStartsOn,
      timeZone,
      format = "P",
      invalidMessage = "Enter a valid date.",
      calendarLabel = "Choose date",
      title = "Choose date",
      closeLabel = "Close",
      calendar,
      name,
      form,
      container,
      className,
      style,
      disabled,
      readOnly,
      placeholder,
      onBlur,
      onKeyDown,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) {
    const [value, setValue] = useControlled(
      valueProp !== undefined,
      valueProp ?? null,
      defaultValue,
      onValueChange,
    );
    const [open, setOpen] = useControlled(
      openProp !== undefined,
      openProp ?? false,
      defaultOpen,
      onOpenChange,
    );
    const phone = useIsPhone();
    const input = useRef<HTMLInputElement | null>(null);
    const trigger = useRef<HTMLButtonElement | null>(null);

    const matchers = useMemo(
      () => disabledDays(min, max, disabledDates, timeZone),
      [min, max, disabledDates, timeZone],
    );

    const field = useDateText({
      value,
      onCommit: setValue,
      problem: (date) =>
        isDisabled(date, matchers) ? invalidMessage : undefined,
      invalidMessage,
      pattern: format,
      locale,
      timeZone,
      input,
    });

    useFormReset(input, () => {
      field.clearDraft();
      setValue(defaultValue);
    });

    return (
      <Popover open={open && !phone} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <InputGroup
            className={cx("nuv-date-picker", className)}
            style={style}
          >
            <Input
              ref={useMergedRef(ref, input)}
              autoComplete="off"
              placeholder={placeholder ?? hint(format, locale)}
              disabled={disabled}
              readOnly={readOnly}
              aria-invalid={field.error ? true : ariaInvalid}
              {...props}
              value={field.text}
              onChange={field.onChange}
              onBlur={(event: FocusEvent<HTMLInputElement>) => {
                field.onBlur();
                onBlur?.(event);
              }}
              onKeyDown={(event) => {
                onKeyDown?.(event);
                if (event.defaultPrevented) return;
                field.onKeyDown(event);
                if (!disabled && !readOnly) {
                  openWithAltDown(event, () => setOpen(true));
                }
              }}
            />
            <PopoverTrigger asChild>
              <InputGroupButton
                ref={trigger}
                className="nuv-date-picker__button"
                aria-label={
                  value
                    ? `${calendarLabel}, ${formatDate(value, "PPPP", locale, timeZone)}`
                    : calendarLabel
                }
                disabled={disabled || readOnly}
              >
                <CalendarIcon />
              </InputGroupButton>
            </PopoverTrigger>
            {name ? (
              <input
                type="hidden"
                name={name}
                form={form}
                value={isoDate(value ?? undefined, timeZone)}
                disabled={disabled}
              />
            ) : null}
          </InputGroup>
        </PopoverAnchor>
        <Popup
          open={open}
          onOpenChange={setOpen}
          phone={phone}
          title={title}
          closeLabel={closeLabel}
          container={container}
          trigger={trigger}
        >
          <Calendar
            {...calendar}
            mode="single"
            // A press on the picked day keeps it. The date is cleared by
            // clearing the text.
            required
            selected={value ?? undefined}
            onSelect={(date) => {
              field.clearDraft();
              setValue(date);
              setOpen(false);
            }}
            defaultMonth={value ?? calendar?.defaultMonth}
            startMonth={min}
            endMonth={max}
            disabled={matchers}
            locale={locale}
            weekStartsOn={weekStartsOn}
            timeZone={timeZone}
          />
        </Popup>
      </Popover>
    );
  },
);

export interface DateRangePickerOwnProps extends SharedProps {
  /**
   * The picked range, or `null` for none. Use it with `onValueChange`.
   */
  value?: DateRange | null;
  /** The range picked to begin with. */
  defaultValue?: DateRange | null;
  /**
   * Called with the new range when a day is picked or typed. While only
   * the first day has been chosen, `to` is `undefined`.
   */
  onValueChange?: (range: DateRange | null) => void;
  /**
   * The name the first day is submitted under, as `yyyy-MM-dd`.
   */
  startName?: string;
  /** The name the last day is submitted under, as `yyyy-MM-dd`. */
  endName?: string;
  /**
   * Accessible name of the field for the first day.
   * @default "Start date"
   */
  startLabel?: string;
  /**
   * Accessible name of the field for the last day.
   * @default "End date"
   */
  endLabel?: string;
  /**
   * What the browser is told when the last day comes before the first.
   * @default "The end date is before the start date."
   */
  orderMessage?: string;
  /**
   * How many months the calendar shows side by side. On a phone it's
   * always one.
   * @default 2
   */
  numberOfMonths?: number;
  /**
   * More of the calendar's own options. `min` and `max` here are the
   * fewest and the most days the range may span.
   */
  calendar?: DateRangePickerCalendarProps;
}

export interface DateRangePickerProps
  extends DateRangePickerOwnProps,
    Omit<InputProps, "placeholder"> {
  /** The hint in both fields. Left out, it's the pattern. */
  placeholder?: string;
}

function before(a: Date, b: Date, timeZone: string | undefined) {
  return isoDate(a, timeZone) < isoDate(b, timeZone);
}

export const DateRangePicker = forwardRef<
  HTMLInputElement,
  DateRangePickerProps
>(function DateRangePicker(
  {
    value: valueProp,
    defaultValue = null,
    onValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    min,
    max,
    disabledDates,
    locale,
    weekStartsOn,
    timeZone,
    format = "P",
    invalidMessage = "Enter a valid date.",
    orderMessage = "The end date is before the start date.",
    calendarLabel = "Choose dates",
    title = "Choose dates",
    closeLabel = "Close",
    startLabel = "Start date",
    endLabel = "End date",
    numberOfMonths = 2,
    calendar,
    startName,
    endName,
    form,
    container,
    className,
    style,
    disabled,
    readOnly,
    required,
    placeholder,
    id,
    onBlur,
    onKeyDown,
    "aria-invalid": ariaInvalid,
    "aria-labelledby": ariaLabelledBy,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControlled(
    valueProp !== undefined,
    valueProp ?? null,
    defaultValue,
    onValueChange,
  );
  const [open, setOpen] = useControlled(
    openProp !== undefined,
    openProp ?? false,
    defaultOpen,
    onOpenChange,
  );
  const phone = useIsPhone();
  const startInput = useRef<HTMLInputElement | null>(null);
  const endInput = useRef<HTMLInputElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  const from = value?.from ?? null;
  const to = value?.to ?? null;

  const matchers = useMemo(
    () => disabledDays(min, max, disabledDates, timeZone),
    [min, max, disabledDates, timeZone],
  );

  function setRange(nextFrom: Date | null, nextTo: Date | null) {
    setValue(
      nextFrom || nextTo
        ? { from: nextFrom ?? undefined, to: nextTo ?? undefined }
        : null,
    );
  }

  const start = useDateText({
    value: from,
    onCommit: (date) => setRange(date, to),
    problem: (date) => {
      if (isDisabled(date, matchers)) return invalidMessage;
      return to && before(to, date, timeZone) ? orderMessage : undefined;
    },
    invalidMessage,
    pattern: format,
    locale,
    timeZone,
    input: startInput,
  });

  const end = useDateText({
    value: to,
    onCommit: (date) => setRange(from, date),
    problem: (date) => {
      if (isDisabled(date, matchers)) return invalidMessage;
      return from && before(date, from, timeZone) ? orderMessage : undefined;
    },
    invalidMessage,
    pattern: format,
    locale,
    timeZone,
    input: endInput,
  });

  useFormReset(startInput, () => {
    start.clearDraft();
    end.clearDraft();
    setValue(defaultValue);
  });

  const pattern = placeholder ?? hint(format, locale);
  const shared = {
    autoComplete: "off",
    placeholder: pattern,
    disabled,
    readOnly,
    required,
    "aria-describedby": ariaDescribedBy,
    ...props,
  };

  function keyDown(
    event: KeyboardEvent<HTMLInputElement>,
    field: typeof start,
  ) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    field.onKeyDown(event);
    if (!disabled && !readOnly) openWithAltDown(event, () => setOpen(true));
  }

  const picked = [from, to]
    .filter((date): date is Date => date !== null)
    .map((date) => formatDate(date, "PPPP", locale, timeZone))
    .join(", ");

  return (
    <Popover open={open && !phone} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup
          role="group"
          aria-labelledby={ariaLabelledBy}
          aria-label={ariaLabel}
          className={cx("nuv-date-picker nuv-date-picker--range", className)}
          style={style}
        >
          <Input
            ref={useMergedRef(ref, startInput)}
            id={id}
            aria-label={startLabel}
            aria-invalid={start.error ? true : ariaInvalid}
            {...shared}
            value={start.text}
            onChange={start.onChange}
            onBlur={(event: FocusEvent<HTMLInputElement>) => {
              start.onBlur();
              onBlur?.(event);
            }}
            onKeyDown={(event) => keyDown(event, start)}
          />
          <span aria-hidden="true" className="nuv-date-picker__separator">
            –
          </span>
          <Input
            ref={endInput}
            aria-label={endLabel}
            aria-invalid={end.error ? true : ariaInvalid}
            {...shared}
            value={end.text}
            onChange={end.onChange}
            onBlur={(event: FocusEvent<HTMLInputElement>) => {
              end.onBlur();
              onBlur?.(event);
            }}
            onKeyDown={(event) => keyDown(event, end)}
          />
          <PopoverTrigger asChild>
            <InputGroupButton
              ref={trigger}
              className="nuv-date-picker__button"
              aria-label={
                picked ? `${calendarLabel}, ${picked}` : calendarLabel
              }
              disabled={disabled || readOnly}
            >
              <CalendarIcon />
            </InputGroupButton>
          </PopoverTrigger>
          {startName ? (
            <input
              type="hidden"
              name={startName}
              form={form}
              value={isoDate(from ?? undefined, timeZone)}
              disabled={disabled}
            />
          ) : null}
          {endName ? (
            <input
              type="hidden"
              name={endName}
              form={form}
              value={isoDate(to ?? undefined, timeZone)}
              disabled={disabled}
            />
          ) : null}
        </InputGroup>
      </PopoverAnchor>
      <Popup
        open={open}
        onOpenChange={setOpen}
        phone={phone}
        title={title}
        closeLabel={closeLabel}
        container={container}
        trigger={trigger}
      >
        <Calendar
          numberOfMonths={phone ? 1 : numberOfMonths}
          {...calendar}
          mode="range"
          required
          // With a whole range picked, the next press starts a new one.
          // Otherwise it would move whichever end is nearer, and there
          // would be no telling when someone has finished.
          resetOnSelect
          selected={value ?? undefined}
          onSelect={(range) => {
            start.clearDraft();
            end.clearDraft();
            setValue(range);
            if (range.from && range.to) setOpen(false);
          }}
          defaultMonth={from ?? calendar?.defaultMonth}
          startMonth={min}
          endMonth={max}
          disabled={matchers}
          locale={locale}
          weekStartsOn={weekStartsOn}
          timeZone={timeZone}
        />
      </Popup>
    </Popover>
  );
});

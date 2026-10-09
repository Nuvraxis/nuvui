"use client";

import { useDirection } from "@nuvui/react/direction";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react/select";
import {
  type ChangeEvent,
  createContext,
  forwardRef,
  type Ref,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  type ChevronProps,
  type ClassNames,
  type CustomComponents,
  DayPicker,
  type DayPickerProps,
  type DropdownProps,
  type PropsBase,
  type RootProps,
  useDayPicker,
} from "react-day-picker";
import { cx } from "../../utils/cx";

export type {
  DateRange,
  DayPickerLocale as CalendarLocale,
  Matcher,
} from "react-day-picker";

// react-day-picker's name for each part, and the class it gets here.
const classes: ClassNames = {
  root: "nuv-calendar",
  months: "nuv-calendar__months",
  month: "nuv-calendar__month",
  month_caption: "nuv-calendar__caption",
  caption_label: "nuv-calendar__caption-label",
  nav: "nuv-calendar__nav",
  button_previous:
    "nuv-calendar__nav-button nuv-calendar__nav-button--previous",
  button_next: "nuv-calendar__nav-button nuv-calendar__nav-button--next",
  chevron: "nuv-calendar__chevron",
  dropdowns: "nuv-calendar__dropdowns",
  // Dropdown below draws no element around the select.
  dropdown_root: "",
  dropdown: "nuv-calendar__select",
  months_dropdown: "nuv-calendar__select--month",
  years_dropdown: "nuv-calendar__select--year",
  month_grid: "nuv-calendar__grid",
  weekdays: "nuv-calendar__weekdays",
  weekday: "nuv-calendar__weekday",
  weeks: "nuv-calendar__weeks",
  week: "nuv-calendar__week",
  week_number: "nuv-calendar__week-number",
  week_number_header: "nuv-calendar__week-number-header",
  day: "nuv-calendar__day",
  day_button: "nuv-calendar__day-button",
  footer: "nuv-calendar__footer",
  today: "nuv-calendar__day--today",
  outside: "nuv-calendar__day--outside",
  disabled: "nuv-calendar__day--disabled",
  hidden: "nuv-calendar__day--hidden",
  focused: "nuv-calendar__day--focused",
  selected: "nuv-calendar__day--selected",
  range_start: "nuv-calendar__day--range-start",
  range_middle: "nuv-calendar__day--range-middle",
  range_end: "nuv-calendar__day--range-end",
  // Sliding between months is left out, see CalendarProps. The keys still
  // have to be here, and an empty class is no class.
  weeks_before_enter: "",
  weeks_before_exit: "",
  weeks_after_enter: "",
  weeks_after_exit: "",
  caption_after_enter: "",
  caption_after_exit: "",
  caption_before_enter: "",
  caption_before_exit: "",
};

const chevrons = {
  left: "M10 3.5 5.5 8l4.5 4.5",
  right: "M6 3.5 10.5 8 6 12.5",
  up: "M3.5 10 8 5.5l4.5 4.5",
  down: "M3.5 6 8 10.5 12.5 6",
};

function Chevron({ orientation = "left", className }: ChevronProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={chevrons[orientation]} />
    </svg>
  );
}

// The calendar's ref reaches its root element this way. A root component
// made inside Calendar could take the ref directly, but it would be a new
// component on every render, and React would rebuild the whole calendar.
const RootRefContext = createContext<Ref<HTMLDivElement> | undefined>(
  undefined,
);

function assign(ref: Ref<HTMLDivElement> | undefined, node: HTMLDivElement) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

function Root({ rootRef, ...props }: RootProps) {
  const forwarded = useContext(RootRefContext);
  const setRef = useCallback(
    (node: HTMLDivElement) => {
      assign(rootRef, node);
      assign(forwarded, node);
    },
    [rootRef, forwarded],
  );
  return <div ref={setRef} {...props} />;
}

// The month or the year as a list to choose from. react-day-picker's own
// is a select element, whose open list is the system's and can't be themed.
function Dropdown({
  options,
  value,
  onChange,
  disabled,
  className,
  style,
  "aria-label": label,
}: DropdownProps) {
  const { classNames } = useDayPicker();
  const selected = options?.find((option) => option.value === value);

  return (
    <Select
      value={String(value)}
      disabled={disabled}
      onValueChange={(next) =>
        // All react-day-picker reads from the event is the value.
        onChange?.({
          target: { value: next },
        } as ChangeEvent<HTMLSelectElement>)
      }
    >
      <SelectTrigger
        className={cx(classNames.dropdown, className)}
        style={style}
        aria-label={label}
      >
        {/* Radix fills the trigger in from the list once it's in the
            browser. Given the text, the server draws it too. */}
        <SelectValue>{selected?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent className="nuv-calendar__options">
        {options?.map((option) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const parts: Partial<CustomComponents> = { Chevron, Dropdown, Root };

const never = () => () => {};

// False on the server, and in the browser for as long as it's taking over
// the HTML the server sent. True from then on, and from the start for
// anything that's first rendered in the browser.
function useHydrated() {
  return useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
}

// A day that's never today, and a month for the hidden stand-in to draw.
// Which month doesn't matter, as long as it isn't the one with that day.
const noDay = new Date(0);
const anyMonth = new Date(2001, 6);

// Omit on a union would merge its members into one type and lose the link
// between `mode` and what `selected` holds.
type OmitFromEach<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * The options a calendar has whatever its `mode`. `CalendarProps` is these
 * with `selected` and `onSelect`, whose types follow the mode.
 */
export type CalendarOptions = Omit<PropsBase, "animate">;

/**
 * What react-day-picker's `DayPicker` takes, except `animate`. Its slide
 * between months is drawn by react-day-picker's own stylesheet, which this
 * package doesn't use.
 */
export type CalendarProps = OmitFromEach<DayPickerProps, "animate">;

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar(
    { classNames, components, dir, navLayout = "around", ...props },
    ref,
  ) {
    // Which day is today is the one thing a server can't know for the
    // person looking: it may have rendered the page hours ago, or in another
    // time zone. If the browser then disagreed with the HTML it was handed,
    // React would throw the calendar away and report an error. So the
    // server marks no day as today, and the browser fills it in once it has
    // taken over. A calendar with nothing else to say which month to show
    // would have to guess that from today as well, so what's drawn in its
    // place is an empty month, hidden, that only holds the room. It's given
    // none of the dates the calendar was, since any of them may have been
    // worked out from the time too.
    const hydrated = useHydrated();
    const undated = !hydrated && props.today === undefined;
    const unplaced =
      undated && props.month === undefined && props.defaultMonth === undefined;

    const direction = useDirection(
      dir === "rtl" || dir === "ltr" ? dir : undefined,
    );

    const merged = useMemo(() => {
      if (!classNames) return classes;
      const result = { ...classes };
      for (const key of Object.keys(classNames) as Array<keyof ClassNames>) {
        result[key] = cx(classes[key], classNames[key]);
      }
      return result;
    }, [classNames]);

    const allParts = useMemo(
      () => (components ? { ...parts, ...components } : parts),
      [components],
    );

    return (
      <RootRefContext.Provider value={ref}>
        <DayPicker
          // The month it shows is state inside, set when it's first drawn.
          // A new key starts it again once the real month is known.
          key={unplaced ? "pending" : "placed"}
          classNames={merged}
          components={allParts}
          dir={direction}
          navLayout={navLayout}
          {...(unplaced
            ? {
                className: props.className,
                style: props.style,
                numberOfMonths: props.numberOfMonths,
                showWeekNumber: props.showWeekNumber,
                fixedWeeks: props.fixedWeeks,
                hideNavigation: props.hideNavigation,
                hideWeekdays: props.hideWeekdays,
                captionLayout: props.captionLayout,
                month: anyMonth,
                today: noDay,
                "data-pending": "",
              }
            : {
                ...(props as DayPickerProps),
                ...(undated ? { today: noDay } : null),
              })}
        />
      </RootRefContext.Provider>
    );
  },
);

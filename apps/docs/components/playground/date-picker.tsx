"use client";

import {
  Calendar,
  DatePicker,
  type DateRange,
  DateRangePicker,
} from "@nuvui/date-picker";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

const modes = ["single", "multiple", "range"] as const;
const captions = ["label", "dropdown"] as const;
const counts = ["1", "2"] as const;
const weekStarts = ["locale", "Sunday", "Monday", "Saturday"] as const;
const startDay = { Sunday: 0, Monday: 1, Saturday: 6 } as const;

export function CalendarPlayground() {
  const [mode, setMode] = useState<(typeof modes)[number]>("single");
  const [caption, setCaption] = useState<(typeof captions)[number]>("label");
  const [months, setMonths] = useState<(typeof counts)[number]>("1");
  const [weekStart, setWeekStart] =
    useState<(typeof weekStarts)[number]>("locale");
  const [outside, setOutside] = useState(false);
  const [weekNumbers, setWeekNumbers] = useState(false);

  const [date, setDate] = useState<Date | undefined>();
  const [dates, setDates] = useState<Date[] | undefined>();
  const [range, setRange] = useState<DateRange | undefined>();

  const weekStartsOn = weekStart === "locale" ? undefined : startDay[weekStart];
  const shared = {
    captionLayout: caption,
    numberOfMonths: Number(months),
    weekStartsOn,
    showOutsideDays: outside,
    showWeekNumber: weekNumbers,
  };

  const props = [
    `mode="${mode}"`,
    caption !== "label" && `captionLayout="${caption}"`,
    months !== "1" && `numberOfMonths={${months}}`,
    weekStartsOn !== undefined && `weekStartsOn={${weekStartsOn}}`,
    outside && "showOutsideDays",
    weekNumbers && "showWeekNumber",
    "selected={selected}",
    "onSelect={setSelected}",
  ].filter(Boolean);
  const code = `<Calendar\n${props.map((prop) => `  ${prop}`).join("\n")}\n/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="mode"
            value={mode}
            options={modes}
            onChange={setMode}
          />
          <SelectControl
            label="captionLayout"
            value={caption}
            options={captions}
            onChange={setCaption}
          />
          <SelectControl
            label="numberOfMonths"
            value={months}
            options={counts}
            onChange={setMonths}
          />
          <SelectControl
            label="weekStartsOn"
            value={weekStart}
            options={weekStarts}
            onChange={setWeekStart}
          />
          <CheckboxControl
            label="showOutsideDays"
            checked={outside}
            onChange={setOutside}
          />
          <CheckboxControl
            label="showWeekNumber"
            checked={weekNumbers}
            onChange={setWeekNumbers}
          />
        </>
      }
    >
      {/* One calendar for each mode and not one whose mode changes: what
          it holds is a date in one, a list in another and a range in the
          third. */}
      {mode === "single" ? (
        <Calendar
          key="single"
          mode="single"
          selected={date}
          onSelect={setDate}
          {...shared}
        />
      ) : mode === "multiple" ? (
        <Calendar
          key="multiple"
          mode="multiple"
          selected={dates}
          onSelect={setDates}
          {...shared}
        />
      ) : (
        <Calendar
          key="range"
          mode="range"
          selected={range}
          onSelect={setRange}
          {...shared}
        />
      )}
    </Playground>
  );
}

const formats = ["P", "yyyy-MM-dd", "d MMM yyyy"] as const;

export function DatePickerPlayground() {
  const [format, setFormat] = useState<(typeof formats)[number]>("P");
  const [placeholder, setPlaceholder] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [weekNumbers, setWeekNumbers] = useState(false);

  const props = [
    'aria-label="Due date"',
    format !== "P" && `format="${format}"`,
    placeholder && `placeholder="${placeholder}"`,
    disabled && "disabled",
    readOnly && "readOnly",
    weekNumbers && "calendar={{ showWeekNumber: true }}",
  ].filter(Boolean);
  const code = `<DatePicker ${props.join(" ")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="format"
            value={format}
            options={formats}
            onChange={setFormat}
          />
          <TextControl
            label="placeholder"
            value={placeholder}
            onChange={setPlaceholder}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <CheckboxControl
            label="readOnly"
            checked={readOnly}
            onChange={setReadOnly}
          />
          <CheckboxControl
            label="showWeekNumber"
            checked={weekNumbers}
            onChange={setWeekNumbers}
          />
        </>
      }
    >
      <DatePicker
        aria-label="Due date"
        style={{ maxInlineSize: 280 }}
        format={format}
        placeholder={placeholder || undefined}
        disabled={disabled}
        readOnly={readOnly}
        calendar={{ showWeekNumber: weekNumbers }}
      />
    </Playground>
  );
}

export function DateRangePickerPlayground() {
  const [months, setMonths] = useState<(typeof counts)[number]>("2");
  const [startLabel, setStartLabel] = useState("Start date");
  const [endLabel, setEndLabel] = useState("End date");
  const [disabled, setDisabled] = useState(false);

  const props = [
    'aria-label="Stay"',
    months !== "2" && `numberOfMonths={${months}}`,
    startLabel !== "Start date" && `startLabel="${startLabel}"`,
    endLabel !== "End date" && `endLabel="${endLabel}"`,
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<DateRangePicker ${props.join(" ")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="numberOfMonths"
            value={months}
            options={counts}
            onChange={setMonths}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <TextControl
            label="startLabel"
            value={startLabel}
            onChange={setStartLabel}
          />
          <TextControl
            label="endLabel"
            value={endLabel}
            onChange={setEndLabel}
          />
        </>
      }
    >
      <DateRangePicker
        aria-label="Stay"
        style={{ maxInlineSize: 340 }}
        numberOfMonths={Number(months)}
        startLabel={startLabel}
        endLabel={endLabel}
        disabled={disabled}
      />
    </Playground>
  );
}

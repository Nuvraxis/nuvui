import { TZDate } from "@date-fns/tz";
import { DatePicker } from "@nuvui/date-picker/date-picker";
import { Input } from "@nuvui/react/input";
import { Label } from "@nuvui/react/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react/select";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react/toggle-group";
import {
  addDays,
  addMonths,
  type DayKey,
  dayOf,
  endOfMonth,
  momentOf,
  weekdayOf,
} from "../../core/dates";
import type { Formatters } from "../../core/format";
import type { RecurrenceDay, RecurrenceDetails } from "../../core/labels";
import {
  type Frequency,
  type RecurrenceRule,
  untilOf,
  type Weekday,
  weekdayNames,
} from "../../core/recurrence";
import { useCalendar } from "./context";

/** The day of the month or year a monthly or yearly event is on. */
type RepeatOn = "date" | "lastDay" | "week" | "lastWeek";

/** How an event repeats, as the popover's fields hold it. */
export interface RepeatDraft {
  frequency: Frequency | null;
  interval: number;
  /** Weekly: the days chosen, or `null` for the start's. */
  weekdays: Weekday[] | null;
  on: RepeatOn;
  ends: "never" | "until" | "count";
  until: DayKey;
  count: number;
}

const frequencies: readonly Frequency[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

// 18 October 2026 is a Sunday, the first of weekdayNames.
const sunday = "2026-10-18";

const dateOf = (day: DayKey) => Number(day.slice(8, 10));
const weekdayAt = (day: DayKey) => weekdayNames[weekdayOf(day)] as Weekday;

export function repeatDraftOf(
  rule: RecurrenceRule | null,
  startDay: DayKey,
  timeZone: string,
): RepeatDraft {
  const until = rule ? untilOf(rule, timeZone) : null;
  const pinned = rule?.weekdays?.length && rule.week;
  return {
    frequency: rule?.frequency ?? null,
    interval: rule?.interval ?? 1,
    weekdays:
      rule?.frequency === "weekly" && rule.weekdays?.length
        ? [...rule.weekdays]
        : null,
    on:
      rule?.monthDay === -1
        ? "lastDay"
        : pinned
          ? (rule.week ?? 0) < 0
            ? "lastWeek"
            : "week"
          : "date",
    ends: until ? "until" : rule?.count ? "count" : "never",
    until: until
      ? (until.day ?? dayOf(until.moment as Date, timeZone))
      : addMonths(startDay, 3),
    count: rule?.count ?? 10,
  };
}

/** The rule the fields describe, for an event starting on a day. */
export function ruleOfDraft(
  draft: RepeatDraft,
  startDay: DayKey,
): RecurrenceRule | null {
  if (!draft.frequency) return null;
  const rule: RecurrenceRule = { frequency: draft.frequency };
  const interval = Math.max(1, Math.floor(draft.interval) || 1);
  if (interval > 1) rule.interval = interval;
  const weekday = weekdayAt(startDay);
  if (draft.frequency === "weekly") {
    const days = draft.weekdays ?? [];
    if (days.length > 1 || (days.length === 1 && days[0] !== weekday)) {
      rule.weekdays = days;
    }
  } else if (draft.frequency !== "daily") {
    if (draft.on === "lastDay") rule.monthDay = -1;
    if (draft.on === "week" || draft.on === "lastWeek") {
      rule.weekdays = [weekday];
      rule.week = draft.on === "week" ? Math.ceil(dateOf(startDay) / 7) : -1;
    }
  }
  if (draft.ends === "until") {
    rule.until = draft.until < startDay ? startDay : draft.until;
  } else if (draft.ends === "count") {
    rule.count = Math.max(1, Math.floor(draft.count) || 1);
  }
  return rule;
}

/** A rule, with the days it takes from its start written out, for its words. */
export function detailsOf(
  rule: RecurrenceRule,
  startDay: DayKey,
  timeZone: string,
  format: Formatters,
): RecurrenceDetails {
  const name = (weekday: Weekday) =>
    format.longWeekday(addDays(sunday, weekdayNames.indexOf(weekday)));
  const named = rule.weekdays?.length
    ? rule.weekdays
    : rule.frequency === "weekly"
      ? [weekdayAt(startDay)]
      : [];
  const details: RecurrenceDetails = {
    frequency: rule.frequency,
    interval: Math.max(1, rule.interval ?? 1),
    weekdays: named.map(name),
  };
  if (rule.frequency === "monthly" || rule.frequency === "yearly") {
    if (named.length > 0) {
      if (rule.week) details.week = rule.week;
    } else details.monthDay = rule.monthDay ?? dateOf(startDay);
    if (rule.frequency === "yearly") {
      const month = String(rule.month ?? Number(startDay.slice(5, 7)));
      details.month = format.monthName(
        `${startDay.slice(0, 5)}${month.padStart(2, "0")}-01`,
      );
    }
  }
  const until = untilOf(rule, timeZone);
  if (until) {
    details.until = format.longDate(
      until.day ?? dayOf(until.moment as Date, timeZone),
    );
  } else if (rule.count) details.count = rule.count;
  return details;
}

interface RepeatFieldsProps {
  id: string;
  draft: RepeatDraft;
  startDay: DayKey;
  /** The event's own time zone, when it isn't the one shown. */
  ownTimeZone: string | undefined;
  onChange: (change: Partial<RepeatDraft>) => void;
}

/** The popover's fields for how an event repeats. */
export function RepeatFields({
  id,
  draft,
  startDay,
  ownTimeZone,
  onChange,
}: RepeatFieldsProps) {
  const { labels, format, preferences, timeZone, locale } = useCalendar();
  const { frequency } = draft;
  const weekday = weekdayAt(startDay);
  const date = dateOf(startDay);
  const length = dateOf(endOfMonth(startDay));
  const month = frequency === "yearly" ? format.monthName(startDay) : undefined;
  // The days of the month or year to choose from: the date, and the
  // weekday in its week of the month, or the last of either when it is.
  const choices: RepeatOn[] = ["date"];
  if (date <= 28) choices.push("week");
  if (date + 7 > length) choices.push("lastWeek");
  if (date === length) choices.push("lastDay");
  if (!choices.includes(draft.on)) choices.push(draft.on);
  const dayOfChoice = (on: RepeatOn): RecurrenceDay => {
    const weekdays = [format.longWeekday(startDay)];
    if (on === "week") return { weekdays, week: Math.ceil(date / 7), month };
    if (on === "lastWeek") return { weekdays, week: -1, month };
    return { weekdays: [], monthDay: on === "lastDay" ? -1 : date, month };
  };
  const ordered = [0, 1, 2, 3, 4, 5, 6].map(
    (index) => (preferences.weekStartsOn + index) % 7,
  );
  // An empty field is 0 while it's typed into, and 1 in the rule.
  const number = (text: string) => {
    const value = Math.floor(Number(text));
    return Number.isFinite(value) && value > 0 ? value : 0;
  };

  return (
    <>
      <div className="nuv-event-calendar__field">
        <Label htmlFor={`${id}-repeat`}>{labels.repeat}</Label>
        <Select
          value={frequency ?? "none"}
          onValueChange={(value) =>
            onChange({
              frequency: value === "none" ? null : (value as Frequency),
            })
          }
        >
          <SelectTrigger id={`${id}-repeat`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{labels.doesNotRepeat}</SelectItem>
            {frequencies.map((option) => (
              <SelectItem key={option} value={option}>
                {labels.frequency(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {frequency ? (
        <>
          <div className="nuv-event-calendar__field">
            <Label htmlFor={`${id}-every`}>{labels.every}</Label>
            <div className="nuv-event-calendar__every">
              <Input
                id={`${id}-every`}
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={draft.interval > 0 ? String(draft.interval) : ""}
                aria-describedby={`${id}-unit`}
                className="nuv-event-calendar__number-input"
                onChange={(input) =>
                  onChange({ interval: number(input.target.value) })
                }
              />
              <span id={`${id}-unit`}>
                {labels.intervalUnit(frequency, Math.max(1, draft.interval))}
              </span>
            </div>
          </div>
          {frequency === "weekly" ? (
            <div className="nuv-event-calendar__field">
              <span id={`${id}-on`} className="nuv-event-calendar__legend">
                {labels.repeatOn}
              </span>
              <ToggleGroup
                type="multiple"
                size="sm"
                aria-labelledby={`${id}-on`}
                className="nuv-event-calendar__repeat-days"
                value={draft.weekdays ?? [weekday]}
                onValueChange={(names: string[]) =>
                  onChange({
                    weekdays:
                      names.length > 0
                        ? weekdayNames.filter((name) => names.includes(name))
                        : null,
                  })
                }
              >
                {ordered.map((index) => {
                  const day = addDays(sunday, index);
                  return (
                    <ToggleGroupItem
                      key={index}
                      value={weekdayNames[index] as Weekday}
                      aria-label={format.longWeekday(day)}
                    >
                      {format.weekday(day)}
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            </div>
          ) : frequency !== "daily" ? (
            <div className="nuv-event-calendar__field">
              <Label htmlFor={`${id}-on`}>{labels.repeatOn}</Label>
              <Select
                value={draft.on}
                onValueChange={(value) => onChange({ on: value as RepeatOn })}
              >
                <SelectTrigger id={`${id}-on`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((on) => (
                    <SelectItem key={on} value={on}>
                      {labels.repeatOption(dayOfChoice(on))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="nuv-event-calendar__field">
            <Label htmlFor={`${id}-ends`}>{labels.repeatEnds}</Label>
            <Select
              value={draft.ends}
              onValueChange={(value) =>
                onChange({ ends: value as RepeatDraft["ends"] })
              }
            >
              <SelectTrigger id={`${id}-ends`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">{labels.never}</SelectItem>
                <SelectItem value="until">{labels.onDate}</SelectItem>
                <SelectItem value="count">{labels.afterCount}</SelectItem>
              </SelectContent>
            </Select>
            {draft.ends === "until" ? (
              <DatePicker
                aria-label={labels.lastDate}
                value={
                  new TZDate(
                    momentOf(draft.until, 12 * 60, timeZone).getTime(),
                    timeZone,
                  )
                }
                timeZone={timeZone}
                {...(locale ? { locale } : null)}
                onValueChange={(picked) => {
                  if (picked) onChange({ until: dayOf(picked, timeZone) });
                }}
              />
            ) : draft.ends === "count" ? (
              <Input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                aria-label={labels.count}
                value={draft.count > 0 ? String(draft.count) : ""}
                className="nuv-event-calendar__number-input"
                onChange={(input) =>
                  onChange({ count: number(input.target.value) })
                }
              />
            ) : null}
          </div>
          {ownTimeZone ? (
            <p className="nuv-event-calendar__note">
              {labels.repeatsIn(ownTimeZone)}
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );
}

import { TZDate } from "@date-fns/tz";
import { DatePicker } from "@nuvui/date-picker/date-picker";
import { Button } from "@nuvui/react/button";
import { Checkbox } from "@nuvui/react/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react/combobox";
import { Input } from "@nuvui/react/input";
import { Label } from "@nuvui/react/label";
import { Popover, PopoverAnchor, PopoverContent } from "@nuvui/react/popover";
import { Textarea } from "@nuvui/react/textarea";
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useId,
  useMemo,
  useState,
} from "react";
import { type DayKey, dayOf, minutesOf, momentOf } from "../../core/dates";
import { type Times, withTimes } from "../../core/edit";
import { type CalendarEvent, place } from "../../core/events";
import {
  occurrenceOf,
  type RecurrenceRule,
  ruleOf,
} from "../../core/recurrence";
import { resourcesOf } from "../../core/resources";
import { useCalendar } from "./context";
import { colorOf, timeOf } from "./event-button";
import {
  detailsOf,
  type RepeatDraft,
  RepeatFields,
  repeatDraftOf,
  ruleOfDraft,
} from "./repeat";

/**
 * A part of the event's popover, which `eventFields` can leave out. The
 * resource is only shown when the calendar has `resources`.
 */
export type EventField =
  | "title"
  | "time"
  | "repeat"
  | "resource"
  | "color"
  | "description";

export const allFields: readonly EventField[] = [
  "title",
  "time",
  "repeat",
  "resource",
  "color",
  "description",
];

export interface EventFieldsProps<TEvent = CalendarEvent> {
  /** The event as it was when the popover opened, as your own object. */
  event: TEvent;
  /**
   * What's been changed with `onChange` so far, kept when it's saved, under
   * your own names.
   */
  changes: Partial<TEvent> & Record<string, unknown>;
  /** Changes fields of the event, saved with the rest. */
  onChange: (changes: Partial<TEvent> & Record<string, unknown>) => void;
  /** The event opened to be read, so nothing in it can change. */
  readOnly: boolean;
}

export interface Editing {
  event: CalendarEvent;
  isNew: boolean;
  /** `actions` is the toolbar a tap shows on a touch screen. */
  mode: "edit" | "read" | "actions";
  /** The element the popover is beside. */
  anchor: () => HTMLElement | null;
}

interface Draft {
  title: string;
  allDay: boolean;
  startDay: DayKey;
  startMinute: number;
  endDay: DayKey;
  endMinute: number;
  color: string | undefined;
  resourceIds: string[];
  description: string;
  repeat: RepeatDraft;
  /** The repeat fields were changed, so the rule they give is saved. */
  repeatChanged: boolean;
}

// The choice of no resource, which a list of options can't hold as "".
const noResource = "\u0000none";

const timeText = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const minutesFrom = (text: string) => {
  const [hours = 0, minutes = 0] = text.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Where the draft puts the event, or `null` when it ends before it starts. */
function timesOfDraft(draft: Draft, timeZone: string): Times | null {
  if (draft.allDay) {
    return draft.endDay < draft.startDay
      ? null
      : { allDay: true, firstDay: draft.startDay, lastDay: draft.endDay };
  }
  const start = momentOf(draft.startDay, draft.startMinute, timeZone);
  const end = momentOf(draft.endDay, draft.endMinute, timeZone);
  return end < start ? null : { allDay: false, start, end };
}

/** How an event repeats: its own rule, or its series' for an occurrence. */
const ruleOfEvent = (event: CalendarEvent) =>
  ruleOf(occurrenceOf(event)?.series.recurrence ?? event.recurrence);

/** The day an event starts on, on its own clock, which its rule goes by. */
function ownStartDay(event: CalendarEvent, timeZone: string): DayKey {
  const placed = place(event, timeZone);
  return placed.allDay
    ? placed.firstDay
    : dayOf(placed.start, event.timeZone ?? timeZone);
}

function draftOf(
  event: CalendarEvent,
  timeZone: string,
  defaults: { startMinute: number; duration: number },
): Draft {
  const placed = place(event, timeZone);
  const common = {
    title: event.title,
    allDay: placed.allDay,
    color: event.color,
    resourceIds: [...(event.resourceIds ?? [])],
    description: event.description ?? "",
    repeat: repeatDraftOf(
      ruleOfEvent(event),
      ownStartDay(event, timeZone),
      event.timeZone ?? timeZone,
    ),
    repeatChanged: false,
  };
  if (placed.allDay) {
    // Times to start from if it's made a timed event.
    const endMinute = Math.min(
      defaults.startMinute + defaults.duration,
      24 * 60 - 1,
    );
    return {
      ...common,
      startDay: placed.firstDay,
      startMinute: defaults.startMinute,
      endDay: placed.lastDay,
      endMinute,
    };
  }
  return {
    ...common,
    startDay: dayOf(placed.start, timeZone),
    startMinute: minutesOf(placed.start, timeZone),
    endDay: dayOf(placed.end, timeZone),
    endMinute: minutesOf(placed.end, timeZone),
  };
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="nuv-event-calendar__swatch"
      style={{ "--nuv-event-color": colorOf(color) } as CSSProperties}
    />
  );
}

interface EventEditorProps {
  editing: Editing | null;
  fields: readonly EventField[];
  renderFields: ((props: EventFieldsProps<object>) => ReactNode) | undefined;
  /** Minutes a timed event lasts when it was all day before. */
  defaultDuration: number;
  scrollToHour: number;
  /**
   * The event, the changes from the app's own fields, and how it repeats
   * after the change: `undefined` when that wasn't changed, and `null` when
   * it no longer repeats.
   */
  onSave: (
    event: CalendarEvent,
    changes: Record<string, unknown>,
    rule: RecurrenceRule | null | undefined,
  ) => void;
  onDelete: (event: CalendarEvent) => void;
  /** From the toolbar to the form. */
  onEdit: () => void;
  onClose: () => void;
  /** A click or the focus went outside it, which closes it. */
  onOutside: () => void;
  /** The times in the form, for a new event to be drawn where it'll go. */
  onTimesChange: (times: Times) => void;
}

/** The popover an event opens in, to be changed or read. */
export function EventEditor({ editing, ...props }: EventEditorProps) {
  const anchor = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          editing?.anchor()?.getBoundingClientRect() ?? new DOMRect(),
      },
    }),
    [editing],
  );
  return (
    <Popover
      open={editing !== null}
      modal={false}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <PopoverAnchor virtualRef={anchor} />
      {editing ? (
        <Panel
          // A fresh form for each event opened.
          key={`${editing.event.id}:${editing.mode}`}
          editing={editing}
          {...props}
        />
      ) : null}
    </Popover>
  );
}

function Panel({
  editing,
  fields,
  renderFields,
  defaultDuration,
  scrollToHour,
  onSave,
  onDelete,
  onEdit,
  onClose,
  onOutside,
  onTimesChange,
}: EventEditorProps & { editing: Editing }) {
  const {
    timeZone,
    locale,
    format,
    labels,
    edit,
    color,
    resources,
    rules,
    resourceRequired,
    multipleResources,
    write,
  } = useCalendar();
  const { event, isNew, mode } = editing;
  const id = useId();
  const [draft, setDraft] = useState(() =>
    draftOf(event, timeZone, {
      startMinute: scrollToHour * 60,
      duration: defaultDuration,
    }),
  );
  const [changes, setChanges] = useState<Record<string, unknown>>({});
  const times = timesOfDraft(draft, timeZone);
  const shown = (field: EventField) => fields.includes(field);
  const choosesResource = shown("resource") && resources.size > 0;
  const missingResource =
    choosesResource && resourceRequired && draft.resourceIds.length === 0;
  // The color it has from its resource, while it has none of its own.
  const inherited =
    rules({ ...event, color: undefined, resourceIds: draft.resourceIds })
      .color ??
    color ??
    "1";
  const heading = isNew ? labels.newEvent : event.title || labels.untitled;
  // Beside the event, where there's room for it, and below it on a narrow
  // screen, where the room beside it would squeeze the form.
  const side =
    typeof window !== "undefined" && window.innerWidth < 640
      ? "bottom"
      : "right";
  // The calendar puts the focus back itself, where the event now is.
  const closing = {
    onInteractOutside: onOutside,
    onCloseAutoFocus: (focus: Event) => focus.preventDefault(),
  };

  const change = (next: Partial<Draft>) => {
    const updated = { ...draft, ...next };
    // The end keeps up with a start moved past it.
    if (next.startDay && updated.endDay < updated.startDay) {
      updated.endDay = updated.startDay;
    }
    setDraft(updated);
    const moved = timesOfDraft(updated, timeZone);
    if (moved) onTimesChange(moved);
  };

  const zoned = (day: DayKey) =>
    new TZDate(momentOf(day, 12 * 60, timeZone).getTime(), timeZone);

  if (mode === "actions") {
    return (
      <PopoverContent
        {...closing}
        aria-label={labels.eventActions(event.title)}
        className="nuv-event-calendar__actions"
        side="top"
      >
        <Button intent="secondary" size="sm" onClick={onEdit}>
          {labels.edit}
        </Button>
        <Button intent="danger" size="sm" onClick={() => onDelete(event)}>
          {labels.delete}
        </Button>
      </PopoverContent>
    );
  }

  if (mode === "read") {
    const placed = place(event, timeZone);
    const rule = ruleOfEvent(event);
    return (
      <PopoverContent
        {...closing}
        aria-labelledby={`${id}-heading`}
        className="nuv-event-calendar__editor"
        side={side}
        align="start"
      >
        <div className="nuv-event-calendar__editor-head">
          <Swatch color={rules(event).color ?? color ?? "1"} />
          <h2 id={`${id}-heading`} className="nuv-event-calendar__editor-title">
            {heading}
          </h2>
        </div>
        <p className="nuv-event-calendar__editor-text">
          {timeOf(placed, format, labels)}
        </p>
        {rule ? (
          <p className="nuv-event-calendar__editor-text">
            {labels.recurrence(
              detailsOf(
                rule,
                ownStartDay(event, timeZone),
                event.timeZone ?? timeZone,
                format,
              ),
            )}
          </p>
        ) : null}
        {resourcesOf(event, resources).length > 0 ? (
          <p className="nuv-event-calendar__editor-text">
            {resourcesOf(event, resources)
              .map((entry) => entry.resource.title)
              .join(", ")}
          </p>
        ) : null}
        {event.description ? (
          <p className="nuv-event-calendar__editor-text">{event.description}</p>
        ) : null}
        {renderFields?.({
          event: write(event),
          changes: {},
          onChange: () => {},
          readOnly: true,
        })}
        <div className="nuv-event-calendar__editor-footer">
          <Button intent="secondary" size="sm" onClick={onClose}>
            {labels.close}
          </Button>
        </div>
      </PopoverContent>
    );
  }

  const submit = (form: FormEvent) => {
    form.preventDefault();
    if (!times || missingResource) return;
    const { description: _, resourceIds: __, ...rest } = event;
    const description = draft.description.trim();
    const resourceIds = choosesResource
      ? draft.resourceIds
      : (event.resourceIds ?? []);
    const saved = withTimes(
      {
        ...rest,
        title: draft.title.trim() || labels.untitled,
        ...(draft.color ? { color: draft.color } : null),
        ...(resourceIds.length > 0 ? { resourceIds } : null),
        ...(description ? { description } : null),
      },
      times,
      timeZone,
    );
    onSave(
      saved,
      changes,
      draft.repeatChanged
        ? ruleOfDraft(draft.repeat, ownStartDay(saved, timeZone))
        : undefined,
    );
  };

  const resourceText =
    draft.resourceIds.length === 1
      ? resources.get(draft.resourceIds[0] ?? "")?.resource.title
      : draft.resourceIds.length > 1
        ? labels.resourceCount(draft.resourceIds.length)
        : undefined;
  const resourceList = (
    <ComboboxContent
      label={labels.searchResources}
      listLabel={multipleResources ? labels.resources : labels.resource}
    >
      <ComboboxEmpty>{labels.noResourceFound}</ComboboxEmpty>
      {multipleResources || resourceRequired ? null : (
        <ComboboxItem value={noResource} textValue={labels.noResource}>
          {labels.noResource}
        </ComboboxItem>
      )}
      {[...resources.values()].map((entry) => (
        <ComboboxItem
          key={entry.resource.id}
          value={entry.resource.id}
          textValue={entry.resource.title}
          className="nuv-event-calendar__resource-option"
          style={{ "--nuv-resource-depth": entry.depth } as CSSProperties}
        >
          {entry.resource.title}
        </ComboboxItem>
      ))}
    </ComboboxContent>
  );
  const resourceTrigger = (
    <ComboboxTrigger
      id={`${id}-resource`}
      aria-invalid={missingResource ? true : undefined}
      aria-describedby={missingResource ? `${id}-resource-error` : undefined}
    >
      <ComboboxValue placeholder={labels.noResource}>
        {resourceText}
      </ComboboxValue>
    </ComboboxTrigger>
  );

  const timeStep = edit.options.step * 60;

  return (
    <PopoverContent
      {...closing}
      aria-labelledby={`${id}-heading`}
      className="nuv-event-calendar__editor"
      side={side}
      align="start"
    >
      <form className="nuv-event-calendar__form" onSubmit={submit} noValidate>
        <h2 id={`${id}-heading`} className="nuv-event-calendar__editor-title">
          {heading}
        </h2>
        {shown("title") ? (
          <div className="nuv-event-calendar__field">
            <Label htmlFor={`${id}-title`}>{labels.eventTitle}</Label>
            <Input
              id={`${id}-title`}
              value={draft.title}
              autoComplete="off"
              onChange={(input) => change({ title: input.target.value })}
            />
          </div>
        ) : null}
        {shown("time") ? (
          <>
            <div className="nuv-event-calendar__check">
              <Checkbox
                id={`${id}-all-day`}
                checked={draft.allDay}
                onCheckedChange={(checked) =>
                  change({ allDay: checked === true })
                }
              />
              <Label htmlFor={`${id}-all-day`}>{labels.allDay}</Label>
            </div>
            {(["start", "end"] as const).map((end) => {
              const day = end === "start" ? draft.startDay : draft.endDay;
              const minute =
                end === "start" ? draft.startMinute : draft.endMinute;
              return (
                <fieldset
                  key={end}
                  className="nuv-event-calendar__when"
                  aria-describedby={
                    end === "end" && !times ? `${id}-order` : undefined
                  }
                >
                  <legend className="nuv-event-calendar__legend">
                    {end === "start" ? labels.starts : labels.ends}
                  </legend>
                  <DatePicker
                    aria-label={labels.date}
                    value={zoned(day)}
                    timeZone={timeZone}
                    {...(locale ? { locale } : null)}
                    aria-invalid={end === "end" && !times ? true : undefined}
                    onValueChange={(date) => {
                      if (!date) return;
                      const picked = dayOf(date, timeZone);
                      change(
                        end === "start"
                          ? { startDay: picked }
                          : { endDay: picked },
                      );
                    }}
                  />
                  {draft.allDay ? null : (
                    <Input
                      type="time"
                      aria-label={labels.time}
                      step={timeStep}
                      value={timeText(minute)}
                      aria-invalid={end === "end" && !times ? true : undefined}
                      className="nuv-event-calendar__time-input"
                      onChange={(input) => {
                        if (!input.target.value) return;
                        const value = minutesFrom(input.target.value);
                        change(
                          end === "start"
                            ? { startMinute: value }
                            : { endMinute: value },
                        );
                      }}
                    />
                  )}
                </fieldset>
              );
            })}
            {times ? null : (
              <p id={`${id}-order`} className="nuv-event-calendar__error">
                {labels.endsBeforeStart}
              </p>
            )}
          </>
        ) : null}
        {shown("repeat") ? (
          <RepeatFields
            id={id}
            draft={draft.repeat}
            startDay={
              times
                ? ownStartDay(withTimes(event, times, timeZone), timeZone)
                : draft.startDay
            }
            ownTimeZone={
              event.timeZone && event.timeZone !== timeZone
                ? event.timeZone
                : undefined
            }
            onChange={(next) =>
              change({
                repeat: { ...draft.repeat, ...next },
                repeatChanged: true,
              })
            }
          />
        ) : null}
        {choosesResource ? (
          <div className="nuv-event-calendar__field">
            <Label htmlFor={`${id}-resource`}>
              {multipleResources ? labels.resources : labels.resource}
            </Label>
            {multipleResources ? (
              <Combobox
                multiple
                value={draft.resourceIds}
                onValueChange={(ids) => change({ resourceIds: ids })}
              >
                {resourceTrigger}
                {resourceList}
              </Combobox>
            ) : (
              <Combobox
                value={draft.resourceIds[0] ?? noResource}
                onValueChange={(picked) =>
                  change({
                    resourceIds:
                      picked === noResource || picked === "" ? [] : [picked],
                  })
                }
              >
                {resourceTrigger}
                {resourceList}
              </Combobox>
            )}
            {missingResource ? (
              <p
                id={`${id}-resource-error`}
                className="nuv-event-calendar__error"
              >
                {labels.resourceRequired}
              </p>
            ) : null}
          </div>
        ) : null}
        {shown("color") ? (
          <fieldset className="nuv-event-calendar__colors">
            <legend className="nuv-event-calendar__legend">
              {labels.color}
            </legend>
            {["1", "2", "3", "4", "5", "6", "7", "8"].map((value) => (
              <label key={value} className="nuv-event-calendar__color">
                <input
                  type="radio"
                  name={`${id}-color`}
                  value={value}
                  checked={(draft.color ?? inherited) === value}
                  aria-label={labels.colorName(Number(value))}
                  className="nuv-event-calendar__color-input"
                  onChange={() => change({ color: value })}
                />
                <Swatch color={value} />
              </label>
            ))}
          </fieldset>
        ) : null}
        {shown("description") ? (
          <div className="nuv-event-calendar__field">
            <Label htmlFor={`${id}-description`}>{labels.description}</Label>
            <Textarea
              id={`${id}-description`}
              rows={3}
              value={draft.description}
              onChange={(input) => change({ description: input.target.value })}
            />
          </div>
        ) : null}
        {renderFields?.({
          event: write(event),
          changes,
          onChange: (next) => setChanges((was) => ({ ...was, ...next })),
          readOnly: false,
        })}
        <div className="nuv-event-calendar__editor-footer">
          {isNew ? null : (
            <Button
              type="button"
              intent="ghost"
              size="sm"
              className="nuv-event-calendar__delete"
              onClick={() => onDelete(event)}
            >
              {labels.delete}
            </Button>
          )}
          <Button type="button" intent="secondary" size="sm" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            type="submit"
            intent="primary"
            size="sm"
            disabled={!times || missingResource}
          >
            {labels.save}
          </Button>
        </div>
      </form>
    </PopoverContent>
  );
}

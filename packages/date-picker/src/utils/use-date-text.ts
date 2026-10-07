import type { Locale } from "date-fns";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { formatDate, isoDate, parseDate } from "./dates";

interface DateTextOptions {
  /** The date the field holds, which the text follows. */
  value: Date | null;
  /** Called with a date that was typed, or `null` for none. */
  onCommit: (date: Date | null) => void;
  /** Why a date that parses still can't be taken, or nothing if it can. */
  problem: (date: Date) => string | undefined;
  /** What to tell the browser when the text isn't a date at all. */
  invalidMessage: string;
  pattern: string;
  locale: Locale | undefined;
  timeZone: string | undefined;
  input: RefObject<HTMLInputElement | null>;
}

/**
 * The text of a field a date can be typed into.
 *
 * While someone types, the text is theirs: a half-written date is left
 * alone. It becomes the field's date the moment it reads as one in full,
 * and again when they leave the field or press Enter, where a looser form
 * such as "1/5/26" is taken too and rewritten in the pattern. Text that
 * isn't a date by then stays as typed, the date is cleared, and the input
 * is marked invalid, with the browser's own validation told why.
 */
export function useDateText({
  value,
  onCommit,
  problem,
  invalidMessage,
  pattern,
  locale,
  timeZone,
  input,
}: DateTextOptions) {
  // What was typed, while that differs from the date. Otherwise null, and
  // the text is the date written in the pattern.
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setErrorState] = useState<string | undefined>(undefined);

  // The browser's own validation is told in the same breath, not after the
  // next render. It's what stops a plain form from being submitted with
  // text in the field that never became a date, and Enter submits the form
  // as soon as this handler returns.
  function setError(message: string | undefined) {
    setErrorState(message);
    input.current?.setCustomValidity(message ?? "");
  }

  const formatted = value ? formatDate(value, pattern, locale, timeZone) : "";
  const text = draft ?? formatted;

  // A date that arrives from anywhere but the keyboard replaces what was
  // typed: a day picked in the calendar, or a value the parent set.
  const day = isoDate(value ?? undefined, timeZone);
  const typedDay = useRef(day);
  useEffect(() => {
    if (day && day !== typedDay.current) {
      setDraft(null);
      setErrorState(undefined);
      input.current?.setCustomValidity("");
    }
    typedDay.current = day;
  }, [day, input]);

  function read(typed: string): { date: Date | null; error?: string } {
    if (!typed.trim()) return { date: null };
    const date = parseDate(typed, pattern, locale, timeZone);
    if (!date) return { date: null, error: invalidMessage };
    const reason = problem(date);
    return reason ? { date: null, error: reason } : { date };
  }

  function commit(date: Date | null) {
    typedDay.current = isoDate(date ?? undefined, timeZone);
    if (typedDay.current !== day) onCommit(date);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const typed = event.target.value;
    setDraft(typed);
    setError(undefined);

    const result = read(typed);
    if (!typed.trim()) {
      commit(null);
    } else if (
      result.date &&
      formatDate(result.date, pattern, locale, timeZone) === typed
    ) {
      commit(result.date);
    }
  }

  // Leaving the field, or pressing Enter in it.
  function settle() {
    if (draft === null) return;
    const result = read(draft);
    setError(result.error);
    // Garbage stays where it is, so that it can be corrected.
    setDraft(result.error ? draft : null);
    commit(result.date);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Not prevented: in a form, Enter still submits. The date has to be in
    // the page by then, so this doesn't wait for React to get round to it.
    // Firefox submits before it would have.
    if (event.key === "Enter") flushSync(settle);
  }

  // For a form's reset, and for a day picked in the calendar when the date
  // itself hasn't changed but the text has been typed over.
  function clearDraft() {
    setDraft(null);
    setError(undefined);
  }

  return { text, error, onChange, onBlur: settle, onKeyDown, clearDraft };
}

import { useCallback, useRef, useState } from "react";

/**
 * A value that's the caller's when they pass one, and kept here when they
 * don't. `onChange` is told either way.
 */
export function useControllable<Value>(
  prop: Value | undefined,
  initial: Value,
  onChange: ((value: Value) => void) | undefined,
): [Value, (value: Value) => void] {
  const [own, setOwn] = useState(initial);
  const controlled = prop !== undefined;
  const value = controlled ? prop : own;

  // Read when the value is set, so a handler that's new on every render
  // doesn't make a new setter.
  const latest = useRef({ controlled, value, onChange });
  latest.current = { controlled, value, onChange };

  const set = useCallback((next: Value) => {
    const now = latest.current;
    if (Object.is(now.value, next)) return;
    if (!now.controlled) setOwn(next);
    now.onChange?.(next);
  }, []);

  return [value, set];
}

import { useCallback, useRef, useState } from "react";

/**
 * State that the parent may hold. With `value` passed, that's the state and
 * `onChange` is only told what was asked for. Without it, the state is kept
 * here, starting from `defaultValue`.
 *
 * `value` being `undefined` can't be what says the parent holds the state,
 * because for a date `undefined` is a value: no date picked. So the caller
 * says it outright with `controlled`.
 */
export function useControlled<T>(
  controlled: boolean,
  value: T,
  defaultValue: T,
  onChange: ((value: T) => void) | undefined,
): [T, (next: T) => void] {
  const [inner, setInner] = useState(defaultValue);
  const current = controlled ? value : inner;

  // Kept in refs so that the setter stays the same function, and can be
  // called from an effect without that effect running again.
  const latest = useRef({ current, controlled, onChange });
  latest.current = { current, controlled, onChange };

  const set = useCallback((next: T) => {
    if (!latest.current.controlled) setInner(next);
    latest.current.onChange?.(next);
  }, []);

  return [current, set];
}

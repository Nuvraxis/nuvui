"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

// A list of options can only hold options. "No results" and "Loading" are
// drawn inside it all the same, where people look for them, and hidden from
// screen readers there. What a screen reader gets is a copy in a status
// region next to the list, which it reads out when the text changes. The
// region is on the page before anything is put in it, because a region
// that arrives with its text already in it often isn't read.

interface ListStatusValue {
  region: HTMLElement | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const ListStatusContext = createContext<ListStatusValue | null>(null);

/**
 * What a list needs for its status: the value for `ListStatusProvider`, and
 * the ref that goes on the status region.
 */
export function useListStatus(): [
  value: ListStatusValue,
  regionRef: (region: HTMLElement | null) => void,
] {
  const [region, setRegion] = useState<HTMLElement | null>(null);
  const [loading, setLoading] = useState(false);
  const value = useMemo(
    () => ({ region, loading, setLoading }),
    [region, loading],
  );
  return [value, setRegion];
}

export const ListStatusProvider = ListStatusContext.Provider;

/** Puts its children in the list's status region for as long as it's rendered. */
export function ListStatus({ children }: { children: ReactNode }) {
  const region = useContext(ListStatusContext)?.region;
  return region ? createPortal(children, region) : null;
}

/**
 * Whether the list is showing that its items are on their way. "No results"
 * waits while it is: nothing has been found yet, which isn't the same.
 */
export function useListLoading(): boolean {
  return useContext(ListStatusContext)?.loading ?? false;
}

/** Marks the list as loading for as long as the component is rendered. */
export function useMarkListLoading(): void {
  const setLoading = useContext(ListStatusContext)?.setLoading;
  useEffect(() => {
    setLoading?.(true);
    return () => setLoading?.(false);
  }, [setLoading]);
}

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../utils/cx";

// What every background shares, and nothing that needs the browser, so a
// background drawn in CSS alone works in a server component.

/**
 * How much of the background's own color is laid over it, so what's on it
 * reads. `strong` keeps body text at 4.5:1 or more over any part of the
 * background in its own colors.
 */
export type BackgroundScrim = "none" | "soft" | "strong";

/** What every background takes. */
export interface BackgroundOwnProps {
  /** What's laid on the background, such as a headline or a form. */
  children?: ReactNode;
  /** Lays the background's own color over it, so what's on it reads. */
  scrim?: BackgroundScrim;
}

export type BackgroundRootProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
>;

/** The part of each background's root that every background shares. */
export const backgroundRoot = (
  block: string,
  scrim: BackgroundScrim,
  className: string | undefined,
) => ({
  className: cx("nuv-background", block, className),
  "data-scrim": scrim === "none" ? undefined : scrim,
});

/** The layer of the background's color laid over it when it has a scrim. */
export function Scrim({ scrim }: { scrim: BackgroundScrim }) {
  return scrim === "none" ? null : (
    <span className="nuv-background__scrim" aria-hidden="true" />
  );
}

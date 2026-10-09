"use client";

import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  useContext,
  useId,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "../../utils/cx";

// The element a screen reader listens to, which is in the page whether the
// bar is open or not. `undefined` outside an ActionBar.
const StatusContext = createContext<HTMLElement | null | undefined>(undefined);

export interface ActionBarOwnProps {
  /** Whether the bar is shown. Usually: whether anything is selected. */
  open: boolean;
  /**
   * Where the bar is. `"fixed"` is the bottom of the window. `"sticky"` is
   * the bottom of whatever scrolls around it, and it takes room in the
   * page. `"static"` is where you put it, with nothing else done.
   * @default "fixed"
   */
  position?: "fixed" | "sticky" | "static";
}

export interface ActionBarProps
  extends ActionBarOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/**
 * A bar that appears while something is selected, with what can be done to
 * it. It's a named group of your own buttons. What's selected, and what
 * the buttons do, is yours.
 */
export const ActionBar = forwardRef<HTMLDivElement, ActionBarProps>(
  function ActionBar(
    {
      open,
      position = "fixed",
      className,
      children,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) {
    const statusId = useId();
    const [status, setStatus] = useState<HTMLElement | null>(null);

    return (
      // This is in the page all the time, and takes no room while the bar
      // is closed. A screen reader only reads out a change to something it
      // already knew was there, and the bar itself is new each time.
      <div
        data-state={open ? "open" : "closed"}
        className={cx("nuv-action-bar", `nuv-action-bar--${position}`)}
      >
        <div
          ref={setStatus}
          id={statusId}
          role="status"
          className="nuv-action-bar__status"
        />
        {open ? (
          <StatusContext.Provider value={status}>
            {/* biome-ignore lint/a11y/useSemanticElements: a fieldset draws a border and a legend, and this is a row of buttons with a name */}
            <div
              ref={ref}
              role="group"
              className={cx("nuv-action-bar__content", className)}
              // Someone who tabs into the bar hears how much is selected
              // along with its name.
              aria-describedby={cx(describedBy, statusId)}
              {...props}
            >
              {children}
            </div>
          </StatusContext.Provider>
        ) : null}
      </div>
    );
  },
);

export type ActionBarSelectionProps = HTMLAttributes<HTMLSpanElement>;

/**
 * How much is selected, in words: "3 selected". A screen reader reads it
 * out when the bar appears and whenever it changes. Keep it to text.
 */
export const ActionBarSelection = forwardRef<
  HTMLSpanElement,
  ActionBarSelectionProps
>(function ActionBarSelection({ className, children, ...props }, ref) {
  const status = useContext(StatusContext);
  if (status === undefined) {
    throw new Error("ActionBarSelection has to be inside an ActionBar.");
  }
  return (
    <>
      {/* The words are in the page twice: here to be seen, and in the
          element a screen reader listens to. It's told about that one. */}
      <span
        ref={ref}
        aria-hidden="true"
        className={cx("nuv-action-bar__selection", className)}
        {...props}
      >
        {children}
      </span>
      {status ? createPortal(children, status) : null}
    </>
  );
});

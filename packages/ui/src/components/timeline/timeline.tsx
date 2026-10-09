import {
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type OlHTMLAttributes,
  type TimeHTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";

export type TimelineProps = OlHTMLAttributes<HTMLOListElement>;

/**
 * Events in the order they happened, with a line down the side that joins
 * them. It's an ordered list: put the events in the order they should be
 * read, newest first or oldest first.
 */
export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(
  function Timeline({ className, ...props }, ref) {
    return (
      <ol
        ref={ref}
        // biome-ignore lint/a11y/noRedundantRoles: Safari stops calling a list a list once its numbers are styled away, and saying so again brings it back
        role="list"
        className={cx("nuv-timeline", className)}
        {...props}
      />
    );
  },
);

export type TimelineItemProps = LiHTMLAttributes<HTMLLIElement>;

/** One event: a `TimelineMarker`, then a `TimelineContent`. */
export const TimelineItem = forwardRef<HTMLLIElement, TimelineItemProps>(
  function TimelineItem({ className, ...props }, ref) {
    return (
      <li
        ref={ref}
        className={cx("nuv-timeline__item", className)}
        {...props}
      />
    );
  },
);

export interface TimelineMarkerOwnProps {
  /**
   * What kind of event it is. The color is extra: the event's text has to
   * say it too.
   * @default "neutral"
   */
  intent?: "neutral" | "primary" | "success" | "warning" | "danger";
}

export interface TimelineMarkerProps
  extends TimelineMarkerOwnProps,
    HTMLAttributes<HTMLSpanElement> {}

/**
 * The point on the line. Empty, it's a ring. An icon can go inside. It's
 * hidden from screen readers, so nothing in it can be the only place a
 * thing is said.
 */
export const TimelineMarker = forwardRef<HTMLSpanElement, TimelineMarkerProps>(
  function TimelineMarker({ intent = "neutral", className, ...props }, ref) {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cx(
          "nuv-timeline__marker",
          `nuv-timeline__marker--${intent}`,
          className,
        )}
        {...props}
      />
    );
  },
);

export type TimelineContentProps = HTMLAttributes<HTMLDivElement>;

/** Everything beside the marker: the title, the time, the description. */
export const TimelineContent = forwardRef<HTMLDivElement, TimelineContentProps>(
  function TimelineContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-timeline__content", className)}
        {...props}
      />
    );
  },
);

export type TimelineTitleProps = HTMLAttributes<HTMLParagraphElement>;

/** What happened, in a line. */
export const TimelineTitle = forwardRef<
  HTMLParagraphElement,
  TimelineTitleProps
>(function TimelineTitle({ className, ...props }, ref) {
  return (
    <p ref={ref} className={cx("nuv-timeline__title", className)} {...props} />
  );
});

export type TimelineDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const TimelineDescription = forwardRef<
  HTMLParagraphElement,
  TimelineDescriptionProps
>(function TimelineDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cx("nuv-timeline__description", className)}
      {...props}
    />
  );
});

export type TimelineTimeProps = TimeHTMLAttributes<HTMLTimeElement>;

/**
 * When it happened. It's a `time` element: write the time for people as
 * its children, and give the exact one in `dateTime`.
 */
export const TimelineTime = forwardRef<HTMLTimeElement, TimelineTimeProps>(
  function TimelineTime({ className, ...props }, ref) {
    return (
      <time
        ref={ref}
        className={cx("nuv-timeline__time", className)}
        {...props}
      />
    );
  },
);

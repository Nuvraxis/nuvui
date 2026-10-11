"use client";

import {
  ListView,
  ListViewItem,
  type ListViewItemProps,
  type ListViewProps,
} from "@nuvui/react/list-view";
import { forwardRef, type HTMLAttributes, type ReactNode, useId } from "react";
import { cx } from "../../utils/cx";
import { useControllable } from "../../utils/use-controllable";

export interface ThreadListOwnProps {
  /**
   * The conversation that's open, when you keep it: its `value`, or
   * `null` for none. Use it with `onValueChange`.
   */
  value?: string | null;
  /** The one that's open to begin with, when it's kept here. */
  defaultValue?: string;
  /** Called with a conversation's `value` when it's opened. */
  onValueChange?: (value: string) => void;
}

export interface ThreadListProps
  extends ThreadListOwnProps,
    Omit<
      ListViewProps,
      keyof ThreadListOwnProps | "selectionMode" | "onAction"
    > {}

/**
 * The conversations someone has had, for a sidebar: a list where one is
 * open and the others can be opened. It's one Tab stop. The arrow keys
 * move between conversations, Enter opens one, and Tab goes on into its
 * buttons. Name it with `aria-label`.
 */
export const ThreadList = forwardRef<HTMLDivElement, ThreadListProps>(
  function ThreadList(
    { value, defaultValue, onValueChange, className, ...props },
    ref,
  ) {
    const [open, setOpen] = useControllable<string | null>(
      value,
      defaultValue ?? null,
      (next) => {
        if (next !== null) onValueChange?.(next);
      },
    );

    return (
      <ListView
        ref={ref}
        selectionMode="single"
        value={open === null ? [] : [open]}
        onValueChange={(rows) => {
          const next = rows[0];
          if (next !== undefined) setOpen(next);
        }}
        className={cx("nuv-thread-list", className)}
        {...props}
      />
    );
  },
);

export interface ThreadListGroupOwnProps {
  /** The heading over them: "Today", "Last week". */
  label: ReactNode;
}

export interface ThreadListGroupProps
  extends ThreadListGroupOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ThreadListGroupOwnProps> {}

/** Conversations under a heading of their own, most often a time. */
export const ThreadListGroup = forwardRef<HTMLDivElement, ThreadListGroupProps>(
  function ThreadListGroup({ label, className, children, ...props }, ref) {
    const id = useId();

    return (
      // biome-ignore lint/a11y/useSemanticElements: a group of rows in a grid made of divs. A tbody belongs to a table
      <div
        ref={ref}
        role="rowgroup"
        aria-labelledby={id}
        className={cx("nuv-thread-list__group", className)}
        {...props}
      >
        {/* A group of rows holds rows. The heading names the group, and
            is no part of the grid itself. */}
        <div id={id} role="presentation" className="nuv-thread-list__heading">
          {label}
        </div>
        {children}
      </div>
    );
  },
);

export interface ThreadListItemOwnProps {
  /** What the conversation is known by in the list's `value`. */
  value: string;
  /** The conversation's title. A long one is cut short. */
  children: ReactNode;
  /** A word or two after the title: when it was last written in. */
  detail?: ReactNode;
  /**
   * Buttons at the end of the row: rename, delete, a menu of both. Tab
   * reaches them from the row.
   */
  actions?: ReactNode;
}

export interface ThreadListItemProps
  extends ThreadListItemOwnProps,
    Omit<ListViewItemProps, keyof ThreadListItemOwnProps> {}

/** One conversation. */
export const ThreadListItem = forwardRef<HTMLDivElement, ThreadListItemProps>(
  function ThreadListItem(
    { detail, actions, className, children, ...props },
    ref,
  ) {
    return (
      <ListViewItem
        ref={ref}
        className={cx("nuv-thread-list__item", className)}
        {...props}
      >
        <span className="nuv-thread-list__title">{children}</span>
        {detail ? (
          <span className="nuv-thread-list__detail">{detail}</span>
        ) : null}
        {actions ? (
          <span className="nuv-thread-list__actions">{actions}</span>
        ) : null}
      </ListViewItem>
    );
  },
);

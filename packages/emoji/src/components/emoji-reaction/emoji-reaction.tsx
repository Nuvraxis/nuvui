"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "../../utils/cx";

export interface EmojiReactionOwnProps {
  /** The emoji, as text. */
  emoji: string;
  /**
   * The emoji's name, such as "thumbs up". It's what the button is read
   * as, with the count, since a screen reader's own name for an emoji
   * varies from one to the next.
   */
  label: string;
  /** How many reacted with it, the reader included when it's theirs. */
  count: number;
  /**
   * Whether the reader is one of them.
   * @default false
   */
  pressed?: boolean;
  /**
   * Called when it's pressed, with what `pressed` would become. The count
   * is yours to change with it.
   */
  onPressedChange?: (pressed: boolean) => void;
}

export interface EmojiReactionProps
  extends EmojiReactionOwnProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      keyof EmojiReactionOwnProps
    > {}

export const EmojiReaction = forwardRef<HTMLButtonElement, EmojiReactionProps>(
  (
    {
      emoji,
      label,
      count,
      pressed = false,
      onPressedChange,
      className,
      children,
      onClick,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      aria-label={`${label}, ${count}`}
      data-pressed={pressed ? "" : undefined}
      {...props}
      className={cx("nuv-emoji-reaction", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onPressedChange?.(!pressed);
      }}
    >
      <span className="nuv-emoji-reaction__emoji">{emoji}</span>
      {/* Children are another way to write the count, such as "1.2K". The
          name keeps the number itself. */}
      <span className="nuv-emoji-reaction__count">{children ?? count}</span>
    </button>
  ),
);
EmojiReaction.displayName = "EmojiReaction";

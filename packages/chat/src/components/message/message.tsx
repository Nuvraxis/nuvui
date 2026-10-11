"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@nuvui/react/tooltip";
import {
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

export interface MessageOwnProps {
  /**
   * Who wrote it. The person's own messages sit at the end of the row in
   * a bubble, and the assistant's at the start, across the row.
   */
  from: "user" | "assistant";
  /**
   * Said before the message to a screen reader, and seen by nobody: who
   * the message is from. Pass `null` when the name is on the page, in a
   * `MessageMeta`.
   * @default "You" for the person's own, "Assistant" for the other
   */
  label?: ReactNode;
  /**
   * A picture of who wrote it, beside the message. An `Avatar`, most
   * often.
   */
  avatar?: ReactNode;
  /**
   * The message is still being written. A screen reader waits until
   * it's finished and then reads it whole, and doesn't read each piece
   * as it arrives.
   * @default false
   */
  streaming?: boolean;
}

export interface MessageProps
  extends MessageOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof MessageOwnProps> {}

/**
 * One message in a conversation. What it says goes in a `MessageContent`,
 * with a `MessageMeta` over it and `MessageActions` under it if you want
 * them.
 */
export const Message = forwardRef<HTMLDivElement, MessageProps>(
  function Message(
    {
      from,
      label = from === "user" ? "You" : "Assistant",
      avatar,
      streaming = false,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cx("nuv-message", className)}
        data-from={from}
        data-streaming={streaming ? "" : undefined}
        aria-busy={streaming || undefined}
        {...props}
      >
        {avatar ? (
          <div className="nuv-message__avatar" aria-hidden="true">
            {avatar}
          </div>
        ) : null}
        <div className="nuv-message__body">
          {label === null || label === undefined || label === false ? null : (
            <span className="nuv-message__label">{label}: </span>
          )}
          {children}
        </div>
      </div>
    );
  },
);

export interface MessageContentProps extends HTMLAttributes<HTMLDivElement> {}

/** What the message says: text, or anything else. */
export const MessageContent = forwardRef<HTMLDivElement, MessageContentProps>(
  function MessageContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-message__content", className)}
        {...props}
      />
    );
  },
);

export interface MessageMetaProps extends HTMLAttributes<HTMLDivElement> {}

/** A small line over or under the message: a name, a time, a model. */
export const MessageMeta = forwardRef<HTMLDivElement, MessageMetaProps>(
  function MessageMeta({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-message__meta", className)}
        {...props}
      />
    );
  },
);

export interface MessageActionsOwnProps {
  /**
   * The name of the group for a screen reader.
   * @default "Message actions"
   */
  label?: string;
}

export interface MessageActionsProps
  extends MessageActionsOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof MessageActionsOwnProps> {}

/** The row of buttons under a message: copy, try again and the like. */
export const MessageActions = forwardRef<HTMLDivElement, MessageActionsProps>(
  function MessageActions(
    { label = "Message actions", className, ...props },
    ref,
  ) {
    return (
      // A fieldset would draw a frame and can't be laid out as a row in
      // every browser.
      // biome-ignore lint/a11y/useSemanticElements: see above
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className={cx("nuv-message__actions", className)}
        {...props}
      />
    );
  },
);

export interface MessageActionOwnProps {
  /**
   * What the button does, in a word or two. It's the button's name for a
   * screen reader and the text of its tooltip.
   */
  label: string;
  /** The icon. */
  children: ReactNode;
}

export interface MessageActionProps
  extends MessageActionOwnProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      keyof MessageActionOwnProps
    > {}

/** One button under a message: an icon, named by `label`. */
export const MessageAction = forwardRef<HTMLButtonElement, MessageActionProps>(
  function MessageAction({ label, className, children, ...props }, ref) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            type="button"
            aria-label={label}
            className={cx("nuv-message__action", className)}
            {...props}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  },
);

export interface MessageCopyActionOwnProps {
  /** The text that's copied. */
  text: string;
  /** @default "Copy" */
  label?: string;
  /**
   * The button's name for the two seconds after it has copied.
   * @default "Copied"
   */
  copiedLabel?: string;
  /** Called once the text is on the clipboard. */
  onCopy?: (text: string) => void;
  /**
   * Called if the browser wouldn't copy: the page isn't served over
   * HTTPS, or permission was refused.
   */
  onCopyError?: (error: unknown) => void;
}

export interface MessageCopyActionProps
  extends MessageCopyActionOwnProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      keyof MessageCopyActionOwnProps | "children"
    > {}

// How long the tick stays, in milliseconds.
const shown = 2000;

/**
 * A button that copies a message. For two seconds after, it shows a tick
 * and says it has copied.
 */
export const MessageCopyAction = forwardRef<
  HTMLButtonElement,
  MessageCopyActionProps
>(function MessageCopyAction(
  {
    text,
    label = "Copy",
    copiedLabel = "Copied",
    onCopy,
    onCopyError,
    onClick,
    ...props
  },
  ref,
) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      onCopyError?.(error);
      return;
    }
    onCopy?.(text);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), shown);
  }

  return (
    <>
      <MessageAction
        ref={ref}
        label={copied ? copiedLabel : label}
        data-copied={copied ? "" : undefined}
        onClick={handleClick}
        {...props}
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {copied ? (
            <path d="m3 8.5 3.5 3.5L13 4.5" />
          ) : (
            <>
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
              <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
            </>
          )}
        </svg>
      </MessageAction>
      {/* A button's new name isn't read out by itself. This is. */}
      <span className="nuv-message__label" role="status">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
});

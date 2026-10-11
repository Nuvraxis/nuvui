"use client";

import {
  type ButtonHTMLAttributes,
  createContext,
  type FormEvent,
  type FormHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { cx } from "../../utils/cx";
import { useControllable } from "../../utils/use-controllable";
import { useOptionalConversation } from "../conversation/conversation";

interface PromptInputContextValue {
  value: string;
  setValue: (value: string) => void;
  disabled: boolean;
  busy: boolean;
  canSubmit: boolean;
  onStop: (() => void) | undefined;
  textarea: { current: HTMLTextAreaElement | null };
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

function usePromptInput(part: string) {
  const context = useContext(PromptInputContext);
  if (!context) throw new Error(`${part} has to be inside a PromptInput.`);
  return context;
}

const isomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface PromptInputOwnProps {
  /** The text in the box, when you keep it. Use it with `onValueChange`. */
  value?: string;
  /** The text in the box to begin with, when it's kept here. */
  defaultValue?: string;
  /** Called with the text as it's typed, and with nothing after a send. */
  onValueChange?: (value: string) => void;
  /**
   * Called with the text when it's sent, by Enter or by the button. The
   * box is emptied after. Text that's only spaces isn't sent.
   */
  onSubmit?: (text: string, event: FormEvent<HTMLFormElement>) => void;
  /**
   * A reply is on its way. Nothing can be sent until it's `false` again,
   * and what's typed meanwhile is kept. With `onStop`, the button to
   * send becomes a button to stop.
   * @default false
   */
  busy?: boolean;
  /** Called by the button to stop, while `busy`. */
  onStop?: () => void;
  /**
   * Nothing can be typed or sent.
   * @default false
   */
  disabled?: boolean;
}

export interface PromptInputProps
  extends PromptInputOwnProps,
    Omit<FormHTMLAttributes<HTMLFormElement>, keyof PromptInputOwnProps> {}

/**
 * The box a prompt is written in: a field that grows with what's typed,
 * and under it a row for buttons. It's a form. Enter sends, and Shift
 * with Enter starts a new line.
 *
 * Inside a `Conversation`, sending also goes to the latest message.
 */
export const PromptInput = forwardRef<HTMLFormElement, PromptInputProps>(
  function PromptInput(
    {
      value: valueProp,
      defaultValue = "",
      onValueChange,
      onSubmit,
      busy = false,
      onStop,
      disabled = false,
      className,
      onClick,
      ...props
    },
    ref,
  ) {
    const [value, setValue] = useControllable(
      valueProp,
      defaultValue,
      onValueChange,
    );
    const textarea = useRef<HTMLTextAreaElement | null>(null);
    const conversation = useOptionalConversation();
    const canSubmit = !disabled && !busy && value.trim() !== "";

    const context = useMemo(
      () => ({ value, setValue, disabled, busy, canSubmit, onStop, textarea }),
      [value, setValue, disabled, busy, canSubmit, onStop],
    );

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
      // The page isn't to be loaded again, whatever happens next.
      event.preventDefault();
      if (!canSubmit) return;
      onSubmit?.(value, event);
      setValue("");
      conversation?.scrollToBottom({ behavior: "auto" });
      textarea.current?.focus();
    }

    // A press on the box's own edge or between its buttons puts the
    // caret in the field, as a press on a text field does.
    function handleClick(event: MouseEvent<HTMLFormElement>) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const pressed = event.target as Element;
      if (pressed.closest("button, a, input, select, textarea, label")) return;
      textarea.current?.focus();
    }

    return (
      <PromptInputContext.Provider value={context}>
        {/* The press is a shortcut for a mouse or a finger. The field is
            reached with Tab like any other. */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: see above */}
        <form
          ref={ref}
          className={cx("nuv-prompt-input", className)}
          data-disabled={disabled ? "" : undefined}
          data-busy={busy ? "" : undefined}
          onSubmit={handleSubmit}
          onClick={handleClick}
          {...props}
        />
      </PromptInputContext.Provider>
    );
  },
);

export interface PromptInputTextareaOwnProps {
  /**
   * Whether Enter sends. Left out, it does where there's a keyboard, and
   * starts a new line on a touch screen, where Enter is the only way to
   * start one and the button is the way to send.
   */
  submitOnEnter?: boolean;
}

export interface PromptInputTextareaProps
  extends PromptInputTextareaOwnProps,
    Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      keyof PromptInputTextareaOwnProps | "value" | "defaultValue"
    > {}

/**
 * The field. It starts a line tall and grows with what's typed, up to a
 * height the stylesheet sets, and scrolls after that. Name it with
 * `aria-label`: a placeholder isn't a name.
 */
export const PromptInputTextarea = forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(function PromptInputTextarea(
  { submitOnEnter, className, onChange, onKeyDown, disabled, ...props },
  ref,
) {
  const context = usePromptInput("PromptInputTextarea");
  const { value, setValue, textarea } = context;

  // As tall as its text. The height is taken off first, so that it can
  // get shorter as well as taller.
  isomorphicLayoutEffect(() => {
    const field = textarea.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [value, textarea]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Enter") return;
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    // Enter that picks a word from an input method's list isn't Enter.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const sends =
      submitOnEnter ??
      !(
        typeof matchMedia === "function" &&
        matchMedia("(pointer: coarse)").matches
      );
    if (!sends) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <textarea
      ref={(node) => {
        textarea.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cx("nuv-prompt-input__textarea", className)}
      rows={1}
      value={value}
      disabled={disabled ?? context.disabled}
      onChange={(event) => {
        onChange?.(event);
        setValue(event.target.value);
      }}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
});

export interface PromptInputToolbarProps
  extends HTMLAttributes<HTMLDivElement> {}

/**
 * The row under the field. What you put first sits at the start and what
 * you put last at the end: tools in a `PromptInputTools`, then the
 * `PromptInputSubmit`.
 */
export const PromptInputToolbar = forwardRef<
  HTMLDivElement,
  PromptInputToolbarProps
>(function PromptInputToolbar({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cx("nuv-prompt-input__toolbar", className)}
      {...props}
    />
  );
});

export interface PromptInputToolsProps extends HTMLAttributes<HTMLDivElement> {}

/** Buttons and the like at the start of the row: a model, a file, a mode. */
export const PromptInputTools = forwardRef<
  HTMLDivElement,
  PromptInputToolsProps
>(function PromptInputTools({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cx("nuv-prompt-input__tools", className)}
      {...props}
    />
  );
});

export interface PromptInputSubmitOwnProps {
  /**
   * The button's name for a screen reader.
   * @default "Send"
   */
  label?: string;
  /**
   * Its name while a reply is on its way and it stops the reply.
   * @default "Stop"
   */
  stopLabel?: string;
  /** In place of the arrow, or of the square while it stops a reply. */
  children?: ReactNode;
}

export interface PromptInputSubmitProps
  extends PromptInputSubmitOwnProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      keyof PromptInputSubmitOwnProps | "type"
    > {}

/**
 * The button that sends. With nothing to send it's marked as disabled and
 * stays where the keyboard can find it. While the box is `busy` and has
 * an `onStop`, it's the button that stops the reply.
 */
export const PromptInputSubmit = forwardRef<
  HTMLButtonElement,
  PromptInputSubmitProps
>(function PromptInputSubmit(
  {
    label = "Send",
    stopLabel = "Stop",
    children,
    className,
    onClick,
    ...props
  },
  ref,
) {
  const { busy, canSubmit, onStop, disabled } =
    usePromptInput("PromptInputSubmit");
  const stops = busy && onStop !== undefined && !disabled;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (stops) {
      // Stopping makes this the button that sends again, and React does
      // that before the press is over. Without this the same press would
      // go on to send.
      event.preventDefault();
      onStop?.();
    }
    // Marked as disabled and not disabled, so a press has to be turned
    // away here.
    else if (!canSubmit) event.preventDefault();
  }

  return (
    <button
      ref={ref}
      type={stops ? "button" : "submit"}
      className={cx("nuv-prompt-input__submit", className)}
      aria-label={stops ? stopLabel : label}
      aria-disabled={stops || canSubmit ? undefined : true}
      data-stop={stops ? "" : undefined}
      onClick={handleClick}
      {...props}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {stops ? (
            <rect
              x="4"
              y="4"
              width="8"
              height="8"
              rx="1.5"
              fill="currentColor"
              stroke="none"
            />
          ) : (
            <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
          )}
        </svg>
      )}
    </button>
  );
});

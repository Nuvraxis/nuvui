"use client";

import {
  type ButtonHTMLAttributes,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

export interface ConversationScrollOptions {
  /**
   * `"smooth"` glides there and `"auto"` jumps. Someone who has asked for
   * less motion always gets the jump.
   * @default "smooth"
   */
  behavior?: "auto" | "smooth";
}

export interface ConversationState {
  /** Whether the latest message is in view. */
  atBottom: boolean;
  /** Goes to the latest message, and follows new ones from then on. */
  scrollToBottom: (options?: ConversationScrollOptions) => void;
}

interface Internal extends ConversationState {
  viewport: { current: HTMLDivElement | null };
  following: { current: boolean };
  setAtBottom: (atBottom: boolean) => void;
}

const ConversationContext = createContext<Internal | null>(null);

// Within this many pixels of the end counts as at the end: a zoomed page
// measures in fractions, and nobody can tell the difference by eye.
const near = 24;

const isomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Whether the conversation is at its latest message, and a way to go
 * there. For a part of your own inside a `Conversation`.
 */
export function useConversation(): ConversationState {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation has to be used inside a Conversation.");
  }
  return context;
}

/** The same, or nothing outside a conversation. For the prompt box. */
export function useOptionalConversation(): ConversationState | null {
  return useContext(ConversationContext);
}

export interface ConversationProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * A conversation: the messages in a box that scrolls, and whatever goes
 * with them, such as the box a prompt is written in. It's as tall as you
 * make it, and the messages take the room that's left.
 */
export const Conversation = forwardRef<HTMLDivElement, ConversationProps>(
  function Conversation({ className, ...props }, ref) {
    const viewport = useRef<HTMLDivElement | null>(null);
    // Whether new messages are followed. It's a ref and not state: it's
    // read when the messages grow, between two renders.
    const following = useRef(true);
    const [atBottom, setAtBottom] = useState(true);

    const scrollToBottom = useCallback(
      ({ behavior = "smooth" }: ConversationScrollOptions = {}) => {
        const box = viewport.current;
        if (!box) return;
        following.current = true;
        const still =
          typeof matchMedia === "function" &&
          matchMedia("(prefers-reduced-motion: reduce)").matches;
        box.scrollTo({
          top: box.scrollHeight,
          behavior: still ? "auto" : behavior,
        });
      },
      [],
    );

    const context = useMemo(
      () => ({ atBottom, scrollToBottom, viewport, following, setAtBottom }),
      [atBottom, scrollToBottom],
    );

    return (
      <ConversationContext.Provider value={context}>
        <div
          ref={ref}
          className={cx("nuv-conversation", className)}
          {...props}
        />
      </ConversationContext.Provider>
    );
  },
);

export interface ConversationContentProps
  extends HTMLAttributes<HTMLDivElement> {}

/**
 * The messages. It scrolls, starts at the latest message, and stays there
 * as a reply arrives. When the reader scrolls up to read, it stops
 * following, and starts again when they come back to the end.
 *
 * To a screen reader it's a log: a new message is read out when it's
 * added. Name it with `aria-label`.
 */
export const ConversationContent = forwardRef<
  HTMLDivElement,
  ConversationContentProps
>(function ConversationContent({ className, children, ...props }, ref) {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("ConversationContent has to be inside a Conversation.");
  }
  const { viewport, following, setAtBottom } = context;
  const content = useRef<HTMLDivElement>(null);

  // The box as it was when last looked at, to tell where the reader was
  // before a change of size, and which way they have moved since. None yet
  // before the first paint.
  const sizes = useRef<{ height: number; room: number; top: number } | null>(
    null,
  );

  // Goes to the end if the end is being followed, and says whether it is.
  // A browser tells of a scroll some time after it happens, and the
  // messages can grow in between. So where the reader is gets read here
  // and not taken from the last scroll that was heard of: one who was at
  // the end before the messages grew is followed, and one who has moved up
  // since is left where they are.
  const follow = useCallback(
    (box: HTMLDivElement) => {
      const was = sizes.current;
      if (!was || was.height - box.scrollTop - was.room <= near) {
        following.current = true;
      }
      // Up, in a box that hasn't got shorter. When it has, the browser
      // moved the position, and the reader didn't.
      else if (box.scrollTop < was.top - 1 && box.scrollHeight >= was.height) {
        following.current = false;
      }
      if (following.current) box.scrollTop = box.scrollHeight;
      sizes.current = {
        height: box.scrollHeight,
        room: box.clientHeight,
        top: box.scrollTop,
      };
    },
    [following],
  );

  // After every render, before it's painted: at the latest message from
  // the first paint, and at the end of a reply as each part of it is
  // drawn, with no frame in between where the end is out of view. It
  // doesn't wait to be told that the size changed, which a browser does
  // when it next paints, and a page that isn't being painted never hears.
  isomorphicLayoutEffect(() => {
    if (viewport.current) follow(viewport.current);
  });

  useEffect(() => {
    const box = viewport.current;
    const inner = content.current;
    if (!box || !inner) return;
    let last = box.scrollTop;

    const measure = () =>
      box.scrollHeight - box.scrollTop - box.clientHeight <= near;

    const scrolled = () => {
      const top = box.scrollTop;
      const end = measure();
      // Back at the end, it follows again. It stops following only when
      // the reader has moved up: a reply that grows leaves the box short
      // of its end for a moment, and that isn't the reader's doing.
      if (end) following.current = true;
      else if (top < last - 1) following.current = false;
      last = top;
      setAtBottom(end);
    };

    // A size changed without a render of the messages: a picture in one
    // loaded, the prompt box under them grew a line, or a phone's keyboard
    // opened.
    const resized = () => {
      follow(box);
      last = box.scrollTop;
      setAtBottom(measure());
    };

    box.addEventListener("scroll", scrolled, { passive: true });
    const observer = new ResizeObserver(resized);
    observer.observe(inner);
    observer.observe(box);
    return () => {
      box.removeEventListener("scroll", scrolled);
      observer.disconnect();
    };
  }, [viewport, following, setAtBottom, follow]);

  return (
    <div
      ref={(node) => {
        viewport.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cx("nuv-conversation__viewport", className)}
      role="log"
      // A box that scrolls has to be reachable, to be scrolled with the
      // keys.
      // biome-ignore lint/a11y/noNoninteractiveTabindex: see above
      tabIndex={0}
      {...props}
    >
      <div ref={content} className="nuv-conversation__content">
        {children}
      </div>
    </div>
  );
});

export interface ConversationEmptyProps
  extends HTMLAttributes<HTMLDivElement> {}

/**
 * What's shown before there are any messages: a greeting, and prompts to
 * start from. It sits in the middle of the room the messages would take.
 */
export const ConversationEmpty = forwardRef<
  HTMLDivElement,
  ConversationEmptyProps
>(function ConversationEmpty({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cx("nuv-conversation__empty", className)}
      {...props}
    />
  );
});

export interface ConversationScrollButtonOwnProps {
  /**
   * The button's name for a screen reader.
   * @default "Go to the latest message"
   */
  label?: string;
  /** In place of the arrow. */
  children?: ReactNode;
}

export interface ConversationScrollButtonProps
  extends ConversationScrollButtonOwnProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      keyof ConversationScrollButtonOwnProps
    > {}

/**
 * A button over the end of the messages that goes to the latest one. It's
 * only there while the latest message is out of view.
 */
export const ConversationScrollButton = forwardRef<
  HTMLButtonElement,
  ConversationScrollButtonProps
>(function ConversationScrollButton(
  {
    label = "Go to the latest message",
    children,
    className,
    onClick,
    ...props
  },
  ref,
) {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "ConversationScrollButton has to be inside a Conversation.",
    );
  }
  if (context.atBottom) return null;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // The button goes once the end is reached. Focus goes to the
    // messages first, so that it isn't dropped on the page.
    context?.viewport.current?.focus({ preventScroll: true });
    context?.scrollToBottom();
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cx("nuv-conversation__scroll-button", className)}
      aria-label={label}
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
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
        </svg>
      )}
    </button>
  );
});

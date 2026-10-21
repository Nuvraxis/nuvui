"use client";

import {
  type CSSProperties,
  Fragment,
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

/** A run of code in one color. */
export interface CodeToken {
  /** The text. */
  content: string;
  /** Any CSS color. Left out, it's the block's own text color. */
  color?: string;
  fontStyle?: "italic";
  fontWeight?: "bold";
  textDecoration?: "underline" | "line-through";
}

/**
 * Colors code: called with the code and the language it was marked as,
 * and returns the code's lines, each a list of tokens. It can return a
 * promise of them. `null` says the language isn't one it knows, and the
 * code is shown in one color.
 *
 * The tokens' text, put back together, has to be the code it was given.
 */
export type CodeHighlighter = (
  code: string,
  language: string | undefined,
) => CodeToken[][] | null | Promise<CodeToken[][] | null>;

export interface CodeBlockOwnProps {
  /** The code. */
  code: string;
  /**
   * The language it's in, as it's written after the fence in markdown:
   * `"ts"`, `"python"`. It's shown over the code and handed to the
   * highlighter.
   */
  language?: string;
  /** In place of the language over the code: a file's name, most often. */
  title?: ReactNode;
  /**
   * Colors the code. Without one it's in one color. A ready one for
   * Shiki is at `@nuvui/chat/shiki`.
   */
  highlighter?: CodeHighlighter;
  /**
   * Whether there's a button that copies the code.
   * @default true
   */
  copyable?: boolean;
  /**
   * The copy button's name for a screen reader.
   * @default "Copy code"
   */
  copyLabel?: string;
  /**
   * Its name for the two seconds after it has copied.
   * @default "Copied"
   */
  copiedLabel?: string;
  /** Called once the code is on the clipboard. */
  onCopy?: (code: string) => void;
  /**
   * Called if the browser wouldn't copy: the page isn't served over
   * HTTPS, or permission was refused.
   */
  onCopyError?: (error: unknown) => void;
  /**
   * The name of the box the code scrolls in, for a screen reader.
   * @default "Code"
   */
  label?: string;
  /**
   * Whether the code types itself out, a character at a time, with a
   * cursor at the end. The box has its full size from the start, and a
   * screen reader and a copy get the whole code. For less motion it's all
   * there at once.
   * @default false
   */
  typing?: boolean;
  /**
   * When the typing starts: `"mount"` is as soon as it's drawn, and
   * `"view"` the first time it's scrolled into view.
   * @default "mount"
   */
  typingTrigger?: "mount" | "view";
  /**
   * How long the typing takes, in milliseconds. Left out, it's 25 a
   * character, and no more than 3,000.
   */
  typingDuration?: number;
  /**
   * How long to wait before the typing starts, in milliseconds.
   * @default 0
   */
  typingDelay?: number;
  /** Called once the whole code is there, typed or shown at once. */
  onTyped?: () => void;
}

export interface CodeBlockProps
  extends CodeBlockOwnProps,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      keyof CodeBlockOwnProps | "children"
    > {}

// How long the tick stays, in milliseconds.
const shown = 2000;

interface Colored {
  code: string;
  language: string | undefined;
  lines: CodeToken[][];
}

// With no duration given: how long a character takes, and the longest the
// whole code may take.
const perCharacter = 25;
const longest = 3000;

// "pending" is the page from the server, before the script has run.
// "waiting" is before the delay is up, or before it's in view.
type Typing = "pending" | "waiting" | "typing" | "done";

// A run of the code, in one token's style or in the block's own.
interface Segment {
  text: string;
  token?: CodeToken;
}

const styleOf = (token: CodeToken): CSSProperties => ({
  color: token.color,
  fontStyle: token.fontStyle,
  fontWeight: token.fontWeight,
  textDecoration: token.textDecoration,
});

function segmentsOf(code: string, colored: Colored | null): Segment[] {
  if (!colored) return [{ text: code }];
  const segments: Segment[] = [];
  colored.lines.forEach((line, row) => {
    if (row > 0) segments.push({ text: "\n" });
    for (const token of line) segments.push({ text: token.content, token });
  });
  const rest = code.slice(colored.code.length);
  if (rest) segments.push({ text: rest });
  return segments;
}

const caret = (
  <span key="caret" className="nuv-code-block__caret" aria-hidden="true" />
);

// The code with the first `typed` characters shown, the cursor after them,
// and the rest in the page but not drawn: the box keeps its full size, and
// a screen reader and a copy still get every character.
function typedOut(segments: Segment[], typed: number) {
  let offset = 0;
  return segments.map((segment, index) => {
    const start = offset;
    const end = start + segment.text.length;
    offset = end;
    const cut = Math.min(Math.max(typed - start, 0), segment.text.length);
    const here =
      (typed >= start && typed < end) ||
      (typed === end && index === segments.length - 1);
    const rest = segment.text.slice(cut);
    const content = (
      <>
        {segment.text.slice(0, cut)}
        {here ? caret : null}
        {rest ? <span className="nuv-code-block__untyped">{rest}</span> : null}
      </>
    );
    return segment.token ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: a run has no name but its place
      <span key={index} style={styleOf(segment.token)}>
        {content}
      </span>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: see above
      <Fragment key={index}>{content}</Fragment>
    );
  });
}

/**
 * Code in a box of its own, in the type code is set in: its language
 * over it, a button that copies it, and colors if you give it a
 * highlighter. Long lines scroll sideways and aren't wrapped.
 */
export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
  function CodeBlock(
    {
      code,
      language,
      title,
      highlighter,
      copyable = true,
      copyLabel = "Copy code",
      copiedLabel = "Copied",
      onCopy,
      onCopyError,
      label = "Code",
      typing = false,
      typingTrigger = "mount",
      typingDuration,
      typingDelay = 0,
      onTyped,
      className,
      ...props
    },
    ref,
  ) {
    const [colored, setColored] = useState<Colored | null>(null);
    const [copied, setCopied] = useState(false);
    const [phase, setPhase] = useState<Typing | null>(
      typing ? "pending" : null,
    );
    const [typed, setTyped] = useState(0);
    const scrollerRef = useRef<HTMLDivElement>(null);
    // Read while it types: the code can still be arriving.
    const latest = useRef({ code, onTyped });
    latest.current = { code, onTyped };
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);

    useEffect(() => {
      if (!highlighter) {
        setColored(null);
        return;
      }
      let wanted = true;
      // Whatever goes wrong in a highlighter, the code is still shown.
      Promise.resolve()
        .then(() => highlighter(code, language))
        .then(
          (lines) => {
            if (wanted) setColored(lines ? { code, language, lines } : null);
          },
          () => {
            if (wanted) setColored(null);
          },
        );
      return () => {
        wanted = false;
      };
    }, [highlighter, code, language]);

    useEffect(() => {
      if (!typing) {
        setPhase(null);
        return;
      }
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const finish = () => {
        setPhase("done");
        latest.current.onTyped?.();
      };
      // All there at once for less motion, and where the browser forces
      // its own colors, which the hidden part can't keep to.
      if (
        matchMedia("(prefers-reduced-motion: reduce)").matches ||
        matchMedia("(forced-colors: active)").matches
      ) {
        finish();
        return;
      }

      let frame = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let observer: IntersectionObserver | undefined;
      const type = () => {
        setPhase("typing");
        const start = performance.now();
        const step = (now: number) => {
          const total = latest.current.code.length;
          const duration =
            typingDuration ?? Math.min(longest, total * perCharacter);
          const progress = duration > 0 ? (now - start) / duration : 1;
          if (progress >= 1) {
            setTyped(total);
            finish();
            return;
          }
          setTyped(Math.floor(total * progress));
          frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      };
      const begin = () => {
        if (typingDelay > 0) timer = setTimeout(type, typingDelay);
        else type();
      };

      setPhase("waiting");
      setTyped(0);
      if (typingTrigger === "view") {
        // As soon as any of it is in view: a block at the end of a page
        // can't be scrolled further in.
        observer = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          begin();
        });
        observer.observe(scroller);
      } else {
        begin();
      }
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        observer?.disconnect();
      };
    }, [typing, typingTrigger, typingDuration, typingDelay]);

    // A long line, or a box with a height of its own, scrolls to keep the
    // cursor in view. Only the box: the page stays where it is.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs for each character typed
    useLayoutEffect(() => {
      if (phase !== "typing") return;
      const scroller = scrollerRef.current;
      const cursor = scroller?.querySelector(".nuv-code-block__caret");
      if (!scroller || !cursor) return;
      const box = scroller.getBoundingClientRect();
      const at = cursor.getBoundingClientRect();
      if (at.right > box.right) scroller.scrollLeft += at.right - box.right;
      else if (at.left < box.left) scroller.scrollLeft -= box.left - at.left;
      if (at.bottom > box.bottom) scroller.scrollTop += at.bottom - box.bottom;
      else if (at.top < box.top) scroller.scrollTop -= box.top - at.top;
    }, [phase, typed]);

    async function handleCopy(event: MouseEvent<HTMLButtonElement>) {
      // Inside a form, it isn't the button that sends.
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(code);
      } catch (error) {
        onCopyError?.(error);
        return;
      }
      onCopy?.(code);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), shown);
    }

    // The colors are for code that was colored a moment ago. While code
    // is still arriving, what's new since then is shown after them in one
    // color, so nothing flickers and nothing is behind.
    const usable =
      colored !== null &&
      colored.language === language &&
      code.startsWith(colored.code);
    const heading = title ?? language;

    return (
      <div
        ref={ref}
        className={cx("nuv-code-block", className)}
        data-language={language}
        data-highlighted={usable ? "" : undefined}
        data-typing={phase ?? undefined}
        {...props}
      >
        {heading || copyable ? (
          <div className="nuv-code-block__head">
            <span className="nuv-code-block__title">{heading}</span>
            {copyable ? (
              <>
                <button
                  type="button"
                  className="nuv-code-block__copy"
                  aria-label={copied ? copiedLabel : copyLabel}
                  data-copied={copied ? "" : undefined}
                  onClick={handleCopy}
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
                </button>
                {/* A button's new name isn't read out by itself. This is. */}
                <span className="nuv-code-block__status" role="status">
                  {copied ? copiedLabel : ""}
                </span>
              </>
            ) : null}
          </div>
        ) : null}
        {/* Long lines scroll, and a box that scrolls has to be reachable,
            to be scrolled with the keys. */}
        {/* biome-ignore lint/a11y/useSemanticElements: a fieldset would draw a frame of its own */}
        <div
          ref={scrollerRef}
          role="group"
          aria-label={label}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: see above
          tabIndex={0}
          className="nuv-code-block__scroller"
        >
          <pre className="nuv-code-block__pre">
            <code className="nuv-code-block__code">
              {phase && phase !== "done"
                ? typedOut(
                    segmentsOf(code, usable ? colored : null),
                    phase === "typing" ? typed : 0,
                  )
                : usable && colored
                  ? colored.lines.map((line, row) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: lines and tokens have no name but their place
                      <span key={row}>
                        {row > 0 ? "\n" : null}
                        {line.map((token, column) => (
                          <span
                            // biome-ignore lint/suspicious/noArrayIndexKey: see above
                            key={column}
                            style={styleOf(token)}
                          >
                            {token.content}
                          </span>
                        ))}
                      </span>
                    ))
                  : code}
              {(!phase || phase === "done") && usable && colored
                ? code.slice(colored.code.length)
                : null}
            </code>
          </pre>
        </div>
      </div>
    );
  },
);

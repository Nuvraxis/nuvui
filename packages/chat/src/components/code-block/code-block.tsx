"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useEffect,
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
      className,
      ...props
    },
    ref,
  ) {
    const [colored, setColored] = useState<Colored | null>(null);
    const [copied, setCopied] = useState(false);
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
          role="group"
          aria-label={label}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: see above
          tabIndex={0}
          className="nuv-code-block__scroller"
        >
          <pre className="nuv-code-block__pre">
            <code className="nuv-code-block__code">
              {usable && colored
                ? colored.lines.map((line, row) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: lines and tokens have no name but their place
                    <span key={row}>
                      {row > 0 ? "\n" : null}
                      {line.map((token, column) => (
                        <span
                          // biome-ignore lint/suspicious/noArrayIndexKey: see above
                          key={column}
                          style={{
                            color: token.color,
                            fontStyle: token.fontStyle,
                            fontWeight: token.fontWeight,
                            textDecoration: token.textDecoration,
                          }}
                        >
                          {token.content}
                        </span>
                      ))}
                    </span>
                  ))
                : code}
              {usable && colored ? code.slice(colored.code.length) : null}
            </code>
          </pre>
        </div>
      </div>
    );
  },
);

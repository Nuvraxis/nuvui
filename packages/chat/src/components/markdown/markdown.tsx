"use client";

import {
  type ComponentProps,
  createElement,
  forwardRef,
  type HTMLAttributes,
  memo,
  useMemo,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cx } from "../../utils/cx";
import { CodeBlock, type CodeHighlighter } from "../code-block/code-block";
import { closeMarkdown } from "./close-markdown";

const plugins = [remarkGfm];

// As much of the parsed text's shape as is read here.
interface Parsed {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Parsed[];
}

const textOf = (node: Parsed): string =>
  node.type === "text"
    ? (node.value ?? "")
    : (node.children ?? []).map(textOf).join("");

export interface MarkdownOwnProps {
  /** The markdown. */
  children: string;
  /**
   * The text is still arriving. What's open at its end is closed for the
   * moment, so a block of code is drawn as one before its last line has
   * come, and bold as bold.
   * @default false
   */
  streaming?: boolean;
  /**
   * Colors the blocks of code. Without one they're in one color. A ready
   * one for Shiki is at `@nuvui/chat/shiki`. Make it once, outside the
   * component: a new one on every render colors everything again.
   */
  highlighter?: CodeHighlighter;
  /**
   * Whether pictures in the text are loaded. Left off, a picture is a
   * link with its description as the text. A picture's address is
   * fetched as soon as it's drawn, and text a model wrote can put
   * anything in that address, the conversation included.
   * @default false
   */
  allowImages?: boolean;
  /**
   * How many levels the headings are moved down, so that they fit under
   * the page's own. With `2`, `#` is an `h3`.
   * @default 0
   */
  headingOffset?: number;
  /**
   * Your own elements in place of these, by tag name, as react-markdown
   * takes them. Keep the object the same from one render to the next.
   */
  components?: Components;
  /**
   * The name of the box a wide table scrolls in.
   * @default "Table"
   */
  tableLabel?: string;
  /**
   * What a ticked item of a task list is called.
   * @default "Done"
   */
  doneLabel?: string;
  /**
   * What one that isn't ticked is called.
   * @default "To do"
   */
  todoLabel?: string;
  /**
   * The name of the button that copies a block of code.
   * @default "Copy code"
   */
  copyLabel?: string;
  /**
   * Its name for the two seconds after it has copied.
   * @default "Copied"
   */
  copiedLabel?: string;
  /**
   * The name of the box a block of code scrolls in.
   * @default "Code"
   */
  codeLabel?: string;
}

export interface MarkdownProps
  extends MarkdownOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof MarkdownOwnProps> {}

/**
 * Markdown drawn with the library's own type: headings, lists, tables,
 * links, quotes and code. It's what a model writes, so it's what a reply
 * is most often drawn with. HTML in the text is shown as text and never
 * run.
 */
export const Markdown = memo(
  forwardRef<HTMLDivElement, MarkdownProps>(function Markdown(
    {
      children,
      streaming = false,
      highlighter,
      allowImages = false,
      headingOffset = 0,
      components,
      tableLabel = "Table",
      doneLabel = "Done",
      todoLabel = "To do",
      copyLabel,
      copiedLabel,
      codeLabel,
      className,
      ...props
    },
    ref,
  ) {
    // The same functions from one render to the next. A new one would be
    // a new kind of element to React, which would take the old one away
    // and with it what a block of code has been colored with.
    const own = useMemo<Components>(() => {
      const heading = (level: number) =>
        function Heading({
          node: _node,
          ...rest
        }: ComponentProps<"h1"> & { node?: unknown }) {
          return createElement(
            `h${Math.min(6, Math.max(1, level + headingOffset))}`,
            rest,
          );
        };

      return {
        h1: heading(1),
        h2: heading(2),
        h3: heading(3),
        h4: heading(4),
        h5: heading(5),
        h6: heading(6),
        // A fenced block of code: a `pre` with one `code` in it, whose
        // class names the language.
        pre({ node }) {
          const block = node as Parsed | undefined;
          const code = block?.children?.find(
            (child) => child.tagName === "code",
          );
          const classes = code?.properties?.className;
          const language = Array.isArray(classes)
            ? classes
                .map(String)
                .find((name) => name.startsWith("language-"))
                ?.slice("language-".length)
            : undefined;
          const text = code ? textOf(code) : block ? textOf(block) : "";

          return (
            <CodeBlock
              // The line break before the closing fence isn't code.
              code={text.replace(/\n$/, "")}
              language={language}
              highlighter={highlighter}
              copyLabel={copyLabel}
              copiedLabel={copiedLabel}
              label={codeLabel}
            />
          );
        },
        // A table can be wider than a message. It scrolls in a box of
        // its own, which has to be reachable to be scrolled with the keys.
        table({ node: _node, ...rest }) {
          return (
            // biome-ignore lint/a11y/useSemanticElements: a fieldset would draw a frame of its own
            <div
              role="group"
              aria-label={tableLabel}
              // biome-ignore lint/a11y/noNoninteractiveTabindex: see above
              tabIndex={0}
              className="nuv-markdown__table"
            >
              <table {...rest} />
            </div>
          );
        },
        // Markdown's tables have headings over their columns and none
        // beside their rows, and saying so is what makes each one a
        // column's heading to everything that reads the page.
        th({ node: _node, ...rest }) {
          return <th scope="col" {...rest} />;
        },
        img({ node: _node, src, alt, title }) {
          if (allowImages) {
            return <img src={src} alt={alt ?? ""} title={title} />;
          }
          const address = typeof src === "string" ? src : undefined;
          const text = alt || address;
          return address ? <a href={address}>{text}</a> : (text ?? null);
        },
        // A task list's box. It can't be ticked here, and says in words
        // which it is, since nothing else names it.
        input({ node: _node, ...rest }) {
          return rest.type === "checkbox" ? (
            <input
              {...rest}
              aria-label={rest.checked ? doneLabel : todoLabel}
            />
          ) : (
            <input {...rest} />
          );
        },
      };
    }, [
      highlighter,
      allowImages,
      headingOffset,
      tableLabel,
      doneLabel,
      todoLabel,
      copyLabel,
      copiedLabel,
      codeLabel,
    ]);
    const all = useMemo(() => ({ ...own, ...components }), [own, components]);

    return (
      <div ref={ref} className={cx("nuv-markdown", className)} {...props}>
        <ReactMarkdown remarkPlugins={plugins} components={all}>
          {streaming ? closeMarkdown(children) : children}
        </ReactMarkdown>
      </div>
    );
  }),
);

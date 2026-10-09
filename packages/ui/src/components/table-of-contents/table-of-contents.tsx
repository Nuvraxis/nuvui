"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

export interface TableOfContentsItem {
  /** The `id` of the heading in the page. The link goes to `#id`. */
  id: string;
  /** What the link says: the heading's text. */
  title: ReactNode;
  /**
   * How far in the link is set. 1 is a section, 2 a section inside one,
   * and so on to 4.
   * @default 1
   */
  depth?: 1 | 2 | 3 | 4;
}

export interface TableOfContentsOwnProps {
  /** The headings, in the order they come in the page. */
  items: TableOfContentsItem[];
  /**
   * The `id` of the heading that's marked, when you control it. `null`
   * marks none. Left out, the component follows the page as it scrolls.
   */
  value?: string | null;
  /**
   * Called with the `id` of the heading the page has scrolled to, or
   * `null` above the first one.
   */
  onValueChange?: (value: string | null) => void;
  /**
   * How far down the window, in pixels, a heading counts as reached. Set
   * it to the height of whatever is stuck to the top of your page, and a
   * little more.
   * @default 96
   */
  offset?: number;
}

export interface TableOfContentsProps
  extends TableOfContentsOwnProps,
    Omit<HTMLAttributes<HTMLElement>, keyof TableOfContentsOwnProps> {}

// Whether the page has been scrolled as far down as it goes. The last
// headings of a page often can't get to the top of the window.
function atEnd() {
  const page = document.scrollingElement;
  if (!page || page.scrollTop <= 0) return false;
  return Math.ceil(page.scrollTop + page.clientHeight) >= page.scrollHeight;
}

/**
 * The headings of a page as a list of links, with the one that's being
 * read marked. It follows the page as it scrolls. Put it beside the page,
 * or in a popover behind a button.
 */
export const TableOfContents = forwardRef<HTMLElement, TableOfContentsProps>(
  function TableOfContents(
    { items, value, onValueChange, offset = 96, className, ...props },
    ref,
  ) {
    const [reached, setReached] = useState<string | null>(null);
    const active = value === undefined ? reached : value;

    const changeRef = useRef(onValueChange);
    changeRef.current = onValueChange;
    // The link that was last followed. At the end of the page, where
    // several headings are in view and none is at the top, it's the one
    // to mark.
    const followed = useRef<string | null>(null);

    // A new array of the same headings, as one written in JSX is on every
    // render, isn't a reason to start again.
    const ids = items.map((item) => item.id).join("\n");

    useEffect(() => {
      const list = ids === "" ? [] : ids.split("\n");
      let last: string | null | undefined;
      let frame = 0;

      const measure = () => {
        frame = 0;
        let current: string | null = null;
        let final: string | null = null;
        for (const id of list) {
          const heading = document.getElementById(id);
          if (!heading) continue;
          final = id;
          if (heading.getBoundingClientRect().top <= offset) current = id;
        }
        if (atEnd()) {
          current =
            followed.current && list.includes(followed.current)
              ? followed.current
              : final;
        } else {
          followed.current = null;
        }

        if (current === last) return;
        last = current;
        setReached(current);
        changeRef.current?.(current);
      };
      // Once a frame at most, however often the browser says it scrolled.
      const schedule = () => {
        if (frame === 0) frame = requestAnimationFrame(measure);
      };

      measure();
      // Scrolling doesn't bubble. Capturing hears it from the window and
      // from anything inside the page that scrolls by itself.
      document.addEventListener("scroll", schedule, {
        capture: true,
        passive: true,
      });
      window.addEventListener("resize", schedule);
      return () => {
        cancelAnimationFrame(frame);
        document.removeEventListener("scroll", schedule, { capture: true });
        window.removeEventListener("resize", schedule);
      };
    }, [ids, offset]);

    return (
      <nav
        ref={ref}
        className={cx("nuv-table-of-contents", className)}
        {...props}
      >
        <ol
          // biome-ignore lint/a11y/noRedundantRoles: Safari stops calling a list a list once its numbers are styled away, and saying so again brings it back
          role="list"
          className="nuv-table-of-contents__list"
        >
          {items.map(({ id, title, depth = 1 }) => (
            <li key={id} className="nuv-table-of-contents__item">
              <a
                href={`#${id}`}
                className="nuv-table-of-contents__link"
                aria-current={id === active ? "location" : undefined}
                data-depth={depth}
                onClick={() => {
                  followed.current = id;
                }}
              >
                {title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    );
  },
);

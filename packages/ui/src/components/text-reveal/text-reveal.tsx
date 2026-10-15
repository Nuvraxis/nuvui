"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import {
  type CSSProperties,
  Fragment,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

export interface TextRevealOwnProps {
  /**
   * The lines, in order. Each one rises into place a moment after the one
   * before it. A line can hold markup, such as a link or an `em`.
   */
  lines: ReactNode[];
  /**
   * When the lines rise. `"mount"` is as soon as it's drawn, for text at
   * the top of a page. `"view"` is the first time it's scrolled into
   * view, for text further down. Text that's already in view when the
   * page opens is shown as it is.
   * @default "mount"
   */
  trigger?: "mount" | "view";
}

export interface TextRevealProps
  extends TextRevealOwnProps,
    Omit<HTMLAttributes<HTMLSpanElement>, "children"> {}

type State = "rising" | "waiting" | "shown";

/**
 * Lines of text that rise into place one after another, for a heading
 * that opens a page. It's still for anyone who asked for less motion, the
 * text is in the page from the server, and a screen reader reads the
 * lines as one text.
 */
export const TextReveal = forwardRef<HTMLSpanElement, TextRevealProps>(
  function TextReveal({ lines, trigger = "mount", className, ...props }, ref) {
    // On the server and in the first render the text is there to read. A
    // line is hidden only by the rise itself, or by this script once it
    // knows the text is out of view, so a page whose script never runs
    // still shows every word.
    const [state, setState] = useState<State>(
      trigger === "mount" ? "rising" : "shown",
    );
    const ownRef = useRef<HTMLSpanElement>(null);
    const merged = useComposedRefs(ref, ownRef);

    useLayoutEffect(() => {
      const element = ownRef.current;
      if (trigger !== "view" || !element) return;
      const box = element.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) return;

      setState("waiting");
      // As soon as any of it is in view. Waiting until it's further in
      // would leave text at the end of a page hidden for good, since the
      // page can't be scrolled to bring it further in.
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setState("rising");
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, [trigger]);

    return (
      <span
        ref={merged}
        data-state={state}
        className={cx("nuv-text-reveal", className)}
        {...props}
      >
        {lines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a line is where it is in the text
          <Fragment key={index}>
            {/* A space between lines, so they read and copy as words and
                not as one run-on word. */}
            {index > 0 ? " " : null}
            <span
              className="nuv-text-reveal__line"
              style={{ "--nuv-text-reveal-index": index } as CSSProperties}
            >
              <span className="nuv-text-reveal__text">{line}</span>
            </span>
          </Fragment>
        ))}
      </span>
    );
  },
);

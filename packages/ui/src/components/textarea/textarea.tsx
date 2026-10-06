"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import {
  forwardRef,
  type TextareaHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

export interface TextareaOwnProps {
  /**
   * Grow with the text, so that all of it shows without scrolling. Set
   * `--nuv-textarea-max-height` to stop it at a height and scroll from there.
   * @default false
   */
  autoResize?: boolean;
}

export interface TextareaProps
  extends TextareaOwnProps,
    TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ autoResize = false, className, ...props }, ref) {
    const [element, setElement] = useState<HTMLTextAreaElement | null>(null);
    const fit = useRef<() => void>(undefined);
    const { value } = props;

    // A browser that has field-sizing sizes the box itself, from the
    // stylesheet. This is for the ones that don't.
    useEffect(() => {
      if (!autoResize || !element) return;
      if (CSS.supports("field-sizing", "content")) return;

      const resize = () => {
        const edges = element.offsetHeight - element.clientHeight;
        element.style.blockSize = "auto";
        element.style.blockSize = `${element.scrollHeight + edges}px`;
      };
      // A form's reset event fires before the fields are emptied.
      const afterReset = () => requestAnimationFrame(resize);

      resize();
      fit.current = resize;
      element.addEventListener("input", resize);
      element.form?.addEventListener("reset", afterReset);
      // Text wraps differently once the width changes.
      const observer = new ResizeObserver(resize);
      observer.observe(element);

      return () => {
        fit.current = undefined;
        element.removeEventListener("input", resize);
        element.form?.removeEventListener("reset", afterReset);
        observer.disconnect();
        element.style.blockSize = "";
      };
    }, [autoResize, element]);

    // A value set from outside doesn't fire an input event.
    // biome-ignore lint/correctness/useExhaustiveDependencies: a new value is the reason to run, and nothing in here reads it
    useEffect(() => fit.current?.(), [value]);

    return (
      <textarea
        ref={useComposedRefs(ref, setElement)}
        className={cx(
          "nuv-textarea",
          autoResize && "nuv-textarea--auto-resize",
          className,
        )}
        {...props}
      />
    );
  },
);

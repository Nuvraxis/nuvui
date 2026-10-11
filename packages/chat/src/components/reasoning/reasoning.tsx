"use client";

import {
  Collapsible,
  CollapsibleContent,
  type CollapsibleProps,
  CollapsibleTrigger,
} from "@nuvui/react/collapsible";
import { Spinner } from "@nuvui/react/spinner";
import { TextShimmer } from "@nuvui/react/text-shimmer";
import {
  type ButtonHTMLAttributes,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import { cx } from "../../utils/cx";
import { useControllable } from "../../utils/use-controllable";

const ReasoningContext = createContext<{ streaming: boolean } | null>(null);

export interface ReasoningOwnProps {
  /**
   * The assistant is still working it out. The steps are open for as
   * long as it is, and close when it's done, unless the reader opened or
   * closed them in the meantime: then they stay as the reader left them.
   * @default false
   */
  streaming?: boolean;
}

export interface ReasoningProps
  extends ReasoningOwnProps,
    Omit<CollapsibleProps, keyof ReasoningOwnProps> {}

/**
 * How the assistant got to its reply: a line that opens to show the
 * steps. Put it in a `Message`, over the `MessageContent`.
 */
export const Reasoning = forwardRef<HTMLDivElement, ReasoningProps>(
  function Reasoning(
    {
      streaming = false,
      open: openProp,
      defaultOpen,
      onOpenChange,
      className,
      ...props
    },
    ref,
  ) {
    const [open, setOpen] = useControllable(
      openProp,
      defaultOpen ?? streaming,
      onOpenChange,
    );
    // Whether the reader has opened or closed it themselves.
    const chosen = useRef(false);
    const was = useRef(streaming);
    useEffect(() => {
      if (was.current === streaming) return;
      was.current = streaming;
      if (!chosen.current) setOpen(streaming);
    }, [streaming, setOpen]);

    return (
      <ReasoningContext.Provider value={{ streaming }}>
        <Collapsible
          ref={ref}
          className={cx("nuv-reasoning", className)}
          data-streaming={streaming ? "" : undefined}
          open={open}
          onOpenChange={(next) => {
            chosen.current = true;
            setOpen(next);
          }}
          {...props}
        />
      </ReasoningContext.Provider>
    );
  },
);

export interface ReasoningTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * The line that opens the steps. Left empty it says "Thinking" while the
 * assistant is at it and "Reasoning" after. Say more if you know more:
 * "Thought for 8 seconds".
 */
export const ReasoningTrigger = forwardRef<
  HTMLButtonElement,
  ReasoningTriggerProps
>(function ReasoningTrigger({ className, children, ...props }, ref) {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("ReasoningTrigger has to be inside a Reasoning.");
  }
  const text = children ?? (context.streaming ? "Thinking" : "Reasoning");

  return (
    <CollapsibleTrigger
      ref={ref}
      className={cx("nuv-reasoning__trigger", className)}
      {...props}
    >
      {context.streaming ? <TextShimmer>{text}</TextShimmer> : text}
      <svg
        aria-hidden="true"
        className="nuv-reasoning__chevron"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </CollapsibleTrigger>
  );
});

export interface ReasoningContentProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * What opens: the assistant's own words about what it did, or a
 * `ReasoningSteps`.
 */
export const ReasoningContent = forwardRef<
  HTMLDivElement,
  ReasoningContentProps
>(function ReasoningContent({ className, ...props }, ref) {
  return (
    <CollapsibleContent className="nuv-reasoning__content">
      <div
        ref={ref}
        className={cx("nuv-reasoning__body", className)}
        {...props}
      />
    </CollapsibleContent>
  );
});

export interface ReasoningStepsProps extends HTMLAttributes<HTMLOListElement> {}

/** The steps, in the order they were taken. */
export const ReasoningSteps = forwardRef<HTMLOListElement, ReasoningStepsProps>(
  function ReasoningSteps({ className, ...props }, ref) {
    return (
      <ol
        ref={ref}
        // biome-ignore lint/a11y/noRedundantRoles: Safari stops calling a list a list once its numbers are styled away, and saying so again brings it back
        role="list"
        className={cx("nuv-reasoning__steps", className)}
        {...props}
      />
    );
  },
);

export interface ReasoningStepOwnProps {
  /** What was done, in a few words. */
  label: ReactNode;
  /**
   * `"active"` for the step that's being taken now. It shows a spinner
   * and is marked as the current step.
   * @default "done"
   */
  status?: "done" | "active";
  /** More about it, under the label. */
  children?: ReactNode;
}

export interface ReasoningStepProps
  extends ReasoningStepOwnProps,
    Omit<LiHTMLAttributes<HTMLLIElement>, keyof ReasoningStepOwnProps> {}

/** One step. It goes inside a `ReasoningSteps`. */
export const ReasoningStep = forwardRef<HTMLLIElement, ReasoningStepProps>(
  function ReasoningStep(
    { label, status = "done", className, children, ...props },
    ref,
  ) {
    return (
      <li
        ref={ref}
        className={cx("nuv-reasoning__step", className)}
        data-status={status}
        aria-current={status === "active" ? "step" : undefined}
        {...props}
      >
        <span className="nuv-reasoning__marker" aria-hidden="true">
          {status === "active" ? (
            <Spinner size="sm" label="" />
          ) : (
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
              <path d="m3.5 8.5 3 3 6-7" />
            </svg>
          )}
        </span>
        <div className="nuv-reasoning__text">
          <div className="nuv-reasoning__label">{label}</div>
          {children ? (
            <div className="nuv-reasoning__detail">{children}</div>
          ) : null}
        </div>
      </li>
    );
  },
);

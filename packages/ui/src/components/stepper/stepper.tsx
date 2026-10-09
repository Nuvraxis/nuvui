"use client";

import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type OlHTMLAttributes,
  useContext,
  useMemo,
} from "react";
import { cx } from "../../utils/cx";

type State = "complete" | "current" | "upcoming";

interface StepperContextValue {
  value: number;
  variant: "number" | "dot";
  completedLabel: string;
}

const StepperContext = createContext<StepperContextValue | null>(null);
const ItemContext = createContext<{ step: number; state: State } | null>(null);

function useItem(part: string) {
  const stepper = useContext(StepperContext);
  const item = useContext(ItemContext);
  if (!stepper || !item) {
    throw new Error(`${part} has to be inside a StepperItem.`);
  }
  return { ...stepper, ...item };
}

export interface StepperOwnProps {
  /**
   * The step someone is on, counted from 1. The steps before it are done,
   * and the ones after it are still to come. One more than the last step
   * means all of them are done.
   */
  value: number;
  /**
   * `"vertical"` stacks the steps, with their text beside them. Use it on
   * a narrow screen, and wherever steps have descriptions.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /**
   * `"dot"` draws a small circle with nothing in it in place of the
   * step's number.
   * @default "number"
   */
  variant?: "number" | "dot";
  /**
   * What a screen reader says after the title of a step that's done. The
   * tick is a picture. Translate it with the rest of your interface.
   * @default "Completed"
   */
  completedLabel?: string;
}

export interface StepperProps
  extends StepperOwnProps,
    OlHTMLAttributes<HTMLOListElement> {}

/**
 * Where someone is in a row of steps. It shows progress and does nothing
 * else: which step is current is yours to keep, and to change.
 */
export const Stepper = forwardRef<HTMLOListElement, StepperProps>(
  function Stepper(
    {
      value,
      orientation = "horizontal",
      variant = "number",
      completedLabel = "Completed",
      className,
      ...props
    },
    ref,
  ) {
    const context = useMemo(
      () => ({ value, variant, completedLabel }),
      [value, variant, completedLabel],
    );
    return (
      <StepperContext.Provider value={context}>
        <ol
          ref={ref}
          // biome-ignore lint/a11y/noRedundantRoles: Safari stops calling a list a list once its numbers are styled away, and saying so again brings it back
          role="list"
          data-orientation={orientation}
          className={cx(
            "nuv-stepper",
            orientation === "vertical" && "nuv-stepper--vertical",
            variant === "dot" && "nuv-stepper--dot",
            className,
          )}
          {...props}
        />
      </StepperContext.Provider>
    );
  },
);

export interface StepperItemOwnProps {
  /** Which step this is, counted from 1. */
  step: number;
}

export interface StepperItemProps
  extends StepperItemOwnProps,
    LiHTMLAttributes<HTMLLIElement> {}

/** One step: a `StepperIndicator`, then a `StepperContent`. */
export const StepperItem = forwardRef<HTMLLIElement, StepperItemProps>(
  function StepperItem({ step, className, ...props }, ref) {
    const stepper = useContext(StepperContext);
    if (!stepper) throw new Error("StepperItem has to be inside a Stepper.");
    const state: State =
      step < stepper.value
        ? "complete"
        : step === stepper.value
          ? "current"
          : "upcoming";
    const context = useMemo(() => ({ step, state }), [step, state]);

    return (
      <ItemContext.Provider value={context}>
        <li
          ref={ref}
          data-state={state}
          aria-current={state === "current" ? "step" : undefined}
          className={cx("nuv-stepper__item", className)}
          {...props}
        />
      </ItemContext.Provider>
    );
  },
);

export type StepperIndicatorProps = HTMLAttributes<HTMLSpanElement>;

/**
 * The circle on the line. It shows the step's number, and a tick once the
 * step is done. Children replace both, for an icon. It's hidden from
 * screen readers, which get the step's place from the list.
 */
export const StepperIndicator = forwardRef<
  HTMLSpanElement,
  StepperIndicatorProps
>(function StepperIndicator({ className, children, ...props }, ref) {
  const { step, state, variant } = useItem("StepperIndicator");
  const own =
    variant === "dot" ? null : state === "complete" ? (
      <svg
        aria-hidden="true"
        className="nuv-stepper__check"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    ) : (
      step
    );

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cx("nuv-stepper__indicator", className)}
      {...props}
    >
      {children ?? own}
    </span>
  );
});

export type StepperContentProps = HTMLAttributes<HTMLDivElement>;

/** The title and the description. */
export const StepperContent = forwardRef<HTMLDivElement, StepperContentProps>(
  function StepperContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-stepper__content", className)}
        {...props}
      />
    );
  },
);

export type StepperTitleProps = HTMLAttributes<HTMLDivElement>;

/** The step's name. A step that's done has "Completed" after it, unseen. */
export const StepperTitle = forwardRef<HTMLDivElement, StepperTitleProps>(
  function StepperTitle({ className, children, ...props }, ref) {
    const { state, completedLabel } = useItem("StepperTitle");
    return (
      <div ref={ref} className={cx("nuv-stepper__title", className)} {...props}>
        {children}
        {state === "complete" && completedLabel ? (
          <span className="nuv-stepper__status"> {completedLabel}</span>
        ) : null}
      </div>
    );
  },
);

export type StepperDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const StepperDescription = forwardRef<
  HTMLParagraphElement,
  StepperDescriptionProps
>(function StepperDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cx("nuv-stepper__description", className)}
      {...props}
    />
  );
});

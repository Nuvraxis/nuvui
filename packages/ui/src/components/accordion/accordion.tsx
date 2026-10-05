"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cx } from "../../utils/cx";

export type AccordionProps = ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Root
>;

export const Accordion = forwardRef<
  ComponentRef<typeof AccordionPrimitive.Root>,
  AccordionProps
>(function Accordion({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Root
      ref={ref}
      className={cx("nuv-accordion", className)}
      {...props}
    />
  );
});

export type AccordionItemProps = ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Item
>;

export const AccordionItem = forwardRef<
  ComponentRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cx("nuv-accordion__item", className)}
      {...props}
    />
  );
});

export interface AccordionTriggerOwnProps {
  /**
   * The heading level each trigger is wrapped in. Pick the one that fits the
   * page's outline: 2 if the accordion sits right under the page title.
   * @default 3
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export interface AccordionTriggerProps
  extends AccordionTriggerOwnProps,
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {}

export const AccordionTrigger = forwardRef<
  ComponentRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(function AccordionTrigger(
  { headingLevel = 3, className, children, ...props },
  ref,
) {
  const Heading = `h${headingLevel}` as const;

  return (
    <AccordionPrimitive.Header asChild>
      <Heading className="nuv-accordion__header">
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cx("nuv-accordion__trigger", className)}
          {...props}
        >
          {children}
          <svg
            aria-hidden="true"
            className="nuv-accordion__chevron"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </AccordionPrimitive.Trigger>
      </Heading>
    </AccordionPrimitive.Header>
  );
});

export type AccordionContentProps = ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Content
>;

export const AccordionContent = forwardRef<
  ComponentRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cx("nuv-accordion__content", className)}
      {...props}
    >
      {/* The outer element's height is animated, so the padding has to live
          on something inside it or the panel jumps at the end. */}
      <div className="nuv-accordion__body">{children}</div>
    </AccordionPrimitive.Content>
  );
});

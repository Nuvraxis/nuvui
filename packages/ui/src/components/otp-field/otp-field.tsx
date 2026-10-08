"use client";

import * as OtpPrimitive from "@radix-ui/react-one-time-password-field";
import { type ComponentRef, Fragment, forwardRef } from "react";
import { cx } from "../../utils/cx";
import type { PartProps } from "../../utils/part-props";

type RootProps = PartProps<typeof OtpPrimitive.Root>;

export interface OtpFieldOwnProps {
  /**
   * How many characters the code has. One box is drawn for each.
   * @default 6
   */
  length?: number;
  /**
   * Draws a dash after every this many boxes, the way a code is often
   * printed: 3 gives 123-456. The dash isn't part of the value.
   */
  groupSize?: number;
  /**
   * Accessible name of one box, from its position, counted from 1, and the
   * number of boxes. Translate it with the rest of your interface.
   * @default (position, length) => `Character ${position} of ${length}`
   */
  inputLabel?: (position: number, length: number) => string;
  /**
   * Inside a form, the browser won't submit until every box is filled.
   * @default false
   */
  required?: boolean;
}

export interface OtpFieldProps
  extends OtpFieldOwnProps,
    Omit<RootProps, keyof OtpFieldOwnProps | "children"> {}

const defaultLabel = (position: number, length: number) =>
  `Character ${position} of ${length}`;

export const OtpField = forwardRef<
  ComponentRef<typeof OtpPrimitive.Root>,
  OtpFieldProps
>(function OtpField(
  {
    length = 6,
    groupSize,
    inputLabel = defaultLabel,
    required = false,
    className,
    "aria-invalid": invalid,
    ...props
  },
  ref,
) {
  return (
    <OtpPrimitive.Root
      ref={ref}
      className={cx("nuv-otp-field", className)}
      {...props}
    >
      {Array.from({ length }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a box is its position and nothing else
        <Fragment key={index}>
          {groupSize && index > 0 && index % groupSize === 0 ? (
            <span aria-hidden="true" className="nuv-otp-field__separator" />
          ) : null}
          <OtpPrimitive.Input
            index={index}
            className="nuv-otp-field__input"
            aria-label={inputLabel(index + 1, length)}
            // The group has no state of its own to be wrong. Each box does.
            aria-invalid={invalid}
            required={required}
          />
        </Fragment>
      ))}
      <OtpPrimitive.HiddenInput />
    </OtpPrimitive.Root>
  );
});

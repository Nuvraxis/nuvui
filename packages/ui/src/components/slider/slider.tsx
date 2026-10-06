"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

type RootProps = ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

export interface SliderOwnProps {
  /**
   * Accessible name of each handle, in order. A slider with two handles
   * needs them told apart. Left out, Radix names them "Minimum" and
   * "Maximum", so set this when your interface isn't in English.
   */
  thumbLabels?: string[];
  /**
   * What a screen reader says for a handle's value, in place of the bare
   * number: "40 percent", or the name of a step. It's given the value and
   * the handle's position, counted from 0.
   */
  valueText?: (value: number, index: number) => string;
}

export interface SliderProps extends SliderOwnProps, RootProps {}

export const Slider = forwardRef<
  ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(function Slider(
  {
    thumbLabels,
    valueText,
    className,
    onValueChange,
    "aria-label": label,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    ...props
  },
  ref,
) {
  // Field passes `required` to whatever control it holds, and a slider
  // always has a value, so there's nothing for it to mean here.
  const { required: _required, ...rootProps } = props as RootProps & {
    required?: boolean;
  };

  // Radix keeps the values to itself when they aren't controlled. A copy is
  // kept here, to know how many handles to draw and what each one's at.
  const [own, setOwn] = useState(props.defaultValue ?? [props.min ?? 0]);
  const values = props.value ?? own;

  // It's the handle that has the slider role, so with one handle the name
  // and the description go there. With several, they name the group, and
  // each handle says which end it is.
  const single = values.length === 1;
  const naming = {
    "aria-label": label,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cx("nuv-slider", className)}
      onValueChange={(next) => {
        setOwn(next);
        onValueChange?.(next);
      }}
      {...(single ? {} : { role: "group", ...naming })}
      {...rootProps}
    >
      <SliderPrimitive.Track className="nuv-slider__track">
        <SliderPrimitive.Range className="nuv-slider__range" />
      </SliderPrimitive.Track>
      {values.map((value, index) => {
        const thumbLabel = thumbLabels?.[index] ?? (single ? label : undefined);
        return (
          <SliderPrimitive.Thumb
            // biome-ignore lint/suspicious/noArrayIndexKey: a handle is its position and nothing else
            key={index}
            className="nuv-slider__thumb"
            // Left off when there's none: Radix's own default name would be
            // overwritten by an undefined one.
            {...(thumbLabel ? { "aria-label": thumbLabel } : {})}
            {...(single
              ? {
                  "aria-labelledby": labelledBy,
                  "aria-describedby": describedBy,
                }
              : {})}
            aria-valuetext={valueText?.(value, index)}
            aria-invalid={invalid}
          />
        );
      })}
    </SliderPrimitive.Root>
  );
});

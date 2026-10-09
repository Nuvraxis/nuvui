import {
  type FieldsetHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";

export type FieldsetProps = FieldsetHTMLAttributes<HTMLFieldSetElement>;

export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(
  function Fieldset({ className, ...props }, ref) {
    return (
      <fieldset
        ref={ref}
        className={cx("nuv-fieldset", className)}
        {...props}
      />
    );
  },
);

export type FieldsetLegendProps = HTMLAttributes<HTMLLegendElement>;

export const FieldsetLegend = forwardRef<
  HTMLLegendElement,
  FieldsetLegendProps
>(function FieldsetLegend({ className, ...props }, ref) {
  return (
    <legend
      ref={ref}
      className={cx("nuv-fieldset__legend", className)}
      {...props}
    />
  );
});

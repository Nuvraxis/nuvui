import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export interface ButtonGroupOwnProps {
  /**
   * Which way the buttons run.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
}

export interface ButtonGroupProps
  extends ButtonGroupOwnProps,
    HTMLAttributes<HTMLDivElement> {}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup(
    { orientation = "horizontal", className, ...props },
    ref,
  ) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form fields, and brings a legend and a disabled state that a row of buttons has no use for
      <div
        ref={ref}
        role="group"
        className={cx(
          "nuv-button-group",
          `nuv-button-group--${orientation}`,
          className,
        )}
        {...props}
      />
    );
  },
);

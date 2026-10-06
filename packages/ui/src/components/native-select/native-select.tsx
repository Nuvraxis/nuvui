import { forwardRef, type SelectHTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect({ className, ...props }, ref) {
    return (
      // A select can't hold an arrow of its own, so a wrapper carries it.
      // The class name goes on the wrapper. Everything else is the select's.
      <span className={cx("nuv-native-select", className)}>
        <select ref={ref} className="nuv-native-select__control" {...props} />
        <svg
          aria-hidden="true"
          className="nuv-native-select__icon"
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
      </span>
    );
  },
);

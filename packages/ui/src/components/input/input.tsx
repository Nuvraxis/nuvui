import { forwardRef, type InputHTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cx("nuv-input", className)} {...props} />;
});

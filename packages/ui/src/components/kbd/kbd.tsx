import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export type KbdProps = HTMLAttributes<HTMLElement>;

/** A key, drawn as a key cap. */
export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { className, ...props },
  ref,
) {
  return <kbd ref={ref} className={cx("nuv-kbd", className)} {...props} />;
});

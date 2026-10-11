import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";

export interface MessageLoaderOwnProps {
  /**
   * What a screen reader is told, when there's no text to see.
   * @default "Writing a reply"
   */
  label?: string;
  /**
   * Text beside the dots, such as "Searching the docs". With it, `label`
   * isn't used.
   */
  children?: ReactNode;
}

export interface MessageLoaderProps
  extends MessageLoaderOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof MessageLoaderOwnProps> {}

/**
 * Three dots for the wait before a reply starts. Put it where the reply
 * will be, in a `Message` from the assistant, and take it away when the
 * first words arrive.
 */
export const MessageLoader = forwardRef<HTMLDivElement, MessageLoaderProps>(
  function MessageLoader(
    { label = "Writing a reply", className, children, ...props },
    ref,
  ) {
    return (
      <div ref={ref} className={cx("nuv-message-loader", className)} {...props}>
        <span className="nuv-message-loader__dots" aria-hidden="true">
          <span className="nuv-message-loader__dot" />
          <span className="nuv-message-loader__dot" />
          <span className="nuv-message-loader__dot" />
        </span>
        {children ? (
          <span className="nuv-message-loader__text">{children}</span>
        ) : (
          <span className="nuv-message-loader__label">{label}</span>
        )}
      </div>
    );
  },
);

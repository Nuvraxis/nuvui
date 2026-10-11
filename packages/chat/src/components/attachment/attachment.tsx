import { Spinner } from "@nuvui/react/spinner";
import {
  type AnchorHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";
import { formatSize as defaultFormatSize } from "../../utils/format-size";

export interface AttachmentsProps extends HTMLAttributes<HTMLUListElement> {}

/**
 * The files that go with a message, side by side, on as many lines as
 * they need. It's a list: put an `Attachment` in it for each file, and
 * name it with `aria-label`.
 */
export const Attachments = forwardRef<HTMLUListElement, AttachmentsProps>(
  function Attachments({ className, ...props }, ref) {
    return (
      <ul
        ref={ref}
        // biome-ignore lint/a11y/noRedundantRoles: Safari stops calling a list a list once its bullets are styled away, and saying so again brings it back
        role="list"
        className={cx("nuv-attachments", className)}
        {...props}
      />
    );
  },
);

const defaultRemoveLabel = (name: string) => `Remove ${name}`;

export interface AttachmentOwnProps {
  /** The file's name. */
  name: string;
  /** Its size in bytes, written after the name. */
  size?: number;
  /** A word or two about it, before the size: "PDF", "3 pages". */
  detail?: ReactNode;
  /**
   * The address of a small picture of it, shown in place of the icon. For
   * a file that's a picture, the picture itself.
   */
  src?: string;
  /** Where the file opens. With it, the name is a link. */
  href?: string;
  /** More for that link: `target`, `download`, `rel`. */
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;
  /** In place of the icon, for a file with no picture. */
  icon?: ReactNode;
  /**
   * The file is on its way to the server. A spinner takes the icon's
   * place and `uploadingLabel` the size's.
   * @default false
   */
  uploading?: boolean;
  /** @default "Uploading" */
  uploadingLabel?: string;
  /**
   * What went wrong with it, in words. Shown in place of the size, and
   * the file is drawn as one that failed.
   */
  error?: ReactNode;
  /** With it, the file has a button that calls this. */
  onRemove?: () => void;
  /**
   * The name of that button, from the file's name.
   * @default (name) => `Remove ${name}`
   */
  removeLabel?: (name: string) => string;
  /**
   * Writes the size, from a number of bytes.
   * @default The size in the reader's own number format, such as "1.2 MB"
   */
  formatSize?: (bytes: number) => string;
}

export interface AttachmentProps
  extends AttachmentOwnProps,
    Omit<
      LiHTMLAttributes<HTMLLIElement>,
      keyof AttachmentOwnProps | "children"
    > {}

/**
 * One file: in a message, or waiting in the prompt box to be sent. It
 * goes inside an `Attachments`.
 */
export const Attachment = forwardRef<HTMLLIElement, AttachmentProps>(
  function Attachment(
    {
      name,
      size,
      detail,
      src,
      href,
      linkProps,
      icon,
      uploading = false,
      uploadingLabel = "Uploading",
      error,
      onRemove,
      removeLabel = defaultRemoveLabel,
      formatSize = defaultFormatSize,
      className,
      ...props
    },
    ref,
  ) {
    const failed = error !== undefined && error !== null && error !== false;

    let picture = icon ?? (
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 2H4.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.5L9 2Z" />
        <path d="M9 2v3.5h3.5" />
      </svg>
    );
    if (src)
      picture = <img className="nuv-attachment__image" src={src} alt="" />;
    if (uploading) picture = <Spinner size="sm" label="" />;

    return (
      <li
        ref={ref}
        className={cx("nuv-attachment", className)}
        data-uploading={uploading ? "" : undefined}
        data-error={failed ? "" : undefined}
        aria-busy={uploading || undefined}
        {...props}
      >
        <span className="nuv-attachment__picture" aria-hidden="true">
          {picture}
        </span>
        <span className="nuv-attachment__text">
          {href ? (
            <a
              className="nuv-attachment__name"
              title={name}
              {...linkProps}
              href={href}
            >
              {name}
            </a>
          ) : (
            <span className="nuv-attachment__name" title={name}>
              {name}
            </span>
          )}
          {failed ? (
            <span className="nuv-attachment__error">{error}</span>
          ) : uploading ? (
            <span className="nuv-attachment__detail">{uploadingLabel}</span>
          ) : detail || size !== undefined ? (
            <span className="nuv-attachment__detail">
              {detail ? <span>{detail}</span> : null}
              {size !== undefined ? <span>{formatSize(size)}</span> : null}
            </span>
          ) : null}
        </span>
        {onRemove ? (
          <button
            type="button"
            className="nuv-attachment__remove"
            aria-label={removeLabel(name)}
            onClick={onRemove}
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="m4 4 8 8m0-8-8 8" />
            </svg>
          </button>
        ) : null}
      </li>
    );
  },
);

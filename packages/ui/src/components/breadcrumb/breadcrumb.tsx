import { Slot } from "@radix-ui/react-slot";
import {
  type AnchorHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type OlHTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";

export type BreadcrumbProps = HTMLAttributes<HTMLElement>;

/**
 * The landmark around the trail. It's named "Breadcrumb" for screen readers.
 * Pass `aria-label` to translate that.
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  function Breadcrumb({ className, ...props }, ref) {
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cx("nuv-breadcrumb", className)}
        {...props}
      />
    );
  },
);

export type BreadcrumbListProps = OlHTMLAttributes<HTMLOListElement>;

export const BreadcrumbList = forwardRef<HTMLOListElement, BreadcrumbListProps>(
  function BreadcrumbList({ className, ...props }, ref) {
    return (
      <ol
        ref={ref}
        className={cx("nuv-breadcrumb__list", className)}
        {...props}
      />
    );
  },
);

export type BreadcrumbItemProps = LiHTMLAttributes<HTMLLIElement>;

export const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  function BreadcrumbItem({ className, ...props }, ref) {
    return (
      <li
        ref={ref}
        className={cx("nuv-breadcrumb__item", className)}
        {...props}
      />
    );
  },
);

export interface BreadcrumbLinkOwnProps {
  /**
   * Render the single child element instead of an `a`, and give it the
   * link's class and props. This is how you use your router's link.
   * @default false
   */
  asChild?: boolean;
}

export interface BreadcrumbLinkProps
  extends BreadcrumbLinkOwnProps,
    AnchorHTMLAttributes<HTMLAnchorElement> {}

export const BreadcrumbLink = forwardRef<
  HTMLAnchorElement,
  BreadcrumbLinkProps
>(function BreadcrumbLink({ asChild = false, className, ...props }, ref) {
  const Element = asChild ? Slot : "a";
  return (
    <Element
      ref={ref}
      className={cx("nuv-breadcrumb__link", className)}
      {...props}
    />
  );
});

export type BreadcrumbPageProps = HTMLAttributes<HTMLSpanElement>;

/** The page the visitor is on. The last entry, and not a link. */
export const BreadcrumbPage = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  function BreadcrumbPage({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        aria-current="page"
        className={cx("nuv-breadcrumb__page", className)}
        {...props}
      />
    );
  },
);

export type BreadcrumbSeparatorProps = LiHTMLAttributes<HTMLLIElement>;

/**
 * The mark between two entries. It's hidden from screen readers, which
 * already announce the trail as a list. Pass children to draw something
 * other than the arrow.
 */
export const BreadcrumbSeparator = forwardRef<
  HTMLLIElement,
  BreadcrumbSeparatorProps
>(function BreadcrumbSeparator({ className, children, ...props }, ref) {
  return (
    <li
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cx("nuv-breadcrumb__separator", className)}
      {...props}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          className="nuv-breadcrumb__chevron"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
      )}
    </li>
  );
});

export interface BreadcrumbEllipsisOwnProps {
  /**
   * What a screen reader says for the three dots. Translate it with the
   * rest of your interface.
   * @default "More"
   */
  label?: string;
}

export interface BreadcrumbEllipsisProps
  extends BreadcrumbEllipsisOwnProps,
    HTMLAttributes<HTMLSpanElement> {}

/** Three dots that stand for the entries left out of a long trail. */
export const BreadcrumbEllipsis = forwardRef<
  HTMLSpanElement,
  BreadcrumbEllipsisProps
>(function BreadcrumbEllipsis({ label = "More", className, ...props }, ref) {
  return (
    <span
      ref={ref}
      role="img"
      aria-label={label}
      className={cx("nuv-breadcrumb__ellipsis", className)}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="currentColor"
      >
        <circle cx="3" cy="8" r="1.25" />
        <circle cx="8" cy="8" r="1.25" />
        <circle cx="13" cy="8" r="1.25" />
      </svg>
    </span>
  );
});

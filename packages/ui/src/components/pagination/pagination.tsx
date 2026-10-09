import { Slot } from "@radix-ui/react-slot";
import {
  type AnchorHTMLAttributes,
  cloneElement,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type LiHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";

export type PaginationProps = HTMLAttributes<HTMLElement>;

/**
 * The landmark around the page links. It's named "Pagination" for screen
 * readers. Pass `aria-label` to translate that.
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  function Pagination({ className, ...props }, ref) {
    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cx("nuv-pagination", className)}
        {...props}
      />
    );
  },
);

export type PaginationListProps = HTMLAttributes<HTMLUListElement>;

export const PaginationList = forwardRef<HTMLUListElement, PaginationListProps>(
  function PaginationList({ className, ...props }, ref) {
    return (
      <ul
        ref={ref}
        className={cx("nuv-pagination__list", className)}
        {...props}
      />
    );
  },
);

export type PaginationItemProps = LiHTMLAttributes<HTMLLIElement>;

export const PaginationItem = forwardRef<HTMLLIElement, PaginationItemProps>(
  function PaginationItem({ className, ...props }, ref) {
    return (
      <li
        ref={ref}
        className={cx("nuv-pagination__item", className)}
        {...props}
      />
    );
  },
);

export interface PaginationLinkOwnProps {
  /**
   * Marks the link as the page being shown. It gets the filled look and
   * `aria-current="page"`.
   * @default false
   */
  active?: boolean;
  /**
   * For a link that leads nowhere right now, such as "Previous" on the
   * first page. It stays in place, faded, and can't be followed or focused.
   * @default false
   */
  disabled?: boolean;
  /**
   * Render the single child element instead of an `a`, and give it the
   * link's classes and props. This is how you use your router's link, or a
   * `button` when the pages are state and not addresses.
   * @default false
   */
  asChild?: boolean;
}

export interface PaginationLinkProps
  extends PaginationLinkOwnProps,
    AnchorHTMLAttributes<HTMLAnchorElement> {}

export const PaginationLink = forwardRef<
  HTMLAnchorElement,
  PaginationLinkProps
>(function PaginationLink(
  { active = false, disabled = false, asChild = false, className, ...props },
  ref,
) {
  const shared = {
    ref,
    className: cx("nuv-pagination__link", className),
    "aria-current": active ? ("page" as const) : undefined,
    "data-active": active ? "" : undefined,
    "data-disabled": disabled ? "" : undefined,
    "aria-disabled": disabled || undefined,
  };

  if (asChild) {
    return <Slot {...shared} tabIndex={disabled ? -1 : undefined} {...props} />;
  }

  // An `a` with no `href` isn't a link to the browser: it can't be followed
  // or focused, which is what disabled means here. It also loses the link
  // role, so the role is put back for screen readers, next to aria-disabled.
  const { href, ...rest } = props;
  return (
    <a
      {...shared}
      role={disabled ? "link" : undefined}
      href={disabled ? undefined : href}
      {...rest}
    />
  );
});

type Direction = "previous" | "next";

function Arrow({ direction }: { direction: Direction }) {
  return (
    <svg
      aria-hidden="true"
      className="nuv-pagination__arrow"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "previous" ? "M10 4l-4 4 4 4" : "M6 4l4 4-4 4"} />
    </svg>
  );
}

// What Previous and Next hold: an arrow on the outer side, and the text in
// an element of its own so that a phone can show the arrow alone. With
// asChild the text is inside the element the caller passed, so that element
// is given the same contents.
function edge(direction: Direction, children: ReactNode, asChild?: boolean) {
  const contents = (text: ReactNode) => (
    <>
      {direction === "previous" ? <Arrow direction="previous" /> : null}
      <span className="nuv-pagination__label">{text}</span>
      {direction === "next" ? <Arrow direction="next" /> : null}
    </>
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ children?: ReactNode }>;
    return cloneElement(child, undefined, contents(child.props.children));
  }
  return contents(children);
}

export type PaginationPreviousProps = PaginationLinkProps;

/**
 * The link to the page before. Its text is "Previous" unless you pass
 * children, and on a phone only its arrow shows.
 */
export const PaginationPrevious = forwardRef<
  HTMLAnchorElement,
  PaginationPreviousProps
>(function PaginationPrevious({ className, children, asChild, ...props }, ref) {
  return (
    <PaginationLink
      ref={ref}
      asChild={asChild}
      className={cx("nuv-pagination__link--previous", className)}
      {...props}
    >
      {edge("previous", children ?? "Previous", asChild)}
    </PaginationLink>
  );
});

export type PaginationNextProps = PaginationLinkProps;

/**
 * The link to the page after. Its text is "Next" unless you pass children,
 * and on a phone only its arrow shows.
 */
export const PaginationNext = forwardRef<
  HTMLAnchorElement,
  PaginationNextProps
>(function PaginationNext({ className, children, asChild, ...props }, ref) {
  return (
    <PaginationLink
      ref={ref}
      asChild={asChild}
      className={cx("nuv-pagination__link--next", className)}
      {...props}
    >
      {edge("next", children ?? "Next", asChild)}
    </PaginationLink>
  );
});

export interface PaginationEllipsisOwnProps {
  /**
   * What a screen reader says for the three dots. Translate it with the
   * rest of your interface.
   * @default "More pages"
   */
  label?: string;
}

export interface PaginationEllipsisProps
  extends PaginationEllipsisOwnProps,
    HTMLAttributes<HTMLSpanElement> {}

/** Three dots that stand for the page numbers left out. */
export const PaginationEllipsis = forwardRef<
  HTMLSpanElement,
  PaginationEllipsisProps
>(function PaginationEllipsis(
  { label = "More pages", className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      role="img"
      aria-label={label}
      className={cx("nuv-pagination__ellipsis", className)}
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

export interface PaginationRangeOptions {
  /** The page being shown, counted from 1. */
  page: number;
  /** How many pages there are. */
  count: number;
  /**
   * How many page numbers to show on each side of the current one.
   * @default 1
   */
  siblings?: number;
  /**
   * How many page numbers to always show at each end.
   * @default 1
   */
  boundaries?: number;
}

export type PaginationRangeItem = number | "ellipsis-start" | "ellipsis-end";

function sequence(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

/**
 * Works out which page numbers to show, and where the gaps go. The result
 * has the same length whichever page is current, so the links don't move
 * under the pointer as someone clicks through. A gap always stands for two
 * pages or more. Each gap has a name of its own, so the entries can be used
 * as React keys.
 */
export function paginationRange({
  page,
  count,
  siblings = 1,
  boundaries = 1,
}: PaginationRangeOptions): PaginationRangeItem[] {
  const total = Math.max(0, Math.floor(count));
  const around = Math.max(0, Math.floor(siblings));
  const ends = Math.max(1, Math.floor(boundaries));
  const current = Math.min(Math.max(1, Math.floor(page)), Math.max(1, total));

  // The current page, its siblings, both ends and the two gaps.
  const shown = around * 2 + 3 + ends * 2;
  if (shown >= total) return sequence(1, total);

  const first = Math.max(current - around, ends);
  const last = Math.min(current + around, total - ends);
  const gapBefore = first > ends + 2;
  const gapAfter = last < total - ends - 1;

  if (!gapBefore && gapAfter) {
    return [
      ...sequence(1, around * 2 + ends + 2),
      "ellipsis-end",
      ...sequence(total - ends + 1, total),
    ];
  }
  if (gapBefore && !gapAfter) {
    return [
      ...sequence(1, ends),
      "ellipsis-start",
      ...sequence(total - (ends + 1 + around * 2), total),
    ];
  }
  return [
    ...sequence(1, ends),
    "ellipsis-start",
    ...sequence(first, last),
    "ellipsis-end",
    ...sequence(total - ends + 1, total),
  ];
}

"use client";

import { Slot } from "@radix-ui/react-slot";
import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  useContext,
} from "react";
import { cx } from "../../utils/cx";

// Whether an item is inside an `ItemGroup`, which is a list and needs
// each of its rows to say it's a list item.
const InGroup = createContext(false);

export interface ItemGroupOwnProps {
  /**
   * `"outline"` puts one edge around all the rows and a line between
   * them, as a settings panel has.
   * @default "plain"
   */
  variant?: "plain" | "outline";
}

export interface ItemGroupProps
  extends ItemGroupOwnProps,
    HTMLAttributes<HTMLUListElement> {}

/**
 * A list of items. A screen reader says how many there are, so put only
 * `Item`s in it, and give it a name with `aria-label` or `aria-labelledby`.
 */
export const ItemGroup = forwardRef<HTMLUListElement, ItemGroupProps>(
  function ItemGroup({ variant = "plain", className, ...props }, ref) {
    return (
      <InGroup.Provider value={true}>
        <ul
          ref={ref}
          // biome-ignore lint/a11y/noRedundantRoles: Safari stops calling a list a list once its bullets are styled away, and saying so again brings it back
          role="list"
          className={cx(
            "nuv-item-group",
            variant === "outline" && "nuv-item-group--outline",
            className,
          )}
          {...props}
        />
      </InGroup.Provider>
    );
  },
);

export interface ItemOwnProps {
  /**
   * Render the single child element instead of a `div`, and give it the
   * item's class and props. This is how a whole row becomes a link or a
   * button: it then has a hover color and a focus ring.
   * @default false
   */
  asChild?: boolean;
  /**
   * `"outline"` draws an edge around the row and `"muted"` fills it. In an
   * outlined `ItemGroup` leave it plain: the group draws the edges.
   * @default "plain"
   */
  variant?: "plain" | "outline" | "muted";
  /**
   * `"sm"` has less padding, for a dense list.
   * @default "md"
   */
  size?: "sm" | "md";
}

export interface ItemProps extends ItemOwnProps, HTMLAttributes<HTMLElement> {}

/**
 * A row: something to look at, a title with a line under it, and
 * something to do at the end. Any of the three can be left out.
 */
export const Item = forwardRef<HTMLElement, ItemProps>(function Item(
  { asChild = false, variant = "plain", size = "md", className, ...props },
  ref,
) {
  const inGroup = useContext(InGroup);
  const Element = asChild ? Slot : "div";
  const row = (
    <Element
      // A div's ref and an anchor's are both elements, which is all the
      // caller is promised.
      ref={ref as never}
      className={cx(
        "nuv-item",
        variant !== "plain" && `nuv-item--${variant}`,
        size === "sm" && "nuv-item--sm",
        className,
      )}
      {...props}
    />
  );

  // The list item is a box around the row, and not the row itself: a row
  // that's a link has to stay a link to a screen reader.
  return inGroup ? <li className="nuv-item-group__row">{row}</li> : row;
});

export interface ItemMediaOwnProps {
  /**
   * `"icon"` draws a small filled square behind an icon. `"plain"` draws
   * nothing, for an avatar or a picture.
   * @default "plain"
   */
  variant?: "plain" | "icon";
}

export interface ItemMediaProps
  extends ItemMediaOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/** What's at the start of the row: an icon, an avatar or a picture. */
export const ItemMedia = forwardRef<HTMLDivElement, ItemMediaProps>(
  function ItemMedia({ variant = "plain", className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx(
          "nuv-item__media",
          variant === "icon" && "nuv-item__media--icon",
          className,
        )}
        {...props}
      />
    );
  },
);

export type ItemContentProps = HTMLAttributes<HTMLDivElement>;

/** The title and the description. It takes the room the rest leaves. */
export const ItemContent = forwardRef<HTMLDivElement, ItemContentProps>(
  function ItemContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-item__content", className)}
        {...props}
      />
    );
  },
);

export type ItemTitleProps = HTMLAttributes<HTMLDivElement>;

/**
 * The row's name. Give it an `id` and point a control in `ItemActions` at
 * it with `aria-labelledby`, and the control is named by it.
 */
export const ItemTitle = forwardRef<HTMLDivElement, ItemTitleProps>(
  function ItemTitle({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cx("nuv-item__title", className)} {...props} />
    );
  },
);

export type ItemDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const ItemDescription = forwardRef<
  HTMLParagraphElement,
  ItemDescriptionProps
>(function ItemDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cx("nuv-item__description", className)}
      {...props}
    />
  );
});

export type ItemActionsProps = HTMLAttributes<HTMLDivElement>;

/** What's at the end of the row: a switch, a button, a badge, an arrow. */
export const ItemActions = forwardRef<HTMLDivElement, ItemActionsProps>(
  function ItemActions({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-item__actions", className)}
        {...props}
      />
    );
  },
);

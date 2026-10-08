import type { ComponentPropsWithoutRef, ElementType } from "react";

/**
 * The props of a Radix part, without `asChild`. For a component that puts
 * something of its own inside the part next to its children, such as a
 * dialog's close button or a checkbox's tick. With `asChild` Radix merges
 * the part into its one child, and there's no one child to merge it into.
 */
export type PartProps<T extends ElementType> = Omit<
  ComponentPropsWithoutRef<T>,
  "asChild"
>;

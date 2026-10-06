"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  createContext,
  forwardRef,
  useContext,
  useMemo,
} from "react";
import { cx } from "../../utils/cx";
import type { ToggleOwnProps } from "../toggle/toggle";

type RootProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>;
type Look = Required<ToggleOwnProps>;

const LookContext = createContext<Look>({ variant: "outline", size: "md" });

export interface ToggleGroupOwnProps {
  /**
   * `"outline"` joins the buttons into one strip. `"ghost"` leaves a small
   * gap between them and gives none an edge until it's pressed.
   * @default "outline"
   */
  variant?: Look["variant"];
  /**
   * The size of every button in the group.
   * @default "md"
   */
  size?: Look["size"];
}

export type ToggleGroupProps = ToggleGroupOwnProps & RootProps;

export const ToggleGroup = forwardRef<
  ComponentRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(function ToggleGroup(
  { variant = "outline", size = "md", className, ...props },
  ref,
) {
  const look = useMemo(() => ({ variant, size }), [variant, size]);
  // Field passes `required` to whatever control it holds. A group of
  // buttons has no such attribute, so it's said with ARIA.
  const { required, ...rootProps } = props as RootProps & {
    required?: boolean;
  };

  return (
    <LookContext.Provider value={look}>
      <ToggleGroupPrimitive.Root
        ref={ref}
        className={cx(
          "nuv-toggle-group",
          `nuv-toggle-group--${variant}`,
          `nuv-toggle-group--${props.orientation ?? "horizontal"}`,
          className,
        )}
        // A radio group can be required. A toolbar of buttons can not.
        aria-required={(props.type === "single" && required) || undefined}
        {...rootProps}
      />
    </LookContext.Provider>
  );
});

export type ToggleGroupItemProps = ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Item
>;

export const ToggleGroupItem = forwardRef<
  ComponentRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(function ToggleGroupItem({ className, ...props }, ref) {
  const { variant, size } = useContext(LookContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      // A button of the group is a toggle, and takes its look from there.
      className={cx(
        "nuv-toggle",
        `nuv-toggle--${variant}`,
        `nuv-toggle--${size}`,
        "nuv-toggle-group__item",
        className,
      )}
      {...props}
    />
  );
});

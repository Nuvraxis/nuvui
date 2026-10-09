import { describe, expectTypeOf, test } from "vitest";
import type {
  AccordionContentProps,
  AccordionItemProps,
  AccordionTriggerProps,
  ButtonProps,
  CheckboxProps,
  ComboboxContentProps,
  ComboboxEmptyProps,
  ComboboxItemProps,
  ComboboxLoadingProps,
  CommandEmptyProps,
  CommandLoadingProps,
  CommandProps,
  ContextMenuCheckboxItemProps,
  ContextMenuItemProps,
  ContextMenuRadioItemProps,
  ContextMenuSubTriggerProps,
  DialogContentProps,
  DialogTitleProps,
  DropdownMenuCheckboxItemProps,
  DropdownMenuItemProps,
  DropdownMenuRadioItemProps,
  DropdownMenuSubTriggerProps,
  MenubarCheckboxItemProps,
  MenubarRadioItemProps,
  MenubarSubTriggerProps,
  NavigationMenuProps,
  NavigationMenuTriggerProps,
  OtpFieldProps,
  PopoverContentProps,
  ProgressProps,
  RadioGroupItemProps,
  ScrollAreaProps,
  SelectContentProps,
  SelectItemProps,
  SelectTriggerProps,
  SheetContentProps,
  SliderProps,
  SwitchProps,
  TooltipContentProps,
} from "../index";

// These are checked by the type checker, which reads this file with the
// rest of the source. Nothing here does anything when it's run.

describe("asChild", () => {
  test("isn't accepted by a part that puts something of its own beside its children", () => {
    expectTypeOf<AccordionTriggerProps>().not.toHaveProperty("asChild");
    expectTypeOf<AccordionContentProps>().not.toHaveProperty("asChild");
    expectTypeOf<CheckboxProps>().not.toHaveProperty("asChild");
    expectTypeOf<ComboboxContentProps>().not.toHaveProperty("asChild");
    expectTypeOf<ComboboxItemProps>().not.toHaveProperty("asChild");
    expectTypeOf<ComboboxEmptyProps>().not.toHaveProperty("asChild");
    expectTypeOf<ComboboxLoadingProps>().not.toHaveProperty("asChild");
    expectTypeOf<CommandProps>().not.toHaveProperty("asChild");
    expectTypeOf<CommandEmptyProps>().not.toHaveProperty("asChild");
    expectTypeOf<CommandLoadingProps>().not.toHaveProperty("asChild");
    expectTypeOf<ContextMenuCheckboxItemProps>().not.toHaveProperty("asChild");
    expectTypeOf<ContextMenuRadioItemProps>().not.toHaveProperty("asChild");
    expectTypeOf<ContextMenuSubTriggerProps>().not.toHaveProperty("asChild");
    expectTypeOf<DialogContentProps>().not.toHaveProperty("asChild");
    expectTypeOf<DropdownMenuCheckboxItemProps>().not.toHaveProperty("asChild");
    expectTypeOf<DropdownMenuRadioItemProps>().not.toHaveProperty("asChild");
    expectTypeOf<DropdownMenuSubTriggerProps>().not.toHaveProperty("asChild");
    expectTypeOf<MenubarCheckboxItemProps>().not.toHaveProperty("asChild");
    expectTypeOf<MenubarRadioItemProps>().not.toHaveProperty("asChild");
    expectTypeOf<MenubarSubTriggerProps>().not.toHaveProperty("asChild");
    expectTypeOf<NavigationMenuProps>().not.toHaveProperty("asChild");
    expectTypeOf<NavigationMenuTriggerProps>().not.toHaveProperty("asChild");
    expectTypeOf<OtpFieldProps>().not.toHaveProperty("asChild");
    expectTypeOf<PopoverContentProps>().not.toHaveProperty("asChild");
    expectTypeOf<ProgressProps>().not.toHaveProperty("asChild");
    expectTypeOf<RadioGroupItemProps>().not.toHaveProperty("asChild");
    expectTypeOf<ScrollAreaProps>().not.toHaveProperty("asChild");
    expectTypeOf<SelectTriggerProps>().not.toHaveProperty("asChild");
    expectTypeOf<SelectContentProps>().not.toHaveProperty("asChild");
    expectTypeOf<SelectItemProps>().not.toHaveProperty("asChild");
    expectTypeOf<SheetContentProps>().not.toHaveProperty("asChild");
    expectTypeOf<SliderProps>().not.toHaveProperty("asChild");
    expectTypeOf<SwitchProps>().not.toHaveProperty("asChild");
    expectTypeOf<TooltipContentProps>().not.toHaveProperty("asChild");
  });

  test("is still accepted by a part that renders one element around its children", () => {
    expectTypeOf<ButtonProps>().toHaveProperty("asChild");
    expectTypeOf<AccordionItemProps>().toHaveProperty("asChild");
    expectTypeOf<DialogTitleProps>().toHaveProperty("asChild");
    expectTypeOf<DropdownMenuItemProps>().toHaveProperty("asChild");
    expectTypeOf<ContextMenuItemProps>().toHaveProperty("asChild");
  });
});

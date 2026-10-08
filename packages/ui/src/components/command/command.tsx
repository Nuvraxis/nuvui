"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Command as CommandPrimitive, useCommandState } from "cmdk";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";
import {
  ListStatus,
  ListStatusProvider,
  useListLoading,
  useListStatus,
  useMarkListLoading,
} from "../../utils/list-status";
import type { PartProps } from "../../utils/part-props";
import { useActiveOption } from "../../utils/use-active-option";
import { useReturnFocus } from "../../utils/use-return-focus";
import { useShortcut } from "../../utils/use-shortcut";

type RootProps = PartProps<typeof CommandPrimitive>;

export interface CommandOwnProps {
  /**
   * The search field's name, for screen readers. Translate it with the rest
   * of your interface.
   * @default "Search"
   */
  label?: string;
  /**
   * Whether Ctrl+N, Ctrl+J, Ctrl+P and Ctrl+K move through the list as the
   * arrow keys do. Off by default, because in a text field on a Mac some of
   * those keys already do something else.
   * @default false
   */
  vimBindings?: boolean;
}

export interface CommandProps
  extends CommandOwnProps,
    Omit<RootProps, keyof CommandOwnProps> {}

/**
 * A search field over a list that filters as you type. Focus stays in the
 * field, and the arrow keys move through the list.
 */
export const Command = forwardRef<
  ComponentRef<typeof CommandPrimitive>,
  CommandProps
>(function Command(
  { label = "Search", vimBindings = false, className, children, ...props },
  ref,
) {
  const [status, statusRef] = useListStatus();
  const activeOption = useActiveOption();

  return (
    <CommandPrimitive
      ref={useComposedRefs(ref, activeOption)}
      label={label}
      vimBindings={vimBindings}
      className={cx("nuv-command", className)}
      {...props}
    >
      <ListStatusProvider value={status}>{children}</ListStatusProvider>
      <div ref={statusRef} role="status" className="nuv-command__status" />
    </CommandPrimitive>
  );
});

export type CommandInputProps = ComponentPropsWithoutRef<
  typeof CommandPrimitive.Input
>;

export const CommandInput = forwardRef<
  ComponentRef<typeof CommandPrimitive.Input>,
  CommandInputProps
>(function CommandInput({ className, ...props }, ref) {
  return (
    <div className="nuv-command__search">
      <svg
        aria-hidden="true"
        className="nuv-command__search-icon"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <circle cx="7" cy="7" r="4.25" />
        <path d="M10.25 10.25l3 3" />
      </svg>
      <CommandPrimitive.Input
        ref={ref}
        className={cx("nuv-command__input", className)}
        {...props}
      />
    </div>
  );
});

type ListProps = ComponentPropsWithoutRef<typeof CommandPrimitive.List>;

export interface CommandListOwnProps {
  /**
   * The list's name, for screen readers. Translate it with the rest of your
   * interface.
   * @default "Suggestions"
   */
  label?: ListProps["label"];
}

export interface CommandListProps
  extends CommandListOwnProps,
    Omit<ListProps, keyof CommandListOwnProps> {}

export const CommandList = forwardRef<
  ComponentRef<typeof CommandPrimitive.List>,
  CommandListProps
>(function CommandList({ className, ...props }, ref) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cx("nuv-command__list", className)}
      {...props}
    />
  );
});

export type CommandEmptyProps = PartProps<typeof CommandPrimitive.Empty>;

/**
 * Shown while nothing matches what was typed, unless a `CommandLoading` is
 * showing. A screen reader is told the same text when it appears.
 */
export const CommandEmpty = forwardRef<
  ComponentRef<typeof CommandPrimitive.Empty>,
  CommandEmptyProps
>(function CommandEmpty({ className, children, ...props }, ref) {
  if (useListLoading()) return null;
  return (
    <CommandPrimitive.Empty
      ref={ref}
      aria-hidden="true"
      className={cx("nuv-command__empty", className)}
      {...props}
    >
      {children}
      <ListStatus>{children}</ListStatus>
    </CommandPrimitive.Empty>
  );
});

type LoadingProps = PartProps<typeof CommandPrimitive.Loading>;

export interface CommandLoadingOwnProps {
  /**
   * What a screen reader is told while this is shown, and what's drawn if
   * there are no children. Translate it with the rest of your interface.
   * @default "Loading"
   */
  label?: string;
}

export interface CommandLoadingProps
  extends CommandLoadingOwnProps,
    Omit<LoadingProps, keyof CommandLoadingOwnProps | "progress"> {}

/** Render it while the items are being fetched. */
export const CommandLoading = forwardRef<
  ComponentRef<typeof CommandPrimitive.Loading>,
  CommandLoadingProps
>(function CommandLoading(
  { label = "Loading", className, children, ...props },
  ref,
) {
  useMarkListLoading();
  return (
    <CommandPrimitive.Loading
      ref={ref}
      label={label}
      aria-hidden="true"
      className={cx("nuv-command__loading", className)}
      {...props}
    >
      {children ?? label}
      <ListStatus>{label}</ListStatus>
    </CommandPrimitive.Loading>
  );
});

type GroupProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Group>;

export interface CommandGroupOwnProps {
  /** The text over the group's items. It also names the group. */
  heading?: ReactNode;
}

export interface CommandGroupProps
  extends CommandGroupOwnProps,
    Omit<GroupProps, keyof CommandGroupOwnProps> {}

export const CommandGroup = forwardRef<
  ComponentRef<typeof CommandPrimitive.Group>,
  CommandGroupProps
>(function CommandGroup({ heading, className, ...props }, ref) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cx("nuv-command__group", className)}
      heading={
        heading ? <div className="nuv-command__label">{heading}</div> : null
      }
      {...props}
    />
  );
});

export type CommandItemProps = ComponentPropsWithoutRef<
  typeof CommandPrimitive.Item
>;

export const CommandItem = forwardRef<
  ComponentRef<typeof CommandPrimitive.Item>,
  CommandItemProps
>(function CommandItem({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cx("nuv-command__item", className)}
      {...props}
    />
  );
});

export type CommandShortcutProps = HTMLAttributes<HTMLSpanElement>;

/**
 * The keys that do the same thing as an item, shown at the end of its row.
 * It only shows them: listening for the keys is up to you. It's hidden from
 * screen readers, so that it doesn't run into the item's name. Put the same
 * keys in `aria-keyshortcuts` on the item to have them announced.
 */
export const CommandShortcut = forwardRef<
  HTMLSpanElement,
  CommandShortcutProps
>(function CommandShortcut({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cx("nuv-command__shortcut", className)}
      {...props}
    />
  );
});

export interface CommandSeparatorOwnProps {
  /**
   * Whether the line stays while something is typed in the search field.
   * Left off, it goes, because the groups it was between may have gone.
   * @default false
   */
  alwaysRender?: boolean;
}

export interface CommandSeparatorProps
  extends CommandSeparatorOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/**
 * A line between groups. It's decoration: a list of options may only hold
 * options and groups, so it's hidden from screen readers, which hear the
 * groups by their headings.
 */
export const CommandSeparator = forwardRef<
  HTMLDivElement,
  CommandSeparatorProps
>(function CommandSeparator(
  { alwaysRender = false, className, ...props },
  ref,
) {
  const searching = useCommandState((state) => Boolean(state.search));
  if (searching && !alwaysRender) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cx("nuv-command__separator", className)}
      {...props}
    />
  );
});

export interface CommandDialogOwnProps {
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /**
   * Whether the dialog starts open, when you don't control it.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the dialog opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * A key that opens and closes the dialog when pressed with Ctrl, or with
   * Command on a Mac. `"k"` is the usual one. Left out, there's no shortcut.
   */
  shortcut?: string | null;
  /**
   * The dialog's name, for screen readers. It isn't drawn. Translate it with
   * the rest of your interface.
   * @default "Command palette"
   */
  title?: string;
  /**
   * The element the dialog is rendered into. Set this when the dialog should
   * pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: DialogPrimitive.DialogPortalProps["container"];
}

export interface CommandDialogProps
  extends CommandDialogOwnProps,
    Omit<CommandProps, keyof CommandDialogOwnProps> {}

/**
 * A `Command` in a dialog. It has no trigger of its own: open it with the
 * shortcut, or from a button that sets `open`.
 */
export const CommandDialog = forwardRef<
  ComponentRef<typeof CommandPrimitive>,
  CommandDialogProps
>(function CommandDialog(
  {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    shortcut,
    title = "Command palette",
    container,
    ...props
  },
  ref,
) {
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    caller: "CommandDialog",
  });
  useShortcut(shortcut, () => setOpen((current) => !current));
  const focus = useReturnFocus();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className="nuv-command__overlay" />
        <DialogPrimitive.Content
          className="nuv-command__dialog"
          // Radix asks for a description, or for this to say there's none.
          aria-describedby={undefined}
          onOpenAutoFocus={focus.remember}
          onCloseAutoFocus={focus.restore}
        >
          <DialogPrimitive.Title className="nuv-command__title">
            {title}
          </DialogPrimitive.Title>
          <Command ref={ref} {...props} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});

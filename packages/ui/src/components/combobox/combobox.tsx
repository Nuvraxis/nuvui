"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Command as CommandPrimitive, useCommandState } from "cmdk";
import {
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { cx } from "../../utils/cx";
import {
  ListStatus,
  ListStatusProvider,
  useListLoading,
  useListStatus,
  useMarkListLoading,
} from "../../utils/list-status";
import { useActiveOption } from "../../utils/use-active-option";

interface ComboboxContextValue {
  multiple: boolean;
  values: string[];
  disabled: boolean;
  /** Picks a value, or with `multiple`, adds or removes it. */
  pick: (value: string) => void;
  setOpen: (open: boolean) => void;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useCombobox(part: string): ComboboxContextValue {
  const combobox = useContext(ComboboxContext);
  if (!combobox) throw new Error(`${part} has to be inside a Combobox.`);
  return combobox;
}

// Lower case and without accents, so "jose" finds "José".
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * The filter a Combobox uses unless it's given another: an option stays
 * while its text, or one of its keywords, contains what was typed. Case and
 * accents are ignored. Every match scores the same, so the options keep the
 * order they were written in.
 */
export function comboboxFilter(
  value: string,
  search: string,
  keywords?: string[],
): number {
  const text = keywords?.length ? keywords.join(" ") : value;
  return fold(text).includes(fold(search.trim())) ? 1 : 0;
}

interface ComboboxSharedProps {
  /** Whether the list is open, when you control it. */
  open?: boolean;
  /**
   * Whether the list starts open, when you don't control it.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the list opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Disables the trigger.
   * @default false
   */
  disabled?: boolean;
  /**
   * The name the value is sent under when a form is submitted. With
   * `multiple`, each value is sent under it.
   */
  name?: string;
  /** The `id` of the form the value belongs to, if it isn't inside it. */
  form?: string;
  children?: ReactNode;
}

export interface ComboboxSingleProps extends ComboboxSharedProps {
  /**
   * Lets more than one option be picked. The value is then a list.
   * @default false
   */
  multiple?: false;
  /** The picked option's value, when you control it. `""` is none. */
  value?: string;
  /** The option picked to begin with, when you don't control it. */
  defaultValue?: string;
  /** Called with the new value when an option is picked. */
  onValueChange?: (value: string) => void;
}

export interface ComboboxMultipleProps extends ComboboxSharedProps {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

const none: string[] = [];

function toList(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  return value === "" ? none : [value];
}

/**
 * A select with a search field: a button that opens a list you can type to
 * filter. It holds one value, or several with `multiple`.
 */
export function Combobox(props: ComboboxProps) {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    disabled = false,
    name,
    form,
    children,
  } = props;
  const multiple = props.multiple === true;
  const { onValueChange } = props;

  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    caller: "Combobox",
  });
  // The same list for as long as the value is the same, so that the parts
  // only draw again when it changes.
  const { value } = props;
  const controlled = useMemo(() => toList(value), [value]);
  const [values, setValues] = useControllableState<string[]>({
    prop: controlled,
    defaultProp: toList(props.defaultValue) ?? none,
    onChange: (next) => {
      // One handler for both shapes. Which one it is follows `multiple`.
      const report = onValueChange as
        | ((value: string | string[]) => void)
        | undefined;
      report?.(multiple ? next : (next[0] ?? ""));
    },
    caller: "Combobox",
  });

  const pick = useCallback(
    (value: string) => {
      if (!multiple) {
        setValues([value]);
        setOpen(false);
        return;
      }
      setValues((current) =>
        current.includes(value)
          ? current.filter((other) => other !== value)
          : [...current, value],
      );
    },
    [multiple, setValues, setOpen],
  );

  const combobox = useMemo<ComboboxContextValue>(
    () => ({ multiple, values, disabled, pick, setOpen }),
    [multiple, values, disabled, pick, setOpen],
  );

  return (
    <ComboboxContext.Provider value={combobox}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        {children}
      </PopoverPrimitive.Root>
      {name === undefined
        ? null
        : // A single value is sent even when it's empty, as a select's is.
          (multiple ? values : [values[0] ?? ""]).map((value) => (
            <input
              key={value}
              type="hidden"
              name={name}
              form={form}
              value={value}
              disabled={disabled}
            />
          ))}
    </ComboboxContext.Provider>
  );
}

export type ComboboxTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** The button that shows the value and opens the list. */
export const ComboboxTrigger = forwardRef<
  HTMLButtonElement,
  ComboboxTriggerProps
>(function ComboboxTrigger(
  { className, children, disabled, onKeyDown, ...props },
  ref,
) {
  const combobox = useCombobox("ComboboxTrigger");
  // Field passes `required` to whatever control it holds. A button has no
  // such attribute, and a combobox says it with ARIA.
  const { required, ...triggerProps } = props as typeof props & {
    required?: boolean;
  };

  return (
    <PopoverPrimitive.Trigger
      ref={ref}
      // A button named by a label loses its own text as far as a screen
      // reader goes. With this role the label is the name and the text is
      // the value, the way a select is read.
      role="combobox"
      aria-required={required || undefined}
      className={cx("nuv-combobox", className)}
      disabled={combobox.disabled || disabled}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        // The arrow keys open a select, so they open this.
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          combobox.setOpen(true);
        }
      }}
      {...triggerProps}
    >
      {children}
      <span className="nuv-combobox__icon">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </span>
    </PopoverPrimitive.Trigger>
  );
});

export interface ComboboxValueOwnProps {
  /** What's shown while nothing is picked. */
  placeholder?: ReactNode;
  /**
   * What's shown for the picked value. Left out, it's the value itself, or
   * with `multiple` the values with commas between them.
   */
  children?: ReactNode;
}

export interface ComboboxValueProps
  extends ComboboxValueOwnProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof ComboboxValueOwnProps> {}

/**
 * The text in the trigger. The list isn't on the page while it's closed, so
 * the component can't look an option's text up: pass it as children when it
 * differs from the value.
 */
export const ComboboxValue = forwardRef<HTMLSpanElement, ComboboxValueProps>(
  function ComboboxValue({ placeholder, children, className, ...props }, ref) {
    const { values } = useCombobox("ComboboxValue");
    const empty = values.length === 0;

    return (
      <span
        ref={ref}
        className={cx("nuv-combobox__value", className)}
        data-placeholder={empty ? "" : undefined}
        {...props}
      >
        {empty ? placeholder : (children ?? values.join(", "))}
      </span>
    );
  },
);

type PopoverContentProps = ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
>;
type CommandRootProps = ComponentPropsWithoutRef<typeof CommandPrimitive>;

export interface ComboboxContentOwnProps {
  /**
   * The search field's name, for screen readers. It names the popup as
   * well, unless that has an `aria-label` of its own. Translate it with the
   * rest of your interface.
   * @default "Search"
   */
  label?: string;
  /**
   * The list's name, for screen readers. Translate it with the rest of your
   * interface.
   * @default "Options"
   */
  listLabel?: string;
  /** The search field's placeholder. */
  searchPlaceholder?: string;
  /** What's typed in the search field, when you control it. */
  search?: string;
  /** Called with the text when the search field changes. */
  onSearchChange?: (search: string) => void;
  /**
   * Whether the list is filtered as you type. Turn it off when the options
   * are fetched for each search, and already are the matches.
   * @default true
   */
  shouldFilter?: boolean;
  /**
   * Scores an option against the search. Zero hides it, and options with a
   * higher score come first. It's given the option's text as the first
   * keyword.
   * @default comboboxFilter
   */
  filter?: CommandRootProps["filter"];
  /**
   * Whether the arrow keys go round from the last option to the first.
   * @default false
   */
  loop?: boolean;
  /**
   * Which edge of the trigger the list lines up with.
   * @default "start"
   */
  align?: PopoverContentProps["align"];
  /**
   * The gap between the trigger and the list, in pixels.
   * @default 6
   */
  sideOffset?: PopoverContentProps["sideOffset"];
  /**
   * How close the list may get to the edge of the screen, in pixels.
   * @default 8
   */
  collisionPadding?: PopoverContentProps["collisionPadding"];
  /**
   * The element the list is rendered into. Set this when the list should
   * pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: PopoverPrimitive.PopoverPortalProps["container"];
}

export interface ComboboxContentProps
  extends ComboboxContentOwnProps,
    Omit<PopoverContentProps, keyof ComboboxContentOwnProps> {}

/** The popup: the search field, and the list its children go in. */
export const ComboboxContent = forwardRef<
  ComponentRef<typeof PopoverPrimitive.Content>,
  ComboboxContentProps
>(function ComboboxContent(
  {
    label = "Search",
    listLabel = "Options",
    searchPlaceholder,
    search,
    onSearchChange,
    shouldFilter = true,
    filter = comboboxFilter,
    loop = false,
    align = "start",
    sideOffset = 6,
    collisionPadding = 8,
    container,
    className,
    children,
    onKeyDown,
    ...props
  },
  ref,
) {
  const combobox = useCombobox("ComboboxContent");
  const [status, statusRef] = useListStatus();
  const activeOption = useActiveOption();

  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        ref={ref}
        aria-label={label}
        className={cx("nuv-combobox__content", className)}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          // The popup is at the end of the page, so Tab would leave from
          // there and not from the trigger. This closes it, which puts
          // focus back on the trigger, and the next Tab moves on from it.
          if (event.key === "Tab") {
            event.preventDefault();
            combobox.setOpen(false);
          }
        }}
        {...props}
      >
        <CommandPrimitive
          ref={activeOption}
          label={label}
          shouldFilter={shouldFilter}
          filter={filter}
          loop={loop}
          vimBindings={false}
          // The list opens with the picked option highlighted and in view.
          defaultValue={combobox.values[0]?.trim()}
          className="nuv-combobox__body"
        >
          <div className="nuv-combobox__search">
            <svg
              aria-hidden="true"
              className="nuv-combobox__search-icon"
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
              className="nuv-combobox__input"
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={onSearchChange}
            />
          </div>
          <CommandPrimitive.List
            className="nuv-combobox__list"
            label={listLabel}
          >
            <ListStatusProvider value={status}>{children}</ListStatusProvider>
          </CommandPrimitive.List>
          <div ref={statusRef} role="status" className="nuv-combobox__status" />
        </CommandPrimitive>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});

type ItemProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Item>;

export interface ComboboxItemOwnProps {
  /**
   * What the option stands for. It's what `value` and `onValueChange` deal
   * in, and it has to differ from every other option's.
   */
  value: string;
  /**
   * The text the search looks through. Left out, it's the children when
   * they're a string. Give it when they aren't.
   */
  textValue?: string;
  /** Other words that should find this option. */
  keywords?: string[];
  /**
   * Whether the option can be picked.
   * @default false
   */
  disabled?: boolean;
  /** Called with the option's value when it's picked. */
  onSelect?: (value: string) => void;
}

export interface ComboboxItemProps
  extends ComboboxItemOwnProps,
    Omit<ItemProps, keyof ComboboxItemOwnProps> {}

export const ComboboxItem = forwardRef<
  ComponentRef<typeof CommandPrimitive.Item>,
  ComboboxItemProps
>(function ComboboxItem(
  { value, textValue, keywords, onSelect, className, children, ...props },
  ref,
) {
  const combobox = useCombobox("ComboboxItem");
  const checked = combobox.values.includes(value);
  const text = textValue ?? (typeof children === "string" ? children : "");
  const words = useMemo(
    () => [...(text ? [text] : []), ...(keywords ?? [])],
    [text, keywords],
  );

  return (
    <CommandPrimitive.Item
      ref={ref}
      value={value}
      keywords={words}
      onSelect={() => {
        onSelect?.(value);
        combobox.pick(value);
      }}
      // aria-selected is the row the arrow keys are on, which is what it
      // means in a list worked from a text field. Being picked is said
      // with this. With one value only the picked option has it, so the
      // others aren't each read out as "not checked".
      aria-checked={combobox.multiple ? checked : checked || undefined}
      data-state={checked ? "checked" : "unchecked"}
      className={cx("nuv-combobox__item", className)}
      {...props}
    >
      {children}
      {checked ? (
        <span className="nuv-combobox__indicator">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        </span>
      ) : null}
    </CommandPrimitive.Item>
  );
});

type GroupProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Group>;

export interface ComboboxGroupOwnProps {
  /** The text over the group's options. It also names the group. */
  heading?: ReactNode;
}

export interface ComboboxGroupProps
  extends ComboboxGroupOwnProps,
    Omit<GroupProps, keyof ComboboxGroupOwnProps> {}

export const ComboboxGroup = forwardRef<
  ComponentRef<typeof CommandPrimitive.Group>,
  ComboboxGroupProps
>(function ComboboxGroup({ heading, className, ...props }, ref) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cx("nuv-combobox__group", className)}
      heading={
        heading ? <div className="nuv-combobox__label">{heading}</div> : null
      }
      {...props}
    />
  );
});

export interface ComboboxSeparatorOwnProps {
  /**
   * Whether the line stays while something is typed in the search field.
   * Left off, it goes, because the groups it was between may have gone.
   * @default false
   */
  alwaysRender?: boolean;
}

export interface ComboboxSeparatorProps
  extends ComboboxSeparatorOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/**
 * A line between groups. It's decoration: a list of options may only hold
 * options and groups, so it's hidden from screen readers, which hear the
 * groups by their headings.
 */
export const ComboboxSeparator = forwardRef<
  HTMLDivElement,
  ComboboxSeparatorProps
>(function ComboboxSeparator(
  { alwaysRender = false, className, ...props },
  ref,
) {
  const searching = useCommandState((state) => Boolean(state.search));
  if (searching && !alwaysRender) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cx("nuv-combobox__separator", className)}
      {...props}
    />
  );
});

export type ComboboxEmptyProps = ComponentPropsWithoutRef<
  typeof CommandPrimitive.Empty
>;

/**
 * Shown while no option matches what was typed, unless a `ComboboxLoading`
 * is showing. A screen reader is told the same text when it appears.
 */
export const ComboboxEmpty = forwardRef<
  ComponentRef<typeof CommandPrimitive.Empty>,
  ComboboxEmptyProps
>(function ComboboxEmpty({ className, children, ...props }, ref) {
  if (useListLoading()) return null;
  return (
    <CommandPrimitive.Empty
      ref={ref}
      aria-hidden="true"
      className={cx("nuv-combobox__empty", className)}
      {...props}
    >
      {children}
      <ListStatus>{children}</ListStatus>
    </CommandPrimitive.Empty>
  );
});

type LoadingProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Loading>;

export interface ComboboxLoadingOwnProps {
  /**
   * What a screen reader is told while this is shown, and what's drawn if
   * there are no children. Translate it with the rest of your interface.
   * @default "Loading"
   */
  label?: string;
}

export interface ComboboxLoadingProps
  extends ComboboxLoadingOwnProps,
    Omit<LoadingProps, keyof ComboboxLoadingOwnProps | "progress"> {}

/** Render it while the options are being fetched. */
export const ComboboxLoading = forwardRef<
  ComponentRef<typeof CommandPrimitive.Loading>,
  ComboboxLoadingProps
>(function ComboboxLoading(
  { label = "Loading", className, children, ...props },
  ref,
) {
  useMarkListLoading();
  return (
    <CommandPrimitive.Loading
      ref={ref}
      label={label}
      aria-hidden="true"
      className={cx("nuv-combobox__loading", className)}
      {...props}
    >
      {children ?? label}
      <ListStatus>{label}</ListStatus>
    </CommandPrimitive.Loading>
  );
});

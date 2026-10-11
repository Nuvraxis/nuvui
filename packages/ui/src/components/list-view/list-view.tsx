"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  createContext,
  type FocusEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

type SelectionMode = "none" | "single" | "multiple";

interface ListViewContextValue {
  mode: SelectionMode;
  selected: string[];
  /** The row Tab stops at, and the arrow keys start from. */
  active: string | null;
  setActive: (value: string) => void;
  press: (value: string, shift: boolean) => void;
}

const ListViewContext = createContext<ListViewContextValue | null>(null);

// How long a pause ends a word that's being typed to find a row.
const typeAheadPause = 500;

// What Tab would stop at inside a row, and what a press on is that thing's
// business and not the row's.
const controls =
  'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable="true"]';
const pressable = `${controls}, label`;

const rowOf = (element: Element | null) =>
  element?.getAttribute("role") === "row" ? (element as HTMLElement) : null;
const rowValue = (row: HTMLElement) => row.dataset.value ?? "";
const disabledRow = (row: HTMLElement) =>
  row.getAttribute("aria-disabled") === "true";
// What a row is found by when typing: the text you gave it, or its own.
const textOf = (row: HTMLElement) =>
  (row.dataset.text ?? row.textContent ?? "").trim().toLowerCase();

export interface ListViewOwnProps {
  /**
   * Whether rows can be selected, and how many. With `"multiple"`, a press
   * adds a row to the selection or takes it out, and Shift selects a run
   * of them.
   * @default "none"
   */
  selectionMode?: SelectionMode;
  /** The selected rows' values, when you control them. */
  value?: string[];
  /** The rows selected at first, when you don't. */
  defaultValue?: string[];
  /** Called with every selected row's value when the selection changes. */
  onValueChange?: (value: string[]) => void;
  /**
   * Called with a row's value when Enter is pressed on it. Where rows can't
   * be selected, a press on the row calls it too.
   */
  onAction?: (value: string) => void;
}

export interface ListViewProps
  extends ListViewOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, "defaultValue"> {}

/**
 * A list whose rows can be selected and can each hold buttons and links.
 * One Tab stop, with the arrow keys moving between rows, and Tab going on
 * into the row it's at. Give it a name with `aria-label`.
 */
export const ListView = forwardRef<HTMLDivElement, ListViewProps>(
  function ListView(
    {
      selectionMode = "none",
      value,
      defaultValue,
      onValueChange,
      onAction,
      className,
      onKeyDown,
      children,
      ...props
    },
    ref,
  ) {
    const root = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useControllableState({
      prop: value,
      defaultProp: defaultValue ?? [],
      onChange: onValueChange,
    });
    const [active, setActive] = useState<string | null>(null);
    // Where a run selected with Shift starts from.
    const anchor = useRef<string | null>(null);
    const typed = useRef({ text: "", at: 0 });
    // The tabindex each control had before the list took it out of the Tab
    // order, to give back when its row is the one Tab stops at.
    const kept = useRef(new WeakMap<Element, string | null>());

    const rows = useCallback(
      () =>
        Array.from(
          root.current?.querySelectorAll<HTMLElement>('[role="row"]') ?? [],
        ),
      [],
    );

    // Tab goes from the row it stopped at to that row's buttons, and then
    // out of the list. So the buttons of every other row are taken out of
    // the Tab order: with all of them in it, Tab would go through every
    // button of every row on its way past.
    const order = useCallback(() => {
      for (const row of rows()) {
        const open = row.tabIndex === 0;
        for (const control of row.querySelectorAll<HTMLElement>(controls)) {
          const was = kept.current.get(control);
          if (open) {
            if (was === undefined) continue;
            if (was === null) control.removeAttribute("tabindex");
            else control.setAttribute("tabindex", was);
            kept.current.delete(control);
          } else if (was === undefined && control.tabIndex >= 0) {
            kept.current.set(control, control.getAttribute("tabindex"));
            control.setAttribute("tabindex", "-1");
          }
        }
      }
    }, [rows]);

    // Tab has to stop somewhere. The row it stopped at can go, when it's
    // taken out of the data. Then it's the first row.
    useLayoutEffect(() => {
      const all = rows();
      if (all.length > 0 && !all.some((row) => row.tabIndex === 0)) {
        setActive(rowValue(all[0] as HTMLElement));
      }
      order();
    });

    // A row can draw a button later than the list was last drawn: one that
    // appears when the row's own state changes.
    useLayoutEffect(() => {
      const element = root.current;
      if (!element || typeof MutationObserver === "undefined") return;
      const observer = new MutationObserver(order);
      observer.observe(element, { childList: true, subtree: true });
      return () => observer.disconnect();
    }, [order]);

    const select = useCallback(
      (row: string, shift: boolean) => {
        if (selectionMode === "none") return;
        if (selectionMode === "single") {
          setSelected([row]);
          return;
        }
        const from = anchor.current;
        if (shift && from !== null && from !== row) {
          // Every row between the two, added to what's selected.
          const values = rows()
            .filter((item) => !disabledRow(item))
            .map(rowValue);
          const start = values.indexOf(from);
          const end = values.indexOf(row);
          if (start >= 0 && end >= 0) {
            const run = values.slice(
              Math.min(start, end),
              Math.max(start, end) + 1,
            );
            setSelected((current = []) => [...new Set([...current, ...run])]);
            return;
          }
        }
        anchor.current = row;
        setSelected((current = []) =>
          current.includes(row)
            ? current.filter((other) => other !== row)
            : [...current, row],
        );
      },
      [selectionMode, setSelected, rows],
    );

    const press = useCallback<ListViewContextValue["press"]>(
      (row, shift) => {
        if (selectionMode === "none") onAction?.(row);
        else select(row, shift);
      },
      [selectionMode, onAction, select],
    );

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      // Only with focus on a row. A key pressed in a field or on a button
      // inside one is that control's.
      const row = rowOf(event.target as Element);
      if (!row || event.altKey) return;

      const all = rows();
      const index = all.indexOf(row);
      const disabled = disabledRow(row);
      const command = event.ctrlKey || event.metaKey;

      const go = (to: HTMLElement | null | undefined) => {
        if (!to) return;
        to.focus();
        // Shift and an arrow selects the row it arrives at.
        if (
          event.shiftKey &&
          selectionMode === "multiple" &&
          !disabledRow(to)
        ) {
          if (anchor.current === null) anchor.current = rowValue(row);
          setSelected((current = []) => [
            ...new Set([...current, rowValue(to)]),
          ]);
        }
      };

      switch (event.key) {
        case "ArrowDown":
          go(all[index + 1]);
          break;
        case "ArrowUp":
          go(all[index - 1]);
          break;
        case "Home":
          all[0]?.focus();
          break;
        case "End":
          all.at(-1)?.focus();
          break;
        case "Enter":
          if (disabled) break;
          if (onAction) onAction(rowValue(row));
          else select(rowValue(row), false);
          break;
        case " ":
          if (disabled) break;
          if (selectionMode === "none") onAction?.(rowValue(row));
          else select(rowValue(row), event.shiftKey);
          break;
        default: {
          if (command && event.key.toLowerCase() === "a") {
            if (selectionMode !== "multiple") return;
            setSelected(all.filter((item) => !disabledRow(item)).map(rowValue));
            break;
          }
          // A letter goes to the next row that starts with it. Letters typed
          // one after another make a word.
          if (event.key.length !== 1 || command) return;
          const now = Date.now();
          const word =
            now - typed.current.at < typeAheadPause
              ? typed.current.text + event.key.toLowerCase()
              : event.key.toLowerCase();
          typed.current = { text: word, at: now };
          // One letter looks after this row, so the same letter again goes
          // on to the next, however quickly it's pressed. A longer word may
          // still be this row's.
          const letter = [...word].every((other) => other === word[0]);
          const wanted = letter ? (word[0] ?? "") : word;
          const from = letter ? index + 1 : index;
          const round = [...all.slice(from), ...all.slice(0, from)];
          round.find((item) => textOf(item).startsWith(wanted))?.focus();
          break;
        }
      }
      event.preventDefault();
    }

    const context = useMemo<ListViewContextValue>(
      () => ({
        mode: selectionMode,
        selected: selected ?? [],
        active,
        setActive,
        press,
      }),
      [selectionMode, selected, active, press],
    );

    return (
      <ListViewContext.Provider value={context}>
        {/* biome-ignore lint/a11y/useSemanticElements: a grid one column wide, which is the pattern for a list whose rows hold controls. A table would be read as data */}
        <div
          ref={useComposedRefs(ref, root)}
          role="grid"
          aria-multiselectable={selectionMode === "multiple" ? true : undefined}
          className={cx("nuv-list-view", className)}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </div>
      </ListViewContext.Provider>
    );
  },
);

export interface ListViewItemOwnProps {
  /** What the row is known by in `value`. No two the same. */
  value: string;
  /**
   * The row's name as plain text, which typing a letter looks for. Needed
   * when the row's text doesn't start with it.
   */
  textValue?: string;
  /**
   * A row that can't be selected or acted on. The arrow keys still stop at
   * it, so a screen reader can read it. Disable the buttons inside it
   * yourself.
   * @default false
   */
  disabled?: boolean;
  /** What the row shows: text, and any buttons or links. */
  children?: ReactNode;
}

export interface ListViewItemProps
  extends ListViewItemOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {}

/** One row of a `ListView`. */
export const ListViewItem = forwardRef<HTMLDivElement, ListViewItemProps>(
  function ListViewItem(
    {
      value,
      textValue,
      disabled = false,
      className,
      onFocus,
      onClick,
      onMouseDown,
      children,
      ...props
    },
    ref,
  ) {
    const list = useContext(ListViewContext);
    if (!list) throw new Error("ListViewItem has to be inside a ListView.");

    function handleFocus(event: FocusEvent<HTMLDivElement>) {
      onFocus?.(event);
      // On the row or on a button inside it: either way this is the row
      // Tab comes back to.
      list?.setActive(value);
    }

    function handleClick(event: MouseEvent<HTMLDivElement>) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const row = event.currentTarget;
      // A press on a button inside the row is the button's.
      if ((event.target as Element).closest(pressable) !== row) return;
      // A press with Shift held is stopped from selecting text, which
      // stops it moving focus too.
      row.focus();
      if (!disabled) list?.press(value, event.shiftKey);
    }

    return (
      // biome-ignore lint/a11y/useSemanticElements: a row of the grid above. A tr can't hold a card's worth of content
      // biome-ignore lint/a11y/useKeyWithClickEvents: the keys are handled on the list
      <div
        ref={ref}
        role="row"
        aria-selected={
          list.mode === "none" ? undefined : list.selected.includes(value)
        }
        aria-disabled={disabled ? true : undefined}
        data-value={value}
        data-text={textValue}
        tabIndex={list.active === value ? 0 : -1}
        className={cx("nuv-list-view__item", className)}
        onFocus={handleFocus}
        onClick={handleClick}
        // Shift and a press selects a run of rows. Without this it
        // selects their text first. In a field inside the row, Shift and
        // a press is still the field's.
        onMouseDown={(event) => {
          onMouseDown?.(event);
          if (
            event.shiftKey &&
            list.mode === "multiple" &&
            (event.target as Element).closest(pressable) === event.currentTarget
          ) {
            event.preventDefault();
          }
        }}
        {...props}
      >
        {/* biome-ignore lint/a11y/useSemanticElements: the one cell of the row. See above */}
        {/* biome-ignore lint/a11y/useFocusableInteractive: focus is on the row, which is the whole of its one cell */}
        <div role="gridcell" className="nuv-list-view__cell">
          {children}
        </div>
      </div>
    );
  },
);

"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Children,
  createContext,
  type FocusEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type LiHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

type SelectionMode = "none" | "single" | "multiple";

interface TreeContextValue {
  mode: SelectionMode;
  expanded: string[];
  selected: string[];
  /** The row Tab stops at, and the arrow keys start from. */
  active: string | null;
  setActive: (value: string) => void;
  press: (
    value: string,
    how: { branch: boolean; chevron: boolean; shift: boolean },
  ) => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);

// How long a pause ends a word that's being typed to find a row.
const typeAheadPause = 500;

const rowOf = (element: Element | null) =>
  element?.getAttribute("role") === "treeitem"
    ? (element as HTMLElement)
    : null;
const rowValue = (row: HTMLElement) => row.dataset.value ?? "";
const disabledRow = (row: HTMLElement) =>
  row.getAttribute("aria-disabled") === "true";
// What a row is found by when typing: the text you gave it, or its label's.
const textOf = (row: HTMLElement) =>
  (
    row.dataset.text ??
    row.querySelector(":scope > .nuv-tree__row")?.textContent ??
    ""
  )
    .trim()
    .toLowerCase();

export interface TreeOwnProps {
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
  /** The open rows' values, when you control them. */
  expanded?: string[];
  /** The rows open at first, when you don't. */
  defaultExpanded?: string[];
  /** Called with every open row's value when a row opens or closes. */
  onExpandedChange?: (expanded: string[]) => void;
}

export interface TreeProps
  extends TreeOwnProps,
    Omit<HTMLAttributes<HTMLUListElement>, "defaultValue"> {}

/**
 * Rows that open to show more rows: files in folders, the parts of an
 * organization, the sections of a document. One Tab stop, with the arrow
 * keys moving between rows. Give it a name with `aria-label`.
 */
export const Tree = forwardRef<HTMLUListElement, TreeProps>(function Tree(
  {
    selectionMode = "none",
    value,
    defaultValue,
    onValueChange,
    expanded: expandedProp,
    defaultExpanded,
    onExpandedChange,
    className,
    onKeyDown,
    children,
    ...props
  },
  ref,
) {
  const root = useRef<HTMLUListElement>(null);
  const [selected, setSelected] = useControllableState({
    prop: value,
    defaultProp: defaultValue ?? [],
    onChange: onValueChange,
  });
  const [expanded, setExpanded] = useControllableState({
    prop: expandedProp,
    defaultProp: defaultExpanded ?? [],
    onChange: onExpandedChange,
  });
  const [active, setActive] = useState<string | null>(null);
  // Where a run selected with Shift starts from.
  const anchor = useRef<string | null>(null);
  const typed = useRef({ text: "", at: 0 });

  // Every row that's drawn, in the order it's seen. A closed row's children
  // aren't in the page, so these are exactly the rows the arrow keys visit.
  const rows = useCallback(
    () =>
      Array.from(
        root.current?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [],
      ),
    [],
  );

  // Tab has to stop somewhere. The row it stopped at can go: its parent is
  // closed, or it's taken out of the data. Then it's the first row.
  useLayoutEffect(() => {
    const all = rows();
    if (all.length === 0 || all.some((row) => row.tabIndex === 0)) return;
    setActive(rowValue(all[0] as HTMLElement));
  });

  const toggle = useCallback(
    (row: string, open?: boolean) =>
      setExpanded((current = []) => {
        const isOpen = current.includes(row);
        if ((open ?? !isOpen) === isOpen) return current;
        return isOpen
          ? current.filter((other) => other !== row)
          : [...current, row];
      }),
    [setExpanded],
  );

  const select = useCallback(
    (row: string, shift: boolean) => {
      if (selectionMode === "none") return;
      if (selectionMode === "single") {
        setSelected([row]);
        return;
      }
      const from = anchor.current;
      if (shift && from !== null && from !== row) {
        // Every row between the two, as they're drawn, added to what's
        // selected.
        const all = rows().filter((item) => !disabledRow(item));
        const values = all.map(rowValue);
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

  const press = useCallback<TreeContextValue["press"]>(
    (row, { branch, chevron, shift }) => {
      // The chevron opens and closes, and leaves the selection alone.
      if (!chevron) select(row, shift);
      if (branch && !shift) toggle(row);
    },
    [select, toggle],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const row = rowOf(event.target as Element);
    if (!row || event.altKey) return;

    const all = rows();
    const index = all.indexOf(row);
    const branch = row.hasAttribute("aria-expanded");
    const open = row.getAttribute("aria-expanded") === "true";
    const disabled = disabledRow(row);
    // In a right-to-left page the tree is mirrored, and so are the keys
    // that go into a row and out of it.
    const rtl = getComputedStyle(row).direction === "rtl";
    const into = rtl ? "ArrowLeft" : "ArrowRight";
    const out = rtl ? "ArrowRight" : "ArrowLeft";
    const command = event.ctrlKey || event.metaKey;

    const go = (to: HTMLElement | null | undefined) => {
      if (!to) return;
      to.focus();
      // Shift and an arrow selects the row it arrives at.
      if (event.shiftKey && selectionMode === "multiple" && !disabledRow(to)) {
        if (anchor.current === null) anchor.current = rowValue(row);
        setSelected((current = []) => [...new Set([...current, rowValue(to)])]);
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
      case into:
        if (!branch) return;
        if (!open) {
          if (!disabled) toggle(rowValue(row), true);
        } else all[index + 1]?.focus();
        break;
      case out:
        if (branch && open) {
          if (!disabled) toggle(rowValue(row), false);
        } else
          rowOf(
            row.parentElement?.closest('[role="treeitem"]') ?? null,
          )?.focus();
        break;
      case "Enter":
        if (!disabled) {
          press(rowValue(row), { branch, chevron: false, shift: false });
        }
        break;
      case " ":
        if (disabled) break;
        if (selectionMode === "none") {
          if (branch) toggle(rowValue(row));
        } else select(rowValue(row), event.shiftKey);
        break;
      case "*": {
        // Opens every row beside this one.
        const beside = Array.from(row.parentElement?.children ?? [])
          .filter(
            (item): item is HTMLElement =>
              item instanceof HTMLElement &&
              item.hasAttribute("aria-expanded") &&
              !disabledRow(item),
          )
          .map(rowValue);
        setExpanded((current = []) => [...new Set([...current, ...beside])]);
        break;
      }
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
        const order = [...all.slice(from), ...all.slice(0, from)];
        order.find((item) => textOf(item).startsWith(wanted))?.focus();
        break;
      }
    }
    event.preventDefault();
  }

  const context = useMemo<TreeContextValue>(
    () => ({
      mode: selectionMode,
      expanded: expanded ?? [],
      selected: selected ?? [],
      active,
      setActive,
      press,
    }),
    [selectionMode, expanded, selected, active, press],
  );

  return (
    <TreeContext.Provider value={context}>
      <ul
        ref={useComposedRefs(ref, root)}
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: a tree is a list of lists, and the roles say what kind
        role="tree"
        aria-multiselectable={selectionMode === "multiple" ? true : undefined}
        className={cx("nuv-tree", className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </ul>
    </TreeContext.Provider>
  );
});

export interface TreeItemOwnProps {
  /** What the row is known by in `value` and `expanded`. No two the same. */
  value: string;
  /** What the row shows: its name, and an icon if you like. */
  label: ReactNode;
  /**
   * The row's name as plain text, which typing a letter looks for. Needed
   * when the label doesn't start with it, as when it starts with a count.
   */
  textValue?: string;
  /**
   * A row that can't be selected, opened or closed. The arrow keys still
   * stop at it, so a screen reader can read it.
   * @default false
   */
  disabled?: boolean;
  /** The rows inside this one: more `TreeItem`s. With any, the row opens. */
  children?: ReactNode;
}

export interface TreeItemProps
  extends TreeItemOwnProps,
    Omit<LiHTMLAttributes<HTMLLIElement>, "value" | "children"> {}

/** One row of a `Tree`. Put `TreeItem`s inside it for the rows under it. */
export const TreeItem = forwardRef<HTMLLIElement, TreeItemProps>(
  function TreeItem(
    {
      value,
      label,
      textValue,
      disabled = false,
      className,
      onFocus,
      children,
      ...props
    },
    ref,
  ) {
    const tree = useContext(TreeContext);
    if (!tree) throw new Error("TreeItem has to be inside a Tree.");
    const labelId = useId();
    const branch = Children.toArray(children).length > 0;
    const open = branch && tree.expanded.includes(value);

    function handleFocus(event: FocusEvent<HTMLLIElement>) {
      onFocus?.(event);
      // Focus on a row inside this one is that row's business.
      if (event.target === event.currentTarget) tree?.setActive(value);
    }

    function handleClick(event: MouseEvent<HTMLDivElement>) {
      // A press with Shift held is stopped from selecting text, which
      // stops it moving focus too.
      event.currentTarget.parentElement?.focus();
      if (disabled) return;
      tree?.press(value, {
        branch,
        chevron:
          (event.target as Element).closest(".nuv-tree__chevron") !== null,
        shift: event.shiftKey,
      });
    }

    return (
      <li
        ref={ref}
        role="treeitem"
        // Its name is its own label, not that and every row inside it.
        aria-labelledby={labelId}
        aria-expanded={branch ? open : undefined}
        aria-selected={
          tree.mode === "none" ? undefined : tree.selected.includes(value)
        }
        aria-disabled={disabled ? true : undefined}
        data-value={value}
        data-text={textValue}
        tabIndex={tree.active === value ? 0 : -1}
        className={cx("nuv-tree__item", className)}
        onFocus={handleFocus}
        {...props}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: the row it's part of is the control, and takes the keys */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: the keys are handled on the tree */}
        <div
          className="nuv-tree__row"
          onClick={handleClick}
          // Shift and a press selects a run of rows. Without this it
          // selects their text first.
          onMouseDown={(event) => {
            if (event.shiftKey) event.preventDefault();
          }}
        >
          <span
            className="nuv-tree__chevron"
            aria-hidden="true"
            data-open={open ? "" : undefined}
          >
            {branch ? (
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
                <path d="M6 4l4 4-4 4" />
              </svg>
            ) : null}
          </span>
          <span id={labelId} className="nuv-tree__label">
            {label}
          </span>
        </div>
        {open ? (
          // biome-ignore lint/a11y/useSemanticElements: it is a list. The role says it's the rows of the row above
          <ul role="group" className="nuv-tree__group">
            {children}
          </ul>
        ) : null}
      </li>
    );
  },
);

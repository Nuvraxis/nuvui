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
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useContext,
  useEffect,
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
  /** Whether rows can be moved, which a row says with its shortcut. */
  movable: boolean;
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
const faceOf = (row: HTMLElement) =>
  row.querySelector<HTMLElement>(":scope > .nuv-tree__row");
const groupOf = (row: HTMLElement) =>
  row.querySelector<HTMLElement>(":scope > .nuv-tree__group");
const parentOf = (row: HTMLElement) =>
  rowOf(row.parentElement?.closest('[role="treeitem"]') ?? null);
const rowsIn = (list: Element | null) =>
  Array.from(list?.children ?? []).filter(
    (item): item is HTMLElement => rowOf(item) !== null,
  );
// A row's name: the text you gave it, or its label's.
const nameOf = (row: HTMLElement) =>
  (row.dataset.text ?? faceOf(row)?.textContent ?? "").trim();
// What a row is found by when typing.
const textOf = (row: HTMLElement) => nameOf(row).toLowerCase();

/** Rows moved to a new place, as `onMove` is told of it. */
export interface TreeMove {
  /**
   * The values of the rows that moved, in the order they're shown. A row
   * inside another that moved isn't listed: it goes where that one goes.
   */
  values: string[];
  /** The value of the row they were moved to. */
  target: string;
  /**
   * Where they go against that row: before it, after it, or inside it,
   * after the rows it already has.
   */
  position: "before" | "after" | "inside";
}

// The same, while it's still about rows in the page.
interface Place {
  row: HTMLElement;
  position: TreeMove["position"];
}

// How far a mouse goes with its button down before it's a drag and not a
// press, and how far a finger goes before it's a scroll and not a hold.
const dragAfter = 4;
const scrollAfter = 8;
// How long a finger stays down before the row is picked up.
const holdFor = 400;
// How long a drag waits over a closed row before the row opens.
const openAfter = 700;
// How near the edge of what scrolls a drag starts scrolling it, and how
// far each frame.
const scrollEdge = 32;
const scrollBy = 8;

// What scrolls the tree: the nearest thing around it that can, or the page.
function scrollerOf(element: HTMLElement) {
  for (let at = element.parentElement; at; at = at.parentElement) {
    const { overflowY } = getComputedStyle(at);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      at.scrollHeight > at.clientHeight
    ) {
      return at;
    }
  }
  return document.scrollingElement ?? document.documentElement;
}

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
  /**
   * Called when rows are moved, by dragging them or with Alt and an arrow
   * key. Giving it is what lets rows be moved. The tree doesn't move them:
   * change your data to match, and draw the rows again.
   */
  onMove?: (move: TreeMove) => void;
  /**
   * Whether rows can go to a place. Return `false` and it isn't offered:
   * a drag shows no mark there, and the keys pass it by. A row can never
   * go inside itself or inside a disabled row.
   */
  canDrop?: (move: TreeMove) => boolean;
  /**
   * What a screen reader is told when rows have moved.
   * @default "Moved Budget into Reports", and the like
   */
  getMoveText?: (move: TreeMove) => string;
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
    onMove,
    canDrop,
    getMoveText,
    className,
    onKeyDown,
    onPointerDown,
    onClickCapture,
    onContextMenu,
    onBlur,
    children,
    ...props
  },
  ref,
) {
  const root = useRef<HTMLUListElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const movable = onMove !== undefined;
  // What you gave, as it is now. A drag outlives the render it began in.
  const latest = useRef({ onMove, canDrop, getMoveText });
  // The row to give focus back to, once moving it has taken focus away.
  const refocus = useRef<string | null>(null);
  // The drag that's going on, from the press that may become one.
  const drag = useRef<{
    touch: boolean;
    active: boolean;
    end: () => void;
  } | null>(null);
  // Set for a moment after a drag, so the press that ends it isn't a press.
  const quiet = useRef(false);
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
    latest.current = { onMove, canDrop, getMoveText };
    const all = rows();

    // A moved row is taken out of the page and put back, and focus doesn't
    // go with it. This waits for your data to change, however long that
    // takes, and gives up once focus has gone somewhere of its own accord.
    const wanted = refocus.current;
    if (wanted !== null) {
      const row = all.find((item) => rowValue(item) === wanted);
      const has = document.activeElement;
      if (row && has !== row) {
        refocus.current = null;
        if (!has || has === document.body) row.focus();
      }
    }

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

  // The rows that go when this one does: every selected row, if it's one
  // of several. Not a row inside another that's going, which goes with it.
  function moving(row: HTMLElement) {
    const chosen = selected ?? [];
    if (selectionMode !== "multiple" || !chosen.includes(rowValue(row))) {
      return [row];
    }
    const all = rows().filter(
      (item) => chosen.includes(rowValue(item)) && !disabledRow(item),
    );
    return all.filter(
      (item) => !all.some((other) => other !== item && other.contains(item)),
    );
  }

  const moveOf = (moved: HTMLElement[], place: Place): TreeMove => ({
    values: moved.map(rowValue),
    target: rowValue(place.row),
    position: place.position,
  });

  function allowed(moved: HTMLElement[], { row, position }: Place) {
    if (moved.some((item) => item.contains(row))) return false;
    if (position === "inside" && disabledRow(row)) return false;
    // Where one row already is isn't somewhere to move it to.
    const only = moved.length === 1 ? moved[0] : undefined;
    if (only) {
      if (position === "before" && row.previousElementSibling === only) {
        return false;
      }
      if (position === "after" && row.nextElementSibling === only) {
        return false;
      }
      if (position === "inside" && rowsIn(groupOf(row)).at(-1) === only) {
        return false;
      }
    }
    return latest.current.canDrop?.(moveOf(moved, { row, position })) ?? true;
  }

  function drop(moved: HTMLElement[], place: Place, focus: HTMLElement) {
    const move = moveOf(moved, place);
    // A row that's been given rows is opened, so they can be seen arriving
    // and the row that had focus is still there to have it.
    if (place.position === "inside") toggle(move.target, true);
    refocus.current = rowValue(focus);
    latest.current.onMove?.(move);
    if (!status.current) return;
    const first = moved[0];
    const what =
      moved.length === 1 && first ? nameOf(first) : `${moved.length} rows`;
    const where = { before: "before", after: "after", inside: "into" };
    status.current.textContent =
      latest.current.getMoveText?.(move) ??
      `Moved ${what} ${where[place.position]} ${nameOf(place.row)}`;
  }

  // Alt and an arrow: to the next place the row can go, up or down. Every
  // place is on the way, so a row can be taken anywhere a drag could.
  function step(row: HTMLElement, by: 1 | -1) {
    const moved = moving(row);
    const gone = new Set<Element>(moved);
    const stays = (item: Element) => !gone.has(item);
    // Every place there is with the moving rows taken out, top to bottom.
    const places: Place[] = [];
    const walk = (list: Element | null) => {
      const items = rowsIn(list).filter(stays);
      items.forEach((item, at) => {
        places.push({ row: item, position: "before" });
        const group = groupOf(item);
        if (rowsIn(group).some(stays)) walk(group);
        else places.push({ row: item, position: "inside" });
        if (at === items.length - 1) {
          places.push({ row: item, position: "after" });
        }
      });
    };
    walk(root.current);

    // Which of those the row is at now.
    const from = moved.find((item) => item.contains(row)) ?? row;
    let next = from.nextElementSibling;
    while (next && !stays(next)) next = next.nextElementSibling;
    let previous = from.previousElementSibling;
    while (previous && !stays(previous)) {
      previous = previous.previousElementSibling;
    }
    const around = parentOf(from);
    const now: Place | null = rowOf(next)
      ? { row: next as HTMLElement, position: "before" }
      : rowOf(previous)
        ? { row: previous as HTMLElement, position: "after" }
        : around
          ? { row: around, position: "inside" }
          : null;
    if (!now) return;

    let index = places.findIndex(
      (place) => place.row === now.row && place.position === now.position,
    );
    for (index += by; index >= 0 && index < places.length; index += by) {
      const place = places[index];
      if (place && allowed(moved, place)) {
        drop(moved, place, row);
        return;
      }
    }
  }

  // The place a pointer is over. The top of a row is before it, the bottom
  // after it and the middle inside it, where each of those is allowed.
  function placeAt(moved: HTMLElement[], x: number, y: number) {
    const under = document.elementFromPoint(x, y);
    if (!under || !root.current?.contains(under)) return null;
    // Between two rows, or beside one that's set in, it's the nearest row.
    let face = under.closest<HTMLElement>(".nuv-tree__row");
    if (!face) {
      let least = Number.POSITIVE_INFINITY;
      for (const item of rows()) {
        const other = faceOf(item);
        if (!other) continue;
        const box = other.getBoundingClientRect();
        const away = Math.max(box.top - y, y - box.bottom, 0);
        if (away < least) {
          least = away;
          face = other;
        }
      }
    }
    const row = rowOf(face?.parentElement ?? null);
    if (!face || !row) return null;

    const box = face.getBoundingClientRect();
    const part = (y - box.top) / box.height;
    const before: Place = { row, position: "before" };
    const inside: Place = { row, position: "inside" };
    // Under an open row is above the first row inside it.
    const first = rowsIn(groupOf(row))[0];
    let after: Place = first
      ? { row: first, position: "before" }
      : { row, position: "after" };
    if (!first) {
      // Under the last row of an open row could be inside that row or
      // after it. Further out than the row starts means further out.
      const rtl = getComputedStyle(row).direction === "rtl";
      let last = row;
      for (;;) {
        const around = parentOf(last);
        const edge = faceOf(last)?.getBoundingClientRect();
        if (!around || !edge || last.nextElementSibling) break;
        if (rtl ? x <= edge.right : x >= edge.left) break;
        last = around;
      }
      after = { row: last, position: "after" };
    }
    const order =
      part < 0.25
        ? [before, inside]
        : part > 0.75
          ? [after, inside]
          : [inside, part < 0.5 ? before : after];
    return order.find((place) => allowed(moved, place)) ?? null;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLUListElement>) {
    onPointerDown?.(event);
    const tree = root.current;
    if (!movable || !tree || event.defaultPrevented) return;
    if (event.button !== 0 || !event.isPrimary || drag.current) return;
    const row = rowOf(
      (event.target as Element).closest(".nuv-tree__row")?.parentElement ??
        null,
    );
    if (!row || disabledRow(row)) return;

    const pointer = event.pointerId;
    const touch = event.pointerType === "touch";
    const start = { x: event.clientX, y: event.clientY };
    let point = start;
    // Empty until the press has become a drag.
    let moved: HTMLElement[] = [];
    let at: Place | null = null;
    let scroller: Element | null = null;
    let hold = 0;
    let opener = 0;
    let frame = 0;

    const mark = (next: Place | null) => {
      if (at?.row === next?.row && at?.position === next?.position) return;
      at?.row.removeAttribute("data-drop");
      window.clearTimeout(opener);
      at = next;
      if (!next) return;
      next.row.dataset.drop = next.position;
      // Held over a closed row, the drag opens it to get inside.
      if (
        next.position === "inside" &&
        next.row.getAttribute("aria-expanded") === "false"
      ) {
        opener = window.setTimeout(
          () => toggle(rowValue(next.row), true),
          openAfter,
        );
      }
    };

    const scroll = () => {
      frame = 0;
      if (!scroller) return;
      const page = scroller === document.scrollingElement;
      const box = page
        ? { top: 0, bottom: window.innerHeight }
        : scroller.getBoundingClientRect();
      const by =
        point.y < box.top + scrollEdge
          ? -scrollBy
          : point.y > box.bottom - scrollEdge
            ? scrollBy
            : 0;
      if (by === 0) return;
      const was = scroller.scrollTop;
      scroller.scrollTop += by;
      if (scroller.scrollTop === was) return;
      mark(placeAt(moved, point.x, point.y));
      frame = requestAnimationFrame(scroll);
    };

    const begin = () => {
      moved = moving(row);
      scroller = scrollerOf(tree);
      for (const item of moved) item.dataset.dragging = "";
      tree.dataset.dragging = "";
      if (drag.current) drag.current.active = true;
      mark(placeAt(moved, point.x, point.y));
    };

    const end = (done = false) => {
      window.clearTimeout(hold);
      window.clearTimeout(opener);
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key, true);
      drag.current = null;
      if (moved.length === 0) return;
      for (const item of moved) item.removeAttribute("data-dragging");
      tree.removeAttribute("data-dragging");
      const place = at;
      place?.row.removeAttribute("data-drop");
      // The press that ends a drag would open or select the row under it.
      quiet.current = true;
      window.setTimeout(() => {
        quiet.current = false;
      });
      if (done && place) drop(moved, place, row);
    };

    function move(next: PointerEvent) {
      if (next.pointerId !== pointer) return;
      point = { x: next.clientX, y: next.clientY };
      if (moved.length === 0) {
        const far = Math.hypot(point.x - start.x, point.y - start.y);
        // A finger that moves before the hold is up is scrolling.
        if (touch) {
          if (far > scrollAfter) end();
          return;
        }
        if (far < dragAfter) return;
        begin();
      } else mark(placeAt(moved, point.x, point.y));
      if (frame === 0) frame = requestAnimationFrame(scroll);
    }
    function up(next: PointerEvent) {
      if (next.pointerId === pointer) end(true);
    }
    function cancel(next: PointerEvent) {
      if (next.pointerId === pointer) end();
    }
    // Escape puts the rows back. It's caught before anything around the
    // tree hears it, so a dialog the tree is in stays open.
    function key(next: globalThis.KeyboardEvent) {
      if (next.key !== "Escape" || moved.length === 0) return;
      next.preventDefault();
      next.stopPropagation();
      end();
    }

    drag.current = { touch, active: false, end };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key, true);
    if (touch) hold = window.setTimeout(begin, holdFor);
  }

  // A finger that's dragging a row would scroll the page along with it.
  // Stopping that takes a listener that says it may, which React's aren't.
  useEffect(() => {
    const tree = root.current;
    if (!movable || !tree) return;
    const stay = (event: TouchEvent) => {
      if (drag.current?.active) event.preventDefault();
    };
    tree.addEventListener("touchmove", stay, { passive: false });
    return () => tree.removeEventListener("touchmove", stay);
  }, [movable]);

  // A tree taken away in the middle of a drag leaves nothing listening.
  useEffect(() => () => drag.current?.end(), []);

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const row = rowOf(event.target as Element);
    if (!row) return;

    const disabled = disabledRow(row);
    if (event.altKey) {
      const down = event.key === "ArrowDown";
      if (!movable || disabled || !(down || event.key === "ArrowUp")) return;
      step(row, down ? 1 : -1);
      event.preventDefault();
      return;
    }

    const all = rows();
    const index = all.indexOf(row);
    const branch = row.hasAttribute("aria-expanded");
    const open = row.getAttribute("aria-expanded") === "true";
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
        } else parentOf(row)?.focus();
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
      movable,
      press,
    }),
    [selectionMode, expanded, selected, active, movable, press],
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
        onPointerDown={handlePointerDown}
        onClickCapture={(event) => {
          onClickCapture?.(event);
          if (!quiet.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        onContextMenu={(event) => {
          onContextMenu?.(event);
          // A finger held down is picking a row up, not asking for a menu.
          if (drag.current?.touch) event.preventDefault();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          // Focus that leaves by itself isn't to be brought back.
          refocus.current = null;
        }}
        {...props}
      >
        {children}
      </ul>
      {movable ? (
        // Beside the tree and not in it: a tree holds rows and nothing else.
        <span ref={status} role="status" className="nuv-tree__status" />
      ) : null}
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
        aria-keyshortcuts={
          tree.movable && !disabled ? "Alt+ArrowUp Alt+ArrowDown" : undefined
        }
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

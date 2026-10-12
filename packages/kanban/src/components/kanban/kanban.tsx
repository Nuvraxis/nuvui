"use client";

import {
  type Announcements,
  type CollisionDetection,
  closestCenter,
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type DroppableContainer,
  getFirstCollision,
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  type Over,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type MutableRefObject,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

/** One column: what it's known by, and its cards from first to last. */
export interface KanbanColumnData {
  id: string;
  cards: string[];
}

/** Where a card is: the column and how far down it, counted from 0. */
export interface KanbanPlace {
  column: string;
  index: number;
}

/** One card moved from one place to another. */
export interface KanbanMove {
  card: string;
  from: KanbanPlace;
  to: KanbanPlace;
}

/** A place as it's said: the column's name and a position counted from 1. */
export interface KanbanSpokenPlace {
  column: string;
  position: number;
  total: number;
}

/**
 * Everything that's said and not drawn. Each has an English default, and
 * each is a whole sentence, since a card's name and its place go together
 * differently in each language.
 */
export interface KanbanLabels {
  /** The name of a card's handle. */
  move?: (card: string) => string;
  /** What kind of thing the handle is, read after its name. */
  roleDescription?: string;
  /** How to move a card with the keyboard, read with the handle. */
  instructions?: string;
  /** Said when a card is picked up, with where it is. */
  picked?: (card: string, place: KanbanSpokenPlace | null) => string;
  /** Said at each place a carried card comes to. */
  over?: (card: string, place: KanbanSpokenPlace) => string;
  /** Said when it's dropped, with where it now is. */
  dropped?: (card: string, place: KanbanSpokenPlace | null) => string;
  /** Said when it's put back with Escape. */
  cancelled?: (card: string) => string;
}

const at = (place: KanbanSpokenPlace) =>
  `position ${place.position} of ${place.total} in ${place.column}`;

const english: Required<KanbanLabels> = {
  move: (card) => `Move ${card}`,
  roleDescription: "sortable",
  instructions:
    "To pick up a card, press Space or Enter. While it is picked up, use the arrow keys to move it. Press Space or Enter again to drop it in its new place, or press Escape to cancel.",
  picked: (card, place) =>
    place ? `Picked up ${card}. It is at ${at(place)}.` : `Picked up ${card}.`,
  over: (card, place) => `${card} is at ${at(place)}.`,
  dropped: (card, place) =>
    place ? `${card} was dropped at ${at(place)}.` : `${card} was dropped.`,
  cancelled: (card) => `Moving ${card} was cancelled.`,
};

// A column's own droppable is known by its id behind this, so that a card
// and a column with the same id are still two things.
const columnKey = (id: string) => `nuv-kanban-column:${id}`;

interface CardEntry {
  label: string;
  children: ReactNode;
}

interface KanbanContextValue {
  shown: KanbanColumnData[];
  disabled: boolean;
  calm: boolean;
  active: string | null;
  labels: Required<KanbanLabels>;
  cards: MutableRefObject<Map<string, CardEntry>>;
  columns: MutableRefObject<Map<string, string>>;
}

const KanbanContext = createContext<KanbanContextValue | null>(null);
const ColumnContext = createContext<string | null>(null);

function useKanban(part: string) {
  const context = useContext(KanbanContext);
  if (!context) throw new Error(`${part} has to be inside a Kanban.`);
  return context;
}

function useColumn(part: string) {
  const column = useContext(ColumnContext);
  if (column === null) {
    throw new Error(`${part} has to be inside a KanbanColumn.`);
  }
  return column;
}

const columnOf = (columns: KanbanColumnData[], card: string) =>
  columns.find((column) => column.cards.includes(card));

const placeOf = (
  columns: KanbanColumnData[],
  card: string,
): KanbanPlace | null => {
  const column = columnOf(columns, card);
  return column
    ? { column: column.id, index: column.cards.indexOf(card) }
    : null;
};

// What a droppable was made with: a card's or a column's.
interface DropData {
  type: "card" | "column";
  column: string;
  count?: number;
  sortable?: { index: number; items: unknown[] };
}

const dataOf = (over: { data: { current?: unknown } }) =>
  over.data.current as DropData | undefined;

const arrows = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];

// Which droppable an arrow key takes a picked-up card to. Up and down
// stay in the column the card is in. Left and right go to the next column
// that way and no further, to whatever in it is nearest. A column that
// has cards is passed over, since its cards are the places in it. One
// with none is a place itself.
const coordinates: KeyboardCoordinateGetter = (
  event,
  { context: { active, droppableRects, droppableContainers, collisionRect } },
) => {
  if (!arrows.includes(event.code)) return undefined;
  event.preventDefault();
  if (!active || !collisionRect) return undefined;

  const end = collisionRect.left + collisionRect.width;
  const sideways = event.code === "ArrowLeft" || event.code === "ArrowRight";
  let that: DroppableContainer[] = [];
  // How far away the nearest column that way is, and which it is.
  let gap = Number.POSITIVE_INFINITY;
  let next: string | undefined;

  for (const entry of droppableContainers.getEnabled()) {
    if (!entry || entry.disabled) continue;
    const rect = droppableRects.get(entry.id);
    const data = dataOf(entry);
    if (!rect || !data) continue;
    if (data.type === "column" && (data.count ?? 0) > 0) continue;

    if (sideways) {
      const away =
        event.code === "ArrowLeft"
          ? collisionRect.left - (rect.left + rect.width)
          : rect.left - end;
      // Half a card's width of overlap is still the next column: a card
      // that's carried isn't always squarely in its own.
      if (away < -collisionRect.width / 2) continue;
      if (away < gap - 1) {
        gap = away;
        next = data.column;
      }
      that.push(entry);
    } else if (
      rect.left < end &&
      rect.left + rect.width > collisionRect.left &&
      (event.code === "ArrowDown"
        ? collisionRect.top < rect.top
        : collisionRect.top > rect.top)
    ) {
      that.push(entry);
    }
  }
  if (sideways) {
    that = that.filter((entry) => dataOf(entry)?.column === next);
  }

  const nearest = getFirstCollision(
    closestCorners({
      active,
      collisionRect,
      droppableRects,
      droppableContainers: that,
      pointerCoordinates: null,
    }),
    "id",
  );
  if (nearest == null) return undefined;
  const rect = droppableContainers.get(nearest)?.rect.current;
  return rect ? { x: rect.left, y: rect.top } : undefined;
};

// Measured all through a drag: a card that goes to another column changes
// the size of both.
const measuring = { droppable: { strategy: MeasuringStrategy.Always } };

function useCalm() {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setCalm(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);
  return calm;
}

function Grip() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <circle cx="6" cy="3.5" r="1.25" />
      <circle cx="10" cy="3.5" r="1.25" />
      <circle cx="6" cy="8" r="1.25" />
      <circle cx="10" cy="8" r="1.25" />
      <circle cx="6" cy="12.5" r="1.25" />
      <circle cx="10" cy="12.5" r="1.25" />
    </svg>
  );
}

export interface KanbanOwnProps {
  /**
   * The columns and the order of the cards in each, when you keep them.
   * Use it with `onValueChange`. A move you don't take is undone.
   */
  value?: KanbanColumnData[];
  /** The columns to begin with, when they're kept here. */
  defaultValue?: KanbanColumnData[];
  /**
   * Called once when a card is dropped somewhere new, with the columns as
   * they are now and the move that was made. Not called while a card is
   * still being carried.
   */
  onValueChange?: (value: KanbanColumnData[], move: KanbanMove) => void;
  /**
   * Draws the board. It's given the columns to draw, which while a card
   * is carried are not yet the ones in `value`.
   */
  children: (columns: KanbanColumnData[]) => ReactNode;
  /**
   * No card can be moved.
   * @default false
   */
  disabled?: boolean;
  /** What's said and not drawn, for another language. */
  labels?: KanbanLabels;
}

export interface KanbanProps
  extends KanbanOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof KanbanOwnProps> {}

/**
 * A board of columns with cards that are moved between and within them:
 * with a mouse by dragging a card, on a touch screen by holding a card
 * and then dragging, and with the keyboard from a card's handle. Each
 * move is read out. Name it with `aria-label`.
 */
export const Kanban = forwardRef<HTMLDivElement, KanbanProps>(function Kanban(
  {
    value,
    defaultValue,
    onValueChange,
    children,
    disabled = false,
    labels: given,
    className,
    ...props
  },
  ref,
) {
  const id = useId();
  const calm = useCalm();
  const labels = useMemo(() => ({ ...english, ...given }), [given]);
  const [own, setOwn] = useState(defaultValue ?? []);
  const kept = value ?? own;
  // The columns while a card is carried. It has changed column here
  // before it's dropped, and nobody is told until it is.
  const [draft, setDraft] = useState<KanbanColumnData[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const shown = draft ?? kept;

  const cards = useRef(new Map<string, CardEntry>());
  const columns = useRef(new Map<string, string>());
  const before = useRef<KanbanColumnData[]>(kept);
  const latest = useRef({ shown, kept, value, onValueChange });
  latest.current = { shown, kept, value, onValueChange };

  // The last thing a card was over, and whether it has just changed
  // column. Just after it has, the layout under the pointer is new and
  // nothing may be found there for a frame. Without these the card would
  // go back and forth between two columns.
  const lastOver = useRef<string | number | null>(null);
  const justMoved = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: run again when the columns change, which is what it waits out
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      justMoved.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [shown]);

  const collisions = useCallback<CollisionDetection>(
    (args) => {
      // Under the pointer when there is one. The keyboard has none, and
      // goes by what the card overlaps.
      const under = pointerWithin(args);
      const found = under.length > 0 ? under : rectIntersection(args);
      let over = getFirstCollision(found, "id");

      if (over != null) {
        const column = args.droppableContainers.find(
          (entry) => entry.id === over,
        );
        const data = column ? dataOf(column) : undefined;
        if (data?.type === "column") {
          // Over a column that has cards: the nearest of its cards.
          const inside = shown.find((other) => other.id === data.column);
          if (inside && inside.cards.length > 0) {
            over =
              closestCenter({
                ...args,
                droppableContainers: args.droppableContainers.filter(
                  (entry) =>
                    entry.id !== over &&
                    inside.cards.includes(String(entry.id)),
                ),
              })[0]?.id ?? over;
          }
        }
        lastOver.current = over;
        return [{ id: over }];
      }

      if (justMoved.current) lastOver.current = active;
      return lastOver.current == null ? [] : [{ id: lastOver.current }];
    },
    [active, shown],
  );

  const sensors = useSensors(
    // A press that moves 8 pixels is a drag. Less is a click on what's
    // in the card.
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // A finger held still for a quarter of a second picks a card up.
    // Moved sooner, it scrolls the board.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: coordinates }),
  );

  function start({ active: card }: DragStartEvent) {
    before.current = latest.current.kept;
    lastOver.current = null;
    setDraft(latest.current.kept);
    setActive(String(card.id));
  }

  // A card over another column goes into it at once, so that the cards
  // there make room for it.
  function over({ active: card, over: target }: DragOverEvent) {
    const data = target ? dataOf(target) : undefined;
    if (!target || !data) return;
    const moved = String(card.id);

    setDraft((now) => {
      const from = now ? columnOf(now, moved) : undefined;
      const to = now?.find((column) => column.id === data.column);
      if (!now || !from || !to || from === to) return now;

      let index = to.cards.length;
      if (data.type === "card") {
        const under = to.cards.indexOf(String(target.id));
        const top = card.rect.current.translated?.top;
        const below =
          top !== undefined && top > target.rect.top + target.rect.height;
        if (under >= 0) index = under + (below ? 1 : 0);
      }

      justMoved.current = true;
      return now.map((column) => {
        if (column === from) {
          return {
            ...column,
            cards: column.cards.filter((other) => other !== moved),
          };
        }
        if (column === to) {
          return {
            ...column,
            cards: [
              ...column.cards.slice(0, index),
              moved,
              ...column.cards.slice(index),
            ],
          };
        }
        return column;
      });
    });
  }

  function end({ active: card, over: target }: DragEndEvent) {
    const moved = String(card.id);
    const now = latest.current;
    let next = now.shown;

    // By now it's in the column it's over. What's left is its place there.
    const column = columnOf(next, moved);
    const data = target ? dataOf(target) : undefined;
    if (column && target && data?.type === "card") {
      const from = column.cards.indexOf(moved);
      const to = column.cards.indexOf(String(target.id));
      if (to >= 0 && from !== to) {
        next = next.map((other) =>
          other === column
            ? { ...other, cards: arrayMove(other.cards, from, to) }
            : other,
        );
      }
    }

    setDraft(null);
    setActive(null);

    const from = placeOf(before.current, moved);
    const to = placeOf(next, moved);
    if (!from || !to) return;
    if (from.column === to.column && from.index === to.index) return;
    if (now.value === undefined) setOwn(next);
    now.onValueChange?.(next, { card: moved, from, to });
  }

  function cancel() {
    setDraft(null);
    setActive(null);
  }

  const announcements = useMemo<Announcements>(() => {
    const name = (card: string | number) =>
      cards.current.get(String(card))?.label ?? String(card);

    // Where the card would be if it were dropped now.
    const spoken = (
      card: string | number,
      target: Over | null,
    ): KanbanSpokenPlace | null => {
      const data = target ? dataOf(target) : undefined;
      if (!target || !data) return null;
      const column = columns.current.get(data.column) ?? data.column;

      if (data.type === "card" && data.sortable) {
        const there = data.sortable.items.includes(card);
        return {
          column,
          position: data.sortable.index + 1,
          total: data.sortable.items.length + (there ? 0 : 1),
        };
      }
      const here = columnOf(latest.current.shown, String(card));
      const total = (data.count ?? 0) + (here?.id === data.column ? 0 : 1);
      return { column, position: total, total };
    };

    return {
      onDragStart({ active: card }) {
        const place = placeOf(latest.current.kept, String(card.id));
        const column = place
          ? latest.current.kept.find((other) => other.id === place.column)
          : undefined;
        return labels.picked(
          name(card.id),
          place && column
            ? {
                column: columns.current.get(column.id) ?? column.id,
                position: place.index + 1,
                total: column.cards.length,
              }
            : null,
        );
      },
      onDragOver({ active: card, over: target }) {
        const place = spoken(card.id, target);
        return place ? labels.over(name(card.id), place) : undefined;
      },
      onDragEnd({ active: card, over: target }) {
        return labels.dropped(name(card.id), spoken(card.id, target));
      },
      onDragCancel({ active: card }) {
        return labels.cancelled(name(card.id));
      },
    };
  }, [labels]);

  const accessibility = useMemo(
    () => ({
      announcements,
      screenReaderInstructions: { draggable: labels.instructions },
    }),
    [announcements, labels.instructions],
  );

  const context = useMemo(
    () => ({ shown, disabled, calm, active, labels, cards, columns }),
    [shown, disabled, calm, active, labels],
  );
  const carried = active === null ? undefined : cards.current.get(active);

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would draw a frame of its own, and holds no form
    <div
      ref={ref}
      role="group"
      data-dragging={active === null ? undefined : ""}
      data-disabled={disabled ? "" : undefined}
      className={cx("nuv-kanban", className)}
      {...props}
    >
      <KanbanContext.Provider value={context}>
        <DndContext
          // Its ids for what describes a handle are counted from 0 on the
          // server and again in the browser. Given one, they're the same.
          id={id}
          sensors={sensors}
          collisionDetection={collisions}
          measuring={measuring}
          accessibility={accessibility}
          onDragStart={start}
          onDragOver={over}
          onDragEnd={end}
          onDragCancel={cancel}
        >
          {children(shown)}
          {/* What follows the pointer. The card itself stays in its column,
              faded, to show where it would land. */}
          <DragOverlay dropAnimation={calm ? null : undefined}>
            {carried ? (
              <div
                aria-hidden="true"
                className="nuv-kanban__card"
                data-overlay=""
              >
                <span className="nuv-kanban__handle">
                  <Grip />
                </span>
                <div className="nuv-kanban__card-content">
                  {carried.children}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </KanbanContext.Provider>
    </div>
  );
});

export interface KanbanColumnOwnProps {
  /** What the column is known by: its `id` in the board's `value`. */
  value: string;
  /**
   * The column's name in words: "To do". It names the column to a screen
   * reader and is said when a card is moved into it.
   */
  label: string;
}

export interface KanbanColumnProps
  extends KanbanColumnOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof KanbanColumnOwnProps> {}

/** One column: a header, its cards, and anything else, such as a button to add one. */
export const KanbanColumn = forwardRef<HTMLDivElement, KanbanColumnProps>(
  function KanbanColumn({ value, label, className, ...props }, ref) {
    const { columns } = useKanban("KanbanColumn");

    useEffect(() => {
      const names = columns.current;
      names.set(value, label);
      return () => {
        names.delete(value);
      };
    }, [columns, value, label]);

    return (
      <ColumnContext.Provider value={value}>
        {/* biome-ignore lint/a11y/useSemanticElements: a fieldset would draw a frame of its own, and holds no form */}
        <div
          ref={ref}
          role="group"
          aria-label={label}
          data-column={value}
          className={cx("nuv-kanban__column", className)}
          {...props}
        />
      </ColumnContext.Provider>
    );
  },
);

export interface KanbanColumnHeaderOwnProps {
  /** The column's title as it's drawn. */
  children: ReactNode;
  /** Shown after the title, most often how many cards there are. */
  count?: ReactNode;
  /** Buttons at the end of the header: add a card, a menu. */
  actions?: ReactNode;
}

export interface KanbanColumnHeaderProps
  extends KanbanColumnHeaderOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof KanbanColumnHeaderOwnProps> {}

/** The top of a column: its title, a count and buttons. */
export const KanbanColumnHeader = forwardRef<
  HTMLDivElement,
  KanbanColumnHeaderProps
>(function KanbanColumnHeader(
  { count, actions, className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cx("nuv-kanban__header", className)} {...props}>
      <span className="nuv-kanban__title">{children}</span>
      {count !== undefined && count !== null ? (
        <span className="nuv-kanban__count">{count}</span>
      ) : null}
      {actions ? <span className="nuv-kanban__actions">{actions}</span> : null}
    </div>
  );
});

export interface KanbanCardsOwnProps {
  /** Shown in place of the cards when the column has none. */
  empty?: ReactNode;
}

export interface KanbanCardsProps
  extends KanbanCardsOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof KanbanCardsOwnProps> {}

/**
 * A column's cards. It's the part a card is dropped on, so it's as tall
 * as the column allows, with no cards too.
 */
export const KanbanCards = forwardRef<HTMLDivElement, KanbanCardsProps>(
  function KanbanCards({ empty, className, children, ...props }, ref) {
    const { shown, disabled } = useKanban("KanbanCards");
    const column = useColumn("KanbanCards");
    const items = useMemo(
      () => shown.find((other) => other.id === column)?.cards ?? [],
      [shown, column],
    );
    const data = useMemo(
      () => ({ type: "column" as const, column, count: items.length }),
      [column, items.length],
    );
    const { setNodeRef, isOver } = useDroppable({
      id: columnKey(column),
      data,
      disabled,
    });
    const refs = useCallback(
      (node: HTMLDivElement | null) => {
        setNodeRef(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [setNodeRef, ref],
    );

    return (
      <div
        ref={refs}
        data-over={isOver ? "" : undefined}
        data-empty={items.length === 0 ? "" : undefined}
        className={cx("nuv-kanban__cards", className)}
        {...props}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ul className="nuv-kanban__list">{children}</ul>
        </SortableContext>
        {items.length === 0 && empty ? (
          <p className="nuv-kanban__empty">{empty}</p>
        ) : null}
      </div>
    );
  },
);

export interface KanbanCardOwnProps {
  /** What the card is known by in its column's `cards`. */
  value: string;
  /**
   * The card's name in words. It names the handle, "Move" and this, and
   * is said as the card is moved.
   */
  label: string;
  /**
   * This card can't be moved.
   * @default false
   */
  disabled?: boolean;
  /** For the handle, when you need it. */
  handleRef?: Ref<HTMLButtonElement>;
}

export interface KanbanCardProps
  extends KanbanCardOwnProps,
    Omit<LiHTMLAttributes<HTMLLIElement>, keyof KanbanCardOwnProps> {}

/**
 * One card. A mouse drags it from anywhere on it. The keyboard moves it
 * from its handle, the button at its start.
 */
export const KanbanCard = forwardRef<HTMLLIElement, KanbanCardProps>(
  function KanbanCard(
    {
      value,
      label,
      disabled: own = false,
      handleRef,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) {
    const { disabled: all, calm, labels, cards } = useKanban("KanbanCard");
    const column = useColumn("KanbanCard");
    const disabled = all || own;
    const data = useMemo(() => ({ type: "card" as const, column }), [column]);
    const attributes = useMemo(
      () => ({ roleDescription: labels.roleDescription }),
      [labels.roleDescription],
    );
    const sortable = useSortable({
      id: value,
      data,
      disabled,
      attributes,
      transition: calm ? null : undefined,
    });

    // What the board draws under the pointer while this is carried.
    useEffect(() => {
      const known = cards.current;
      known.set(value, { label, children });
      return () => {
        known.delete(value);
      };
    });

    const { setNodeRef, setActivatorNodeRef } = sortable;
    const refs = useCallback(
      (node: HTMLLIElement | null) => {
        setNodeRef(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [setNodeRef, ref],
    );
    const handleRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        setActivatorNodeRef(node);
        if (typeof handleRef === "function") handleRef(node);
        else if (handleRef) {
          (handleRef as MutableRefObject<HTMLButtonElement | null>).current =
            node;
        }
      },
      [setActivatorNodeRef, handleRef],
    );

    // The keys are the handle's. A press of the mouse or a finger is
    // taken anywhere on the card.
    const { onKeyDown, ...pointer } = sortable.listeners ?? {};
    const { transform } = sortable;

    return (
      <li
        ref={refs}
        data-card={value}
        data-dragging={sortable.isDragging ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={cx("nuv-kanban__card", className)}
        style={{
          ...style,
          transform: transform
            ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
            : style?.transform,
          transition: sortable.transition ?? style?.transition,
        }}
        {...props}
        {...pointer}
      >
        <button
          type="button"
          ref={handleRefs}
          className="nuv-kanban__handle"
          {...sortable.attributes}
          aria-label={labels.move(label)}
          disabled={disabled}
          onKeyDown={onKeyDown as never}
        >
          <Grip />
        </button>
        <div className="nuv-kanban__card-content">{children}</div>
      </li>
    );
  },
);

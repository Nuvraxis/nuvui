import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { canDrag, type DragMode, type Spot } from "../../core/edit";
import type { CalendarEvent, PlacedEvent } from "../../core/events";
import type { EventRules } from "../../core/resources";

/** How far a mouse moves before a press becomes a drag, in pixels. */
const slop = 4;
/** How far a finger may wander while it's held, before it's a scroll. */
const fingerSlop = 8;
/** How long a finger is held on an event to pick it up, in milliseconds. */
const hold = 500;

/** The spot on the calendar under a point, read from the cell there. */
export function spotAt(root: HTMLElement, x: number, y: number): Spot | null {
  // The point has to be in the cell's own box. An event that runs on into
  // the next hours is still inside the cell it starts in, which is given
  // as being under the point too.
  const inside = (element: HTMLElement) => {
    const box = element.getBoundingClientRect();
    return x >= box.left && x < box.right && y >= box.top && y < box.bottom;
  };
  const cell = document
    .elementsFromPoint(x, y)
    .find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        element.dataset.spotDay !== undefined &&
        root.contains(element) &&
        inside(element),
    );
  const day = cell?.dataset.spotDay;
  if (!cell || !day) return null;
  const hour = cell.dataset.spotHour;
  if (hour === undefined) return { day, minute: null };
  const box = cell.getBoundingClientRect();
  const into = Math.min(Math.max((y - box.top) / box.height, 0), 59 / 60);
  return { day, minute: Number(hour) * 60 + into * 60 };
}

export interface DragUpdate {
  mode: DragMode;
  placed: PlacedEvent | null;
  from: Spot;
  /** `null` while the pointer is outside the calendar. */
  to: Spot | null;
  clientX: number;
  clientY: number;
}

interface Session extends DragUpdate {
  pointerId: number;
  touch: boolean;
  started: boolean;
  startX: number;
  startY: number;
  timer: ReturnType<typeof setTimeout> | undefined;
}

export interface DragOptions {
  editable: boolean;
  creatable: boolean;
  find: (id: string) => PlacedEvent | undefined;
  /** What an event may do, with what it takes from its resources. */
  rules: (event: CalendarEvent) => EventRules;
  /** The spot under a point. */
  locate: (root: HTMLElement, x: number, y: number) => Spot | null;
  /** Scrolls the view when the pointer is near its edges. */
  scrollNear: (root: HTMLElement, x: number, y: number) => void;
  /** The drag has moved, or has started. */
  onMove: (update: DragUpdate) => void;
  /** Let go: `to` is where, or `null` outside the calendar. */
  onDrop: (update: DragUpdate) => void;
  /** Escape, or the browser took the pointer for a scroll. */
  onCancel: () => void;
}

// The click that follows letting go of a drag isn't a press of what's
// under the pointer.
function swallowClick(click: MouseEvent) {
  click.preventDefault();
  click.stopPropagation();
}

// Near the top or bottom of the time grid's hours, it scrolls to show more.
export function scrollTimeGrid(root: HTMLElement, _x: number, y: number) {
  const grid = root.querySelector<HTMLElement>(
    ".nuv-event-calendar__time-grid",
  );
  if (!grid) return;
  const top =
    grid.querySelector(".nuv-event-calendar__head")?.getBoundingClientRect()
      .bottom ?? grid.getBoundingClientRect().top;
  const bottom = grid.getBoundingClientRect().bottom;
  const edge = 32;
  if (y > top && y < top + edge) grid.scrollTop -= 12;
  else if (y < bottom && y > bottom - edge) grid.scrollTop += 12;
}

function dragger(
  root: RefObject<HTMLElement | null>,
  latest: { current: DragOptions },
) {
  let session: Session | null = null;

  function end() {
    if (session?.timer) clearTimeout(session.timer);
    session = null;
    root.current?.removeAttribute("data-dragging");
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
    window.removeEventListener("keydown", onEscape, true);
    window.removeEventListener("touchmove", holdStill);
  }

  function update(current: Session, x: number, y: number) {
    const node = root.current;
    if (!node) return;
    current.clientX = x;
    current.clientY = y;
    current.to = latest.current.locate(node, x, y);
    latest.current.scrollNear(node, x, y);
    latest.current.onMove({ ...current });
  }

  function start(current: Session) {
    current.started = true;
    root.current?.setAttribute("data-dragging", "");
    update(current, current.clientX, current.clientY);
  }

  function move(event: PointerEvent) {
    const current = session;
    if (!current || event.pointerId !== current.pointerId) return;
    if (!current.started) {
      const distance = Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      );
      if (current.touch) {
        if (distance > fingerSlop) end();
        return;
      }
      if (distance < slop) return;
      current.clientX = event.clientX;
      current.clientY = event.clientY;
      start(current);
      return;
    }
    event.preventDefault();
    update(current, event.clientX, event.clientY);
  }

  function up(event: PointerEvent) {
    const current = session;
    if (!current || event.pointerId !== current.pointerId) return;
    if (!current.started) {
      end();
      return;
    }
    update(current, event.clientX, event.clientY);
    window.addEventListener("click", swallowClick, true);
    setTimeout(() => window.removeEventListener("click", swallowClick, true));
    const done = { ...current };
    end();
    latest.current.onDrop(done);
  }

  function cancel() {
    const started = session?.started;
    end();
    if (started) latest.current.onCancel();
  }

  function onEscape(event: KeyboardEvent) {
    if (event.key !== "Escape" || !session?.started) return;
    event.preventDefault();
    event.stopPropagation();
    cancel();
  }

  // Once a finger has picked an event up, moving it drags and doesn't
  // scroll the page.
  function holdStill(event: TouchEvent) {
    if (session?.started) event.preventDefault();
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    const node = root.current;
    const { editable, creatable, find, rules, locate } = latest.current;
    if (!node || !editable || session) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as HTMLElement;
    const from = locate(node, event.clientX, event.clientY);
    if (!from) return;

    let mode: DragMode = "create";
    let placed: PlacedEvent | null = null;
    const element = target.closest<HTMLElement>(
      "[data-event-id]:not([data-preview])",
    );
    if (element) {
      // An event in a popover is in the calendar's React tree, not its page.
      if (!node.contains(element)) return;
      placed = find(element.dataset.eventId ?? "") ?? null;
      const handle =
        target.closest<HTMLElement>("[data-handle]")?.dataset.handle;
      mode = handle === "start" || handle === "end" ? handle : "move";
      if (!placed || !canDrag(rules(placed.event), editable, mode)) return;
    } else if (!creatable || target.closest("button, a, input")) {
      return;
    }

    const touch = event.pointerType === "touch";
    const current: Session = {
      mode,
      placed,
      from,
      to: from,
      pointerId: event.pointerId,
      touch,
      started: false,
      startX: event.clientX,
      startY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      timer: undefined,
    };
    session = current;
    if (touch) {
      current.timer = setTimeout(() => {
        if (session === current) start(current);
      }, hold);
      window.addEventListener("touchmove", holdStill, { passive: false });
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", onEscape, true);
  }

  return { onPointerDown, end };
}

/**
 * Dragging events and empty time with a pointer. A mouse drags once it has
 * moved a few pixels, so a click stays a click. A finger is held still on
 * an event first, so that a swipe still scrolls.
 */
export function useDrag(
  root: RefObject<HTMLElement | null>,
  options: DragOptions,
) {
  const latest = useRef(options);
  latest.current = options;
  const [drag] = useState(() => dragger(root, latest));
  useEffect(() => drag.end, [drag]);
  return drag.onPointerDown;
}

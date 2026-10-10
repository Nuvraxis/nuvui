"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type CSSProperties,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type PointerEvent,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import type { PartProps } from "../../utils/part-props";
import { useScrollRegion } from "../../utils/use-scroll-region";

export type SheetProps = DialogPrimitive.DialogProps;
export type SheetTriggerProps = DialogPrimitive.DialogTriggerProps;
export type SheetCloseProps = DialogPrimitive.DialogCloseProps;

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

type Side = "start" | "end" | "top" | "bottom";

// What SheetHandle needs from the sheet it's in.
interface SwipeContextValue {
  resizes: boolean;
  /** Goes to the next stop, or closes a sheet that has none. */
  next: () => void;
  /** Whether the press that's ending was a drag, and so isn't a press. */
  dragged: { current: boolean };
}

const SwipeContext = createContext<SwipeContextValue | null>(null);

interface Drag {
  id: number;
  x: number;
  y: number;
  /** 1 or -1: which way along the axis is towards the sheet's edge. */
  sign: number;
  /** How large the sheet was when the drag began, in pixels. */
  size: number;
  fromHandle: boolean;
  active: boolean;
  /** How far it's been dragged towards its edge, in pixels. */
  distance: number;
  /** In pixels a millisecond, towards its edge. */
  velocity: number;
  time: number;
}

// A drag has to go this far before it's a drag and not a press.
const slop = 6;
// A flick counts for as far as it would go in this many milliseconds.
const throwFor = 150;

const controls =
  'button, a[href], input, select, textarea, label, [role="slider"], [contenteditable=""], [contenteditable="true"]';

// Whether something between the touch and the sheet scrolls along the way
// the sheet is dragged. A finger there is scrolling it.
//
// Up and down, anything that can scroll counts, whether it has enough in
// it to scroll or not: the browser takes a finger's up and down there
// before a script hears of it. Sideways it has to have something to
// scroll to, because an element that scrolls one way is reported as able
// to scroll the other.
function inScroller(target: Element, sheet: Element, vertical: boolean) {
  for (
    let element: Element | null = target;
    element && element !== sheet;
    element = element.parentElement
  ) {
    const style = getComputedStyle(element);
    const overflow = vertical ? style.overflowY : style.overflowX;
    if (overflow !== "auto" && overflow !== "scroll") continue;
    if (vertical || element.scrollWidth > element.clientWidth) return true;
  }
  return false;
}

const lessMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface SheetContentOwnProps {
  /**
   * The edge of the screen the sheet is attached to. `"start"` is the left
   * edge in a left-to-right layout and the right edge in a right-to-left
   * one, and `"end"` is the other.
   * @default "end"
   */
  side?: Side;
  /**
   * How wide a sheet on the start or end edge is. It's never wider than the
   * screen. A sheet on the top or bottom edge is as wide as the screen and
   * as tall as its content, whatever the size.
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to render the close button in the corner. If you turn it off,
   * give people another visible way to close the sheet.
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Accessible name of the close button. Translate it with the rest of your
   * interface.
   * @default "Close"
   */
  closeLabel?: string;
  /**
   * Lets a finger drag the sheet towards its edge, and closes it when it's
   * let go of past halfway or flicked. A drag starts anywhere but on a
   * control or in the part that scrolls, and a `SheetHandle` can be
   * dragged with a mouse as well. On by default when there are `stops`.
   * @default false
   */
  swipe?: boolean;
  /**
   * Sizes the sheet stops at, each a share of the screen from 0 to 1:
   * `[0.4, 0.9]` is 40% and 90% of its height for a sheet on the top or
   * bottom edge, and of its width for one on the start or end edge. A drag
   * that's let go of settles on the nearest one, and one that ends well
   * under the smallest closes the sheet.
   */
  stops?: number[];
  /** The stop the sheet is at, when you control it. One of `stops`. */
  stop?: number;
  /**
   * The stop the sheet opens at, when you don't control it. The smallest
   * unless you say otherwise.
   */
  defaultStop?: number;
  /** Called with the stop the sheet has settled on. */
  onStopChange?: (stop: number) => void;
  /**
   * The element the sheet is rendered into. Set this when the sheet should
   * pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: DialogPrimitive.DialogPortalProps["container"];
}

export interface SheetContentProps
  extends SheetContentOwnProps,
    PartProps<typeof DialogPrimitive.Content> {}

export const SheetContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(function SheetContent(
  {
    side = "end",
    size = "md",
    showCloseButton = true,
    closeLabel = "Close",
    swipe,
    stops,
    stop: stopProp,
    defaultStop,
    onStopChange,
    container,
    className,
    style,
    children,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    ...props
  },
  ref,
) {
  const sheet = useRef<HTMLDivElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const drag = useRef<Drag | null>(null);
  const dragged = useRef(false);

  // Smallest first, whatever order they were written in. A new array of
  // the same numbers, as one written in JSX is on every render, is the
  // same stops.
  const key = stops?.join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: the numbers are what it depends on, not the array that holds them
  const sizes = useMemo(
    () => (stops ? [...stops].sort((a, b) => a - b) : undefined),
    [key],
  );
  const [ownStop, setOwnStop] = useState(defaultStop);
  const stop = sizes ? (stopProp ?? ownStop ?? sizes[0]) : undefined;
  const changeStop = (next: number) => {
    if (next === stop) return;
    setOwnStop(next);
    onStopChange?.(next);
  };

  const swipeable = swipe ?? sizes !== undefined;
  const vertical = side === "top" || side === "bottom";
  const dimension = vertical ? "blockSize" : "inlineSize";
  const screen = () => (vertical ? window.innerHeight : window.innerWidth);

  // Radix keeps whether the sheet is open, and gives no way to change it
  // from here but its own close button.
  const close = () => closer.current?.click();

  const next = () => {
    if (!sizes || stop === undefined) return close();
    changeStop(sizes[(sizes.indexOf(stop) + 1) % sizes.length] ?? stop);
  };
  const context = useMemo<SwipeContextValue>(
    () => ({
      resizes: sizes !== undefined,
      next: () => nextRef.current(),
      dragged,
    }),
    [sizes],
  );
  const nextRef = useRef(next);
  nextRef.current = next;

  // Takes off what a drag wrote on the element, once the stylesheet's own
  // size has caught up with it.
  const settle = (element: HTMLElement) => {
    const done = () => {
      element.removeEventListener("transitionend", done);
      clearTimeout(timer);
      element.style.removeProperty("transition");
      element.style.removeProperty("transform");
      element.style[dimension] = "";
    };
    // The transition may not run: there's less motion, or nothing to move.
    const timer = setTimeout(done, lessMotion() ? 0 : 400);
    element.addEventListener("transitionend", done);
  };

  const begin = (event: PointerEvent<HTMLDivElement>) => {
    const element = sheet.current;
    if (!swipeable || !element || event.button !== 0) return;
    const target = event.target as Element;
    const fromHandle = target.closest(".nuv-sheet__handle") !== null;
    if (!fromHandle) {
      // A mouse drags text to select it. A finger drags the sheet.
      if (event.pointerType === "mouse") return;
      if (target.closest(controls)) return;
      if (inScroller(target, element, vertical)) return;
    }
    const rtl = getComputedStyle(element).direction === "rtl";
    const box = element.getBoundingClientRect();
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      sign:
        side === "bottom"
          ? 1
          : side === "top"
            ? -1
            : (side === "end") === rtl
              ? -1
              : 1,
      size: vertical ? box.height : box.width,
      fromHandle,
      active: false,
      distance: 0,
      velocity: 0,
      time: event.timeStamp,
    };
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const element = sheet.current;
    if (!state || !element || event.pointerId !== state.id) return;
    const along = vertical ? event.clientY - state.y : event.clientX - state.x;
    const across = vertical ? event.clientX - state.x : event.clientY - state.y;
    const distance = along * state.sign;

    if (!state.active) {
      if (Math.abs(distance) < slop) return;
      // Mostly sideways to the sheet's way out: not a drag of the sheet.
      if (Math.abs(across) > Math.abs(distance)) {
        drag.current = null;
        return;
      }
      state.active = true;
      element.style.transition = "none";
      element.setAttribute("data-dragging", "");
      // So the drag goes on when the pointer leaves the sheet. A pointer
      // that a script made up has nothing to capture.
      try {
        element.setPointerCapture(event.pointerId);
      } catch {}
    }

    const elapsed = event.timeStamp - state.time;
    if (elapsed > 0) {
      state.velocity = (distance - state.distance) / elapsed;
      state.time = event.timeStamp;
    }
    state.distance = distance;

    if (sizes) {
      // A sheet with stops changes size under the finger, so what's at its
      // far end stays in view.
      const most = (sizes[sizes.length - 1] ?? 1) * screen();
      const size = Math.min(most, Math.max(0, state.size - distance));
      element.style[dimension] = `${size}px`;
    } else {
      // It follows the finger towards its edge, and not the other way.
      const offset = Math.max(0, distance) * state.sign;
      element.style.transform = vertical
        ? `translateY(${offset}px)`
        : `translateX(${offset}px)`;
    }
  };

  const end = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const state = drag.current;
    const element = sheet.current;
    if (!state || !element || event.pointerId !== state.id) return;
    drag.current = null;
    if (!state.active) return;
    // The click that follows a drag of the handle isn't a press of it.
    dragged.current = state.fromHandle;
    element.removeAttribute("data-dragging");
    try {
      element.releasePointerCapture(event.pointerId);
    } catch {}

    const thrown = cancelled ? 0 : state.distance + state.velocity * throwFor;
    // Back under the stylesheet, so the way out and the way back are drawn.
    element.style.removeProperty("transition");

    if (sizes) {
      const wanted = state.size - thrown;
      const least = (sizes[0] ?? 1) * screen();
      if (!cancelled && wanted < least / 2) {
        close();
        // Still open a moment later: the close was refused.
        requestAnimationFrame(() => {
          if (element.dataset.state === "open") settle(element);
        });
        return;
      }
      const nearest = sizes.reduce((best, size) =>
        Math.abs(size * screen() - wanted) < Math.abs(best * screen() - wanted)
          ? size
          : best,
      );
      element.style[dimension] = `${nearest * screen()}px`;
      changeStop(nearest);
      settle(element);
      return;
    }

    if (!cancelled && thrown > state.size / 2) {
      close();
      requestAnimationFrame(() => {
        if (element.dataset.state === "open") {
          element.style.transition =
            "transform var(--nuv-duration-base) var(--ease-out)";
          element.style.transform = "";
          settle(element);
        }
      });
      return;
    }
    if (!lessMotion()) {
      element.style.transition =
        "transform var(--nuv-duration-base) var(--ease-out)";
    }
    element.style.transform = "";
    settle(element);
  };

  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay className="nuv-sheet__overlay" />
      <DialogPrimitive.Content
        ref={useComposedRefs(ref, sheet)}
        className={cx(
          "nuv-sheet",
          `nuv-sheet--${side}`,
          `nuv-sheet--${size}`,
          swipeable && "nuv-sheet--swipe",
          sizes && "nuv-sheet--stops",
          className,
        )}
        style={
          stop === undefined
            ? style
            : ({ ...style, "--nuv-sheet-stop": stop } as CSSProperties)
        }
        onPointerDown={(event) => {
          onPointerDown?.(event);
          begin(event);
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          move(event);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          end(event, false);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          end(event, true);
        }}
        {...props}
      >
        <SwipeContext.Provider value={context}>
          {children}
        </SwipeContext.Provider>
        {showCloseButton ? (
          <DialogPrimitive.Close
            ref={closer}
            className="nuv-sheet__close"
            aria-label={closeLabel}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M3.5 3.5l9 9m0-9l-9 9" />
            </svg>
          </DialogPrimitive.Close>
        ) : (
          // What a swipe and a handle press to close the sheet, when
          // there's no close button to press. Nobody else can reach it.
          <DialogPrimitive.Close ref={closer} hidden tabIndex={-1} />
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export interface SheetHandleOwnProps {
  /**
   * Accessible name of the handle, which says what pressing it does.
   * Translate it with the rest of your interface.
   * @default "Change size", or "Dismiss" in a sheet with no stops
   */
  label?: string;
}

export interface SheetHandleProps
  extends SheetHandleOwnProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SheetHandleOwnProps> {}

/**
 * The bar at the edge of a sheet that says it can be dragged. It can be
 * dragged with a mouse as well as a finger. Pressing it goes to the sheet's
 * next stop, or closes a sheet that has none, which is how the keyboard
 * and a screen reader do what a drag does.
 */
export const SheetHandle = forwardRef<HTMLButtonElement, SheetHandleProps>(
  function SheetHandle({ label, className, onClick, ...props }, ref) {
    const swipe = useContext(SwipeContext);
    if (!swipe) throw new Error("SheetHandle has to be inside a SheetContent.");
    return (
      <button
        ref={ref}
        type="button"
        className={cx("nuv-sheet__handle", className)}
        // Not "Close": the sheet's own close button has that name.
        aria-label={label ?? (swipe.resizes ? "Change size" : "Dismiss")}
        onClick={(event) => {
          onClick?.(event);
          if (swipe.dragged.current) swipe.dragged.current = false;
          else swipe.next();
        }}
        {...props}
      />
    );
  },
);

export type SheetTitleProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Title
>;

export const SheetTitle = forwardRef<
  ComponentRef<typeof DialogPrimitive.Title>,
  SheetTitleProps
>(function SheetTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cx("nuv-sheet__title", className)}
      {...props}
    />
  );
});

export type SheetDescriptionProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Description
>;

export const SheetDescription = forwardRef<
  ComponentRef<typeof DialogPrimitive.Description>,
  SheetDescriptionProps
>(function SheetDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cx("nuv-sheet__description", className)}
      {...props}
    />
  );
});

export type SheetHeaderProps = HTMLAttributes<HTMLDivElement>;

export const SheetHeader = forwardRef<HTMLDivElement, SheetHeaderProps>(
  function SheetHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-sheet__header", className)}
        {...props}
      />
    );
  },
);

export type SheetBodyProps = HTMLAttributes<HTMLDivElement>;

export const SheetBody = forwardRef<HTMLDivElement, SheetBodyProps>(
  function SheetBody({ className, ...props }, ref) {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    const scrollRegion = useScrollRegion(element);

    return (
      <div
        ref={useComposedRefs(ref, setElement)}
        className={cx("nuv-sheet__body", className)}
        {...scrollRegion}
        {...props}
      />
    );
  },
);

export type SheetFooterProps = HTMLAttributes<HTMLDivElement>;

export const SheetFooter = forwardRef<HTMLDivElement, SheetFooterProps>(
  function SheetFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-sheet__footer", className)}
        {...props}
      />
    );
  },
);

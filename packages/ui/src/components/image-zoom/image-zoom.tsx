"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

export interface ImageZoomOwnProps {
  /** The picture, such as an `img` with its own `alt`. */
  children: ReactNode;
  /**
   * How many times larger the picture is drawn when it's zoomed in.
   * @default 2
   */
  scale?: number;
  /** Whether it's zoomed in, when you control it. */
  zoomed?: boolean;
  /**
   * Whether it's zoomed in at first, when you don't control it.
   * @default false
   */
  defaultZoomed?: boolean;
  /** Called with whether it's zoomed in, when that changes. */
  onZoomedChange?: (zoomed: boolean) => void;
  /**
   * Zooms in while a mouse is over the picture, and out when it leaves. A
   * click zooms in or out either way.
   * @default true
   */
  hover?: boolean;
  /**
   * How far one arrow key moves what's in view while it's zoomed in, as a
   * percentage of the picture.
   * @default 10
   */
  step?: number;
  /**
   * It doesn't zoom, and has no button.
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessible name of the button that zooms in and out. Translate it with
   * the rest of your interface.
   * @default "Zoom"
   */
  zoomLabel?: string;
}

export interface ImageZoomProps
  extends ImageZoomOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ImageZoomOwnProps> {}

const x = "--nuv-image-zoom-x";
const y = "--nuv-image-zoom-y";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

// A finger that moves less than this between pressing and letting go has
// tapped, not dragged.
const slop = 6;

function Magnifier({ zoomed }: { zoomed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="nuv-image-zoom__icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3M5 7h4" />
      {zoomed ? null : <path d="M7 5v4" />}
    </svg>
  );
}

/**
 * A picture that's drawn larger where it's pointed at. A mouse zooms in by
 * resting on it, or by a click, and what's in view follows the mouse. A tap
 * zooms in where the finger is, and a drag moves around the picture. The
 * button in its corner does the same from the keyboard.
 */
export const ImageZoom = forwardRef<HTMLDivElement, ImageZoomProps>(
  function ImageZoom(
    {
      children,
      scale = 2,
      zoomed: zoomedProp,
      defaultZoomed = false,
      onZoomedChange,
      hover = true,
      step = 10,
      disabled = false,
      zoomLabel = "Zoom",
      className,
      onClick,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onPointerEnter,
      onPointerLeave,
      ...props
    },
    ref,
  ) {
    const [ownZoomed, setOwnZoomed] = useState(defaultZoomed);
    const zoomed = !disabled && (zoomedProp ?? ownZoomed);
    const content = useRef<HTMLDivElement>(null);
    const button = useRef<HTMLButtonElement>(null);
    // Where the zoom is centred, as a percentage of the picture each way.
    // It goes straight to the element: nothing is drawn again by React as
    // the pointer moves.
    const origin = useRef({ x: 50, y: 50 });
    // A finger pressed on a zoomed picture, and where it started.
    const press = useRef<{
      id: number;
      x: number;
      y: number;
      origin: { x: number; y: number };
    } | null>(null);
    const dragged = useRef(false);
    // Zoomed out on purpose, by a click or a key, while a mouse is over
    // the picture. Resting there doesn't zoom it in again until the mouse
    // has left.
    const held = useRef(false);

    const change = (next: boolean) => {
      if (disabled || next === zoomed) return;
      setOwnZoomed(next);
      onZoomedChange?.(next);
    };

    const toggle = (next: boolean) => {
      held.current = !next;
      change(next);
    };

    const place = (next: { x: number; y: number }) => {
      origin.current = { x: clamp(next.x), y: clamp(next.y) };
      content.current?.style.setProperty(x, `${origin.current.x}%`);
      content.current?.style.setProperty(y, `${origin.current.y}%`);
    };

    const placeAt = (event: {
      clientX: number;
      clientY: number;
      currentTarget: Element;
    }) => {
      const box = event.currentTarget.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;
      place({
        x: ((event.clientX - box.left) / box.width) * 100,
        y: ((event.clientY - box.top) / box.height) * 100,
      });
    };

    const fromButton = (event: { target: EventTarget }) =>
      button.current !== null &&
      event.target instanceof Node &&
      button.current.contains(event.target);

    // Set through the CSSOM, not a style attribute, so a Content Security
    // Policy can't block it. Nothing is zoomed before the script runs.
    useLayoutEffect(() => {
      content.current?.style.setProperty("--nuv-image-zoom-scale", `${scale}`);
    }, [scale]);

    // A press on a picture would pick up a copy of it to drag, where
    // someone moving around a zoomed one meant nothing of the kind. The
    // stylesheet stops it where it can. This is for Firefox, which has no
    // such property.
    useLayoutEffect(() => {
      const element = content.current;
      if (!element) return;
      const stop = (event: DragEvent) => event.preventDefault();
      element.addEventListener("dragstart", stop);
      return () => element.removeEventListener("dragstart", stop);
    }, []);

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || fromButton(event)) return;
      if (dragged.current) {
        dragged.current = false;
        return;
      }
      if (!zoomed) placeAt(event);
      toggle(!zoomed);
    };

    // A mouse on its way to the button isn't asking to zoom: the click on
    // the button would only zoom out again.
    const rest = (event: PointerEvent<HTMLDivElement>) => {
      placeAt(event);
      if (hover && !held.current && !fromButton(event)) change(true);
    };

    const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event);
      if (event.pointerType !== "mouse" || disabled) return;
      held.current = false;
      rest(event);
    };

    const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event);
      if (event.pointerType !== "mouse") return;
      held.current = false;
      if (hover) change(false);
    };

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event);
      dragged.current = false;
      if (event.pointerType === "mouse" || !zoomed || fromButton(event)) {
        return;
      }
      press.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        origin: origin.current,
      };
      // The browser can't capture a pointer it didn't start, such as one
      // a test or a script made up.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
    };

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);
      if (disabled) return;
      if (event.pointerType === "mouse") {
        rest(event);
        return;
      }
      const start = press.current;
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!dragged.current && Math.hypot(dx, dy) < slop) return;
      dragged.current = true;
      const box = event.currentTarget.getBoundingClientRect();
      if (box.width === 0 || box.height === 0 || scale <= 1) return;
      // The picture moves with the finger. Moving the centre by some part
      // of the box moves the picture scale - 1 times as far the other way.
      place({
        x: start.origin.x - ((dx / box.width) * 100) / (scale - 1),
        y: start.origin.y - ((dy / box.height) * 100) / (scale - 1),
      });
    };

    const release = (event: PointerEvent<HTMLDivElement>) => {
      if (press.current?.id === event.pointerId) press.current = null;
    };

    // The arrows move what's in view the way they point, on a page that
    // reads either way: it's a picture, and left is left in it.
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!zoomed) return;
      const by: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const move = by[event.key];
      if (move) {
        event.preventDefault();
        place({
          x: origin.current.x + move[0],
          y: origin.current.y + move[1],
        });
      } else if (event.key === "Escape") {
        event.preventDefault();
        toggle(false);
      }
    };

    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: the button inside does the same from the keyboard. A click on the picture only adds where to zoom in.
      // biome-ignore lint/a11y/useKeyWithClickEvents: as above
      <div
        ref={ref}
        data-state={zoomed ? "zoomed" : "idle"}
        data-disabled={disabled ? "" : undefined}
        className={cx(
          "nuv-image-zoom",
          zoomed && "nuv-image-zoom--zoomed",
          disabled && "nuv-image-zoom--disabled",
          className,
        )}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          release(event);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          release(event);
        }}
        {...props}
      >
        <div ref={content} className="nuv-image-zoom__content">
          {children}
        </div>
        {disabled ? null : (
          <button
            ref={button}
            type="button"
            aria-label={zoomLabel}
            aria-pressed={zoomed}
            className="nuv-image-zoom__button"
            onClick={() => toggle(!zoomed)}
            onKeyDown={handleKeyDown}
          >
            <Magnifier zoomed={zoomed} />
          </button>
        )}
      </div>
    );
  },
);

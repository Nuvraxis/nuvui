"use client";

import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group";

export type CompareSide = "before" | "after";

export interface CompareOwnProps {
  /** What it looked like before, such as an `img` with its own `alt`. */
  before: ReactNode;
  /** What it looks like after. Both are drawn in the same box. */
  after: ReactNode;
  /**
   * `"slider"` shows both, split by a divider that's dragged by its
   * handle. `"toggle"` shows one at a time, with a switch under it.
   * @default "slider"
   */
  mode?: "slider" | "toggle";
  /**
   * Which way the divider moves. `"horizontal"` puts before at the start
   * of the line and after at the end. `"vertical"` puts before on top.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /**
   * How much of before shows, from 0 to 100, when you control it.
   * In `"slider"` mode only.
   */
  position?: number;
  /**
   * How much of before shows at first, when you don't control it.
   * @default 50
   */
  defaultPosition?: number;
  /** Called with the new position while the divider moves. */
  onPositionChange?: (position: number) => void;
  /**
   * How far one arrow key moves the divider. Page Up and Page Down move it
   * ten times as far.
   * @default 1
   */
  step?: number;
  /** Which one shows, when you control it. In `"toggle"` mode only. */
  shown?: CompareSide;
  /**
   * Which one shows at first, when you don't control it.
   * @default "before"
   */
  defaultShown?: CompareSide;
  /** Called with the one that was chosen. */
  onShownChange?: (shown: CompareSide) => void;
  /**
   * The name of before, on the picture and on its switch. Translate it
   * with the rest of your interface.
   * @default "Before"
   */
  beforeLabel?: string;
  /**
   * The name of after, on the picture and on its switch.
   * @default "After"
   */
  afterLabel?: string;
  /**
   * Shows the two names on the picture. The switch in `"toggle"` mode
   * shows them either way.
   * @default true
   */
  labels?: boolean;
  /**
   * Accessible name of the divider, which a screen reader reads as a
   * slider.
   * @default "Before and after"
   */
  dividerLabel?: string;
  /**
   * What a screen reader says the position is.
   * @default (position, before, after) => `${position}% ${before}, ${100 - position}% ${after}`
   */
  valueLabel?: (position: number, before: string, after: string) => string;
  /**
   * Accessible name of the switch in `"toggle"` mode.
   * @default "Show"
   */
  switchLabel?: string;
}

export interface CompareProps
  extends CompareOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof CompareOwnProps | "children"> {}

const defaultValueLabel = (position: number, before: string, after: string) =>
  `${position}% ${before}, ${100 - position}% ${after}`;

const clamp = (value: number) =>
  Math.round(Math.min(100, Math.max(0, value)) * 100) / 100;

function Arrows() {
  return (
    <svg
      aria-hidden="true"
      className="nuv-compare__icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2.5v11M5.5 5.5 3 8l2.5 2.5M10.5 5.5 13 8l-2.5 2.5" />
    </svg>
  );
}

/**
 * Two pictures of the same thing, before and after, in one box. A divider
 * shows part of each and is dragged by its handle, or a switch shows one at
 * a time. A drag anywhere else on the picture scrolls the page as usual.
 */
export const Compare = forwardRef<HTMLDivElement, CompareProps>(
  function Compare(
    {
      before,
      after,
      mode = "slider",
      orientation = "horizontal",
      position: positionProp,
      defaultPosition = 50,
      onPositionChange,
      step = 1,
      shown: shownProp,
      defaultShown = "before",
      onShownChange,
      beforeLabel = "Before",
      afterLabel = "After",
      labels = true,
      dividerLabel = "Before and after",
      valueLabel = defaultValueLabel,
      switchLabel = "Show",
      className,
      ...props
    },
    ref,
  ) {
    const [ownPosition, setOwnPosition] = useState(() =>
      clamp(defaultPosition),
    );
    const [ownShown, setOwnShown] = useState(defaultShown);
    const frame = useRef<HTMLDivElement>(null);
    const beforeLayer = useRef<HTMLDivElement>(null);
    const afterLayer = useRef<HTMLDivElement>(null);

    const shown = shownProp ?? ownShown;
    const slider = mode === "slider";
    // A switch shows the whole of one, which is a divider at one end.
    const position = slider
      ? clamp(positionProp ?? ownPosition)
      : shown === "before"
        ? 100
        : 0;
    const vertical = orientation === "vertical";

    const move = (next: number) => {
      const value = clamp(next);
      if (value === position) return;
      setOwnPosition(value);
      onPositionChange?.(value);
    };

    const choose = (next: CompareSide) => {
      setOwnShown(next);
      onShownChange?.(next);
    };

    // Read when it's used, not when it's drawn: the server can't know it,
    // and a page can change direction after it loads.
    const rtl = () =>
      frame.current !== null &&
      getComputedStyle(frame.current).direction === "rtl";

    const follow = (event: PointerEvent<HTMLDivElement>) => {
      const box = frame.current?.getBoundingClientRect();
      if (!box || box.width === 0 || box.height === 0) return;
      if (vertical) {
        move(((event.clientY - box.top) / box.height) * 100);
      } else if (rtl()) {
        move(((box.right - event.clientX) / box.width) * 100);
      } else {
        move(((event.clientX - box.left) / box.width) * 100);
      }
    };

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
      // The main button of a mouse, or any touch or pen.
      if (event.button !== 0) return;
      // The browser focuses the divider itself, without the ring it shows
      // for the keyboard. touch-action keeps a finger from scrolling.
      event.currentTarget.setPointerCapture(event.pointerId);
      follow(event);
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        follow(event);
      }
    };

    // The arrows along the divider's way move it where they point, so on a
    // right-to-left page the left arrow shows more of before. The other two
    // move it as a slider's do: up or right for more.
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      const forward = vertical ? 1 : rtl() ? -1 : 1;
      const by: Record<string, number> = vertical
        ? {
            ArrowDown: step,
            ArrowUp: -step,
            ArrowRight: step,
            ArrowLeft: -step,
          }
        : {
            ArrowRight: step * forward,
            ArrowLeft: -step * forward,
            ArrowUp: step,
            ArrowDown: -step,
          };
      let next: number;
      if (event.key in by) next = position + (by[event.key] ?? 0);
      else if (event.key === "PageUp") next = position + step * 10;
      else if (event.key === "PageDown") next = position - step * 10;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = 100;
      else return;
      event.preventDefault();
      move(next);
    };

    const hides = (side: CompareSide) => !slider && side !== shown;

    // The one a switch hides can't be reached with Tab either. Set on the
    // element, since React 18 and 19 don't agree on what the prop takes.
    useLayoutEffect(() => {
      beforeLayer.current?.toggleAttribute("inert", hides("before"));
      afterLayer.current?.toggleAttribute("inert", hides("after"));
    });

    // A press on a picture would pick up a copy of it to drag, where
    // someone reaching for the divider meant nothing of the kind. The
    // stylesheet stops it where it can. This is for Firefox, which has no
    // such property.
    useLayoutEffect(() => {
      const element = frame.current;
      if (!element) return;
      const stop = (event: DragEvent) => event.preventDefault();
      element.addEventListener("dragstart", stop);
      return () => element.removeEventListener("dragstart", stop);
    }, []);

    // The server sends the position as a style attribute, which a Content
    // Security Policy can block, and hydrating doesn't write it again. Set
    // through the CSSOM it can't be blocked.
    useLayoutEffect(() => {
      frame.current?.style.setProperty(
        "--nuv-compare-position",
        `${position}%`,
      );
    }, [position]);

    return (
      <div
        ref={ref}
        data-orientation={orientation}
        data-mode={mode}
        className={cx(
          "nuv-compare",
          `nuv-compare--${orientation}`,
          !slider && "nuv-compare--toggle",
          className,
        )}
        {...props}
      >
        <div
          ref={frame}
          className="nuv-compare__frame"
          style={{ "--nuv-compare-position": `${position}%` } as CSSProperties}
        >
          <div
            ref={beforeLayer}
            aria-hidden={hides("before") || undefined}
            className="nuv-compare__layer nuv-compare__layer--before"
          >
            {before}
            {labels ? (
              <span className="nuv-compare__label nuv-compare__label--before">
                {beforeLabel}
              </span>
            ) : null}
          </div>
          <div
            ref={afterLayer}
            aria-hidden={hides("after") || undefined}
            className="nuv-compare__layer nuv-compare__layer--after"
          >
            {after}
            {labels ? (
              <span className="nuv-compare__label nuv-compare__label--after">
                {afterLabel}
              </span>
            ) : null}
          </div>
          {slider ? (
            <div
              role="slider"
              tabIndex={0}
              aria-label={dividerLabel}
              aria-orientation={orientation}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={position}
              aria-valuetext={valueLabel(
                Math.round(position),
                beforeLabel,
                afterLabel,
              )}
              className="nuv-compare__divider"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onKeyDown={onKeyDown}
            >
              <span className="nuv-compare__handle">
                <Arrows />
              </span>
            </div>
          ) : null}
        </div>
        {slider ? null : (
          <ToggleGroup
            type="single"
            size="sm"
            aria-label={switchLabel}
            value={shown}
            // Radix lets the pressed one be pressed again to leave none.
            // One of the two always shows, so that's ignored.
            onValueChange={(next) => {
              if (next === "before" || next === "after") choose(next);
            }}
            className="nuv-compare__switch"
          >
            <ToggleGroupItem value="before">{beforeLabel}</ToggleGroupItem>
            <ToggleGroupItem value="after">{afterLabel}</ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
    );
  },
);

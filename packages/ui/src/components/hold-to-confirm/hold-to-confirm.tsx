"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import { Button, type ButtonProps } from "../button/button";

export interface HoldToConfirmOwnProps {
  /**
   * Called once the button has been held for the whole of `duration`, or
   * pressed twice by someone whose way of pressing can't be held.
   */
  onConfirm: () => void;
  /**
   * How long the button has to be held, in milliseconds.
   * @default 1500
   */
  duration?: number;
  /**
   * What a screen reader says about the button, and says again when it's
   * let go of too soon. Translate it with the rest of your interface.
   * @default "Hold down to confirm."
   */
  hint?: string;
  /**
   * What a screen reader says after the first of two presses. Translate it
   * with the rest of your interface.
   * @default "Press again to confirm."
   */
  againLabel?: string;
}

export interface HoldToConfirmProps
  extends HoldToConfirmOwnProps,
    Omit<ButtonProps, keyof HoldToConfirmOwnProps | "asChild"> {}

type State = "idle" | "holding" | "armed";

// How long the first of two presses waits for the second, in milliseconds.
const armedFor = 5000;

const holds = (key: string) => key === " " || key === "Enter";

/**
 * A button that acts only after it's been held down, with the wait drawn
 * across it. For things that can't be undone and aren't worth a dialog. A
 * screen reader or a switch, which press and can't hold, confirm with a
 * second press.
 */
export const HoldToConfirm = forwardRef<HTMLButtonElement, HoldToConfirmProps>(
  function HoldToConfirm(
    {
      onConfirm,
      duration = 1500,
      hint = "Hold down to confirm.",
      againLabel = "Press again to confirm.",
      intent = "danger",
      className,
      children,
      "aria-describedby": describedBy,
      onClick,
      onKeyDown,
      onKeyUp,
      onBlur,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      onContextMenu,
      ...props
    },
    ref,
  ) {
    const [state, setState] = useState<State>("idle");
    const [message, setMessage] = useState("");
    const hintId = useId();

    // The newest `onConfirm`, for a timer that outlives the render it was
    // started in.
    const confirmRef = useRef(onConfirm);
    confirmRef.current = onConfirm;
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const clear = useCallback(() => {
      clearTimeout(timer.current);
      timer.current = undefined;
    }, []);
    useEffect(() => clear, [clear]);

    // Whether a pointer or a key has gone down on the button since its
    // last click. A click with neither before it came from something that
    // presses and can't hold: a screen reader, a switch, a voice command.
    const attempt = useRef(false);

    const start = () => {
      attempt.current = true;
      clear();
      setMessage("");
      setState("holding");
      timer.current = setTimeout(() => {
        timer.current = undefined;
        setState("idle");
        confirmRef.current();
      }, duration);
    };

    const stop = () => {
      if (state !== "holding") return;
      clear();
      setState("idle");
      setMessage(hint);
    };

    const press = () => {
      clear();
      if (state === "armed") {
        setState("idle");
        setMessage("");
        onConfirm();
        return;
      }
      setState("armed");
      setMessage(againLabel);
      timer.current = setTimeout(() => {
        timer.current = undefined;
        setState("idle");
        setMessage("");
      }, armedFor);
    };

    return (
      <>
        <Button
          ref={ref}
          intent={intent}
          data-state={state}
          className={cx("nuv-hold-to-confirm", className)}
          aria-describedby={cx(describedBy, hintId)}
          onPointerDown={(event) => {
            onPointerDown?.(event);
            // The main button of a mouse, a finger or a pen.
            if (event.button === 0) start();
          }}
          onPointerUp={(event) => {
            onPointerUp?.(event);
            stop();
          }}
          onPointerLeave={(event) => {
            onPointerLeave?.(event);
            stop();
            // A mouse dragged off while it's down gives no click. A finger
            // leaves after it lifts, and its click is still to come.
            if (event.buttons !== 0) attempt.current = false;
          }}
          onPointerCancel={(event) => {
            onPointerCancel?.(event);
            stop();
            attempt.current = false;
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (!holds(event.key)) return;
            // A key that's held sends itself again and again, and Enter
            // sends a click each time. Only the first one starts the wait.
            if (event.repeat) attempt.current = true;
            else start();
          }}
          onKeyUp={(event) => {
            onKeyUp?.(event);
            if (holds(event.key)) stop();
          }}
          onBlur={(event) => {
            onBlur?.(event);
            stop();
            attempt.current = false;
          }}
          onClick={(event) => {
            onClick?.(event);
            if (attempt.current) attempt.current = false;
            else press();
          }}
          // A finger held on a phone asks for a menu.
          onContextMenu={(event) => {
            onContextMenu?.(event);
            if (state === "holding") event.preventDefault();
          }}
          {...props}
        >
          <span
            aria-hidden="true"
            className="nuv-hold-to-confirm__progress"
            style={
              state === "holding"
                ? { transitionDuration: `${duration}ms` }
                : undefined
            }
          />
          <span className="nuv-hold-to-confirm__label">{children}</span>
        </Button>
        <span id={hintId} hidden>
          {hint}
        </span>
        <span role="status" className="nuv-hold-to-confirm__status">
          {message}
        </span>
      </>
    );
  },
);

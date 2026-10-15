"use client";

import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import {
  type FormatNumberOptions,
  formatterFor,
} from "../formatted-number/formatted-number";

export interface AnimatedNumberOwnProps extends FormatNumberOptions {
  /** The number. When it changes, the digits that differ move to it. */
  value: number;
  /**
   * How a digit that changes moves. `"roll"` turns it through the digits
   * between, like a counter. `"pop"` lets the old digit rise out as the
   * new one rises in, coming into focus. Either way it's still for anyone
   * who asked for less motion.
   * @default "roll"
   */
  animation?: "roll" | "pop";
}

export interface AnimatedNumberProps
  extends AnimatedNumberOwnProps,
    Omit<HTMLAttributes<HTMLDataElement>, "children"> {}

// One character of the written number. A digit has its place, counted
// from the decimal separator, so the tens of the old number can be found
// for the tens of the new one however the two are written.
interface Glyph {
  char: string;
  place: string | null;
  digit: number;
}

// The ten digits of the numbering system a formatter writes in. A number
// in Arabic or in Hindi turns through its own digits.
const numeralsCache = new WeakMap<Intl.NumberFormat, string[]>();

function numeralsOf(formatter: Intl.NumberFormat): string[] {
  let numerals = numeralsCache.get(formatter);
  if (!numerals) {
    const plain = new Intl.NumberFormat("en-US", {
      numberingSystem: formatter.resolvedOptions().numberingSystem,
      useGrouping: false,
    });
    numerals = Array.from({ length: 10 }, (_, digit) => plain.format(digit));
    numeralsCache.set(formatter, numerals);
  }
  return numerals;
}

function glyphsOf(formatter: Intl.NumberFormat, value: number): Glyph[] {
  const numerals = numeralsOf(formatter);
  const parts = formatter.formatToParts(value);
  // The whole part can come in pieces, between group separators, so its
  // digits are counted first to know the place of the first one.
  let whole = 0;
  for (const part of parts) {
    if (part.type === "integer") whole += Array.from(part.value).length;
  }
  const glyphs: Glyph[] = [];
  let fraction = 0;
  for (const part of parts) {
    for (const char of part.value) {
      const digit = numerals.indexOf(char);
      if (digit !== -1 && part.type === "integer") {
        whole -= 1;
        glyphs.push({ char, place: `i${whole}`, digit });
      } else if (digit !== -1 && part.type === "fraction") {
        glyphs.push({ char, place: `f${fraction}`, digit });
        fraction += 1;
      } else {
        // A separator, a sign, a currency, a unit or a short form's
        // letter stays where it is.
        glyphs.push({ char, place: null, digit: -1 });
      }
    }
  }
  return glyphs;
}

// Where a digit that moves sits, in the copy, measured from the copy.
interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Move {
  // The digit each place had before, for the places that had one.
  from: Map<string, number>;
  up: boolean;
  run: number;
  boxes: Box[] | null;
}

// A digit that moves: what it was, what it becomes, and which way.
interface Change {
  from: number | null;
  to: number;
  up: boolean;
}

// The digits a roll passes through, from the old one to the new one, the
// way the number went. Going down they're listed from the new one, since
// the column then moves the other way.
function path(from: number, to: number, up: boolean): number[] {
  const steps = (up ? to - from + 10 : from - to + 10) % 10;
  const digits = Array.from(
    { length: steps + 1 },
    (_, step) => (from + (up ? step : -step) + 10) % 10,
  );
  return up ? digits : digits.reverse();
}

const px = (value: number) => `${value}px`;

/**
 * A number that moves to its new value: the digits that change roll or
 * pop to the new ones, and the rest stay still. It's written the way
 * `FormattedNumber` writes it, and a screen reader reads it as one number.
 * The first value is drawn as it is, so the page from the server has it.
 */
export const AnimatedNumber = forwardRef<HTMLDataElement, AnimatedNumberProps>(
  function AnimatedNumber(
    {
      value,
      animation = "roll",
      locale,
      format,
      currency,
      compact,
      signDisplay,
      minimumFractionDigits,
      maximumFractionDigits,
      options,
      className,
      ...props
    },
    ref,
  ) {
    const formatter = formatterFor({
      locale,
      format,
      currency,
      compact,
      signDisplay,
      minimumFractionDigits,
      maximumFractionDigits,
      options,
    });
    const text = formatter.format(value);
    const glyphs = useMemo(
      () => glyphsOf(formatter, value),
      [formatter, value],
    );

    const [shown, setShown] = useState({ text, value, glyphs });
    const [move, setMove] = useState<Move | null>(null);
    // What was on the screen becomes what the digits move from. Set while
    // rendering, so the first frame with the new text already moves.
    if (text !== shown.text) {
      const from = new Map<string, number>();
      for (const glyph of shown.glyphs) {
        if (glyph.place) from.set(glyph.place, glyph.digit);
      }
      setShown({ text, value, glyphs });
      setMove({
        from,
        // The digits are the number's size, and the sign is written apart
        // from them. So -1,200 to -1,300 counts up, as 1,200 to 1,300 does.
        up: Math.abs(value) >= Math.abs(shown.value),
        run: (move?.run ?? 0) + 1,
        boxes: null,
      });
    }

    const changes: Change[] = [];
    const moving = glyphs.map((glyph) => {
      if (!move || glyph.place === null) return false;
      const before = move.from.get(glyph.place);
      if (before === glyph.digit) return false;
      // A place the number didn't have before counts up from zero.
      changes.push({
        from: before ?? null,
        to: glyph.digit,
        up: before === undefined || move.up,
      });
      return true;
    });

    // The copy is drawn first with a gap for each digit that moves, laid
    // out by the browser the way the text is, whatever the direction of
    // the language. Then each gap is measured and what moves is put in
    // it. Both happen before the browser draws, and so does taking the
    // copy away again where nothing moves: because the visitor asked for
    // less motion, or a stylesheet took the animations away.
    const motionRef = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
      const motion = motionRef.current;
      if (!move || !motion) return;
      if (!move.boxes) {
        // Measured on the screen, to a fraction of a pixel, and turned back
        // into the copy's own pixels, in case something around it is
        // scaled, such as a dialog as it opens.
        // offsetWidth is rounded to a whole pixel, so a difference smaller
        // than one is the rounding and not a scale.
        const frame = motion.getBoundingClientRect();
        const scale =
          frame.width > 0 && Math.abs(motion.offsetWidth - frame.width) >= 1
            ? motion.offsetWidth / frame.width
            : 1;
        const gaps = motion.querySelectorAll<HTMLElement>("[data-gap]");
        const boxes = Array.from(gaps, (gap) => {
          const box = gap.getBoundingClientRect();
          return {
            left: (box.left - frame.left) * scale,
            top: (box.top - frame.top) * scale,
            width: box.width * scale,
            height: box.height * scale,
          };
        });
        setMove({ ...move, boxes });
        return;
      }
      const animations = motion.getAnimations({ subtree: true });
      if (animations.length === 0) {
        setMove(null);
        return;
      }
      let current = true;
      Promise.all(animations.map((each) => each.finished)).then(
        () => {
          if (current) setMove(null);
        },
        // A new value took this one's place mid-way.
        () => {},
      );
      return () => {
        current = false;
      };
    }, [move]);

    const numerals = numeralsOf(formatter);

    return (
      <data
        ref={ref}
        value={value}
        data-state={move ? "moving" : "still"}
        className={cx(
          "nuv-animated-number",
          `nuv-animated-number--${animation}`,
          className,
        )}
        {...props}
      >
        <span className="nuv-animated-number__text">{text}</span>
        {move ? (
          <span
            key={move.run}
            ref={motionRef}
            aria-hidden="true"
            data-direction={move.up ? "up" : "down"}
            className="nuv-animated-number__motion"
          >
            {glyphs.map((glyph, index) => (
              <span
                // The characters of one number, drawn once in this order.
                // biome-ignore lint/suspicious/noArrayIndexKey: a character is where it is
                key={index}
                data-gap={moving[index] ? "" : undefined}
                className={
                  moving[index] ? "nuv-animated-number__gap" : undefined
                }
              >
                {glyph.char}
              </span>
            ))}
            {move.boxes?.map((box, index) => {
              const change = changes[index];
              if (!change) return null;
              const style = {
                left: px(box.left),
                top: px(box.top),
                width: px(box.width),
                height: px(box.height),
                "--nuv-animated-number-order": index,
              } as CSSProperties;

              if (animation === "pop") {
                return (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: one box for each digit that moves, in order
                    key={index}
                    className="nuv-animated-number__digit"
                    data-direction={change.up ? "up" : "down"}
                    style={style}
                  >
                    {change.from === null ? null : (
                      <span className="nuv-animated-number__old">
                        {numerals[change.from]}
                      </span>
                    )}
                    <span className="nuv-animated-number__new">
                      {numerals[change.to]}
                    </span>
                  </span>
                );
              }

              const digits = path(change.from ?? 0, change.to, change.up);
              // The column is as tall as one digit, and moves by a digit's
              // height for each step.
              const travel = `${(digits.length - 1) * -100}%`;
              return (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: one box for each digit that moves, in order
                  key={index}
                  className="nuv-animated-number__digit"
                  style={
                    {
                      ...style,
                      "--nuv-animated-number-from": change.up ? "0%" : travel,
                      "--nuv-animated-number-to": change.up ? travel : "0%",
                    } as CSSProperties
                  }
                >
                  <span className="nuv-animated-number__reel">
                    {digits.map((digit) => (
                      <span
                        key={digit}
                        className="nuv-animated-number__numeral"
                      >
                        {numerals[digit]}
                      </span>
                    ))}
                  </span>
                </span>
              );
            })}
          </span>
        ) : null}
      </data>
    );
  },
);

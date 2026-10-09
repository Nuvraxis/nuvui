"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  forwardRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

type RootProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

export interface RatingOwnProps {
  /** How many stars are chosen, when you control it. 0 is none. */
  value?: number;
  /**
   * How many stars are chosen at first, when you don't control it.
   * @default 0
   */
  defaultValue?: number;
  /** Called with the number of the star that was chosen. */
  onValueChange?: (value: number) => void;
  /**
   * How many stars there are.
   * @default 5
   */
  max?: number;
  /**
   * Shows a rating that can't be changed, such as an average. It's then a
   * picture with a name, not a set of controls, and the value can have a
   * fraction: 3.5 fills half of the fourth star.
   * @default false
   */
  readOnly?: boolean;
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /**
   * Accessible name of one star, from its number and the number of stars.
   * Translate it with the rest of your interface.
   * @default (value) => (value === 1 ? "1 star" : `${value} stars`)
   */
  itemLabel?: (value: number, max: number) => string;
  /**
   * Accessible name of a rating that can't be changed, from its value and
   * the number of stars. Translate it with the rest of your interface.
   * @default (value, max) => `${value} out of ${max}`
   */
  valueLabel?: (value: number, max: number) => string;
}

export interface RatingProps
  extends RatingOwnProps,
    Omit<
      RootProps,
      keyof RatingOwnProps | "orientation" | "asChild" | "children"
    > {}

const defaultItemLabel = (value: number) =>
  value === 1 ? "1 star" : `${value} stars`;
const defaultValueLabel = (value: number, max: number) =>
  `${value} out of ${max}`;

function Star({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 16 16"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    >
      <path d="M8 1.6l1.95 4.1 4.45.6-3.25 3.1.8 4.45L8 11.7l-3.95 2.15.8-4.45L1.6 6.3l4.45-.6z" />
    </svg>
  );
}

/**
 * Stars to rate something with, or to show how it was rated. To choose
 * from, it's a radio group: one star is chosen, and the arrow keys move
 * between them.
 */
export const Rating = forwardRef<HTMLDivElement, RatingProps>(function Rating(
  {
    value: valueProp,
    defaultValue = 0,
    onValueChange,
    max = 5,
    readOnly = false,
    size = "md",
    itemLabel = defaultItemLabel,
    valueLabel = defaultValueLabel,
    className,
    ...props
  },
  ref,
) {
  const [ownValue, setOwnValue] = useState(defaultValue);
  const value = valueProp ?? ownValue;
  // The star under the pointer. The stars up to it are filled while it's
  // there, to show what a click would choose.
  const [hovered, setHovered] = useState<number | null>(null);

  const stars = Array.from({ length: max }, (_, index) => index + 1);
  const classes = cx(
    "nuv-rating",
    size !== "md" && `nuv-rating--${size}`,
    className,
  );

  if (readOnly) {
    // What only a radio group has a use for is left behind. The rest is
    // the element's: an id, a style, a title, a name of your own.
    const {
      name: _name,
      required: _required,
      disabled: _disabled,
      loop: _loop,
      "aria-label": label,
      ...rest
    } = props;
    return (
      <div
        ref={ref}
        role="img"
        aria-label={label ?? valueLabel(value, max)}
        className={cx(classes, "nuv-rating--read-only")}
        {...rest}
      >
        {stars.map((star) => {
          // How much of this star the value covers, from none to all.
          const part = Math.min(1, Math.max(0, value - (star - 1)));
          return (
            <span key={star} className="nuv-rating__item">
              <Star className="nuv-rating__star" />
              {part > 0 ? (
                <span
                  className="nuv-rating__fill"
                  style={{ "--nuv-rating-part": part } as CSSProperties}
                >
                  <Star className="nuv-rating__star nuv-rating__star--on" />
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
    );
  }

  const shown = hovered ?? value;

  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      orientation="horizontal"
      // An empty string is no star, which Radix takes as nothing chosen.
      value={value > 0 ? String(value) : ""}
      onValueChange={(next) => {
        const chosen = Number(next);
        // The pointer may still be over another star, from a click before
        // the arrow keys were used. What was chosen is what's shown.
        setHovered(null);
        setOwnValue(chosen);
        onValueChange?.(chosen);
      }}
      onPointerLeave={() => setHovered(null)}
      className={classes}
      {...props}
    >
      {stars.map((star) => (
        <RadioGroupPrimitive.Item
          key={star}
          value={String(star)}
          aria-label={itemLabel(star, max)}
          className="nuv-rating__item"
          // A finger has no hover, and would leave the stars filled after
          // it lifts.
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setHovered(star);
          }}
        >
          <Star
            className={cx(
              "nuv-rating__star",
              star <= shown && "nuv-rating__star--on",
            )}
          />
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
});

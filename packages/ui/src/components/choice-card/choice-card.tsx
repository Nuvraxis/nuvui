"use client";

import {
  type ComponentRef,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import { Checkbox, type CheckboxProps } from "../checkbox/checkbox";
import {
  RadioGroupItem,
  type RadioGroupItemProps,
} from "../radio-group/radio-group";

type Part = "title" | "description";

interface CardContextValue {
  titleId: string;
  descriptionId: string;
  setPart: (part: Part, present: boolean) => void;
}

const CardContext = createContext<CardContextValue | null>(null);

function useCardPart(name: string, part: Part) {
  const card = useContext(CardContext);
  if (!card) {
    throw new Error(`${name} has to be inside a CheckboxCard or a RadioCard.`);
  }
  // Tells the card the part is on the page for as long as it is. The
  // control is only pointed at an id once there's something with it.
  const { setPart } = card;
  useEffect(() => {
    setPart(part, true);
    return () => setPart(part, false);
  }, [setPart, part]);
  return card;
}

// What both cards share: the ids, and which parts are there to point at.
function useCard() {
  const id = useId();
  const [parts, setParts] = useState({ title: false, description: false });
  const context = useMemo<CardContextValue>(
    () => ({
      titleId: `${id}-title`,
      descriptionId: `${id}-description`,
      setPart: (part, present) =>
        setParts((current) =>
          current[part] === present ? current : { ...current, [part]: present },
        ),
    }),
    [id],
  );
  return {
    context,
    naming: {
      "aria-labelledby": parts.title ? context.titleId : undefined,
      "aria-describedby": parts.description ? context.descriptionId : undefined,
    },
  };
}

export interface ChoiceCardOwnProps {
  /**
   * Which end of the card the checkbox or the radio button is at.
   * @default "start"
   */
  indicator?: "start" | "end";
  /** The card's content: a `ChoiceCardTitle`, and anything else. */
  children?: ReactNode;
}

const cardClass = (indicator: "start" | "end", className?: string) =>
  cx(
    "nuv-choice-card",
    indicator === "end" && "nuv-choice-card--end",
    className,
  );

export interface CheckboxCardProps
  extends ChoiceCardOwnProps,
    Omit<CheckboxProps, "children"> {}

/**
 * A checkbox drawn as a card: the whole card can be pressed, and has room
 * for a title, a description and anything else. Several can be on at once.
 */
export const CheckboxCard = forwardRef<
  ComponentRef<typeof Checkbox>,
  CheckboxCardProps
>(function CheckboxCard(
  { indicator = "start", className, children, ...props },
  ref,
) {
  const { context, naming } = useCard();
  return (
    // The class name goes on the card. Everything else is the checkbox's.
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is the checkbox inside, which Radix draws as a button
    <label className={cardClass(indicator, className)}>
      <Checkbox
        ref={ref}
        className="nuv-choice-card__control"
        {...naming}
        {...props}
      />
      <CardContext.Provider value={context}>
        <span className="nuv-choice-card__body">{children}</span>
      </CardContext.Provider>
    </label>
  );
});

export interface RadioCardProps
  extends ChoiceCardOwnProps,
    Omit<RadioGroupItemProps, "children"> {}

/**
 * A radio button drawn as a card. It goes in a `RadioGroup`, where one
 * card is chosen at a time.
 */
export const RadioCard = forwardRef<
  ComponentRef<typeof RadioGroupItem>,
  RadioCardProps
>(function RadioCard(
  { indicator = "start", className, children, ...props },
  ref,
) {
  const { context, naming } = useCard();
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is the radio button inside, which Radix draws as a button
    <label className={cardClass(indicator, className)}>
      <RadioGroupItem
        ref={ref}
        className="nuv-choice-card__control"
        {...naming}
        {...props}
      />
      <CardContext.Provider value={context}>
        <span className="nuv-choice-card__body">{children}</span>
      </CardContext.Provider>
    </label>
  );
});

export type ChoiceCardTitleProps = HTMLAttributes<HTMLSpanElement>;

/** The choice's name, which is the name of the control. */
export const ChoiceCardTitle = forwardRef<
  HTMLSpanElement,
  ChoiceCardTitleProps
>(function ChoiceCardTitle({ className, ...props }, ref) {
  const { titleId } = useCardPart("ChoiceCardTitle", "title");
  return (
    <span
      ref={ref}
      id={titleId}
      className={cx("nuv-choice-card__title", className)}
      {...props}
    />
  );
});

export type ChoiceCardDescriptionProps = HTMLAttributes<HTMLSpanElement>;

/** More about the choice. A screen reader reads it after the name. */
export const ChoiceCardDescription = forwardRef<
  HTMLSpanElement,
  ChoiceCardDescriptionProps
>(function ChoiceCardDescription({ className, ...props }, ref) {
  const { descriptionId } = useCardPart("ChoiceCardDescription", "description");
  return (
    <span
      ref={ref}
      id={descriptionId}
      className={cx("nuv-choice-card__description", className)}
      {...props}
    />
  );
});

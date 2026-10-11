import {
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";

export interface PromptSuggestionsOwnProps {
  /**
   * The name of the group for a screen reader.
   * @default "Suggestions"
   */
  label?: string;
}

export interface PromptSuggestionsProps
  extends PromptSuggestionsOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof PromptSuggestionsOwnProps> {}

/**
 * Prompts to start from, for a conversation with nothing in it yet. They
 * sit in a row and wrap to the next.
 */
export const PromptSuggestions = forwardRef<
  HTMLDivElement,
  PromptSuggestionsProps
>(function PromptSuggestions(
  { label = "Suggestions", className, ...props },
  ref,
) {
  return (
    // A fieldset would draw a frame and can't be laid out as a row in
    // every browser.
    // biome-ignore lint/a11y/useSemanticElements: see above
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cx("nuv-prompt-suggestions", className)}
      {...props}
    />
  );
});

export interface PromptSuggestionProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * One prompt to start from. It's a button: what a press does with its
 * text, send it or put it in the prompt box, is yours to say.
 */
export const PromptSuggestion = forwardRef<
  HTMLButtonElement,
  PromptSuggestionProps
>(function PromptSuggestion({ className, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx("nuv-prompt-suggestion", className)}
      {...props}
    />
  );
});

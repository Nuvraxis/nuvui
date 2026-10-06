"use client";

import { Slot, Slottable } from "@radix-ui/react-slot";
import {
  type ComponentRef,
  cloneElement,
  createContext,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import { Label, type LabelProps } from "../label/label";

type Part = "label" | "description" | "error";

interface FieldContextValue {
  controlId: string;
  labelId: string;
  descriptionId: string;
  errorId: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  /** Which parts are on the page. An id is only pointed at once it exists. */
  parts: Record<Part, boolean>;
  setPart: (part: Part, present: boolean) => void;
}

const FieldContext = createContext<FieldContextValue | null>(null);

function useField(part: string): FieldContextValue {
  const field = useContext(FieldContext);
  if (!field) throw new Error(`${part} has to be inside a Field.`);
  return field;
}

// Tells the field a part is on the page for as long as it is.
function usePart(field: FieldContextValue, part: Part, present = true) {
  const { setPart } = field;
  useEffect(() => {
    if (!present) return;
    setPart(part, true);
    return () => setPart(part, false);
  }, [setPart, part, present]);
}

export interface FieldOwnProps {
  /**
   * `"vertical"` stacks the label, the control and the text under it.
   * `"horizontal"` puts the first two side by side, which suits a checkbox
   * or a switch with its label.
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal";
  /**
   * Marks the control as invalid. Left out, the control is invalid while a
   * `FieldError` has something in it.
   */
  invalid?: boolean;
  /**
   * Makes the control required and puts a mark after the label.
   * @default false
   */
  required?: boolean;
  /**
   * Disables the control and fades the label.
   * @default false
   */
  disabled?: boolean;
  /**
   * The `id` the control gets. The label, the description and the error take
   * theirs from it. Left out, one is made up.
   */
  controlId?: string;
}

export interface FieldProps
  extends FieldOwnProps,
    HTMLAttributes<HTMLDivElement> {}

export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    orientation = "vertical",
    invalid: invalidProp,
    required = false,
    disabled = false,
    controlId,
    className,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const [parts, setParts] = useState<Record<Part, boolean>>({
    label: false,
    description: false,
    error: false,
  });
  const invalid = invalidProp ?? parts.error;
  // The same function on every render. A part tells the field it's there
  // from an effect that depends on this, and a new one each time would run
  // that effect again without end.
  const setPart = useCallback(
    (part: Part, present: boolean) =>
      setParts((current) =>
        current[part] === present ? current : { ...current, [part]: present },
      ),
    [],
  );

  const field = useMemo<FieldContextValue>(
    () => ({
      controlId: id,
      labelId: `${id}-label`,
      descriptionId: `${id}-description`,
      errorId: `${id}-error`,
      invalid,
      required,
      disabled,
      parts,
      setPart,
    }),
    [id, invalid, required, disabled, parts, setPart],
  );

  return (
    <FieldContext.Provider value={field}>
      <div
        ref={ref}
        className={cx("nuv-field", `nuv-field--${orientation}`, className)}
        data-invalid={invalid ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        {...props}
      />
    </FieldContext.Provider>
  );
});

export interface FieldLabelOwnProps {
  /**
   * What follows the label's text while the field is required. It's hidden
   * from screen readers, which hear "required" from the control itself.
   * @default "*"
   */
  requiredIndicator?: ReactNode;
}

export interface FieldLabelProps extends FieldLabelOwnProps, LabelProps {}

export const FieldLabel = forwardRef<
  ComponentRef<typeof Label>,
  FieldLabelProps
>(function FieldLabel({ requiredIndicator = "*", children, ...props }, ref) {
  const field = useField("FieldLabel");
  usePart(field, "label");

  return (
    <Label
      ref={ref}
      id={field.labelId}
      // Only a label element has one. Anything else names the control
      // through the aria-labelledby that FieldControl sets.
      htmlFor={props.asChild ? undefined : field.controlId}
      data-disabled={field.disabled ? "" : undefined}
      {...props}
    >
      {/* With asChild, this says which child is the element to render. The
          mark then goes inside it, after its own content. */}
      <Slottable>{children}</Slottable>
      {field.required && requiredIndicator ? (
        <span aria-hidden="true" className="nuv-field__required">
          {requiredIndicator}
        </span>
      ) : null}
    </Label>
  );
});

export interface FieldControlProps {
  /** The control: one element, which gets the field's props. */
  children: ReactNode;
}

export const FieldControl = forwardRef<HTMLElement, FieldControlProps>(
  function FieldControl({ children, ...props }, ref) {
    const field = useField("FieldControl");

    // What the control already says describes it stays, in front of the
    // field's own text.
    const child = isValidElement<{ "aria-describedby"?: string }>(children)
      ? children
      : null;
    const describedBy =
      [
        child?.props["aria-describedby"],
        field.parts.description && field.descriptionId,
        field.parts.error && field.errorId,
      ]
        .filter(Boolean)
        .join(" ") || undefined;

    const fieldProps = {
      id: field.controlId,
      "aria-labelledby": field.parts.label ? field.labelId : undefined,
      "aria-invalid": field.invalid || undefined,
      required: field.required || undefined,
      disabled: field.disabled || undefined,
    };

    return (
      <Slot ref={ref} {...fieldProps} {...props}>
        {child
          ? cloneElement(child, { "aria-describedby": describedBy })
          : children}
      </Slot>
    );
  },
);

export type FieldDescriptionProps = HTMLAttributes<HTMLDivElement>;

export const FieldDescription = forwardRef<
  HTMLDivElement,
  FieldDescriptionProps
>(function FieldDescription({ className, ...props }, ref) {
  const field = useField("FieldDescription");
  usePart(field, "description");

  return (
    <div
      ref={ref}
      id={field.descriptionId}
      className={cx("nuv-field__description", className)}
      {...props}
    />
  );
});

export type FieldErrorProps = HTMLAttributes<HTMLDivElement>;

export const FieldError = forwardRef<HTMLDivElement, FieldErrorProps>(
  function FieldError({ className, children, ...props }, ref) {
    const field = useField("FieldError");
    // Nothing to say renders nothing, so a form library's message can be
    // passed straight in whether or not there is one.
    const present = children != null && children !== false && children !== "";
    usePart(field, "error", present);

    if (!present) return null;
    return (
      <div
        ref={ref}
        id={field.errorId}
        className={cx("nuv-field__error", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

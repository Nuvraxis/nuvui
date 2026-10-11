"use client";

import { Button } from "@nuvui/react/button";
import {
  Collapsible,
  CollapsibleContent,
  type CollapsibleProps,
  CollapsibleTrigger,
} from "@nuvui/react/collapsible";
import { Spinner } from "@nuvui/react/spinner";
import {
  type ButtonHTMLAttributes,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useId,
  useMemo,
  useRef,
} from "react";
import { cx } from "../../utils/cx";

/**
 * Where a call stands. `"running"`: it has been asked and hasn't
 * answered. `"approval"`: it waits for the person to allow it. `"done"`:
 * it answered. `"error"`: it failed. `"denied"`: the person didn't allow
 * it.
 */
export type ToolCallStatus =
  | "running"
  | "approval"
  | "done"
  | "error"
  | "denied";

interface ToolCallContextValue {
  status: ToolCallStatus;
  trigger: { current: HTMLButtonElement | null };
}

const ToolCallContext = createContext<ToolCallContextValue | null>(null);

function useToolCall(part: string) {
  const context = useContext(ToolCallContext);
  if (!context) throw new Error(`${part} has to be inside a ToolCall.`);
  return context;
}

const statusLabels: Record<ToolCallStatus, string> = {
  running: "Running",
  approval: "Needs approval",
  done: "Done",
  error: "Failed",
  denied: "Denied",
};

const icon = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const statusIcons: Record<ToolCallStatus, ReactNode> = {
  running: <Spinner size="sm" label="" />,
  approval: (
    <svg aria-hidden="true" {...icon}>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M6.4 6.4a1.7 1.7 0 1 1 2.5 1.5c-.6.3-.9.7-.9 1.2M8 11.2v.1" />
    </svg>
  ),
  done: (
    <svg aria-hidden="true" {...icon}>
      <path d="m3 8.5 3.5 3.5L13 4.5" />
    </svg>
  ),
  error: (
    <svg aria-hidden="true" {...icon}>
      <path d="M8 2.5 14 13H2L8 2.5ZM8 6.5v3M8 11.2v.1" />
    </svg>
  ),
  denied: (
    <svg aria-hidden="true" {...icon}>
      <circle cx="8" cy="8" r="5.75" />
      <path d="m4 4 8 8" />
    </svg>
  ),
};

export interface ToolCallOwnProps {
  /** Where the call stands. */
  status: ToolCallStatus;
}

export interface ToolCallProps
  extends ToolCallOwnProps,
    Omit<CollapsibleProps, keyof ToolCallOwnProps> {}

/**
 * Something the assistant did, or wants to do, with a tool: a card with
 * the tool's name and where the call stands, which opens to show what
 * was asked and what came back. It starts closed.
 */
export const ToolCall = forwardRef<HTMLDivElement, ToolCallProps>(
  function ToolCall({ status, className, ...props }, ref) {
    const trigger = useRef<HTMLButtonElement | null>(null);
    const context = useMemo(() => ({ status, trigger }), [status]);

    return (
      <ToolCallContext.Provider value={context}>
        <Collapsible
          ref={ref}
          className={cx("nuv-tool-call", className)}
          data-status={status}
          {...props}
        />
      </ToolCallContext.Provider>
    );
  },
);

export interface ToolCallTriggerOwnProps {
  /** What the tool is called, in words a person would use. */
  children: ReactNode;
  /**
   * Where the call stands, in words. It's written beside the name, so
   * the icon and its color aren't the only way to tell.
   * @default "Running", "Needs approval", "Done", "Failed" or "Denied"
   */
  statusLabel?: ReactNode;
}

export interface ToolCallTriggerProps
  extends ToolCallTriggerOwnProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      keyof ToolCallTriggerOwnProps
    > {}

/** The card's top line, which opens and closes it. */
export const ToolCallTrigger = forwardRef<
  HTMLButtonElement,
  ToolCallTriggerProps
>(function ToolCallTrigger(
  { statusLabel, className, children, ...props },
  ref,
) {
  const { status, trigger } = useToolCall("ToolCallTrigger");

  return (
    <CollapsibleTrigger
      ref={(node) => {
        trigger.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cx("nuv-tool-call__trigger", className)}
      {...props}
    >
      <span className="nuv-tool-call__icon" aria-hidden="true">
        {statusIcons[status]}
      </span>
      <span className="nuv-tool-call__name">{children}</span>
      <span className="nuv-tool-call__status">
        {statusLabel ?? statusLabels[status]}
      </span>
      <svg aria-hidden="true" className="nuv-tool-call__chevron" {...icon}>
        <path d="m4 6 4 4 4-4" />
      </svg>
    </CollapsibleTrigger>
  );
});

export interface ToolCallContentProps extends HTMLAttributes<HTMLDivElement> {}

/** What the card shows when it's open. */
export const ToolCallContent = forwardRef<HTMLDivElement, ToolCallContentProps>(
  function ToolCallContent({ className, ...props }, ref) {
    return (
      <CollapsibleContent className="nuv-tool-call__content">
        <div
          ref={ref}
          className={cx("nuv-tool-call__body", className)}
          {...props}
        />
      </CollapsibleContent>
    );
  },
);

// Text as it is, and anything else as JSON a person can read.
function write(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    // Something that refers to itself, or a number too big for JSON.
    return String(value);
  }
}

export interface ToolCallSectionOwnProps {
  /** The heading over it. */
  label?: ReactNode;
  /**
   * What to show. Text is shown as it is, and anything else as indented
   * JSON.
   */
  value?: unknown;
  /** In place of `value`, drawn your own way: a table, a picture. */
  children?: ReactNode;
}

export interface ToolCallSectionProps
  extends ToolCallSectionOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ToolCallSectionOwnProps> {}

function section(kind: "input" | "output", name: string, heading: string) {
  const Section = forwardRef<HTMLDivElement, ToolCallSectionProps>(
    function Section(
      { label = heading, value, children, className, ...props },
      ref,
    ) {
      const id = useId();

      return (
        <div
          ref={ref}
          className={cx("nuv-tool-call__section", className)}
          data-kind={kind}
          {...props}
        >
          <div id={id} className="nuv-tool-call__label">
            {label}
          </div>
          {children ?? (
            // A long answer scrolls inside its box, and a box that
            // scrolls has to be reachable, to be scrolled with the keys.
            // biome-ignore lint/a11y/useSemanticElements: a fieldset would draw a frame of its own
            <div
              role="group"
              aria-labelledby={id}
              // biome-ignore lint/a11y/noNoninteractiveTabindex: see above
              tabIndex={0}
              className="nuv-tool-call__code"
            >
              <pre className="nuv-tool-call__pre">{write(value)}</pre>
            </div>
          )}
        </div>
      );
    },
  );
  Section.displayName = name;
  return Section;
}

/**
 * What the tool was asked, under the heading "Request".
 */
export const ToolCallInput = section("input", "ToolCallInput", "Request");

/**
 * What it answered, under the heading "Result".
 */
export const ToolCallOutput = section("output", "ToolCallOutput", "Result");

export interface ToolCallErrorOwnProps {
  /**
   * The heading over it.
   * @default "Error"
   */
  label?: ReactNode;
}

export interface ToolCallErrorProps
  extends ToolCallErrorOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ToolCallErrorOwnProps> {}

/** What went wrong, in words, for a call that failed. */
export const ToolCallError = forwardRef<HTMLDivElement, ToolCallErrorProps>(
  function ToolCallError(
    { label = "Error", className, children, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cx("nuv-tool-call__section", className)}
        data-kind="error"
        {...props}
      >
        <div className="nuv-tool-call__label">{label}</div>
        <div className="nuv-tool-call__error">{children}</div>
      </div>
    );
  },
);

export interface ToolCallApprovalOwnProps {
  /** What's being asked: what the tool will do if it's allowed. */
  children: ReactNode;
  /** Called by the button that allows it. */
  onApprove?: () => void;
  /** Called by the button that doesn't. */
  onDeny?: () => void;
  /** @default "Approve" */
  approveLabel?: ReactNode;
  /** @default "Deny" */
  denyLabel?: ReactNode;
  /**
   * The name of the group for a screen reader.
   * @default "Approval"
   */
  label?: string;
}

export interface ToolCallApprovalProps
  extends ToolCallApprovalOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ToolCallApprovalOwnProps> {}

/**
 * The question and its two buttons, for a call that waits to be allowed.
 * It's drawn only while the call's `status` is `"approval"`, and it's
 * outside the part that opens, so it's seen with the card closed.
 */
export const ToolCallApproval = forwardRef<
  HTMLDivElement,
  ToolCallApprovalProps
>(function ToolCallApproval(
  {
    onApprove,
    onDeny,
    approveLabel = "Approve",
    denyLabel = "Deny",
    label = "Approval",
    className,
    children,
    ...props
  },
  ref,
) {
  const { status, trigger } = useToolCall("ToolCallApproval");
  if (status !== "approval") return null;

  // The buttons go once one is pressed. Focus goes to the card's top
  // line first, so that it isn't dropped on the page.
  const answer = (handler: (() => void) | undefined) => () => {
    trigger.current?.focus({ preventScroll: true });
    handler?.();
  };

  return (
    // A fieldset would draw a frame and can't be laid out as a row in
    // every browser.
    // biome-ignore lint/a11y/useSemanticElements: see above
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cx("nuv-tool-call__approval", className)}
      {...props}
    >
      <div className="nuv-tool-call__question">{children}</div>
      <div className="nuv-tool-call__choices">
        <Button
          type="button"
          size="sm"
          intent="secondary"
          onClick={answer(onDeny)}
        >
          {denyLabel}
        </Button>
        <Button type="button" size="sm" onClick={answer(onApprove)}>
          {approveLabel}
        </Button>
      </div>
    </div>
  );
});

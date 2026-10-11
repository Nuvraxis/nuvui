"use client";

import {
  type ButtonHTMLAttributes,
  type ClipboardEvent,
  createContext,
  type DragEvent,
  type FormEvent,
  type FormHTMLAttributes,
  Fragment,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import { useControllable } from "../../utils/use-controllable";
import { Attachment, Attachments } from "../attachment/attachment";
import { useOptionalConversation } from "../conversation/conversation";

export interface PromptInputFileRejection {
  file: File;
  /**
   * `"type"`: `accept` doesn't allow it. `"size"`: it's over
   * `maxFileSize`. `"count"`: there's no room left for it.
   */
  reason: "type" | "size" | "count";
}

/** What goes with the text when it's sent. */
export interface PromptInputSubmission {
  /** The files that were waiting in the box. None, if it takes none. */
  files: File[];
  event: FormEvent<HTMLFormElement>;
}

interface PromptInputContextValue {
  value: string;
  setValue: (value: string) => void;
  disabled: boolean;
  busy: boolean;
  canSubmit: boolean;
  onStop: (() => void) | undefined;
  textarea: { current: HTMLTextAreaElement | null };
  files: File[];
  addFiles: (incoming: File[]) => void;
  removeFile: (file: File) => void;
  accept: string | undefined;
  multiple: boolean;
  /** Whether a part that shows or picks files is in the box. */
  takesFiles: boolean;
  /** Called by such a part while it's there. Returns the way to leave. */
  takeFiles: () => () => void;
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

function usePromptInput(part: string) {
  const context = useContext(PromptInputContext);
  if (!context) throw new Error(`${part} has to be inside a PromptInput.`);
  return context;
}

const isomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const none: File[] = [];

// The same test a browser's file picker applies. A drop and a paste don't
// go through the picker, so it has to be made here.
function accepts(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith(".")) return name.endsWith(rule);
      if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

const same = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

const fileKey = (file: File) =>
  `${file.name}:${file.size}:${file.lastModified}`;

// Whether what's dragged over the box is files, and not text or a link.
const carriesFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer.types).includes("Files");

export interface PromptInputOwnProps {
  /** The text in the box, when you keep it. Use it with `onValueChange`. */
  value?: string;
  /** The text in the box to begin with, when it's kept here. */
  defaultValue?: string;
  /** Called with the text as it's typed, and with nothing after a send. */
  onValueChange?: (value: string) => void;
  /**
   * Called with the text when it's sent, by Enter or by the button, and
   * with the files that were waiting. The box is emptied after. Text
   * that's only spaces isn't sent, unless there are files to go with it.
   */
  onSubmit?: (text: string, submission: PromptInputSubmission) => void;
  /**
   * The files waiting to be sent, when you keep them. Use it with
   * `onFilesChange`.
   */
  files?: File[];
  /** The files waiting to begin with, when they're kept here. */
  defaultFiles?: File[];
  /** Called with all of them when one is added or taken out. */
  onFilesChange?: (files: File[]) => void;
  /**
   * The kinds of file it takes, written as a file input's `accept`:
   * `"image/*,.pdf"`. Left out, it takes any.
   */
  accept?: string;
  /** The most files that can wait at once. */
  maxFiles?: number;
  /** The largest a file may be, in bytes. */
  maxFileSize?: number;
  /**
   * Called with the files that were turned away and the reason for each.
   * Nothing is shown for them, so this is where you tell the person.
   */
  onFilesReject?: (rejections: PromptInputFileRejection[]) => void;
  /**
   * A reply is on its way. Nothing can be sent until it's `false` again,
   * and what's typed meanwhile is kept. With `onStop`, the button to
   * send becomes a button to stop.
   * @default false
   */
  busy?: boolean;
  /** Called by the button to stop, while `busy`. */
  onStop?: () => void;
  /**
   * Nothing can be typed or sent.
   * @default false
   */
  disabled?: boolean;
}

export interface PromptInputProps
  extends PromptInputOwnProps,
    Omit<FormHTMLAttributes<HTMLFormElement>, keyof PromptInputOwnProps> {}

/**
 * The box a prompt is written in: a field that grows with what's typed,
 * and under it a row for buttons. It's a form. Enter sends, and Shift
 * with Enter starts a new line.
 *
 * Inside a `Conversation`, sending also goes to the latest message.
 *
 * With a `PromptInputAttach` or a `PromptInputAttachments` in it, it
 * takes files as well: picked, pasted, or dropped on it.
 */
export const PromptInput = forwardRef<HTMLFormElement, PromptInputProps>(
  function PromptInput(
    {
      value: valueProp,
      defaultValue = "",
      onValueChange,
      onSubmit,
      busy = false,
      onStop,
      disabled = false,
      files: filesProp,
      defaultFiles = none,
      onFilesChange,
      accept,
      maxFiles,
      maxFileSize,
      onFilesReject,
      className,
      onClick,
      onDragOver,
      onDragLeave,
      onDrop,
      ...props
    },
    ref,
  ) {
    const [value, setValue] = useControllable(
      valueProp,
      defaultValue,
      onValueChange,
    );
    const [files, setFiles] = useControllable(
      filesProp,
      defaultFiles,
      onFilesChange,
    );
    const [parts, setParts] = useState(0);
    const [dragging, setDragging] = useState(false);
    const textarea = useRef<HTMLTextAreaElement | null>(null);
    const conversation = useOptionalConversation();
    const takesFiles = parts > 0;
    const canSubmit =
      !disabled && !busy && (value.trim() !== "" || files.length > 0);

    // Read when a file arrives, so that the two functions below stay the
    // same from one render to the next.
    const now = useRef({ files, accept, maxFiles, maxFileSize, disabled });
    now.current = { files, accept, maxFiles, maxFileSize, disabled };
    const rejected = useRef(onFilesReject);
    rejected.current = onFilesReject;

    const addFiles = useCallback(
      (incoming: File[]) => {
        const { files, accept, maxFiles, maxFileSize, disabled } = now.current;
        if (disabled || incoming.length === 0) return;
        const kept = [...files];
        const turnedAway: PromptInputFileRejection[] = [];

        for (const file of incoming) {
          if (!accepts(file, accept)) {
            turnedAway.push({ file, reason: "type" });
          } else if (maxFileSize !== undefined && file.size > maxFileSize) {
            turnedAway.push({ file, reason: "size" });
          } else if (kept.some((other) => same(other, file))) {
            // Added twice. Once is enough, and it's nobody's mistake.
          } else if (maxFiles !== undefined && kept.length >= maxFiles) {
            turnedAway.push({ file, reason: "count" });
          } else {
            kept.push(file);
          }
        }

        if (kept.length !== files.length) setFiles(kept);
        if (turnedAway.length > 0) rejected.current?.(turnedAway);
      },
      [setFiles],
    );

    const removeFile = useCallback(
      (file: File) => {
        setFiles(now.current.files.filter((other) => other !== file));
        // The button that had focus is gone with its file.
        textarea.current?.focus();
      },
      [setFiles],
    );

    const takeFiles = useCallback(() => {
      setParts((count) => count + 1);
      return () => setParts((count) => count - 1);
    }, []);

    const context = useMemo(
      () => ({
        value,
        setValue,
        disabled,
        busy,
        canSubmit,
        onStop,
        textarea,
        files,
        addFiles,
        removeFile,
        accept,
        multiple: maxFiles !== 1,
        takesFiles,
        takeFiles,
      }),
      [
        value,
        setValue,
        disabled,
        busy,
        canSubmit,
        onStop,
        files,
        addFiles,
        removeFile,
        accept,
        maxFiles,
        takesFiles,
        takeFiles,
      ],
    );

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
      // The page isn't to be loaded again, whatever happens next.
      event.preventDefault();
      if (!canSubmit) return;
      onSubmit?.(value, { files, event });
      setValue("");
      if (files.length > 0) setFiles(none);
      conversation?.scrollToBottom({ behavior: "auto" });
      textarea.current?.focus();
    }

    // A press on the box's own edge or between its buttons puts the
    // caret in the field, as a press on a text field does.
    function handleClick(event: MouseEvent<HTMLFormElement>) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const pressed = event.target as Element;
      if (pressed.closest("button, a, input, select, textarea, label")) return;
      textarea.current?.focus();
    }

    function handleDragOver(event: DragEvent<HTMLFormElement>) {
      onDragOver?.(event);
      if (event.defaultPrevented) return;
      if (!takesFiles || disabled || !carriesFiles(event)) return;
      // A drop is only allowed where dragover was cancelled.
      event.preventDefault();
      setDragging(true);
    }

    function handleDragLeave(event: DragEvent<HTMLFormElement>) {
      onDragLeave?.(event);
      // Moving onto a child fires this too, with the child as the place
      // being entered.
      if (event.currentTarget.contains(event.relatedTarget as Node)) return;
      setDragging(false);
    }

    function handleDrop(event: DragEvent<HTMLFormElement>) {
      onDrop?.(event);
      setDragging(false);
      if (event.defaultPrevented) return;
      if (!takesFiles || disabled || !carriesFiles(event)) return;
      // Without this the browser opens the file in place of the page.
      event.preventDefault();
      addFiles([...event.dataTransfer.files]);
      textarea.current?.focus();
    }

    return (
      <PromptInputContext.Provider value={context}>
        {/* The press is a shortcut for a mouse or a finger. The field is
            reached with Tab like any other. */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: see above */}
        <form
          ref={ref}
          className={cx("nuv-prompt-input", className)}
          data-disabled={disabled ? "" : undefined}
          data-busy={busy ? "" : undefined}
          data-dragging={dragging ? "" : undefined}
          onSubmit={handleSubmit}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          {...props}
        />
      </PromptInputContext.Provider>
    );
  },
);

export interface PromptInputTextareaOwnProps {
  /**
   * Whether Enter sends. Left out, it does where there's a keyboard, and
   * starts a new line on a touch screen, where Enter is the only way to
   * start one and the button is the way to send.
   */
  submitOnEnter?: boolean;
}

export interface PromptInputTextareaProps
  extends PromptInputTextareaOwnProps,
    Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      keyof PromptInputTextareaOwnProps | "value" | "defaultValue"
    > {}

/**
 * The field. It starts a line tall and grows with what's typed, up to a
 * height the stylesheet sets, and scrolls after that. Name it with
 * `aria-label`: a placeholder isn't a name.
 */
export const PromptInputTextarea = forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(function PromptInputTextarea(
  {
    submitOnEnter,
    className,
    onChange,
    onKeyDown,
    onPaste,
    disabled,
    ...props
  },
  ref,
) {
  const context = usePromptInput("PromptInputTextarea");
  const { value, setValue, textarea } = context;

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    onPaste?.(event);
    if (event.defaultPrevented || !context.takesFiles) return;
    const pasted = [...event.clipboardData.files];
    // Cells copied from a spreadsheet come as text and as a picture of
    // the text. The text is what was meant.
    if (pasted.length === 0 || event.clipboardData.getData("text/plain")) {
      return;
    }
    event.preventDefault();
    context.addFiles(pasted);
  }

  // As tall as its text. The height is taken off first, so that it can
  // get shorter as well as taller.
  isomorphicLayoutEffect(() => {
    const field = textarea.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [value, textarea]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Enter") return;
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    // Enter that picks a word from an input method's list isn't Enter.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const sends =
      submitOnEnter ??
      !(
        typeof matchMedia === "function" &&
        matchMedia("(pointer: coarse)").matches
      );
    if (!sends) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <textarea
      ref={(node) => {
        textarea.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cx("nuv-prompt-input__textarea", className)}
      rows={1}
      value={value}
      disabled={disabled ?? context.disabled}
      onChange={(event) => {
        onChange?.(event);
        setValue(event.target.value);
      }}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      {...props}
    />
  );
});

export interface PromptInputAttachmentsOwnProps {
  /**
   * The list's name for a screen reader.
   * @default "Files to send"
   */
  label?: string;
  /**
   * The name of the button that takes a file out, from the file's name.
   * @default (name) => `Remove ${name}`
   */
  removeLabel?: (name: string) => string;
  /**
   * Writes a file's size, from a number of bytes.
   * @default The size in the reader's own number format, such as "1.2 MB"
   */
  formatSize?: (bytes: number) => string;
  /**
   * What a screen reader is told when a file is added or taken out, from
   * how many are waiting now.
   * @default (count) => "2 files attached", and the like
   */
  announce?: (count: number) => string;
  /**
   * Draws each file yourself: called with the file and with the way to
   * take it out, and returns an `Attachment`. For a file that's being
   * uploaded as it waits, or one that failed.
   */
  children?: (file: File, remove: () => void) => ReactNode;
}

export interface PromptInputAttachmentsProps
  extends PromptInputAttachmentsOwnProps,
    Omit<
      HTMLAttributes<HTMLUListElement>,
      keyof PromptInputAttachmentsOwnProps
    > {}

const defaultAnnounce = (count: number) =>
  count === 0
    ? "No files attached"
    : count === 1
      ? "1 file attached"
      : `${count} files attached`;

// A file as it waits. One that's a picture shows the picture, from an
// address that lasts as long as the file is here.
function WaitingFile({
  file,
  ...props
}: {
  file: File;
  onRemove: () => void;
  removeLabel: ((name: string) => string) | undefined;
  formatSize: ((bytes: number) => string) | undefined;
}) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const address = URL.createObjectURL(file);
    setSrc(address);
    return () => URL.revokeObjectURL(address);
  }, [file]);

  return <Attachment name={file.name} size={file.size} src={src} {...props} />;
}

/**
 * The files waiting to be sent, each with a button that takes it out
 * again. Put it over the field. It draws nothing while there are none.
 */
export const PromptInputAttachments = forwardRef<
  HTMLUListElement,
  PromptInputAttachmentsProps
>(function PromptInputAttachments(
  {
    label = "Files to send",
    removeLabel,
    formatSize,
    announce = defaultAnnounce,
    children,
    className,
    ...props
  },
  ref,
) {
  const { files, removeFile, takeFiles } = usePromptInput(
    "PromptInputAttachments",
  );
  useEffect(() => takeFiles(), [takeFiles]);

  // A list that changes isn't read out by itself. This is.
  const count = files.length;
  const [said, setSaid] = useState("");
  const before = useRef(count);
  const say = useRef(announce);
  say.current = announce;
  useEffect(() => {
    if (before.current === count) return;
    before.current = count;
    setSaid(say.current(count));
  }, [count]);

  return (
    <>
      {count > 0 ? (
        <Attachments
          ref={ref}
          aria-label={label}
          className={cx("nuv-prompt-input__attachments", className)}
          {...props}
        >
          {files.map((file) =>
            children ? (
              <Fragment key={fileKey(file)}>
                {children(file, () => removeFile(file))}
              </Fragment>
            ) : (
              <WaitingFile
                key={fileKey(file)}
                file={file}
                removeLabel={removeLabel}
                formatSize={formatSize}
                onRemove={() => removeFile(file)}
              />
            ),
          )}
        </Attachments>
      ) : null}
      <span className="nuv-prompt-input__status" role="status">
        {said}
      </span>
    </>
  );
});

export interface PromptInputAttachOwnProps {
  /**
   * The button's name for a screen reader.
   * @default "Attach files"
   */
  label?: string;
  /** In place of the paperclip. */
  children?: ReactNode;
}

export interface PromptInputAttachProps
  extends PromptInputAttachOwnProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      keyof PromptInputAttachOwnProps | "type"
    > {}

/**
 * A button that opens the device's file picker. What's picked waits in
 * the box, in a `PromptInputAttachments`, until it's sent.
 */
export const PromptInputAttach = forwardRef<
  HTMLButtonElement,
  PromptInputAttachProps
>(function PromptInputAttach(
  { label = "Attach files", children, className, onClick, disabled, ...props },
  ref,
) {
  const context = usePromptInput("PromptInputAttach");
  const { addFiles, takeFiles } = context;
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => takeFiles(), [takeFiles]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={cx("nuv-prompt-input__attach", className)}
        aria-label={label}
        disabled={disabled ?? context.disabled}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) input.current?.click();
        }}
        {...props}
      >
        {children ?? (
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m13.5 7.5-5.3 5.3a3.2 3.2 0 0 1-4.5-4.5l5.6-5.6a2.1 2.1 0 0 1 3 3l-5.6 5.6a1.1 1.1 0 0 1-1.5-1.5l5-5" />
          </svg>
        )}
      </button>
      {/* The picker's own input, which nobody sees or reaches. It has no
          name, so the form around it doesn't send it. */}
      <input
        ref={input}
        type="file"
        hidden
        tabIndex={-1}
        accept={context.accept}
        multiple={context.multiple}
        onChange={(event) => {
          addFiles([...(event.target.files ?? [])]);
          // Emptied, so the same file can be picked again once it has
          // been taken out.
          event.target.value = "";
        }}
      />
    </>
  );
});

export interface PromptInputToolbarProps
  extends HTMLAttributes<HTMLDivElement> {}

/**
 * The row under the field. What you put first sits at the start and what
 * you put last at the end: tools in a `PromptInputTools`, then the
 * `PromptInputSubmit`.
 */
export const PromptInputToolbar = forwardRef<
  HTMLDivElement,
  PromptInputToolbarProps
>(function PromptInputToolbar({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cx("nuv-prompt-input__toolbar", className)}
      {...props}
    />
  );
});

export interface PromptInputToolsProps extends HTMLAttributes<HTMLDivElement> {}

/** Buttons and the like at the start of the row: a model, a file, a mode. */
export const PromptInputTools = forwardRef<
  HTMLDivElement,
  PromptInputToolsProps
>(function PromptInputTools({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cx("nuv-prompt-input__tools", className)}
      {...props}
    />
  );
});

export interface PromptInputSubmitOwnProps {
  /**
   * The button's name for a screen reader.
   * @default "Send"
   */
  label?: string;
  /**
   * Its name while a reply is on its way and it stops the reply.
   * @default "Stop"
   */
  stopLabel?: string;
  /** In place of the arrow, or of the square while it stops a reply. */
  children?: ReactNode;
}

export interface PromptInputSubmitProps
  extends PromptInputSubmitOwnProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      keyof PromptInputSubmitOwnProps | "type"
    > {}

/**
 * The button that sends. With nothing to send it's marked as disabled and
 * stays where the keyboard can find it. While the box is `busy` and has
 * an `onStop`, it's the button that stops the reply.
 */
export const PromptInputSubmit = forwardRef<
  HTMLButtonElement,
  PromptInputSubmitProps
>(function PromptInputSubmit(
  {
    label = "Send",
    stopLabel = "Stop",
    children,
    className,
    onClick,
    ...props
  },
  ref,
) {
  const { busy, canSubmit, onStop, disabled } =
    usePromptInput("PromptInputSubmit");
  const stops = busy && onStop !== undefined && !disabled;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (stops) {
      // Stopping makes this the button that sends again, and React does
      // that before the press is over. Without this the same press would
      // go on to send.
      event.preventDefault();
      onStop?.();
    }
    // Marked as disabled and not disabled, so a press has to be turned
    // away here.
    else if (!canSubmit) event.preventDefault();
  }

  return (
    <button
      ref={ref}
      type={stops ? "button" : "submit"}
      className={cx("nuv-prompt-input__submit", className)}
      aria-label={stops ? stopLabel : label}
      aria-disabled={stops || canSubmit ? undefined : true}
      data-stop={stops ? "" : undefined}
      onClick={handleClick}
      {...props}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {stops ? (
            <rect
              x="4"
              y="4"
              width="8"
              height="8"
              rx="1.5"
              fill="currentColor"
              stroke="none"
            />
          ) : (
            <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
          )}
        </svg>
      )}
    </button>
  );
});

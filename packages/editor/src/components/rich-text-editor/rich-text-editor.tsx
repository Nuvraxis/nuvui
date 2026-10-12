"use client";

import { Button } from "@nuvui/react/button";
import { Input } from "@nuvui/react/input";
import { Popover, PopoverContent, PopoverTrigger } from "@nuvui/react/popover";
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "@nuvui/react/toolbar";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { StarterKit } from "@tiptap/starter-kit";
import {
  createContext,
  type FormEvent,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cx } from "../../utils/cx";

/** The document as data, for a place that wants it so and not as HTML. */
export type RichTextEditorJSON = Record<string, unknown>;

/** A heading's level, from the largest to the smallest. */
export type RichTextEditorHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** What a toggle in the toolbar turns on and off. */
export type RichTextEditorFormat =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "codeBlock";

/** What a button in the toolbar does once. */
export type RichTextEditorAction =
  | "undo"
  | "redo"
  | "horizontalRule"
  | "clearFormatting";

/** What comes with the HTML when the text changes. */
export interface RichTextEditorChange {
  /** The document as data. Worked out when it's read. */
  readonly json: RichTextEditorJSON;
  /** The words alone, with no markup. Worked out when it's read. */
  readonly text: string;
  characters: number;
  words: number;
  /** Nothing is written. */
  empty: boolean;
}

/** What `editorRef` gives: the editor from outside it. */
export interface RichTextEditorHandle {
  focus: () => void;
  /** Takes everything out. `onValueChange` is called. */
  clear: () => void;
  getHTML: () => string;
  getJSON: () => RichTextEditorJSON;
  getText: () => string;
  /** Replaces everything. `onValueChange` is called. */
  setHTML: (html: string) => void;
  /** Puts text where the caret is, over what's selected. */
  insertText: (text: string) => void;
}

/**
 * Everything that's said and not drawn, and the words in the box for a
 * link. Each has an English default.
 */
export interface RichTextEditorLabels {
  /** The name of the toolbar. */
  toolbar?: string;
  /** The name of the group of bold, italic and the like. */
  textStyle?: string;
  /** The name of the group of headings, lists and the like. */
  blocks?: string;
  /** The name of the menu over selected text. */
  selectionMenu?: string;
  bold?: string;
  italic?: string;
  underline?: string;
  strike?: string;
  code?: string;
  heading?: (level: RichTextEditorHeadingLevel) => string;
  bulletList?: string;
  orderedList?: string;
  blockquote?: string;
  codeBlock?: string;
  undo?: string;
  redo?: string;
  horizontalRule?: string;
  clearFormatting?: string;
  link?: string;
  /** The name of the field a link's address is written in. */
  linkAddress?: string;
  linkApply?: string;
  linkRemove?: string;
  /** Said when what's written isn't an address a link can have. */
  linkInvalid?: string;
  /** The count under the text. `max` is there when there's a limit. */
  count?: (characters: number, max: number | undefined) => string;
}

const english: Required<RichTextEditorLabels> = {
  toolbar: "Formatting",
  textStyle: "Text style",
  blocks: "Blocks",
  selectionMenu: "Format the selection",
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strike: "Strikethrough",
  code: "Code",
  heading: (level) => `Heading ${level}`,
  bulletList: "Bulleted list",
  orderedList: "Numbered list",
  blockquote: "Quote",
  codeBlock: "Code block",
  undo: "Undo",
  redo: "Redo",
  horizontalRule: "Divider",
  clearFormatting: "Clear formatting",
  link: "Link",
  linkAddress: "Web address",
  linkApply: "Apply",
  linkRemove: "Remove link",
  linkInvalid: "Enter a web address, an email address or a phone number.",
  count: (characters, max) =>
    max === undefined
      ? `${characters} characters`
      : `${characters} of ${max} characters`,
};

interface EditorContextValue {
  editor: Editor | null;
  labels: Required<RichTextEditorLabels>;
  levels: RichTextEditorHeadingLevel[];
  maxLength: number | undefined;
  locked: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

function useParts(part: string) {
  const context = useContext(EditorContext);
  if (!context) throw new Error(`${part} has to be inside a RichTextEditor.`);
  return context;
}

// Nothing written is the empty string, not the empty paragraph the editor
// keeps so there's somewhere to type.
const htmlOf = (editor: Editor) => (editor.isEmpty ? "" : editor.getHTML());

const levelOf = (format: RichTextEditorFormat) =>
  format.startsWith("heading")
    ? (Number(format.slice(7)) as RichTextEditorHeadingLevel)
    : undefined;

function isOn(editor: Editor, format: RichTextEditorFormat) {
  const level = levelOf(format);
  return level
    ? editor.isActive("heading", { level })
    : editor.isActive(format);
}

function toggle(editor: Editor, format: RichTextEditorFormat) {
  const chain = editor.chain().focus();
  const level = levelOf(format);
  if (level) return chain.toggleHeading({ level }).run();
  switch (format) {
    case "bold":
      return chain.toggleBold().run();
    case "italic":
      return chain.toggleItalic().run();
    case "underline":
      return chain.toggleUnderline().run();
    case "strike":
      return chain.toggleStrike().run();
    case "code":
      return chain.toggleCode().run();
    case "bulletList":
      return chain.toggleBulletList().run();
    case "orderedList":
      return chain.toggleOrderedList().run();
    case "blockquote":
      return chain.toggleBlockquote().run();
    case "codeBlock":
      return chain.toggleCodeBlock().run();
    default:
      return false;
  }
}

function act(editor: Editor, action: RichTextEditorAction) {
  const chain = editor.chain().focus();
  switch (action) {
    case "undo":
      return chain.undo().run();
    case "redo":
      return chain.redo().run();
    case "horizontalRule":
      return chain.setHorizontalRule().run();
    case "clearFormatting":
      return chain.unsetAllMarks().clearNodes().run();
  }
}

function canAct(editor: Editor, action: RichTextEditorAction) {
  if (action === "undo") return editor.can().undo();
  if (action === "redo") return editor.can().redo();
  return true;
}

// The addresses a link may have: the web, email, a phone number, and a
// place on this site. An address with no scheme is taken for the web.
// Anything else, a script among them, is no link.
function address(written: string): string | null {
  const text = written.trim();
  if (!text) return null;
  if (/^(https?:\/\/|mailto:|tel:)\S+$/i.test(text)) return text;
  if (/^[/#]\S*$/.test(text)) return text;
  if (/^[a-z][a-z0-9+.-]*:/i.test(text) || /\s/.test(text)) return null;
  return `https://${text}`;
}

const paths: Record<string, string> = {
  code: "M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5",
  bulletList: "M6 4h8M6 8h8M6 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01",
  orderedList: "M7 4h7M7 8h7M7 12h7M2 3h1v3M1.75 9.5h2v1.25h-2V12h2",
  blockquote: "M3 3v10M7 5h7M7 8h7M7 11h4",
  codeBlock: "M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5M9 3 7 13",
  link: "M6.5 9.5a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-.8.8M9.5 6.5a3 3 0 0 0-4.2 0L3 8.8A3 3 0 0 0 7.2 13l.8-.8",
  undo: "M3 6h7a3.5 3.5 0 0 1 0 7H6M3 6l3-3M3 6l3 3",
  redo: "M13 6H6a3.5 3.5 0 0 0 0 7h4M13 6l-3-3M13 6l-3 3",
  horizontalRule: "M2 8h12",
  clearFormatting: "M3 3h8M7 3 5.5 13M10 10l4 4M14 10l-4 4",
};

// A letter where a letter is what's known, B for bold, and a drawing
// for the rest.
const letters: Record<string, string> = {
  bold: "B",
  italic: "I",
  underline: "U",
  strike: "S",
};

function Glyph({ name }: { name: string }) {
  const level = name.startsWith("heading") ? name.slice(7) : undefined;
  const letter = level ? `H${level}` : letters[name];
  if (letter) {
    return (
      <span
        aria-hidden="true"
        data-glyph={level ? "heading" : name}
        className="nuv-rich-text-editor__glyph"
      >
        {letter}
      </span>
    );
  }
  return (
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
      <path d={paths[name]} />
    </svg>
  );
}

export interface RichTextEditorOwnProps {
  /**
   * The text as HTML, when you keep it. Use it with `onValueChange`.
   * Nothing written is the empty string.
   */
  value?: string;
  /** The text to begin with, when it's kept here. */
  defaultValue?: string;
  /**
   * Called when the text changes, with the HTML and, beside it, the same
   * as data, as plain words, and its counts.
   */
  onValueChange?: (html: string, change: RichTextEditorChange) => void;
  /** Shown while nothing is written. */
  placeholder?: string;
  /**
   * It can't be written in, and isn't sent with a form.
   * @default false
   */
  disabled?: boolean;
  /**
   * It can be read and selected, and not changed.
   * @default false
   */
  readOnly?: boolean;
  /** The most characters it takes. Typing and pasting stop there. */
  maxLength?: number;
  /**
   * Puts the caret in it when it's first drawn.
   * @default false
   */
  autoFocus?: boolean;
  /** With a name, the HTML is sent with the form it's in. */
  name?: string;
  /**
   * The heading levels the text can have, and the toolbar offers. Give
   * the ones under the page's own headings.
   * @default [2, 3]
   */
  headingLevels?: RichTextEditorHeadingLevel[];
  /** What's said and not drawn, for another language. */
  labels?: RichTextEditorLabels;
  /** The editor from outside: focus, clear, and the text as data. */
  editorRef?: Ref<RichTextEditorHandle>;
  /**
   * The parts, when the ones it draws by itself aren't the ones you
   * want: a toolbar, the text, and the count if there's a `maxLength`.
   * A menu on the selection is a part to add here.
   */
  children?: ReactNode;
}

export interface RichTextEditorProps
  extends RichTextEditorOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof RichTextEditorOwnProps> {}

const defaultLevels: RichTextEditorHeadingLevel[] = [2, 3];

/**
 * A box to write formatted text in: bold and italic, headings, lists,
 * quotes, code and links. Its value is HTML. Name it with `aria-label` or
 * `aria-labelledby`, which go to the text itself, as `aria-describedby`,
 * `aria-invalid` and `aria-required` do.
 */
export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  function RichTextEditor(
    {
      value,
      defaultValue,
      onValueChange,
      placeholder,
      disabled = false,
      readOnly = false,
      maxLength,
      autoFocus = false,
      name,
      headingLevels = defaultLevels,
      labels: given,
      editorRef,
      children,
      className,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledby,
      "aria-describedby": ariaDescribedby,
      "aria-invalid": ariaInvalid,
      "aria-required": ariaRequired,
      ...props
    },
    ref,
  ) {
    const labels = useMemo(() => ({ ...english, ...given }), [given]);
    const levelsKey = headingLevels.join(",");
    // biome-ignore lint/correctness/useExhaustiveDependencies: the levels by what they are, since a new array of the same ones is given on every render
    const levels = useMemo(() => headingLevels, [levelsKey]);
    const locked = disabled || readOnly;

    // The HTML as it last was. A new editor is made when the placeholder,
    // the limit or the levels change, and it starts from this.
    const html = useRef(value ?? defaultValue ?? "");
    const latest = useRef({ onValueChange, value });
    latest.current = { onValueChange, value };
    // What's been reported and hasn't come back as `value` yet. Typing
    // is quicker than a parent draws, so a value can arrive that's older
    // than what's written, and writing it in would take letters away.
    const reported = useRef<string[]>([]);

    const attributes = useMemo(() => {
      const all: Record<string, string> = {
        class: "nuv-rich-text-editor__content",
        role: "textbox",
        "aria-multiline": "true",
      };
      const optional: Record<string, unknown> = {
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledby,
        "aria-describedby": ariaDescribedby,
        "aria-invalid": ariaInvalid,
        "aria-required": ariaRequired,
        "aria-placeholder": placeholder,
        "aria-readonly": readOnly ? "true" : undefined,
        "aria-disabled": disabled ? "true" : undefined,
      };
      for (const [key, set] of Object.entries(optional)) {
        if (set !== undefined && set !== false) all[key] = String(set);
      }
      return all;
    }, [
      ariaLabel,
      ariaLabelledby,
      ariaDescribedby,
      ariaInvalid,
      ariaRequired,
      placeholder,
      readOnly,
      disabled,
    ]);

    const extensions = useMemo(
      () => [
        StarterKit.configure({
          heading: levels.length > 0 ? { levels } : false,
          // It would keep an empty paragraph under a heading or a list
          // that ends the text, and that paragraph would be in the HTML.
          trailingNode: false,
          link: {
            // A click on a link in text that's being written puts the
            // caret there. It doesn't leave the page.
            openOnClick: false,
            defaultProtocol: "https",
            protocols: ["http", "https", "mailto", "tel"],
            HTMLAttributes: { rel: "noopener noreferrer nofollow" },
          },
        }),
        Placeholder.configure({
          placeholder: placeholder ?? "",
          emptyEditorClass: "nuv-rich-text-editor__placeholder",
        }),
        CharacterCount.configure({ limit: maxLength ?? null }),
      ],
      [levels, placeholder, maxLength],
    );

    const editor = useEditor(
      {
        // Nothing is drawn on a server, where there's no document to
        // draw it in. It's drawn once the page is in a browser.
        immediatelyRender: false,
        shouldRerenderOnTransaction: false,
        // Its own styles would go in a style element it makes, which a
        // page with a strict content security policy turns away. They're
        // in the stylesheet.
        injectCSS: false,
        extensions,
        content: html.current,
        editable: !locked,
        autofocus: autoFocus,
        editorProps: { attributes },
        onUpdate({ editor: now }) {
          const next = htmlOf(now);
          if (next === html.current) return;
          html.current = next;
          reported.current = [...reported.current.slice(-49), next];
          const count = now.storage.characterCount;
          latest.current.onValueChange?.(next, {
            get json() {
              return now.getJSON() as RichTextEditorJSON;
            },
            get text() {
              return now.getText();
            },
            characters: count.characters(),
            words: count.words(),
            empty: now.isEmpty,
          });
        },
      },
      [extensions],
    );

    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!locked, false);
      editor.setOptions({ editorProps: { attributes } });
    }, [editor, locked, attributes]);

    // A value from outside that isn't what's written is written in. One
    // that only repeats what was reported is left alone, so the caret
    // stays where it is as the text is typed.
    useEffect(() => {
      if (!editor || value === undefined) return;
      if (value === html.current) {
        reported.current = [];
        return;
      }
      const echo = reported.current.lastIndexOf(value);
      if (echo !== -1) {
        reported.current = reported.current.slice(echo + 1);
        return;
      }
      reported.current = [];
      html.current = value;
      editor.commands.setContent(value, { emitUpdate: false });
    }, [editor, value]);

    useImperativeHandle(
      editorRef,
      () => ({
        focus: () => editor?.commands.focus(),
        clear: () => editor?.commands.clearContent(true),
        getHTML: () => (editor ? htmlOf(editor) : html.current),
        getJSON: () => (editor?.getJSON() ?? {}) as RichTextEditorJSON,
        getText: () => editor?.getText() ?? "",
        setHTML: (next) => editor?.commands.setContent(next),
        insertText: (text) => editor?.chain().focus().insertContent(text).run(),
      }),
      [editor],
    );

    const context = useMemo(
      () => ({ editor, labels, levels, maxLength, locked }),
      [editor, labels, levels, maxLength, locked],
    );

    return (
      <div
        ref={ref}
        data-disabled={disabled ? "" : undefined}
        data-readonly={readOnly ? "" : undefined}
        data-invalid={
          ariaInvalid === true || ariaInvalid === "true" ? "" : undefined
        }
        className={cx("nuv-rich-text-editor", className)}
        {...props}
      >
        <EditorContext.Provider value={context}>
          {children ?? (
            <>
              <RichTextEditorToolbar />
              <RichTextEditorContent />
              {maxLength === undefined ? null : <RichTextEditorCount />}
            </>
          )}
          {name && !disabled ? (
            <Field name={name} start={html.current} />
          ) : null}
        </EditorContext.Provider>
      </div>
    );
  },
);

// Something read from the editor, and read again whenever the text or
// the selection changes. Tiptap has a hook for this, which goes on
// answering for no editor until the first change after one is made, so
// a count would say 0 over text that was there to begin with.
function useEditorValue<Value extends string | number | boolean>(
  editor: Editor | null,
  read: (editor: Editor) => Value,
  none: Value,
): Value {
  const reader = useRef(read);
  reader.current = read;
  const subscribe = useCallback(
    (changed: () => void) => {
      if (!editor) return () => {};
      editor.on("create", changed);
      editor.on("transaction", changed);
      editor.on("update", changed);
      return () => {
        editor.off("create", changed);
        editor.off("transaction", changed);
        editor.off("update", changed);
      };
    },
    [editor],
  );
  return useSyncExternalStore(
    subscribe,
    () => (editor ? reader.current(editor) : none),
    () => none,
  );
}

// What a form is sent: the HTML, in a field nobody sees.
function Field({ name, start }: { name: string; start: string }) {
  const { editor } = useParts("RichTextEditor");
  const now = useEditorValue(editor, htmlOf, start);
  return <input type="hidden" name={name} value={now} />;
}

export interface RichTextEditorFormatsOwnProps {
  /** The toggles, in the order they're drawn. */
  items: RichTextEditorFormat[];
}

export interface RichTextEditorFormatsProps
  extends RichTextEditorFormatsOwnProps,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      keyof RichTextEditorFormatsOwnProps | "defaultValue" | "dir"
    > {}

/**
 * A group of toggles in a toolbar, each on while the text at the caret
 * has what it's for. Name the group with `aria-label`.
 */
export const RichTextEditorFormats = forwardRef<
  HTMLDivElement,
  RichTextEditorFormatsProps
>(function RichTextEditorFormats({ items, className, ...props }, ref) {
  const { editor, labels, locked } = useParts("RichTextEditorFormats");
  const key = items.join(",");
  // A string, so the same toggles being on is the same answer and
  // nothing is drawn again.
  const on = useEditorValue(
    editor,
    (current) =>
      key
        .split(",")
        .filter((item) => isOn(current, item as RichTextEditorFormat))
        .join(","),
    "",
  );
  const active = on ? on.split(",") : [];

  const named = (format: RichTextEditorFormat) => {
    const level = levelOf(format);
    return level
      ? labels.heading(level)
      : labels[format as Exclude<RichTextEditorFormat, `heading${number}`>];
  };

  return (
    <ToolbarToggleGroup
      ref={ref}
      type="multiple"
      value={active}
      disabled={!editor || locked}
      onValueChange={(next: string[]) => {
        const changed = items.find(
          (item) => next.includes(item) !== active.includes(item),
        );
        if (editor && changed) toggle(editor, changed);
      }}
      className={cx("nuv-rich-text-editor__group", className)}
      {...props}
    >
      {items.map((item) => (
        <ToolbarToggleItem
          key={item}
          value={item}
          aria-label={named(item)}
          title={named(item)}
          className="nuv-rich-text-editor__item"
        >
          <Glyph name={item} />
        </ToolbarToggleItem>
      ))}
    </ToolbarToggleGroup>
  );
});

export interface RichTextEditorActionsOwnProps {
  /** The buttons, in the order they're drawn. */
  items: RichTextEditorAction[];
}

export interface RichTextEditorActionsProps
  extends RichTextEditorActionsOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof RichTextEditorActionsOwnProps> {}

/** Buttons in a toolbar that each do one thing once: undo, a divider. */
export const RichTextEditorActions = forwardRef<
  HTMLDivElement,
  RichTextEditorActionsProps
>(function RichTextEditorActions({ items, className, ...props }, ref) {
  const { editor, labels, locked } = useParts("RichTextEditorActions");
  const key = items.join(",");
  const can = useEditorValue(
    editor,
    (current) =>
      key
        .split(",")
        .filter((item) => canAct(current, item as RichTextEditorAction))
        .join(","),
    "",
  );
  const able = can ? can.split(",") : [];

  return (
    <div
      ref={ref}
      className={cx("nuv-rich-text-editor__group", className)}
      {...props}
    >
      {items.map((item) => (
        <ToolbarButton
          key={item}
          aria-label={labels[item]}
          title={labels[item]}
          disabled={!editor || locked || !able.includes(item)}
          onClick={() => editor && act(editor, item)}
          className="nuv-rich-text-editor__item"
        >
          <Glyph name={item} />
        </ToolbarButton>
      ))}
    </div>
  );
});

/**
 * The button for a link, in a toolbar. It opens a box to write the
 * address in, with what's selected as the link's words. On a link, the
 * box has its address and a button that takes the link off.
 */
export const RichTextEditorLink = forwardRef<HTMLButtonElement, object>(
  function RichTextEditorLink(_props, ref) {
    const { editor, labels, locked } = useParts("RichTextEditorLink");
    const id = useId();
    const [open, setOpen] = useState(false);
    const [written, setWritten] = useState("");
    const [wrong, setWrong] = useState(false);
    const on = useEditorValue(
      editor,
      (current) => current.isActive("link"),
      false,
    );

    function change(next: boolean) {
      if (next && editor) {
        setWritten(String(editor.getAttributes("link").href ?? ""));
        setWrong(false);
      }
      setOpen(next);
    }

    function apply(event: FormEvent) {
      event.preventDefault();
      if (!editor) return;
      const href = address(written);
      if (!href) {
        setWrong(true);
        return;
      }
      const chain = editor.chain().focus().extendMarkRange("link");
      if (editor.state.selection.empty && !editor.isActive("link")) {
        // Nothing is selected to be the link's words. The address is.
        chain
          .insertContent({
            type: "text",
            text: written.trim(),
            marks: [{ type: "link", attrs: { href } }],
          })
          .run();
      } else {
        chain.setLink({ href }).run();
      }
      setOpen(false);
    }

    function remove() {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      setOpen(false);
    }

    return (
      <Popover open={open} onOpenChange={change}>
        <PopoverTrigger asChild>
          <ToolbarButton
            ref={ref}
            aria-label={labels.link}
            title={labels.link}
            aria-pressed={on ? true : undefined}
            data-state={on ? "on" : "off"}
            disabled={!editor || locked}
            className="nuv-rich-text-editor__item"
          >
            <Glyph name="link" />
          </ToolbarButton>
        </PopoverTrigger>
        <PopoverContent align="start" aria-label={labels.link}>
          <form className="nuv-rich-text-editor__link" onSubmit={apply}>
            <Input
              aria-label={labels.linkAddress}
              aria-invalid={wrong ? true : undefined}
              aria-describedby={wrong ? id : undefined}
              inputMode="url"
              placeholder="https://"
              value={written}
              onChange={(event) => {
                setWritten(event.target.value);
                setWrong(false);
              }}
            />
            {wrong ? (
              <p id={id} className="nuv-rich-text-editor__link-error">
                {labels.linkInvalid}
              </p>
            ) : null}
            <div className="nuv-rich-text-editor__link-actions">
              <Button type="submit" size="sm">
                {labels.linkApply}
              </Button>
              {on ? (
                <Button
                  type="button"
                  intent="secondary"
                  size="sm"
                  onClick={remove}
                >
                  {labels.linkRemove}
                </Button>
              ) : null}
            </div>
          </form>
        </PopoverContent>
      </Popover>
    );
  },
);

export interface RichTextEditorToolbarOwnProps {
  /**
   * The groups and buttons, when the ones it draws by itself aren't the
   * ones you want.
   */
  children?: ReactNode;
}

// The attributes of a div, and not the core toolbar's own type. That one
// is written in terms of a package this one doesn't depend on, and the
// build would copy that package's types in here to describe it.
export interface RichTextEditorToolbarProps
  extends RichTextEditorToolbarOwnProps,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      keyof RichTextEditorToolbarOwnProps | "dir"
    > {}

const marks: RichTextEditorFormat[] = [
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
];
const history: RichTextEditorAction[] = ["undo", "redo"];

/**
 * The row of controls over the text. It's one stop for the Tab key, and
 * the arrow keys move along it.
 */
export const RichTextEditorToolbar = forwardRef<
  HTMLDivElement,
  RichTextEditorToolbarProps
>(function RichTextEditorToolbar({ children, className, ...props }, ref) {
  const { labels, levels } = useParts("RichTextEditorToolbar");
  const blocks = useMemo<RichTextEditorFormat[]>(
    () => [
      ...levels.map((level) => `heading${level}` as RichTextEditorFormat),
      "bulletList",
      "orderedList",
      "blockquote",
      "codeBlock",
    ],
    [levels],
  );

  return (
    <Toolbar
      ref={ref}
      aria-label={labels.toolbar}
      className={cx("nuv-rich-text-editor__toolbar", className)}
      {...props}
    >
      {children ?? (
        <>
          <RichTextEditorFormats items={marks} aria-label={labels.textStyle} />
          <ToolbarSeparator />
          <RichTextEditorFormats items={blocks} aria-label={labels.blocks} />
          <ToolbarSeparator />
          <RichTextEditorLink />
          <ToolbarSeparator />
          <RichTextEditorActions items={history} />
        </>
      )}
    </Toolbar>
  );
});

export type RichTextEditorContentProps = HTMLAttributes<HTMLDivElement>;

/** The text. It's what's written in. */
export const RichTextEditorContent = forwardRef<
  HTMLDivElement,
  RichTextEditorContentProps
>(function RichTextEditorContent({ className, ...props }, ref) {
  const { editor } = useParts("RichTextEditorContent");

  return (
    <EditorContent
      ref={ref}
      editor={editor}
      className={cx("nuv-rich-text-editor__body", className)}
      {...props}
    />
  );
});

export interface RichTextEditorBubbleMenuOwnProps {
  /**
   * The toggles it offers.
   * @default ["bold", "italic", "underline", "strike"]
   */
  items?: RichTextEditorFormat[];
}

export interface RichTextEditorBubbleMenuProps
  extends RichTextEditorBubbleMenuOwnProps,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      keyof RichTextEditorBubbleMenuOwnProps
    > {}

const quick: RichTextEditorFormat[] = ["bold", "italic", "underline", "strike"];

/**
 * A small toolbar that comes up over text when it's selected, for the
 * formats used most. It's drawn when it's given as a child of
 * `RichTextEditor`, and it's for an editor with no toolbar over the
 * text: under one, it covers the toolbar when the first line is selected.
 */
export const RichTextEditorBubbleMenu = forwardRef<
  HTMLDivElement,
  RichTextEditorBubbleMenuProps
>(function RichTextEditorBubbleMenu(
  { items = quick, className, ...props },
  ref,
) {
  const { editor, labels, locked } = useParts("RichTextEditorBubbleMenu");
  if (!editor || locked) return null;

  return (
    <BubbleMenu
      ref={ref}
      editor={editor}
      className={cx("nuv-rich-text-editor__bubble", className)}
      {...props}
    >
      <Toolbar
        aria-label={labels.selectionMenu}
        className="nuv-rich-text-editor__bubble-toolbar"
      >
        <RichTextEditorFormats items={items} aria-label={labels.textStyle} />
      </Toolbar>
    </BubbleMenu>
  );
});

export type RichTextEditorCountProps = HTMLAttributes<HTMLParagraphElement>;

/** How much is written, and how much can be when there's a `maxLength`. */
export const RichTextEditorCount = forwardRef<
  HTMLParagraphElement,
  RichTextEditorCountProps
>(function RichTextEditorCount({ className, ...props }, ref) {
  const { editor, labels, maxLength } = useParts("RichTextEditorCount");
  const count = useEditorValue(
    editor,
    (current) => current.storage.characterCount.characters() as number,
    0,
  );

  return (
    <p
      ref={ref}
      data-full={maxLength !== undefined && count >= maxLength ? "" : undefined}
      className={cx("nuv-rich-text-editor__count", className)}
      {...props}
    >
      {labels.count(count, maxLength)}
    </p>
  );
});

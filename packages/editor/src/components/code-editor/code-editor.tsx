"use client";

import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  simplifySelection,
  temporarilySetTabFocusMode,
} from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter as foldGutterExtension,
  foldKeymap,
  indentOnInput,
  indentUnit,
} from "@codemirror/language";
import {
  type Diagnostic,
  diagnosticCount,
  lintGutter,
  lintKeymap,
  setDiagnostics,
} from "@codemirror/lint";
import {
  highlightSelectionMatches,
  search,
  searchKeymap,
} from "@codemirror/search";
import {
  Annotation,
  Compartment,
  EditorState,
  type Extension,
  type StateEffect,
  Transaction,
} from "@codemirror/state";
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers as lineNumbersExtension,
  placeholder as placeholderExtension,
  rectangularSelection,
} from "@codemirror/view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react/select";
import { Toolbar, ToolbarButton, ToolbarSeparator } from "@nuvui/react/toolbar";
import { VisuallyHidden } from "@nuvui/react/visually-hidden";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "../../utils/cx";
import {
  CodeEditorContext,
  type CodeEditorContextValue,
  createViewStore,
  useCodeEditor,
  useViewValue,
} from "./context";
import {
  type CodeEditorLabels,
  type CodeEditorSeverity,
  englishLabels,
  phrasesOf,
} from "./labels";
import {
  type CodeEditorLanguage,
  commonLanguages,
  languageOfPath,
  loadLanguage,
  nameOf,
  supportNow,
} from "./languages";
import { SearchPanel } from "./search";
import { codeHighlighting, editorTheme, heightTheme, lines } from "./theme";

export type { CodeEditorLabels, CodeEditorSeverity } from "./labels";
export type { CodeEditorLanguage } from "./languages";

/** A stretch of the code, by where it starts and ends, in characters. */
export interface CodeEditorRange {
  from: number;
  to: number;
}

/** What comes with the code when it changes. */
export interface CodeEditorChange {
  lines: number;
  characters: number;
  /** Each place that's selected. One with `from` equal to `to` is a cursor. */
  selections: readonly CodeEditorRange[];
  /** The line the main cursor is on, from 1. */
  line: number;
  /** The column the main cursor is at, from 1. */
  column: number;
}

/** A problem in the code, underlined where it is and marked in the gutter. */
export interface CodeEditorDiagnostic {
  /** Where the problem starts, in characters from the start of the code. */
  from: number;
  /** Where it ends. The same as `from` for a point. */
  to: number;
  severity: CodeEditorSeverity;
  message: string;
  /** What found it, such as the name of a linter. */
  source?: string;
}

/** What `editorRef` gives: the editor from outside it. */
export interface CodeEditorHandle {
  focus: () => void;
  getValue: () => string;
  /** Replaces all the code. `onValueChange` is called. */
  setValue: (code: string) => void;
  /** Puts text where the cursor is, over what's selected. */
  insertText: (text: string) => void;
  /** Selects from one place to another, or puts the cursor at one. */
  select: (from: number, to?: number) => void;
  /** CodeMirror's own view, for anything else. Null until it's drawn. */
  readonly view: EditorView | null;
}

export interface CodeEditorOwnProps {
  /** The code, when you keep it. Use it with `onValueChange`. */
  value?: string;
  /** The code to begin with, when it's kept here. */
  defaultValue?: string;
  /**
   * Called when the code is changed in the editor, with the code and,
   * beside it, its lines, characters, selections and where the cursor is.
   */
  onValueChange?: (code: string, change: CodeEditorChange) => void;
  /**
   * The language, by a name such as `"typescript"`, `"ts"` or `"py"`, or
   * as any `LanguageSupport`. A language is fetched the first time it's
   * used. With none, it's the one `path` ends in, or plain text.
   */
  language?: CodeEditorLanguage;
  /** The language to begin with, when the toolbar changes it here. */
  defaultLanguage?: string;
  /**
   * Called with a language's name when it's picked in the toolbar, or
   * the empty string for plain text.
   */
  onLanguageChange?: (language: string) => void;
  /**
   * Draws the number of each line beside it.
   * @default true
   */
  lineNumbers?: boolean;
  /** Wraps a line longer than the box, when you keep whether it does. */
  wrap?: boolean;
  /**
   * Wraps long lines to begin with, when it's kept here.
   * @default false
   */
  defaultWrap?: boolean;
  /** Called when wrapping is turned on or off in the toolbar. */
  onWrapChange?: (wrap: boolean) => void;
  /**
   * How many spaces a Tab indents, and how wide a tab character is.
   * @default 2
   */
  tabSize?: number;
  /**
   * The fewest lines tall it is.
   * @default 4
   */
  minLines?: number;
  /** The most lines tall it grows. Past them, it scrolls. */
  maxLines?: number;
  /**
   * Draws a button beside each block of code that folds it away.
   * @default true
   */
  foldGutter?: boolean;
  /**
   * What Tab does. `"indent"` indents, and Escape then Tab leaves the
   * editor, which is said to a screen reader. `"focus"` leaves at once.
   * @default "indent"
   */
  tabBehavior?: "indent" | "focus";
  /**
   * Formats the code, from the toolbar and from Shift-Alt-F. Prettier or
   * anything else is yours to give: nothing is installed with this.
   */
  format?: (code: string) => string | Promise<string>;
  /** Problems to show, underlined in the code and marked in the gutter. */
  diagnostics?: readonly CodeEditorDiagnostic[];
  /**
   * The file the code is, for a set of them. The editor keeps each file
   * it's shown, with its own undo history, selection and scroll, and
   * opens it again as it was. Give `value` for the file along with it.
   */
  path?: string;
  /** Shown while there's no code. */
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
  /**
   * Puts the cursor in it when it's first drawn.
   * @default false
   */
  autoFocus?: boolean;
  /** With a name, the code is sent with the form it's in. */
  name?: string;
  /**
   * The nonce of a content security policy. CodeMirror adds its styles to
   * the page as it runs, and a strict policy needs it on them.
   */
  nonce?: string;
  /** Anything else CodeMirror has, from its own packages or yours. */
  extensions?: readonly Extension[];
  /** What's said and not drawn, for another language. */
  labels?: CodeEditorLabels;
  /** The editor from outside: focus, the code, and CodeMirror's view. */
  editorRef?: Ref<CodeEditorHandle>;
  /**
   * The parts, when the ones it draws by itself aren't the ones you
   * want: a toolbar, the code, and a status bar.
   */
  children?: ReactNode;
}

export interface CodeEditorProps
  extends CodeEditorOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof CodeEditorOwnProps> {}

// A change made from outside, by `value` or a file being opened. It isn't
// reported back through onValueChange.
const fromOutside = Annotation.define<boolean>();

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const noExtensions: readonly Extension[] = [];
// No language: plain text. One value, so it's the same each time.
const none: Extension = [];

// The smallest change from one text to another, so the cursor stays where
// it is in the part that didn't change.
function smallestChange(from: string, to: string) {
  let start = 0;
  const shorter = Math.min(from.length, to.length);
  while (start < shorter && from[start] === to[start]) start += 1;
  let end = 0;
  while (
    end < shorter - start &&
    from[from.length - 1 - end] === to[to.length - 1 - end]
  ) {
    end += 1;
  }
  return {
    from: start,
    to: from.length - end,
    insert: to.slice(start, to.length - end),
  };
}

function changeOf(state: EditorState): CodeEditorChange {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  return {
    lines: state.doc.lines,
    characters: state.doc.length,
    selections: state.selection.ranges.map(({ from, to }) => ({ from, to })),
    line: line.number,
    column: head - line.from + 1,
  };
}

const svg = "http://www.w3.org/2000/svg";
const shapes: Record<CodeEditorSeverity, string> = {
  error: "M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13M8 4.5v4M8 11h.01",
  warning: "M8 1.75 15 14H1L8 1.75M8 6v3.5M8 11.75h.01",
  info: "M8 1.5 14.5 8 8 14.5 1.5 8 8 1.5M8 7.5V11M8 5.25h.01",
  hint: "M8 1.5 14.5 8 8 14.5 1.5 8 8 1.5M8 7.5V11M8 5.25h.01",
};

// A problem's words in its tooltip: its kind as a word and an icon, so it
// isn't told by color alone, and then what's wrong.
function problemMessage(
  diagnostic: CodeEditorDiagnostic,
  labels: Required<CodeEditorLabels>,
) {
  return () => {
    const box = document.createElement("span");
    box.className = "nuv-code-editor__problem";
    const kind = document.createElement("span");
    kind.className = "nuv-code-editor__severity";
    kind.dataset.severity = diagnostic.severity;
    const icon = document.createElementNS(svg, "svg");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.5");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    const path = document.createElementNS(svg, "path");
    path.setAttribute("d", shapes[diagnostic.severity]);
    icon.append(path);
    kind.append(icon, document.createTextNode(labels[diagnostic.severity]));
    const text = document.createElement("span");
    text.textContent = diagnostic.message;
    box.append(kind, text);
    return box;
  };
}

function diagnosticsOf(
  given: readonly CodeEditorDiagnostic[],
  length: number,
  labels: Required<CodeEditorLabels>,
): Diagnostic[] {
  return given.map((diagnostic) => {
    // A problem from a check of the code a moment ago can be past the end
    // of what's there now.
    const from = Math.max(0, Math.min(diagnostic.from, length));
    const to = Math.max(from, Math.min(diagnostic.to, length));
    return {
      from,
      to,
      severity: diagnostic.severity,
      message: diagnostic.message,
      ...(diagnostic.source ? { source: diagnostic.source } : {}),
      renderMessage: problemMessage(diagnostic, labels),
    };
  });
}

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type Settings =
  | "gutters"
  | "wrap"
  | "tabSize"
  | "editable"
  | "attributes"
  | "phrases"
  | "placeholder"
  | "tab"
  | "height"
  | "cursor"
  | "nonce"
  | "extensions";

const settingNames: Settings[] = [
  "gutters",
  "wrap",
  "tabSize",
  "editable",
  "attributes",
  "phrases",
  "placeholder",
  "tab",
  "height",
  "cursor",
  "nonce",
  "extensions",
];

/**
 * A box to write code in, on CodeMirror: colored as `CodeBlock` colors
 * code, with line numbers, folding, search, completion, problems in the
 * gutter, and a file's own history when it's one of a set. Name it with
 * `aria-label` or `aria-labelledby`, which go to the code itself, as
 * `aria-describedby`, `aria-invalid` and `aria-required` do.
 */
export const CodeEditor = forwardRef<HTMLDivElement, CodeEditorProps>(
  function CodeEditor(
    {
      value,
      defaultValue,
      onValueChange,
      language: languageProp,
      defaultLanguage,
      onLanguageChange,
      lineNumbers = true,
      wrap: wrapProp,
      defaultWrap = false,
      onWrapChange,
      tabSize = 2,
      minLines = 4,
      maxLines,
      foldGutter = true,
      tabBehavior = "indent",
      format,
      diagnostics,
      path,
      placeholder,
      disabled = false,
      readOnly = false,
      autoFocus = false,
      name,
      nonce,
      extensions = noExtensions,
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
    const labels = useMemo(() => ({ ...englishLabels, ...given }), [given]);
    const locked = disabled || readOnly;
    const store = useMemo(createViewStore, []);
    const [host, setHost] = useState<HTMLElement | null>(null);
    const [view, setView] = useState<EditorView | null>(null);
    const viewRef = useRef<EditorView | null>(null);
    const [searchHost, setSearchHost] = useState<HTMLElement | null>(null);
    const hintId = useId();
    const leaveHint = tabBehavior === "indent" && !locked;

    const latest = useRef({ value, defaultValue, onValueChange, labels });
    latest.current = { value, defaultValue, onValueChange, labels };
    // What's been reported and hasn't come back as `value` yet. Typing is
    // quicker than a parent draws, so a value can arrive that's older than
    // what's written, and writing it in would take letters away.
    const reported = useRef<string[]>([]);

    // The language: given, picked in the toolbar for this file, given to
    // begin with, or the one the file's name ends in.
    const [picked, setPicked] = useState<Record<string, string>>({});
    const file = path ?? "";
    const language: CodeEditorLanguage | undefined =
      languageProp ?? picked[file] ?? defaultLanguage ?? languageOfPath(path);
    const setLanguage = useCallback(
      (next: string) => {
        if (languageProp === undefined) {
          setPicked((before) => ({ ...before, [file]: next }));
        }
        onLanguageChange?.(next);
      },
      [languageProp, file, onLanguageChange],
    );

    const [wrapState, setWrapState] = useState(defaultWrap);
    const wrap = wrapProp ?? wrapState;
    const setWrap = useCallback(
      (next: boolean) => {
        if (wrapProp === undefined) setWrapState(next);
        onWrapChange?.(next);
      },
      [wrapProp, onWrapChange],
    );

    const compartments = useMemo(
      () =>
        Object.fromEntries(
          settingNames.map((setting) => [setting, new Compartment()]),
        ) as Record<Settings, Compartment>,
      [],
    );
    const languageCompartment = useMemo(() => new Compartment(), []);
    // The language's support as it's in the view now. It's set when the
    // language has been fetched, and not on every render.
    const languageSupport = useRef<Extension>(supportNow(language) ?? none);

    const attributes = useMemo(() => {
      const all: Record<string, string> = {
        // A class of the package's own, for the stylesheet to find it by.
        class: "nuv-code-editor__code",
        // Code reads left to right in a page that doesn't.
        dir: "ltr",
        "aria-multiline": "true",
      };
      const describedBy =
        [ariaDescribedby, leaveHint ? hintId : undefined]
          .filter(Boolean)
          .join(" ") || undefined;
      const optional: Record<string, unknown> = {
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledby,
        "aria-describedby": describedBy,
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
      leaveHint,
      hintId,
    ]);

    const showsProblems = diagnostics !== undefined;
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
      if (typeof window.matchMedia !== "function") return;
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(query.matches);
      const changed = () => setReduced(query.matches);
      query.addEventListener("change", changed);
      return () => query.removeEventListener("change", changed);
    }, []);

    // What each setting is now. A view is made with these, and a file
    // opened again is brought up to them.
    const settings = useMemo<Record<Settings, Extension>>(
      () => ({
        gutters: [
          lineNumbers
            ? [lineNumbersExtension(), highlightActiveLineGutter()]
            : [],
          showsProblems ? lintGutter() : [],
          foldGutter ? foldGutterExtension() : [],
        ],
        wrap: wrap ? EditorView.lineWrapping : [],
        tabSize: [
          EditorState.tabSize.of(tabSize),
          indentUnit.of(" ".repeat(Math.max(1, tabSize))),
        ],
        editable: [
          EditorView.editable.of(!disabled),
          EditorState.readOnly.of(locked),
        ],
        attributes: EditorView.contentAttributes.of(attributes),
        phrases: EditorState.phrases.of(phrasesOf(labels)),
        placeholder: placeholder ? placeholderExtension(placeholder) : [],
        tab: tabBehavior === "indent" ? keymap.of([indentWithTab]) : [],
        height: heightTheme(minLines, maxLines),
        // The cursor doesn't blink for someone who asks for less motion.
        cursor: drawSelection({
          cursorBlinkRate: reduced || reducedMotion() ? 0 : 1200,
        }),
        nonce: nonce ? EditorView.cspNonce.of(nonce) : [],
        extensions: [...extensions],
      }),
      [
        lineNumbers,
        showsProblems,
        foldGutter,
        wrap,
        tabSize,
        disabled,
        locked,
        attributes,
        labels,
        placeholder,
        tabBehavior,
        minLines,
        maxLines,
        reduced,
        nonce,
        extensions,
      ],
    );
    const current = useRef(settings);
    current.current = settings;
    const applied = useRef<Partial<Record<Settings, Extension>>>({});

    const formatRef = useRef(format);
    formatRef.current = format;
    const runFormat = useCallback(async () => {
      const now = viewRef.current;
      const formatter = formatRef.current;
      if (!now || !formatter || now.state.readOnly) return;
      const code = now.state.doc.toString();
      let next: string;
      try {
        next = await formatter(code);
      } catch {
        now.dispatch({
          effects: EditorView.announce.of(latest.current.labels.formatFailed),
        });
        return;
      }
      // Typing while it was formatting wins over the formatted code.
      if (now.state.doc.toString() !== code || next === code) return;
      const head = now.state.selection.main.head;
      now.dispatch({
        changes: smallestChange(code, next),
        selection: { anchor: Math.min(head, next.length) },
        userEvent: "input.format",
        scrollIntoView: true,
      });
    }, []);

    const base = useMemo<Extension>(
      () => [
        history(),
        highlightSpecialChars(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({
          icons: false,
          tooltipClass: () => "nuv-code-editor__completions",
        }),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        search({
          top: true,
          // The panel is drawn with the core's fields and buttons, into the
          // place CodeMirror makes for it.
          createPanel: () => {
            const dom = document.createElement("div");
            dom.className = "nuv-code-editor__search";
            return {
              dom,
              top: true,
              mount: () => setSearchHost(dom),
              destroy: () => setSearchHost(null),
            };
          },
        }),
        codeHighlighting,
        editorTheme,
        keymap.of([
          {
            // Escape lets Tab leave the editor for a moment, once there's
            // only one cursor left.
            key: "Escape",
            run: (now) =>
              simplifySelection(now) || temporarilySetTabFocusMode(now),
          },
          {
            key: "Shift-Alt-f",
            run: () => {
              if (!formatRef.current) return false;
              void runFormat();
              return true;
            },
          },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (
            update.docChanged &&
            !update.transactions.some((tr) => tr.annotation(fromOutside))
          ) {
            const code = update.state.doc.toString();
            reported.current = [...reported.current.slice(-49), code];
            latest.current.onValueChange?.(code, changeOf(update.state));
          }
          store.changed();
        }),
      ],
      [store, runFormat],
    );

    const createState = useCallback(
      (doc: string) =>
        EditorState.create({
          doc,
          extensions: [
            base,
            languageCompartment.of(languageSupport.current),
            settingNames.map((setting) =>
              compartments[setting].of(current.current[setting]),
            ),
          ],
        }),
      [base, compartments, languageCompartment],
    );

    const diagnosticsRef = useRef(diagnostics);
    diagnosticsRef.current = diagnostics;
    const showDiagnostics = useCallback((now: EditorView) => {
      const given = diagnosticsRef.current;
      if (given === undefined) return;
      now.dispatch(
        setDiagnostics(
          now.state,
          diagnosticsOf(given, now.state.doc.length, latest.current.labels),
        ),
      );
    }, []);

    // Each file the editor has shown, as it was left.
    const files = useRef(
      new Map<string, { state: EditorState; scroll: StateEffect<unknown> }>(),
    );
    const shownPath = useRef(path);

    // Made once there's somewhere to draw it, and gone with that place.
    useIsomorphicLayoutEffect(() => {
      if (!host) return;
      const start = latest.current;
      const kept =
        shownPath.current === undefined
          ? undefined
          : files.current.get(shownPath.current);
      const made = new EditorView({
        parent: host,
        state:
          kept?.state ?? createState(start.value ?? start.defaultValue ?? ""),
      });
      for (const setting of settingNames) {
        applied.current[setting] = current.current[setting];
      }
      viewRef.current = made;
      setView(made);
      showDiagnostics(made);
      if (autoFocus) made.focus();
      store.changed();
      return () => {
        if (shownPath.current !== undefined) {
          files.current.set(shownPath.current, {
            state: made.state,
            scroll: made.scrollSnapshot(),
          });
        }
        made.destroy();
        viewRef.current = null;
        setView(null);
      };
    }, [host]);

    // Another file: the one shown is put away as it is, and the new one is
    // opened as it was left, or made from its code.
    useIsomorphicLayoutEffect(() => {
      const now = viewRef.current;
      if (!now || shownPath.current === path) return;
      if (shownPath.current !== undefined) {
        files.current.set(shownPath.current, {
          state: now.state,
          scroll: now.scrollSnapshot(),
        });
      }
      shownPath.current = path;
      const kept = path === undefined ? undefined : files.current.get(path);
      const { value: code, defaultValue: start } = latest.current;
      now.setState(kept?.state ?? createState(code ?? start ?? ""));
      // Its settings are the ones now, which may have changed while it was
      // put away.
      now.dispatch({
        effects: [
          languageCompartment.reconfigure(languageSupport.current),
          ...settingNames.map((setting) =>
            compartments[setting].reconfigure(current.current[setting]),
          ),
        ],
      });
      if (kept) now.dispatch({ effects: kept.scroll });
      if (code !== undefined && code !== now.state.doc.toString()) {
        now.dispatch({
          changes: smallestChange(now.state.doc.toString(), code),
          annotations: [
            fromOutside.of(true),
            Transaction.addToHistory.of(false),
          ],
        });
      }
      reported.current = [];
      showDiagnostics(now);
      store.changed();
    }, [path]);

    // A setting that changed is put in the view that's there.
    useEffect(() => {
      if (!view) return;
      const effects = settingNames
        .filter((setting) => applied.current[setting] !== settings[setting])
        .map((setting) => {
          applied.current[setting] = settings[setting];
          return compartments[setting].reconfigure(settings[setting]);
        });
      if (effects.length > 0) view.dispatch({ effects });
    }, [view, settings, compartments]);

    // The language, fetched first when it hasn't been yet. Until it's
    // here, the code is plain text.
    useEffect(() => {
      if (!view) return;
      const put = (support: Extension) => {
        if (languageSupport.current === support) return;
        languageSupport.current = support;
        view.dispatch({ effects: languageCompartment.reconfigure(support) });
        store.changed();
      };
      const now = supportNow(language);
      if (now || !language) {
        put(now ?? none);
        return;
      }
      let wanted = true;
      loadLanguage(language).then(
        (support) => {
          if (wanted) put(support ?? none);
        },
        () => {
          if (wanted) put(none);
        },
      );
      return () => {
        wanted = false;
      };
    }, [view, language, languageCompartment, store]);

    // They're read through refs, and shown again when they change.
    // biome-ignore lint/correctness/useExhaustiveDependencies: diagnostics and labels are what it's run again for
    useEffect(() => {
      if (view) showDiagnostics(view);
    }, [view, diagnostics, labels, showDiagnostics]);

    // A value from outside that isn't what's written is written in. One
    // that only repeats what was reported is left alone, so the cursor
    // stays where it is as the code is typed.
    useEffect(() => {
      if (!view || value === undefined) return;
      const now = view.state.doc.toString();
      if (value === now) {
        reported.current = [];
        return;
      }
      const echo = reported.current.lastIndexOf(value);
      if (echo !== -1) {
        reported.current = reported.current.slice(echo + 1);
        return;
      }
      reported.current = [];
      view.dispatch({
        changes: smallestChange(now, value),
        annotations: [fromOutside.of(true), Transaction.addToHistory.of(false)],
      });
    }, [view, value]);

    useImperativeHandle(
      editorRef,
      () => ({
        focus: () => viewRef.current?.focus(),
        getValue: () =>
          viewRef.current?.state.doc.toString() ??
          latest.current.value ??
          latest.current.defaultValue ??
          "",
        setValue: (code) => {
          const now = viewRef.current;
          if (!now) return;
          now.dispatch({
            changes: smallestChange(now.state.doc.toString(), code),
          });
        },
        insertText: (text) => {
          const now = viewRef.current;
          if (!now) return;
          now.dispatch(now.state.replaceSelection(text));
          now.focus();
        },
        select: (from, to = from) => {
          const now = viewRef.current;
          if (!now) return;
          const length = now.state.doc.length;
          const clamp = (at: number) => Math.max(0, Math.min(at, length));
          now.dispatch({
            selection: { anchor: clamp(from), head: clamp(to) },
            scrollIntoView: true,
          });
          now.focus();
        },
        get view() {
          return viewRef.current;
        },
      }),
      [],
    );

    const context = useMemo<CodeEditorContextValue>(
      () => ({
        view,
        store,
        labels,
        setHost,
        initial: value ?? defaultValue ?? "",
        language,
        languageChangeable:
          languageProp === undefined || onLanguageChange !== undefined,
        setLanguage,
        wrap,
        setWrap,
        lineNumbers,
        minLines,
        maxLines,
        locked,
        disabled,
        format: format ? runFormat : undefined,
        searchHost,
        hintId: leaveHint ? hintId : undefined,
      }),
      [
        view,
        store,
        labels,
        language,
        languageProp,
        onLanguageChange,
        setLanguage,
        wrap,
        setWrap,
        lineNumbers,
        minLines,
        maxLines,
        locked,
        disabled,
        format,
        runFormat,
        searchHost,
        leaveHint,
        hintId,
        value,
        defaultValue,
      ],
    );

    return (
      <div
        ref={ref}
        data-disabled={disabled ? "" : undefined}
        data-readonly={readOnly ? "" : undefined}
        data-invalid={
          ariaInvalid === true || ariaInvalid === "true" ? "" : undefined
        }
        className={cx("nuv-code-editor", className)}
        {...props}
      >
        <CodeEditorContext.Provider value={context}>
          {children ?? (
            <>
              <CodeEditorToolbar />
              <CodeEditorContent />
              <CodeEditorStatus />
            </>
          )}
          {leaveHint ? (
            <VisuallyHidden id={hintId}>{labels.leave}</VisuallyHidden>
          ) : null}
          {searchHost ? createPortal(<SearchPanel />, searchHost) : null}
          {name && !disabled ? <Field name={name} /> : null}
        </CodeEditorContext.Provider>
      </div>
    );
  },
);

// What a form is sent: the code, in a field nobody sees.
function Field({ name }: { name: string }) {
  const { view, store, initial } = useCodeEditor("CodeEditor");
  const code = useViewValue(
    view,
    store,
    (now) => now.state.doc.toString(),
    initial,
  );
  return <input type="hidden" name={name} value={code} />;
}

export type CodeEditorContentProps = HTMLAttributes<HTMLDivElement>;

/**
 * The code. Until CodeMirror has taken over, on a server and as the page
 * starts, it's the same code in a `<pre>`, in the same font, at the same
 * height, so nothing moves when it does.
 */
export const CodeEditorContent = forwardRef<
  HTMLDivElement,
  CodeEditorContentProps
>(function CodeEditorContent({ className, style, ...props }, ref) {
  const { view, setHost, initial, lineNumbers, minLines, maxLines } =
    useCodeEditor("CodeEditorContent");

  return (
    <div
      ref={ref}
      dir="ltr"
      className={cx("nuv-code-editor__body", className)}
      style={style}
      {...props}
    >
      <div ref={setHost} className="nuv-code-editor__view" />
      {view ? null : (
        <div
          className="nuv-code-editor__fallback"
          style={
            {
              minBlockSize: lines(minLines),
              maxBlockSize:
                maxLines === undefined ? undefined : lines(maxLines),
            } as CSSProperties
          }
        >
          {lineNumbers ? (
            <pre
              aria-hidden="true"
              className="nuv-code-editor__fallback-gutter"
            >
              {initial
                .split("\n")
                .map((_, index) => index + 1)
                .join("\n")}
            </pre>
          ) : null}
          <pre className="nuv-code-editor__fallback-code">
            <code>{initial}</code>
          </pre>
        </div>
      )}
    </div>
  );
});

const icons = {
  wrap: "M2 4h12M2 8h9a2.5 2.5 0 0 1 0 5H8M2 12h3M9.5 11.5 8 13l1.5 1.5",
  copy: "M5.5 5.5V3a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 14.5 3v6a1.5 1.5 0 0 1-1.5 1.5h-2.5M3 5.5h6A1.5 1.5 0 0 1 10.5 7v6A1.5 1.5 0 0 1 9 14.5H3A1.5 1.5 0 0 1 1.5 13V7A1.5 1.5 0 0 1 3 5.5",
  copied: "M3 8.5 6.5 12 13 4.5",
  format: "M2 3h12M5 6.5h9M5 10h9M2 13.5h12M2 6.5l1.5 1.75L2 10",
};

function Icon({ path }: { path: string }) {
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
      <path d={path} />
    </svg>
  );
}

// A value for plain text, since a select's item can't have the empty one.
const plain = "plain-text";

function LanguagePicker({ languages }: { languages: readonly string[] }) {
  const { labels, language, languageChangeable, setLanguage, disabled } =
    useCodeEditor("CodeEditorToolbar");
  const current = nameOf(language);

  if (!languageChangeable) {
    return (
      <span className="nuv-code-editor__language-name">
        {current ?? labels.plainText}
      </span>
    );
  }

  const options: string[] = [];
  for (const option of languages) {
    const named = nameOf(option) ?? option;
    if (!options.includes(named)) options.push(named);
  }
  if (current && !options.includes(current)) options.push(current);

  return (
    <Select
      value={current ?? plain}
      disabled={disabled}
      onValueChange={(next) => setLanguage(next === plain ? "" : next)}
    >
      <ToolbarButton asChild>
        <SelectTrigger
          variant="inline"
          aria-label={labels.language}
          className="nuv-code-editor__language"
        >
          <SelectValue />
        </SelectTrigger>
      </ToolbarButton>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
        <SelectItem value={plain}>{labels.plainText}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export interface CodeEditorToolbarOwnProps {
  /**
   * The languages the picker offers, by name.
   * @default JavaScript, TypeScript, JSX, TSX, CSS, SCSS, HTML, JSON, Markdown, Python, SQL and YAML
   */
  languages?: readonly string[];
  /** More controls, after the toolbar's own: a button to run the code. */
  children?: ReactNode;
}

// The attributes of a div, and not the core toolbar's own type. That one
// is written in terms of a package this one doesn't depend on, and the
// build would copy that package's types in here to describe it.
export interface CodeEditorToolbarProps
  extends CodeEditorToolbarOwnProps,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      keyof CodeEditorToolbarOwnProps | "dir"
    > {}

/**
 * The row of controls over the code: the language, wrapping long lines,
 * copying, and formatting when there's a `format`. It's one stop for the
 * Tab key, and the arrow keys move along it.
 */
export const CodeEditorToolbar = forwardRef<
  HTMLDivElement,
  CodeEditorToolbarProps
>(function CodeEditorToolbar(
  { languages = commonLanguages, children, className, ...props },
  ref,
) {
  const { view, labels, wrap, setWrap, format, locked, disabled } =
    useCodeEditor("CodeEditorToolbar");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function copy() {
    if (!view) return;
    const code = view.state.doc.toString();
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        view.dispatch({ effects: EditorView.announce.of(labels.copied) });
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }

  return (
    <Toolbar
      ref={ref}
      aria-label={labels.toolbar}
      className={cx("nuv-code-editor__toolbar", className)}
      {...props}
    >
      <LanguagePicker languages={languages} />
      <ToolbarSeparator />
      <ToolbarButton
        aria-label={labels.wrap}
        title={labels.wrap}
        aria-pressed={wrap}
        data-state={wrap ? "on" : "off"}
        disabled={disabled}
        onClick={() => setWrap(!wrap)}
        className="nuv-code-editor__item"
      >
        <Icon path={icons.wrap} />
      </ToolbarButton>
      <ToolbarButton
        aria-label={copied ? labels.copied : labels.copy}
        title={labels.copy}
        disabled={!view || disabled}
        onClick={copy}
        className="nuv-code-editor__item"
      >
        <Icon path={copied ? icons.copied : icons.copy} />
      </ToolbarButton>
      {format ? (
        <ToolbarButton
          aria-label={labels.format}
          title={labels.format}
          aria-keyshortcuts="Shift+Alt+F"
          disabled={!view || locked}
          onClick={() => {
            void format();
          }}
          className="nuv-code-editor__item"
        >
          <Icon path={icons.format} />
        </ToolbarButton>
      ) : null}
      {children ? (
        <>
          <ToolbarSeparator />
          {children}
        </>
      ) : null}
    </Toolbar>
  );
});

export type CodeEditorStatusProps = HTMLAttributes<HTMLDivElement>;

/**
 * The line under the code: where the cursor is, how many places are
 * selected when it's more than one, how many problems there are, and the
 * language.
 */
export const CodeEditorStatus = forwardRef<
  HTMLDivElement,
  CodeEditorStatusProps
>(function CodeEditorStatus({ className, ...props }, ref) {
  const { view, store, labels, language } = useCodeEditor("CodeEditorStatus");
  // One string, so the same place is the same answer and nothing is drawn
  // again.
  const state = useViewValue(
    view,
    store,
    (now) => {
      const { state: current } = now;
      const head = current.selection.main.head;
      const line = current.doc.lineAt(head);
      return [
        line.number,
        head - line.from + 1,
        current.selection.ranges.length,
        diagnosticCount(current),
      ].join(",");
    },
    "1,1,1,0",
  );
  const [line = 1, column = 1, selections = 1, problems = 0] = state
    .split(",")
    .map(Number);

  return (
    // biome-ignore lint/a11y/useSemanticElements: a group of facts about the code, not a fieldset of controls
    <div
      ref={ref}
      role="group"
      aria-label={labels.status}
      className={cx("nuv-code-editor__status", className)}
      {...props}
    >
      <span className="nuv-code-editor__status-item">
        {labels.position(line, column)}
      </span>
      {selections > 1 ? (
        <span className="nuv-code-editor__status-item">
          {labels.selections(selections)}
        </span>
      ) : null}
      {problems > 0 ? (
        <span className="nuv-code-editor__status-item" data-problems="">
          {labels.problems(problems)}
        </span>
      ) : null}
      <span className="nuv-code-editor__status-item" data-language="">
        {nameOf(language) ?? labels.plainText}
      </span>
    </div>
  );
});

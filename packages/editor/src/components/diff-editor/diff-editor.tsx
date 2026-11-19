"use client";

import {
  type Chunk,
  getChunks,
  getOriginalDoc,
  goToNextChunk,
  goToPreviousChunk,
  MergeView,
  originalDocChangeEffect,
  acceptChunk as takeUnified,
  rejectChunk as undoUnified,
  unifiedMergeView,
} from "@codemirror/merge";
import {
  Annotation,
  ChangeSet,
  Compartment,
  EditorState,
  type Extension,
  Prec,
  type Text,
  Transaction,
} from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightSpecialChars,
  keymap,
  lineNumbers as lineNumbersExtension,
} from "@codemirror/view";
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "@nuvui/react/toolbar";
import { VisuallyHidden } from "@nuvui/react/visually-hidden";
import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import {
  createViewStore,
  useViewValue,
  type ViewStore,
} from "../code-editor/context";
import {
  type CodeEditorLanguage,
  loadLanguage,
  supportNow,
} from "../code-editor/languages";
import { codeHighlighting, editorTheme } from "../code-editor/theme";
import { diffTheme } from "./theme";

/** Side by side, or both in one column. */
export type DiffEditorLayout = "split" | "unified";

/** What changed, counted. */
export interface DiffEditorSummary {
  /** How many separate changes there are. */
  changes: number;
  /** How many lines the changed text has that the original doesn't. */
  added: number;
  /** How many lines of the original are gone from the changed text. */
  removed: number;
}

/**
 * Everything the diff editor says and doesn't draw, and the words in its
 * toolbar and status. Each has an English default.
 */
export interface DiffEditorLabels {
  toolbar?: string;
  /** The name of the switch between the two layouts. */
  layout?: string;
  split?: string;
  unified?: string;
  previousChange?: string;
  nextChange?: string;
  /** Keeps a change, so it's no longer shown as one. */
  keep?: string;
  /** Puts a change back to the original. */
  undo?: string;
  /** Opens the unchanged lines that are folded away. */
  showUnchanged?: string;
  /** The names of the two texts. */
  original?: string;
  modified?: string;
  /** The name of the status bar. */
  status?: string;
  /** What changed, in the status bar and to a screen reader. */
  summary?: (summary: DiffEditorSummary) => string;
  /** Which change the cursor is in, said when it moves to one. */
  position?: (current: number, total: number) => string;
  /** Said for each line that's new or gone, which is also drawn as + or −. */
  added?: string;
  removed?: string;
  /** A stretch of unchanged lines that's folded away. */
  unchangedLines?: (count: number) => string;
}

const english: Required<DiffEditorLabels> = {
  toolbar: "Changes",
  layout: "Layout",
  split: "Side by side",
  unified: "In one column",
  previousChange: "Previous change",
  nextChange: "Next change",
  keep: "Keep change",
  undo: "Undo change",
  showUnchanged: "Show unchanged lines",
  original: "Original",
  modified: "Changed",
  status: "Changes status",
  summary: ({ changes, added, removed }) =>
    changes === 0
      ? "No changes"
      : `${changes === 1 ? "1 change" : `${changes} changes`}, ${added} ${added === 1 ? "line" : "lines"} added, ${removed} removed`,
  position: (current, total) => `Change ${current} of ${total}`,
  added: "added",
  removed: "removed",
  unchangedLines: (count) => `${count} unchanged lines`,
};

/** What `editorRef` gives: the diff editor from outside it. */
export interface DiffEditorHandle {
  /** Puts the cursor in the changed text. */
  focus: () => void;
  getModified: () => string;
  /** Moves to the next change, and says which it is. */
  nextChange: () => void;
  previousChange: () => void;
}

export interface DiffEditorOwnProps {
  /** The text before. */
  original: string;
  /** The text after, when you keep it. Use it with `onModifiedChange`. */
  modified?: string;
  /** The text after, to begin with, when it's kept here. */
  defaultModified?: string;
  /**
   * Called after the changed text is edited, or a change is kept or
   * undone, with the text and what changed now.
   */
  onModifiedChange?: (modified: string, summary: DiffEditorSummary) => void;
  /**
   * Called after a change is kept, with the original as it is now, the
   * change written into it. Give it back as `original`, so a change that
   * was kept stays kept when the editor is drawn again.
   */
  onOriginalChange?: (original: string) => void;
  /**
   * The changed text can be edited, and each change has a button beside
   * it that keeps it and one that undoes it. Both texts are read only
   * without it, for a review.
   * @default false
   */
  editable?: boolean;
  /** The layout, when you keep it. */
  layout?: DiffEditorLayout;
  /**
   * The layout to begin with, when the toolbar changes it here.
   * @default "split"
   */
  defaultLayout?: DiffEditorLayout;
  onLayoutChange?: (layout: DiffEditorLayout) => void;
  /**
   * Below this width, measured on the box and not the window, a split
   * layout is drawn in one column.
   * @default 720
   */
  minSplitWidth?: number;
  /**
   * Folds long stretches of unchanged lines away, keeping `margin` lines
   * around each change.
   * @default true
   */
  collapseUnchanged?: boolean | { margin?: number; minSize?: number };
  /** The language of both texts, as `CodeEditor` takes it. */
  language?: CodeEditorLanguage;
  /** @default true */
  lineNumbers?: boolean;
  /**
   * Wraps lines longer than the box.
   * @default false
   */
  wrap?: boolean;
  /** The nonce of a content security policy, as `CodeEditor` takes it. */
  nonce?: string;
  /** Anything else CodeMirror has, for both texts. */
  extensions?: readonly Extension[];
  /** What's said and not drawn, for another language. */
  labels?: DiffEditorLabels;
  /** The diff editor from outside: the changed text, and moving between changes. */
  editorRef?: Ref<DiffEditorHandle>;
  /** The parts, when the ones it draws by itself aren't the ones you want. */
  children?: ReactNode;
}

export interface DiffEditorProps
  extends DiffEditorOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof DiffEditorOwnProps> {}

interface Drawn {
  layout: DiffEditorLayout;
  /** The editor with the changed text. */
  modified: EditorView;
  /** The editor with the original, side by side. */
  original: EditorView | null;
  merge: MergeView | null;
}

interface DiffEditorContextValue {
  drawn: Drawn | null;
  store: ViewStore;
  labels: Required<DiffEditorLabels>;
  setHost: (host: HTMLElement | null) => void;
  layout: DiffEditorLayout;
  /** A split that's narrower than it may be is drawn in one column. */
  shownLayout: DiffEditorLayout;
  setLayout: (layout: DiffEditorLayout) => void;
  editable: boolean;
  collapses: boolean;
  unfolded: boolean;
  unfold: () => void;
  move: (direction: 1 | -1) => void;
  keep: () => void;
  undo: () => void;
  initial: string;
}

const DiffEditorContext = createContext<DiffEditorContextValue | null>(null);

function useDiffEditor(part: string) {
  const context = useContext(DiffEditorContext);
  if (!context) throw new Error(`${part} has to be inside a DiffEditor.`);
  return context;
}

const fromOutside = Annotation.define<boolean>();
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
const noExtensions: readonly Extension[] = [];
const none: Extension = [];

function chunksOf(drawn: Drawn) {
  if (drawn.merge) return drawn.merge.chunks;
  return getChunks(drawn.modified.state)?.chunks ?? [];
}

function originalOf(drawn: Drawn): Text {
  return drawn.original
    ? drawn.original.state.doc
    : getOriginalDoc(drawn.modified.state);
}

function linesIn(doc: Text, from: number, to: number, end: number) {
  if (to <= from) return 0;
  return doc.lineAt(end).number - doc.lineAt(from).number + 1;
}

function summaryOf(drawn: Drawn): DiffEditorSummary {
  const before = originalOf(drawn);
  const after = drawn.modified.state.doc;
  let added = 0;
  let removed = 0;
  const chunks = chunksOf(drawn);
  for (const chunk of chunks) {
    removed += linesIn(before, chunk.fromA, chunk.toA, chunk.endA);
    added += linesIn(after, chunk.fromB, chunk.toB, chunk.endB);
  }
  return { changes: chunks.length, added, removed };
}

// The change the cursor is in, from 1, or 0 when it's in none.
function currentChange(drawn: Drawn) {
  const head = drawn.modified.state.selection.main.head;
  const chunks = chunksOf(drawn);
  const index = chunks.findIndex(
    (chunk) => chunk.fromB <= head && chunk.endB >= head,
  );
  return { index, total: chunks.length };
}

// One side's part of a change, with the line break that ends it when
// it's not the last line.
function sliceOf(
  doc: Text,
  from: number,
  to: number,
  otherTo: number,
  otherLength: number,
) {
  let text = doc.sliceString(from, Math.max(from, to - 1));
  if (from !== to && otherTo <= otherLength) text += "\n";
  return text;
}

// Side by side: keeping a change writes it into the original, and undoing
// it writes the original's part back over it.
function keepSplit(drawn: Drawn, chunk: Chunk) {
  const { original, modified } = drawn;
  if (!original) return;
  const length = original.state.doc.length;
  original.dispatch({
    changes: {
      from: chunk.fromA,
      to: Math.min(length, chunk.toA),
      insert: sliceOf(
        modified.state.doc,
        chunk.fromB,
        chunk.toB,
        chunk.toA,
        length,
      ),
    },
    userEvent: "accept",
  });
}

function undoSplit(drawn: Drawn, chunk: Chunk) {
  const { original, modified } = drawn;
  if (!original) return;
  const length = modified.state.doc.length;
  modified.dispatch({
    changes: {
      from: chunk.fromB,
      to: Math.min(length, chunk.toB),
      insert: sliceOf(
        original.state.doc,
        chunk.fromA,
        chunk.toA,
        chunk.toB,
        length,
      ),
    },
    userEvent: "revert",
  });
}

const paths = {
  previous: "M4 10l4-4 4 4",
  next: "M4 6l4 4 4-4",
  keep: "M3 8.5 6.5 12 13 4.5",
  undo: "M3 6h7a3.5 3.5 0 0 1 0 7H6M3 6l3-3M3 6l3 3",
  split: "M2 3h12v10H2zM8 3v10",
  unified: "M2 3h12v10H2zM2 8h12",
  unfold: "M8 2v4M6 4l2 2 2-2M8 14v-4M6 12l2-2 2 2M2 8h12",
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

// A button beside a change, drawn by CodeMirror's merge view outside
// React, so it's made as an element.
function chunkButton(
  label: string,
  path: string,
  act: (event: MouseEvent) => void,
) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "nuv-diff-editor__chunk-button";
  button.setAttribute("aria-label", label);
  button.title = label;
  const svg = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(svg, "svg");
  for (const [name, value] of Object.entries({
    "aria-hidden": "true",
    width: "14",
    height: "14",
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  })) {
    icon.setAttribute(name, value);
  }
  const line = document.createElementNS(svg, "path");
  line.setAttribute("d", path);
  icon.append(line);
  button.append(icon);
  // A press is a click, so the keyboard works too. CodeMirror acts on the
  // mouse button going down, which Enter and Space never do.
  button.addEventListener("mousedown", (event) => event.stopPropagation());
  button.addEventListener("click", act);
  return button;
}

/**
 * Two texts and what changed between them, side by side or in one
 * column, on CodeMirror. Each change is drawn with + and − as well as its
 * color, and unchanged lines are folded away. Name it with `aria-label`.
 */
export const DiffEditor = forwardRef<HTMLDivElement, DiffEditorProps>(
  function DiffEditor(
    {
      original,
      modified,
      defaultModified,
      onModifiedChange,
      onOriginalChange,
      editable = false,
      layout: layoutProp,
      defaultLayout = "split",
      onLayoutChange,
      minSplitWidth = 720,
      collapseUnchanged = true,
      language,
      lineNumbers = true,
      wrap = false,
      nonce,
      extensions = noExtensions,
      labels: given,
      editorRef,
      children,
      className,
      ...props
    },
    ref,
  ) {
    const labels = useMemo(() => ({ ...english, ...given }), [given]);
    const store = useMemo(createViewStore, []);
    // The merge view works out its changes after an editor has taken a
    // change in, and the parts read them, so they're told a moment later.
    const changed = useCallback(() => {
      queueMicrotask(store.changed);
    }, [store]);
    const [host, setHost] = useState<HTMLElement | null>(null);
    const [drawn, setDrawn] = useState<Drawn | null>(null);
    const drawnRef = useRef<Drawn | null>(null);
    const [said, setSaid] = useState("");

    const [layoutState, setLayoutState] = useState(defaultLayout);
    const layout = layoutProp ?? layoutState;
    const setLayout = useCallback(
      (next: DiffEditorLayout) => {
        if (layoutProp === undefined) setLayoutState(next);
        onLayoutChange?.(next);
      },
      [layoutProp, onLayoutChange],
    );

    const [width, setWidth] = useState<number | null>(null);
    const root = useRef<HTMLDivElement | null>(null);
    const setRoot = useCallback(
      (node: HTMLDivElement | null) => {
        root.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    useIsomorphicLayoutEffect(() => {
      const node = root.current;
      if (!node) return;
      setWidth(node.clientWidth);
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => setWidth(node.clientWidth));
      observer.observe(node);
      return () => observer.disconnect();
    }, []);
    const shownLayout: DiffEditorLayout =
      layout === "split" && (width === null || width >= minSplitWidth)
        ? "split"
        : "unified";

    const [unfolded, setUnfolded] = useState(false);
    const collapse =
      collapseUnchanged === false || unfolded
        ? undefined
        : {
            margin:
              typeof collapseUnchanged === "object"
                ? (collapseUnchanged.margin ?? 3)
                : 3,
            minSize:
              typeof collapseUnchanged === "object"
                ? (collapseUnchanged.minSize ?? 4)
                : 4,
          };
    const collapseKey = collapse
      ? `${collapse.margin},${collapse.minSize}`
      : "";

    const latest = useRef({
      original,
      modified,
      defaultModified,
      onModifiedChange,
      onOriginalChange,
      labels,
    });
    latest.current = {
      original,
      modified,
      defaultModified,
      onModifiedChange,
      onOriginalChange,
      labels,
    };
    const reported = useRef<string[]>([]);
    // The original as the prop last gave it. Keeping a change writes into
    // the original that's shown, which the prop doesn't, so the two are
    // compared only when the prop itself changes.
    const givenOriginal = useRef(original);

    const report = useCallback(() => {
      const now = drawnRef.current;
      if (!now) return;
      const code = now.modified.state.doc.toString();
      reported.current = [...reported.current.slice(-49), code];
      latest.current.onModifiedChange?.(code, summaryOf(now));
    }, []);

    // After a change is kept: what's left, and the original with it in.
    const reportKept = useCallback(() => {
      report();
      const now = drawnRef.current;
      if (!now) return;
      const kept = originalOf(now).toString();
      givenOriginal.current = kept;
      latest.current.onOriginalChange?.(kept);
    }, [report]);

    const compartments = useMemo(
      () => ({
        language: new Compartment(),
        lineNumbers: new Compartment(),
        wrap: new Compartment(),
        phrases: new Compartment(),
        nonce: new Compartment(),
        extensions: new Compartment(),
      }),
      [],
    );
    const languageSupport = useRef<Extension>(supportNow(language) ?? none);
    const settings = useMemo(
      () => ({
        lineNumbers: lineNumbers ? lineNumbersExtension() : [],
        wrap: wrap ? EditorView.lineWrapping : [],
        phrases: EditorState.phrases.of({
          "$ unchanged lines": labels.unchangedLines(0).replace("0", "$"),
          Accept: labels.keep,
          Reject: labels.undo,
          "Revert this chunk": labels.undo,
        }),
        nonce: nonce ? EditorView.cspNonce.of(nonce) : [],
        extensions: [...extensions],
      }),
      [lineNumbers, wrap, labels, nonce, extensions],
    );
    const current = useRef(settings);
    current.current = settings;

    const say = useCallback((text: string) => {
      // The same words twice in a row are said again.
      setSaid("");
      requestAnimationFrame(() => setSaid(text));
    }, []);

    const move = useCallback(
      (direction: 1 | -1) => {
        const now = drawnRef.current;
        if (!now) return;
        const view = now.modified;
        (direction === 1 ? goToNextChunk : goToPreviousChunk)(view);
        view.focus();
        const { index, total } = currentChange(now);
        if (index >= 0) say(latest.current.labels.position(index + 1, total));
        changed();
      },
      [say, changed],
    );

    const keep = useCallback(() => {
      const now = drawnRef.current;
      if (!now) return;
      const { index } = currentChange(now);
      const chunk = chunksOf(now)[index];
      if (!chunk) return;
      if (now.merge) keepSplit(now, chunk);
      else takeUnified(now.modified);
      queueMicrotask(reportKept);
      changed();
    }, [reportKept, changed]);

    const undo = useCallback(() => {
      const now = drawnRef.current;
      if (!now) return;
      const { index } = currentChange(now);
      const chunk = chunksOf(now)[index];
      if (!chunk) return;
      if (now.merge) undoSplit(now, chunk);
      else undoUnified(now.modified);
      changed();
    }, [changed]);

    // Made once there's somewhere to draw it, and made again when the
    // layout, whether it's editable or what's folded changes. The texts are
    // kept as they are.
    useIsomorphicLayoutEffect(() => {
      if (!host || width === null) return;
      const before = drawnRef.current;
      const startModified = before
        ? before.modified.state.doc.toString()
        : (latest.current.modified ??
          latest.current.defaultModified ??
          original);
      const startOriginal = before ? originalOf(before).toString() : original;
      const words = latest.current.labels;

      const shared = (side: "original" | "modified"): Extension => [
        highlightSpecialChars(),
        drawSelection(),
        codeHighlighting,
        editorTheme,
        diffTheme(words.added, words.removed),
        compartments.language.of(languageSupport.current),
        compartments.lineNumbers.of(current.current.lineNumbers),
        compartments.wrap.of(current.current.wrap),
        compartments.phrases.of(current.current.phrases),
        compartments.nonce.of(current.current.nonce),
        compartments.extensions.of(current.current.extensions),
        EditorView.contentAttributes.of({
          class: "nuv-diff-editor__code",
          dir: "ltr",
          "aria-label": side === "original" ? words.original : words.modified,
          "aria-multiline": "true",
          ...(side === "original" || !editable
            ? { "aria-readonly": "true" }
            : {}),
        }),
        EditorState.readOnly.of(side === "original" || !editable),
        Prec.high(
          keymap.of([
            {
              key: "Alt-ArrowDown",
              run: () => {
                move(1);
                return true;
              },
            },
            {
              key: "Alt-ArrowUp",
              run: () => {
                move(-1);
                return true;
              },
            },
          ]),
        ),
        EditorView.updateListener.of((update) => {
          if (
            side === "modified" &&
            update.docChanged &&
            !update.transactions.some((tr) => tr.annotation(fromOutside))
          ) {
            queueMicrotask(report);
          }
          changed();
        }),
      ];

      let next: Drawn;
      if (shownLayout === "split") {
        const merge: MergeView = new MergeView({
          parent: host,
          a: { doc: startOriginal, extensions: shared("original") },
          b: { doc: startModified, extensions: shared("modified") },
          highlightChanges: true,
          gutter: true,
          ...(collapse ? { collapseUnchanged: collapse } : {}),
          ...(editable
            ? {
                revertControls: "a-to-b" as const,
                renderRevertControl: () => {
                  const controls = document.createElement("div");
                  controls.className = "nuv-diff-editor__chunk-controls";
                  const chunkHere = () =>
                    merge.chunks[Number(controls.dataset.chunk)];
                  controls.append(
                    chunkButton(words.keep, paths.keep, () => {
                      const chunk = chunkHere();
                      if (!chunk || !drawnRef.current) return;
                      keepSplit(drawnRef.current, chunk);
                      queueMicrotask(reportKept);
                      changed();
                    }),
                    chunkButton(words.undo, paths.undo, () => {
                      const chunk = chunkHere();
                      if (!chunk || !drawnRef.current) return;
                      undoSplit(drawnRef.current, chunk);
                      changed();
                    }),
                  );
                  return controls;
                },
              }
            : {}),
        });
        // The column between the texts holds the buttons beside each
        // change. Its width is CodeMirror's, from a style it adds outside
        // any layer, so it's set on the element.
        const gap = merge.dom.querySelector<HTMLElement>(".cm-merge-revert");
        if (gap) {
          gap.style.width = "var(--nuv-diff-editor-controls-width, 2.875rem)";
        }
        next = { layout: "split", modified: merge.b, original: merge.a, merge };
      } else {
        const view = new EditorView({
          parent: host,
          state: EditorState.create({
            doc: startModified,
            extensions: [
              shared("modified"),
              unifiedMergeView({
                original: startOriginal,
                highlightChanges: true,
                gutter: true,
                syntaxHighlightDeletions: true,
                ...(collapse ? { collapseUnchanged: collapse } : {}),
                mergeControls: editable
                  ? (type, act) =>
                      chunkButton(
                        type === "accept" ? words.keep : words.undo,
                        type === "accept" ? paths.keep : paths.undo,
                        (event) => {
                          act(event);
                          if (type === "accept") queueMicrotask(reportKept);
                        },
                      )
                  : false,
              }),
            ],
          }),
        });
        next = {
          layout: "unified",
          modified: view,
          original: null,
          merge: null,
        };
      }

      drawnRef.current = next;
      setDrawn(next);
      changed();
      return () => {
        if (next.merge) next.merge.destroy();
        else next.modified.destroy();
      };
    }, [host, width === null, shownLayout, editable, collapseKey]);

    useEffect(() => {
      if (!drawn) return;
      const views = [drawn.modified, drawn.original].filter(
        (view): view is EditorView => view !== null,
      );
      for (const view of views) {
        view.dispatch({
          effects: [
            compartments.lineNumbers.reconfigure(settings.lineNumbers),
            compartments.wrap.reconfigure(settings.wrap),
            compartments.phrases.reconfigure(settings.phrases),
            compartments.nonce.reconfigure(settings.nonce),
            compartments.extensions.reconfigure(settings.extensions),
          ],
        });
      }
    }, [drawn, settings, compartments]);

    useEffect(() => {
      if (!drawn) return;
      const views = [drawn.modified, drawn.original].filter(
        (view): view is EditorView => view !== null,
      );
      const put = (support: Extension) => {
        languageSupport.current = support;
        for (const view of views) {
          view.dispatch({
            effects: compartments.language.reconfigure(support),
          });
        }
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
    }, [drawn, language, compartments]);

    // A new original from outside replaces the one shown.
    useEffect(() => {
      if (!drawn || original === givenOriginal.current) return;
      givenOriginal.current = original;
      const shown = originalOf(drawn).toString();
      if (shown === original) return;
      if (drawn.original) {
        drawn.original.dispatch({
          changes: { from: 0, to: shown.length, insert: original },
          annotations: [
            fromOutside.of(true),
            Transaction.addToHistory.of(false),
          ],
        });
      } else {
        const view = drawn.modified;
        const changes = ChangeSet.of(
          { from: 0, to: shown.length, insert: original },
          shown.length,
        );
        view.dispatch({
          effects: originalDocChangeEffect(view.state, changes),
        });
      }
      changed();
    }, [drawn, original, changed]);

    // A changed text from outside that isn't what's there is written in.
    useEffect(() => {
      if (!drawn || modified === undefined) return;
      const view = drawn.modified;
      const now = view.state.doc.toString();
      if (modified === now) {
        reported.current = [];
        return;
      }
      const echo = reported.current.lastIndexOf(modified);
      if (echo !== -1) {
        reported.current = reported.current.slice(echo + 1);
        return;
      }
      reported.current = [];
      view.dispatch({
        changes: { from: 0, to: now.length, insert: modified },
        annotations: [fromOutside.of(true), Transaction.addToHistory.of(false)],
      });
      changed();
    }, [drawn, modified, changed]);

    useImperativeHandle(
      editorRef,
      () => ({
        focus: () => drawnRef.current?.modified.focus(),
        getModified: () =>
          drawnRef.current?.modified.state.doc.toString() ??
          latest.current.modified ??
          latest.current.defaultModified ??
          latest.current.original,
        nextChange: () => move(1),
        previousChange: () => move(-1),
      }),
      [move],
    );

    const context = useMemo<DiffEditorContextValue>(
      () => ({
        drawn,
        store,
        labels,
        setHost,
        layout,
        shownLayout,
        setLayout,
        editable,
        collapses: collapseUnchanged !== false,
        unfolded,
        unfold: () => setUnfolded((before) => !before),
        move,
        keep,
        undo,
        initial: modified ?? defaultModified ?? original,
      }),
      [
        drawn,
        store,
        labels,
        layout,
        shownLayout,
        setLayout,
        editable,
        collapseUnchanged,
        unfolded,
        move,
        keep,
        undo,
        modified,
        defaultModified,
        original,
      ],
    );

    return (
      // biome-ignore lint/a11y/useSemanticElements: two texts and their controls, named as one thing, not a fieldset of a form
      <div
        ref={setRoot}
        role="group"
        data-layout={shownLayout}
        data-editable={editable ? "" : undefined}
        className={cx("nuv-diff-editor", className)}
        {...props}
      >
        <DiffEditorContext.Provider value={context}>
          {children ?? (
            <>
              <DiffEditorToolbar />
              <DiffEditorContent />
              <DiffEditorStatus />
            </>
          )}
          <VisuallyHidden aria-live="polite" aria-atomic="true">
            {said}
          </VisuallyHidden>
        </DiffEditorContext.Provider>
      </div>
    );
  },
);

// The attributes of a div, and not the core toolbar's own type. That one
// is written in terms of a package this one doesn't depend on, and the
// build would copy that package's types in here to describe it.
export interface DiffEditorToolbarOwnProps {
  /** More controls, after the toolbar's own. */
  children?: ReactNode;
}

export interface DiffEditorToolbarProps
  extends DiffEditorToolbarOwnProps,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      keyof DiffEditorToolbarOwnProps | "dir"
    > {}

/**
 * The row of controls over the texts: the layout, the previous and next
 * change, keeping and undoing the one the cursor is in when it's
 * editable, and opening what's folded.
 */
export const DiffEditorToolbar = forwardRef<
  HTMLDivElement,
  DiffEditorToolbarProps
>(function DiffEditorToolbar({ children, className, ...props }, ref) {
  const {
    drawn,
    store,
    labels,
    layout,
    setLayout,
    editable,
    collapses,
    unfolded,
    unfold,
    move,
    keep,
    undo,
  } = useDiffEditor("DiffEditorToolbar");
  const state = useViewValue(
    drawn?.modified ?? null,
    store,
    () => {
      if (!drawn) return "0,0";
      const { index, total } = currentChange(drawn);
      return `${index},${total}`;
    },
    "0,0",
  );
  const [index = -1, total = 0] = state.split(",").map(Number);

  return (
    <Toolbar
      ref={ref}
      aria-label={labels.toolbar}
      className={cx("nuv-diff-editor__toolbar", className)}
      {...props}
    >
      <ToolbarToggleGroup
        type="single"
        aria-label={labels.layout}
        value={layout}
        onValueChange={(next: string) => {
          if (next) setLayout(next as DiffEditorLayout);
        }}
        className="nuv-diff-editor__group"
      >
        <ToolbarToggleItem
          value="split"
          aria-label={labels.split}
          title={labels.split}
          className="nuv-diff-editor__item"
        >
          <Icon path={paths.split} />
        </ToolbarToggleItem>
        <ToolbarToggleItem
          value="unified"
          aria-label={labels.unified}
          title={labels.unified}
          className="nuv-diff-editor__item"
        >
          <Icon path={paths.unified} />
        </ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarButton
        aria-label={labels.previousChange}
        title={labels.previousChange}
        aria-keyshortcuts="Alt+ArrowUp"
        disabled={total === 0}
        onClick={() => move(-1)}
        className="nuv-diff-editor__item"
      >
        <Icon path={paths.previous} />
      </ToolbarButton>
      <ToolbarButton
        aria-label={labels.nextChange}
        title={labels.nextChange}
        aria-keyshortcuts="Alt+ArrowDown"
        disabled={total === 0}
        onClick={() => move(1)}
        className="nuv-diff-editor__item"
      >
        <Icon path={paths.next} />
      </ToolbarButton>
      {editable ? (
        <>
          <ToolbarSeparator />
          <ToolbarButton
            aria-label={labels.keep}
            title={labels.keep}
            disabled={index < 0}
            onClick={keep}
            className="nuv-diff-editor__item"
          >
            <Icon path={paths.keep} />
          </ToolbarButton>
          <ToolbarButton
            aria-label={labels.undo}
            title={labels.undo}
            disabled={index < 0}
            onClick={undo}
            className="nuv-diff-editor__item"
          >
            <Icon path={paths.undo} />
          </ToolbarButton>
        </>
      ) : null}
      {collapses ? (
        <>
          <ToolbarSeparator />
          <ToolbarButton
            aria-label={labels.showUnchanged}
            title={labels.showUnchanged}
            aria-pressed={unfolded}
            data-state={unfolded ? "on" : "off"}
            onClick={unfold}
            className="nuv-diff-editor__item"
          >
            <Icon path={paths.unfold} />
          </ToolbarButton>
        </>
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

export type DiffEditorContentProps = HTMLAttributes<HTMLDivElement>;

/**
 * The two texts. Until CodeMirror has taken over, on a server and as the
 * page starts, it's the changed text in a `<pre>`.
 */
export const DiffEditorContent = forwardRef<
  HTMLDivElement,
  DiffEditorContentProps
>(function DiffEditorContent({ className, ...props }, ref) {
  const { drawn, setHost, initial } = useDiffEditor("DiffEditorContent");
  return (
    <div
      ref={ref}
      dir="ltr"
      className={cx("nuv-diff-editor__body", className)}
      {...props}
    >
      <div ref={setHost} className="nuv-diff-editor__view" />
      {drawn ? null : (
        <pre className="nuv-diff-editor__fallback">
          <code>{initial}</code>
        </pre>
      )}
    </div>
  );
});

export type DiffEditorStatusProps = HTMLAttributes<HTMLDivElement>;

/** The line under the texts: how many changes, and the lines added and removed. */
export const DiffEditorStatus = forwardRef<
  HTMLDivElement,
  DiffEditorStatusProps
>(function DiffEditorStatus({ className, ...props }, ref) {
  const { drawn, store, labels } = useDiffEditor("DiffEditorStatus");
  const counted = useViewValue(
    drawn?.modified ?? null,
    store,
    () => {
      if (!drawn) return "0,0,0";
      const { changes, added, removed } = summaryOf(drawn);
      return `${changes},${added},${removed}`;
    },
    "0,0,0",
  );
  const [changes = 0, added = 0, removed = 0] = counted.split(",").map(Number);

  return (
    // biome-ignore lint/a11y/useSemanticElements: a group of facts about the change, not a fieldset of controls
    <div
      ref={ref}
      role="group"
      aria-label={labels.status}
      className={cx("nuv-diff-editor__status", className)}
      {...props}
    >
      <span className="nuv-diff-editor__summary">
        {labels.summary({ changes, added, removed })}
      </span>
    </div>
  );
});

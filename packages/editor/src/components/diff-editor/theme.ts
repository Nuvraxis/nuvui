import { EditorView } from "@codemirror/view";
import { forced, lifted, tinted } from "../code-editor/theme";

// Mixed from the theme's success and danger colors, a light wash for a
// changed line and a stronger one for the words that changed inside it.
// Both are light enough for the code's colors, mixed as they are on a
// tint, to keep a contrast of 4.5 to 1 in the light and the dark theme.
const inserted =
  "var(--nuv-diff-editor-inserted-bg, color-mix(in oklab, var(--color-success) 12%, transparent))";
const deleted =
  "var(--nuv-diff-editor-deleted-bg, color-mix(in oklab, var(--color-danger) 12%, transparent))";
const insertedText =
  "var(--nuv-diff-editor-inserted-text-bg, color-mix(in oklab, var(--color-success) 18%, transparent))";
const deletedText =
  "var(--nuv-diff-editor-deleted-text-bg, color-mix(in oklab, var(--color-danger) 18%, transparent))";
const plus = "var(--nuv-diff-editor-inserted-fg, var(--color-success))";
const minus = "var(--nuv-diff-editor-deleted-fg, var(--color-danger))";

// A + or − in the gutter, drawn in place of the bar of color CodeMirror
// draws, so a change isn't told by color alone.
const sign = (character: string, color: string) => ({
  content: `"${character}"`,
  display: "block",
  color,
  fontWeight: "var(--font-weight-semibold)",
  textAlign: "center",
  [forced]: { color: "CanvasText" },
});

// Words for a screen reader at the start of each changed line. Nothing is
// drawn: the + and − are in the gutter, which isn't read.
const spoken = (words: string) => ({
  content: `"" / "${words.replace(/["\\]/g, "\\$&")}"`,
  position: "absolute",
});

/** The colors of what changed. Everything else is the code editor's. */
export function diffTheme(added: string, removed: string) {
  return EditorView.theme(
    lifted({
      "&.cm-merge-a .cm-changedLine, .cm-deletedChunk": {
        backgroundColor: deleted,
        ...tinted,
        [forced]: { borderLeft: "2px solid CanvasText" },
      },
      "&.cm-merge-b .cm-changedLine, .cm-inlineChangedLine": {
        backgroundColor: inserted,
        ...tinted,
        [forced]: { borderLeft: "2px solid CanvasText" },
      },
      "&.cm-merge-a .cm-changedText, .cm-deletedChunk .cm-deletedText": {
        background: deletedText,
        [forced]: { textDecoration: "line-through" },
      },
      "&.cm-merge-b .cm-changedText": {
        background: insertedText,
        [forced]: { textDecoration: "underline" },
      },
      "&.cm-merge-b .cm-deletedText": { background: deletedText },
      ".cm-insertedLine, .cm-deletedLine, .cm-deletedLine del": {
        textDecoration: "none",
      },
      "&.cm-merge-a .cm-changedLine::before, .cm-deletedChunk .cm-deletedLine::before":
        spoken(removed),
      "&.cm-merge-b .cm-changedLine::before": spoken(added),
      "&.cm-merge-a .cm-changedLineGutter, &.cm-merge-b .cm-changedLineGutter, & .cm-deletedLineGutter, & .cm-inlineChangedLineGutter":
        { background: "none" },
      "&.cm-merge-a .cm-changedLineGutter::before, & .cm-deletedLineGutter::before":
        sign("−", minus),
      "&.cm-merge-b .cm-changedLineGutter::before": sign("+", plus),
      "& .cm-inlineChangedLineGutter::before": sign("±", plus),
      ".cm-gutter.cm-changeGutter": { width: "1.25em", paddingLeft: "0" },
      // A stretch of unchanged lines, folded. Pressing it opens it.
      ".cm-collapsedLines": {
        padding: "calc(var(--spacing) * 1) calc(var(--spacing) * 3)",
        background: "var(--nuv-diff-editor-folded-bg, var(--color-muted))",
        color:
          "var(--nuv-diff-editor-folded-fg, var(--color-muted-foreground))",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-xs)",
        cursor: "pointer",
        [forced]: { border: "1px solid CanvasText" },
      },
      ".cm-collapsedLines:before, .cm-collapsedLines:after": {
        content: "none",
      },
      ".cm-deletedChunk": { paddingLeft: "0" },
      ".cm-deletedChunk .cm-chunkButtons": {
        position: "absolute",
        insetInlineEnd: "var(--spacing)",
        display: "flex",
        gap: "var(--spacing)",
      },
    }),
  );
}

import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

// CodeMirror puts its own styles in the page as it runs, outside any
// layer, so a rule in the stylesheet would lose to them. What it draws is
// styled here, and every value is a variable over the theme's tokens.

// A token's color: the editor's own variable, then CodeBlock's, then the
// color CodeBlock falls back to. Code looks the same written as it does
// shown, and an app that recolors one recolors both.
const colors = new Map<string, string>();
const token = (name: string, fallback: string) => {
  const color = `var(--nuv-code-editor-token-${name}, var(--nuv-code-block-token-${name}, ${fallback}))`;
  colors.set(name, color);
  return `var(--nuv-code-ink-${name}, ${color})`;
};

const muted = "var(--color-muted-foreground)";
const text = "var(--nuv-code-editor-fg, var(--color-surface-foreground))";

const highlightStyle = HighlightStyle.define([
  {
    tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
    color: token("comment", muted),
  },
  {
    tag: [t.punctuation, t.separator, t.bracket, t.processingInstruction],
    color: token("punctuation", muted),
  },
  {
    tag: [
      t.keyword,
      t.modifier,
      t.operator,
      t.operatorKeyword,
      t.controlKeyword,
      t.definitionKeyword,
      t.moduleKeyword,
    ],
    color: token("keyword", "var(--color-danger)"),
  },
  {
    tag: [t.string, t.special(t.string), t.regexp, t.escape, t.tagName],
    color: token("string-expression", "var(--color-success)"),
  },
  {
    tag: [t.character, t.attributeValue, t.monospace],
    color: token("string", "var(--color-success)"),
  },
  {
    tag: [
      t.number,
      t.bool,
      t.null,
      t.atom,
      t.unit,
      t.self,
      t.constant(t.variableName),
      t.standard(t.variableName),
    ],
    color: token("constant", "var(--color-warning)"),
  },
  {
    tag: [
      t.function(t.variableName),
      t.function(t.propertyName),
      t.function(t.definition(t.variableName)),
      t.typeName,
      t.className,
      t.attributeName,
      t.macroName,
    ],
    color: token("function", "currentcolor"),
  },
  {
    tag: [t.link, t.url],
    color: token("link", "currentcolor"),
    textDecoration: "underline",
  },
  { tag: [t.heading, t.strong], fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.inserted, color: token("inserted", "var(--color-success)") },
  { tag: t.deleted, color: token("deleted", "var(--color-danger)") },
  { tag: t.changed, color: token("changed", "var(--color-warning)") },
]);

/** The colors of the code, the same as `CodeBlock`'s. */
export const codeHighlighting = syntaxHighlighting(highlightStyle);

/**
 * For a line with a background of its own, such as the line being edited
 * or one that changed. The code's colors are only sure to be readable on
 * the editor's background, so on a tint each is mixed a third of the way
 * to the text's color.
 */
export const tinted: Record<string, string> = Object.fromEntries(
  [...colors].map(([name, color]) => [
    `--nuv-code-ink-${name}`,
    `color-mix(in oklab, ${color} 65%, ${text})`,
  ]),
);

const border = "var(--nuv-border-width, 1px) solid";
const edge = "var(--nuv-code-editor-border, var(--color-border))";
const padBlock =
  "var(--nuv-code-editor-padding-block, calc(var(--spacing) * 2))";
const padInline =
  "var(--nuv-code-editor-padding-inline, calc(var(--spacing) * 3))";
const selection =
  "var(--nuv-code-editor-selection-bg, color-mix(in oklab, var(--color-primary) 22%, transparent))";
const activeLine =
  "var(--nuv-code-editor-active-line-bg, color-mix(in oklab, var(--color-muted) 70%, transparent))";
export const forced = "@media (forced-colors: active)";

type Rule = Record<string, unknown>;
type Spec = Parameters<typeof EditorView.theme>[0];

/**
 * A theme's rules, with what changes under a media query written inside
 * the rule it changes. CodeMirror takes a media query only around rules,
 * so each is moved out to one, after the rules it overrides.
 */
export function lifted(rules: Record<string, Rule>): Spec {
  const plain: Record<string, Rule> = {};
  const queries: Record<string, Record<string, Rule>> = {};
  for (const [selector, rule] of Object.entries(rules)) {
    const own: Rule = {};
    for (const [key, value] of Object.entries(rule)) {
      if (key.startsWith("@") && value && typeof value === "object") {
        queries[key] ??= {};
        queries[key][selector] = value as Rule;
      } else {
        own[key] = value;
      }
    }
    plain[selector] = own;
  }
  return { ...plain, ...queries } as Spec;
}

// Each kind of problem is a shape as well as a color in the gutter: a
// circle for an error, a triangle for a warning, a diamond for the rest.
const marker = (color: string, shape: string) => ({
  content: '""',
  display: "block",
  width: "0.7em",
  height: "0.7em",
  margin: "0.15em auto 0",
  backgroundColor: color,
  clipPath: shape,
  [forced]: { forcedColorAdjust: "none", backgroundColor: "CanvasText" },
});
const circle = "circle(50%)";
const triangle = "polygon(50% 0, 100% 100%, 0 100%)";
const diamond = "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)";

// A wavy line under the code a problem is about, in the color of its kind,
// in place of the picture CodeMirror draws in a fixed color.
const underline = (color: string) => ({
  backgroundImage: "none",
  textDecoration: `underline wavy ${color}`,
  textDecorationSkipInk: "none",
  textUnderlineOffset: "0.2em",
});

const danger = "var(--nuv-code-editor-error, var(--color-danger))";
const warning = "var(--nuv-code-editor-warning, var(--color-warning))";
const info = "var(--nuv-code-editor-info, var(--color-primary))";
const hint = `var(--nuv-code-editor-hint, ${muted})`;

/** How the editor itself is drawn, in the theme's tokens. */
export const editorTheme = EditorView.theme(
  lifted({
    "&": {
      color: "var(--nuv-code-editor-fg, var(--color-surface-foreground))",
      backgroundColor: "var(--nuv-code-editor-bg, var(--color-surface))",
      // 16px on a touch screen, so iOS doesn't zoom the page when the code
      // is tapped, and smaller with a mouse.
      fontSize: "max(1rem, var(--nuv-code-editor-font-size, var(--text-sm)))",
      fontFamily: "var(--nuv-code-editor-font, var(--font-mono))",
      lineHeight: "var(--nuv-code-editor-line-height, 1.5)",
      borderRadius: "inherit",
      "@media (pointer: fine)": {
        fontSize: "var(--nuv-code-editor-font-size, var(--text-sm))",
      },
    },
    // The box around it has the ring, as a field does.
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": {
      fontFamily: "inherit",
      lineHeight: "inherit",
      borderRadius: "inherit",
    },
    ".cm-content": {
      padding: `${padBlock} 0`,
      caretColor: "var(--nuv-code-editor-cursor, var(--color-foreground))",
      fontVariantLigatures: "none",
    },
    ".cm-line": { padding: `0 ${padInline}` },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--nuv-code-editor-cursor, var(--color-foreground))",
      [forced]: { borderLeftColor: "CanvasText" },
    },
    "& .cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
      {
        background: selection,
        [forced]: { forcedColorAdjust: "none", background: "Highlight" },
      },
    ".cm-content ::selection": {
      backgroundColor: selection,
      [forced]: { backgroundColor: "Highlight", color: "HighlightText" },
    },
    // Only while the cursor is in it: an editor that isn't being used has
    // no line it's on.
    ".cm-activeLine": { backgroundColor: "transparent" },
    "&.cm-focused .cm-activeLine": {
      backgroundColor: activeLine,
      ...tinted,
      [forced]: { outline: "1px solid CanvasText", outlineOffset: "-1px" },
    },
    ".cm-gutters": {
      border: "none",
      backgroundColor: "var(--nuv-code-editor-gutter-bg, transparent)",
      color: `var(--nuv-code-editor-gutter-fg, ${muted})`,
      borderStartStartRadius: "inherit",
      borderEndStartRadius: "inherit",
    },
    ".cm-activeLineGutter": { backgroundColor: "transparent" },
    "&.cm-focused .cm-activeLineGutter": {
      backgroundColor: activeLine,
      color: "var(--nuv-code-editor-gutter-active-fg, var(--color-foreground))",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      minWidth: "2ch",
      padding: "0 calc(var(--spacing) * 1) 0 calc(var(--spacing) * 3)",
    },
    ".cm-foldGutter .cm-gutterElement": {
      padding: "0 calc(var(--spacing) * 1)",
      cursor: "pointer",
    },
    "&.cm-focused .cm-matchingBracket": {
      backgroundColor: "var(--nuv-code-editor-bracket-bg, var(--color-muted))",
      outline: `1px solid var(--nuv-code-editor-bracket-border, var(--color-border-strong))`,
      ...tinted,
      [forced]: { outline: "1px solid CanvasText" },
    },
    "&.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: "transparent",
      color: danger,
    },
    ".cm-foldPlaceholder": {
      padding: "0 calc(var(--spacing) * 1)",
      border: "none",
      borderRadius: "var(--radius-sm)",
      backgroundColor: "var(--color-muted)",
      color: muted,
    },
    ".cm-placeholder": {
      color: `var(--nuv-code-editor-placeholder-fg, ${muted})`,
    },
    ".cm-specialChar": { color: danger },
    ".cm-searchMatch": {
      backgroundColor:
        "var(--nuv-code-editor-match-bg, color-mix(in oklab, var(--color-warning) 25%, transparent))",
      outline:
        "1px solid var(--nuv-code-editor-match-border, color-mix(in oklab, var(--color-warning) 70%, transparent))",
      ...tinted,
      [forced]: { outline: "1px solid Highlight" },
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor:
        "var(--nuv-code-editor-match-active-bg, color-mix(in oklab, var(--color-warning) 50%, transparent))",
      [forced]: { outline: "2px solid Highlight" },
    },
    ".cm-selectionMatch": { backgroundColor: "var(--color-muted)" },
    ".cm-panels": {
      backgroundColor: "var(--nuv-code-editor-panel-bg, var(--color-surface))",
      color: "inherit",
    },
    ".cm-panels.cm-panels-top": { borderBottom: `${border} ${edge}` },
    ".cm-panels.cm-panels-bottom": { borderTop: `${border} ${edge}` },
    ".cm-tooltip": {
      border: `${border} var(--color-border)`,
      borderRadius: "var(--radius-md)",
      backgroundColor:
        "var(--nuv-code-editor-tooltip-bg, var(--color-surface))",
      color:
        "var(--nuv-code-editor-tooltip-fg, var(--color-surface-foreground))",
      boxShadow: "var(--shadow-lg)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      lineHeight: "var(--text-sm--line-height)",
    },
    // The list of completions, drawn as the core's Command list is.
    ".cm-tooltip.cm-tooltip-autocomplete > ul": {
      maxHeight: "18rem",
      padding: "var(--spacing)",
      fontFamily: "var(--font-mono)",
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
      display: "flex",
      alignItems: "center",
      gap: "calc(var(--spacing) * 2)",
      minHeight: "var(--nuv-touch-size)",
      padding: "var(--spacing) calc(var(--spacing) * 3)",
      borderRadius: "var(--radius-sm)",
      "@media (pointer: fine)": { minHeight: "var(--nuv-control-height-sm)" },
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      outline: "2px solid transparent",
      outlineOffset: "-2px",
      backgroundColor:
        "var(--nuv-code-editor-option-active-bg, var(--color-primary))",
      color:
        "var(--nuv-code-editor-option-active-fg, var(--color-primary-foreground))",
    },
    ".cm-completionMatchedText": {
      textDecoration: "none",
      fontWeight: "var(--font-weight-semibold)",
    },
    ".cm-completionDetail": {
      marginInlineStart: "auto",
      fontStyle: "normal",
      opacity: "0.8",
    },
    ".cm-completionLabel": { whiteSpace: "pre" },
    // A problem: a word and an icon for its kind, then what's wrong.
    ".cm-tooltip-lint": { padding: "var(--spacing)" },
    ".cm-diagnostic": {
      padding: "var(--spacing) calc(var(--spacing) * 2)",
      borderLeftWidth: "3px",
    },
    ".cm-diagnostic-error": { borderLeftColor: danger },
    ".cm-diagnostic-warning": { borderLeftColor: warning },
    ".cm-diagnostic-info": { borderLeftColor: info },
    ".cm-diagnostic-hint": { borderLeftColor: hint },
    ".cm-lintRange-error": underline(danger),
    ".cm-lintRange-warning": underline(warning),
    ".cm-lintRange-info": underline(info),
    ".cm-lintRange-hint": underline(hint),
    ".cm-lint-marker": { width: "1em", height: "1em" },
    ".cm-lint-marker.cm-lint-marker-error": marker(danger, circle),
    ".cm-lint-marker.cm-lint-marker-warning": marker(warning, triangle),
    ".cm-lint-marker.cm-lint-marker-info": marker(info, diamond),
    ".cm-lint-marker.cm-lint-marker-hint": marker(hint, diamond),
  }),
);

/**
 * How tall the code is, in lines of it: at least `min`, and at most
 * `max`, past which it scrolls.
 */
export function heightTheme(min: number, max: number | undefined) {
  return EditorView.theme({
    "&": max === undefined ? {} : { maxHeight: lines(max) },
    ".cm-scroller": { minHeight: lines(min), overflow: "auto" },
  });
}

export const lines = (count: number) =>
  `calc(${count} * 1lh + 2 * ${padBlock})`;

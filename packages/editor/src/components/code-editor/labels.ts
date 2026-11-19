/** How bad a problem is. */
export type CodeEditorSeverity = "error" | "warning" | "info" | "hint";

/**
 * Everything the code editor says and doesn't draw, and the words in its
 * toolbar, status and search. Each has an English default.
 */
export interface CodeEditorLabels {
  /** The name of the toolbar. */
  toolbar?: string;
  /** The name of the language picker. */
  language?: string;
  /** The language of code with no language. */
  plainText?: string;
  /** The button that wraps long lines. */
  wrap?: string;
  copy?: string;
  /** Said once the code is on the clipboard. */
  copied?: string;
  format?: string;
  /** Said when `format` throws, as it does when the code can't be read. */
  formatFailed?: string;
  /** The name of the status bar under the code. */
  status?: string;
  /** Where the cursor is, in the status bar. */
  position?: (line: number, column: number) => string;
  /** How many places are selected at once, when it's more than one. */
  selections?: (count: number) => string;
  /** How many problems there are, in the status bar. */
  problems?: (count: number) => string;
  /**
   * Said to a screen reader on the code: Tab indents, and how to leave the
   * editor instead.
   */
  leave?: string;
  error?: string;
  warning?: string;
  info?: string;
  hint?: string;
  /** The name of the search panel. */
  search?: string;
  find?: string;
  replace?: string;
  findNext?: string;
  findPrevious?: string;
  replaceNext?: string;
  replaceAll?: string;
  matchCase?: string;
  wholeWord?: string;
  regexp?: string;
  closeSearch?: string;
  /** How many matches there are, and which one is selected. */
  matches?: (current: number, total: number) => string;
  /** The list of completions. */
  completions?: string;
  /** A stretch of folded code, and the button that opens it. */
  foldedCode?: string;
  unfold?: string;
  /** A character there's no sign for, shown as a dot. */
  controlCharacter?: string;
  /**
   * Any other words CodeMirror writes itself, by its own English, for
   * the extensions you add. They're passed to its `phrases`.
   */
  phrases?: Record<string, string>;
}

export const englishLabels: Required<CodeEditorLabels> = {
  toolbar: "Code",
  language: "Language",
  plainText: "Plain text",
  wrap: "Wrap lines",
  copy: "Copy code",
  copied: "Copied",
  format: "Format code",
  formatFailed: "The code couldn't be formatted.",
  status: "Code status",
  position: (line, column) => `Line ${line}, column ${column}`,
  selections: (count) => `${count} selections`,
  problems: (count) => (count === 1 ? "1 problem" : `${count} problems`),
  leave: "Tab indents. To leave the code, press Escape, then Tab.",
  error: "Error",
  warning: "Warning",
  info: "Info",
  hint: "Hint",
  search: "Search",
  find: "Find",
  replace: "Replace",
  findNext: "Next match",
  findPrevious: "Previous match",
  replaceNext: "Replace",
  replaceAll: "Replace all",
  matchCase: "Match case",
  wholeWord: "Whole word",
  regexp: "Regular expression",
  closeSearch: "Close search",
  matches: (current, total) =>
    total === 0 ? "No matches" : `${current} of ${total}`,
  completions: "Completions",
  foldedCode: "folded code",
  unfold: "unfold",
  controlCharacter: "Control character",
  phrases: {},
};

/** CodeMirror's own words, from the labels. */
export function phrasesOf(labels: Required<CodeEditorLabels>) {
  return {
    Completions: labels.completions,
    "folded code": labels.foldedCode,
    unfold: labels.unfold,
    "Control character": labels.controlCharacter,
    ...labels.phrases,
  };
}

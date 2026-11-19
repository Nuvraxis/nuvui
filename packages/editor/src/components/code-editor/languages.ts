import { LanguageDescription, LanguageSupport } from "@codemirror/language";
import { languages } from "@codemirror/language-data";

/**
 * A language: a name such as `"typescript"`, `"ts"` or `"py"`, or any
 * `LanguageSupport` from a CodeMirror language package.
 */
export type CodeEditorLanguage = string | LanguageSupport;

/** The languages the toolbar offers, unless it's given others. */
export const commonLanguages = [
  "JavaScript",
  "TypeScript",
  "JSX",
  "TSX",
  "CSS",
  "SCSS",
  "HTML",
  "JSON",
  "Markdown",
  "Python",
  "SQL",
  "YAML",
];

// A name, an alias, or what a file in the language ends with, so "md"
// finds Markdown as "markdown" does.
function describe(name: string): LanguageDescription | null {
  const wanted = name.trim();
  if (!wanted) return null;
  return (
    LanguageDescription.matchLanguageName(languages, wanted, false) ??
    LanguageDescription.matchFilename(languages, `file.${wanted}`) ??
    LanguageDescription.matchLanguageName(languages, wanted, true)
  );
}

/** The language a file is in, from its name, as a path is given. */
export function languageOfPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const file = path.split("/").pop() ?? path;
  return LanguageDescription.matchFilename(languages, file)?.name;
}

/** The language's own name, or null for plain text. */
export function nameOf(language: CodeEditorLanguage | undefined) {
  if (!language) return null;
  if (language instanceof LanguageSupport) return language.language.name;
  return describe(language)?.name ?? null;
}

/** The language's support when it's here already, without waiting. */
export function supportNow(
  language: CodeEditorLanguage | undefined,
): LanguageSupport | null {
  if (!language) return null;
  if (language instanceof LanguageSupport) return language;
  return describe(language)?.support ?? null;
}

/**
 * The language's support, fetched the first time it's asked for. Null
 * for a name that isn't a language, which is shown as plain text.
 */
export async function loadLanguage(
  language: CodeEditorLanguage | undefined,
): Promise<LanguageSupport | null> {
  if (!language) return null;
  if (language instanceof LanguageSupport) return language;
  const description = describe(language);
  if (!description) return null;
  return description.support ?? description.load();
}

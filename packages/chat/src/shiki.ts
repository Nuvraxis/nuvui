import type {
  CodeHighlighter,
  CodeToken,
} from "./components/code-block/code-block";

// Where each kind of token takes its color from when the variable for it
// isn't set. The theme checks all four against the surface a code block
// is drawn on, as text, in every preset and in both modes.
const defaults = {
  foreground: "currentcolor",
  "token-comment": "var(--color-muted-foreground)",
  "token-punctuation": "var(--color-muted-foreground)",
  "token-keyword": "var(--color-danger)",
  "token-string": "var(--color-success)",
  "token-string-expression": "var(--color-success)",
  "token-constant": "var(--color-warning)",
  "token-function": "currentcolor",
  "token-parameter": "currentcolor",
  "token-link": "currentcolor",
  "token-inserted": "var(--color-success)",
  "token-deleted": "var(--color-danger)",
  "token-changed": "var(--color-warning)",
};

// Shiki's font styles, which are bits of one number.
const italic = 1;
const bold = 2;
const underline = 4;
const struck = 8;

async function start() {
  // Loaded when code is first colored, and not with the page. The
  // engine is the one written in JavaScript: no WebAssembly to fetch.
  const [core, engine, languages] = await Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("shiki/langs"),
  ]);
  const theme = core.createCssVariablesTheme({
    name: "nuvui",
    variablePrefix: "--nuv-code-block-",
    variableDefaults: defaults,
    fontStyle: true,
  });
  const highlighter = await core.createHighlighterCore({
    themes: [theme],
    langs: [],
    // A grammar with a pattern this engine can't run colors less, and
    // doesn't fail.
    engine: engine.createJavaScriptRegexEngine({ forgiving: true }),
  });
  return { highlighter, grammars: languages.bundledLanguages };
}

/**
 * A highlighter for `CodeBlock` and `Markdown` that colors with Shiki.
 * Shiki itself, and the grammar of each language, is fetched the first
 * time it's needed. The colors are CSS variables, so they follow the
 * theme and dark mode.
 *
 * Make one for the whole app, outside any component.
 */
export function createShikiHighlighter(): CodeHighlighter {
  let shiki: ReturnType<typeof start> | undefined;
  // The languages that have colored something already.
  const met = new Set<string>();

  return async (code, language) => {
    if (!language) return null;
    shiki ??= start();
    const { highlighter, grammars } = await shiki;
    const name = language.toLowerCase();

    if (!highlighter.getLoadedLanguages().includes(name)) {
      const grammar = grammars[name as keyof typeof grammars];
      if (!grammar) return null;
      await highlighter.loadLanguage(grammar);
    }

    // Shiki gives up on a line after half a second and leaves the rest of
    // it uncolored, so that a pattern gone wrong can't hold the page. The
    // first code in a language is slow for another reason: every pattern
    // it meets is built then. On a slow machine that alone takes longer,
    // so the first time gets ten times as long.
    const first = !met.has(name);
    met.add(name);
    const { tokens } = highlighter.codeToTokens(code, {
      lang: name,
      theme: "nuvui",
      tokenizeTimeLimit: first ? 5000 : 500,
    });
    return tokens.map((line) =>
      line.map((token) => {
        const style = token.fontStyle ?? 0;
        const colored: CodeToken = { content: token.content };
        if (token.color) colored.color = token.color;
        if (style & italic) colored.fontStyle = "italic";
        if (style & bold) colored.fontWeight = "bold";
        if (style & underline) colored.textDecoration = "underline";
        if (style & struck) colored.textDecoration = "line-through";
        return colored;
      }),
    );
  };
}

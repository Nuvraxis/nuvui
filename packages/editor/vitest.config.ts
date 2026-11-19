import core from "@nuvui/react/package.json" with { type: "json" };
import { browserTests } from "@nuvui/tooling/vitest";

export default browserTests({
  dependencies: [
    // What @nuvui/react imports. It's linked from the workspace, so Vite
    // treats it as source and would otherwise find these one at a time
    // while the tests are already running.
    ...Object.keys(core.dependencies).map((name) => `@nuvui/react > ${name}`),
    "@codemirror/autocomplete",
    "@codemirror/commands",
    "@codemirror/language-data > @codemirror/lang-css",
    "@codemirror/language-data > @codemirror/lang-html",
    "@codemirror/language-data > @codemirror/lang-javascript",
    "@codemirror/language-data > @codemirror/lang-json",
    "@codemirror/language-data > @codemirror/lang-markdown",
    "@codemirror/language-data > @codemirror/lang-yaml",
    "@codemirror/language",
    "@codemirror/language-data",
    "@codemirror/lint",
    "@codemirror/merge",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/highlight",
    "@tiptap/core",
    "@tiptap/extensions",
    "@tiptap/pm/state",
    "@tiptap/pm/view",
    "@tiptap/react",
    "@tiptap/react/menus",
    "@tiptap/starter-kit",
  ],
});

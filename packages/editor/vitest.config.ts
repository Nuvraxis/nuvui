import core from "@nuvui/react/package.json" with { type: "json" };
import { browserTests } from "@nuvui/tooling/vitest";

export default browserTests({
  dependencies: [
    // What @nuvui/react imports. It's linked from the workspace, so Vite
    // treats it as source and would otherwise find these one at a time
    // while the tests are already running.
    ...Object.keys(core.dependencies).map((name) => `@nuvui/react > ${name}`),
    "@tiptap/core",
    "@tiptap/extensions",
    "@tiptap/pm/state",
    "@tiptap/pm/view",
    "@tiptap/react",
    "@tiptap/react/menus",
    "@tiptap/starter-kit",
  ],
});

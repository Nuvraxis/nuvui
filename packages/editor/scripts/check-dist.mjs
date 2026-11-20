import { fileURLToPath } from "node:url";
import { checkDist } from "@nuvui/tooling/check-dist";

await checkDist({
  root: fileURLToPath(new URL("..", import.meta.url)),
  stylesheets: ["styles.css"],
  // They bring CodeMirror, which the rich text editor doesn't need. Both
  // are imported from @nuvui/editor/code.
  apart: ["code-editor", "diff-editor"],
});

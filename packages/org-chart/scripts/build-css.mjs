import { fileURLToPath } from "node:url";
import { buildCss } from "@nuvui/tooling/build-css";

await buildCss({
  root: fileURLToPath(new URL("..", import.meta.url)),
  stylesheets: { "styles.css": "src/styles/index.scss" },
});

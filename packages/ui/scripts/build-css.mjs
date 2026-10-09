import { fileURLToPath } from "node:url";
import { buildCss } from "@nuvui/tooling/build-css";

await buildCss({
  root: fileURLToPath(new URL("..", import.meta.url)),
  stylesheets: {
    "styles.css": "src/styles/index.scss",
    "tokens.css": "src/styles/tokens.scss",
    "base.css": "src/styles/base.scss",
  },
  presets: true,
  scss: true,
});

import { fileURLToPath } from "node:url";
import { checkDist } from "@nuvui/tooling/check-dist";

await checkDist({
  root: fileURLToPath(new URL("..", import.meta.url)),
  stylesheets: ["styles.css", "tokens.css", "base.css"],
  presets: true,
  scss: true,
});

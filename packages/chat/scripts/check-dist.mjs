import { fileURLToPath } from "node:url";
import { checkDist } from "@nuvui/tooling/check-dist";

await checkDist({
  root: fileURLToPath(new URL("..", import.meta.url)),
  stylesheets: ["styles.css"],
  // It brings a markdown parser, which nothing else here needs.
  apart: ["markdown"],
});

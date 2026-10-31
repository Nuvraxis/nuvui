import { readFileSync } from "node:fs";
import path from "node:path";

// Next runs with the app folder as the working directory, in dev and in a
// build. This is read on the server, when a page is made.
const readme = path.join(process.cwd(), "..", "..", "README.md");

export interface RoadItem {
  text: string;
  done: boolean;
}

/**
 * The checklist for 1.0, from the README, which is where it's kept up to
 * date. Its links are left out: a line is shown here as plain text.
 */
export function roadToOne(): RoadItem[] {
  const section =
    readFileSync(readme, "utf8")
      .split("## Status and the road to 1.0")[1]
      ?.split("\n## ")[0] ?? "";
  return [...section.matchAll(/^- \[( |x)\] (.+)$/gm)].map(
    ([, mark, line = ""]) => ({
      done: mark === "x",
      text: line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
    }),
  );
}

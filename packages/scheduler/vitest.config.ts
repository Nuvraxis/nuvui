import picker from "@nuvui/date-picker/package.json" with { type: "json" };
import core from "@nuvui/react/package.json" with { type: "json" };
import { browserTests } from "@nuvui/tooling/vitest";
import pkg from "./package.json" with { type: "json" };

export default browserTests({
  dependencies: [
    ...Object.keys(pkg.dependencies),
    // For the tests of a calendar that a server rendered first.
    "react-dom/server",
    // What the two linked packages import. They're linked from the
    // workspace, so Vite treats them as source and would otherwise find
    // these one at a time while the tests are already running.
    ...Object.keys(core.dependencies).map((name) => `@nuvui/react > ${name}`),
    ...Object.keys(picker.dependencies).map(
      (name) => `@nuvui/date-picker > ${name}`,
    ),
  ],
});

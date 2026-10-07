import core from "@nuvui/react/package.json" with { type: "json" };
import { browserTests } from "@nuvui/tooling/vitest";
import pkg from "./package.json" with { type: "json" };

export default browserTests({
  dependencies: [
    ...Object.keys(pkg.dependencies),
    // Entries of their own, which the package name alone doesn't cover.
    "date-fns/locale/en-US",
    "react-day-picker/locale",
    // For the tests of a calendar that a server rendered first.
    "react-dom/server",
    // What @nuvui/react imports. It's linked from the workspace, so Vite
    // treats it as source and would otherwise find these one at a time
    // while the tests are already running.
    ...Object.keys(core.dependencies).map((name) => `@nuvui/react > ${name}`),
  ],
});

import { browserTests } from "@nuvui/tooling/vitest";
import pkg from "./package.json" with { type: "json" };

export default browserTests({
  dependencies: Object.keys(pkg.dependencies),
});

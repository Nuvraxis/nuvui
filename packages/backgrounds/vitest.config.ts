import { browserTests } from "@nuvui/tooling/vitest";

export default browserTests({
  // Only in the tests: what a server sends.
  dependencies: ["react-dom/server"],
});

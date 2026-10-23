import { library } from "@nuvui/tooling/tsdown";

export default library({
  entry: ["src/index.ts", "src/components/*/index.ts"],
  // three's loaders and controls are ESM only.
  format: ["esm"],
});

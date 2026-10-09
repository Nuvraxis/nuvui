import { library } from "@nuvui/tooling/tsdown";

export default library({
  entry: [
    "src/index.ts",
    "src/components/*/index.ts",
    "src/full.ts",
    "src/virtual.tsx",
  ],
  // @tanstack/react-table is ESM only.
  format: ["esm"],
});

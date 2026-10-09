import { library } from "@nuvui/tooling/tsdown";

export default library({
  entry: [
    "src/index.ts",
    "src/components/*/index.ts",
    "src/direction/index.ts",
  ],
});

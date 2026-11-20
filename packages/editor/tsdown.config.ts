import { library } from "@nuvui/tooling/tsdown";

export default library({
  entry: ["src/index.ts", "src/code.ts", "src/components/*/index.ts"],
});

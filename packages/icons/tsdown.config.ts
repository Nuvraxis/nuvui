import { library } from "@nuvui/tooling/tsdown";

export default library({
  entry: ["src/index.ts", "src/rounded.ts", "src/sharp.ts"],
  css: false,
  // Each icon's doc comment carries a picture of it for an editor to show.
  // That's read from the types, and in the scripts it would only be weight.
  jsdoc: false,
});

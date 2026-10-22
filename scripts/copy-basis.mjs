// Copies three's KTX2 transcoder, basis_transcoder.js and .wasm, into an
// app's public folder, from the three that app has installed. A model
// viewer with `decoders={{ ktx2: ... }}` loads them from there. A
// transcoder from another version of three can fail, which is why they're
// copied on every dev and build run and not kept in git.
//
//   node ../../scripts/copy-basis.mjs public/basis
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const target = process.argv[2];
if (!target) throw new Error("Say which folder to copy the transcoder into.");

const require = createRequire(join(process.cwd(), "package.json"));
// three's CommonJS build is in build/, beside its examples.
const three = join(dirname(require.resolve("three")), "..");
const from = join(three, "examples", "jsm", "libs", "basis");

mkdirSync(target, { recursive: true });
for (const file of ["basis_transcoder.js", "basis_transcoder.wasm"]) {
  copyFileSync(join(from, file), join(target, file));
}

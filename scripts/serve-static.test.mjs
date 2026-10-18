import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

const server = path.join(import.meta.dirname, "serve-static.mjs");
const folder = mkdtempSync(path.join(tmpdir(), "serve-static-"));
const port = 3190;
const url = (file) => `http://localhost:${port}/${file}`;
let child;

before(async () => {
  writeFileSync(path.join(folder, "index.html"), "<p>home</p>");
  writeFileSync(path.join(folder, "404.html"), "<p>missing</p>");
  writeFileSync(path.join(folder, "clip.mp4"), "0123456789");
  writeFileSync(path.join(folder, "captions.vtt"), "WEBVTT\n");
  child = spawn(process.execPath, [server, String(port), folder]);
  await new Promise((resolve, reject) => {
    child.stdout.once("data", resolve);
    child.once("exit", reject);
  });
});

after(() => {
  child.kill();
  rmSync(folder, { recursive: true, force: true });
});

test("a video is sent as one, and says it can be sent in parts", async () => {
  const response = await fetch(url("clip.mp4"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "video/mp4");
  assert.equal(response.headers.get("accept-ranges"), "bytes");
  assert.equal(await response.text(), "0123456789");
});

test("captions are sent as text/vtt, which Firefox needs", async () => {
  const response = await fetch(url("captions.vtt"));
  assert.match(response.headers.get("content-type"), /^text\/vtt/);
});

test("a range is sent alone, with where it sits in the file", async () => {
  const response = await fetch(url("clip.mp4"), {
    headers: { range: "bytes=2-5" },
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 2-5/10");
  assert.equal(await response.text(), "2345");
});

test("an open range runs to the end, and a suffix is the last bytes", async () => {
  const open = await fetch(url("clip.mp4"), {
    headers: { range: "bytes=7-" },
  });
  assert.equal(await open.text(), "789");
  const suffix = await fetch(url("clip.mp4"), {
    headers: { range: "bytes=-3" },
  });
  assert.equal(suffix.headers.get("content-range"), "bytes 7-9/10");
  assert.equal(await suffix.text(), "789");
});

test("a range past the end is refused", async () => {
  const response = await fetch(url("clip.mp4"), {
    headers: { range: "bytes=20-30" },
  });
  assert.equal(response.status, 416);
  assert.equal(response.headers.get("content-range"), "bytes */10");
});

test("a page that isn't there is still the 404 page, whole", async () => {
  const response = await fetch(url("nowhere"), {
    headers: { range: "bytes=0-3" },
  });
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "<p>missing</p>");
});

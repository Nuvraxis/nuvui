// Checks a running container of the site image, the one apps/Dockerfile
// builds. The end-to-end tests run against scripts/serve-static.mjs, so
// nothing else asks nginx whether apps/nginx.conf serves the same site.
//
//   docker run --rm --publish 8080:8080 nuvui-site
//   node scripts/check-site-image.mjs http://localhost:8080
const [base = "http://localhost:8080"] = process.argv.slice(2);

const failures = [];
let checked = 0;

function check(what, ok, got) {
  checked += 1;
  if (!ok) failures.push(`${what}: got ${got}`);
}

// Never follows a redirect: where one goes is what's being checked.
const get = (path) => fetch(new URL(path, base), { redirect: "manual" });

// nginx starts in well under a second. This is for a slow runner.
async function waitUntilUp() {
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      if ((await get("/healthz")).ok) return;
    } catch {
      // Not listening yet.
    }
    if (Date.now() > deadline) {
      console.error(`check-site-image: nothing answered at ${base}/healthz`);
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function page(path) {
  const response = await get(path);
  const type = response.headers.get("content-type") ?? "";
  check(`${path} status`, response.status === 200, response.status);
  check(`${path} content type`, type.startsWith("text/html"), type);
  check(
    `${path} cache-control`,
    response.headers.get("cache-control") === "no-cache",
    response.headers.get("cache-control"),
  );
  return response.text();
}

async function redirect(path, to) {
  const response = await get(path);
  check(`${path} status`, response.status === 301, response.status);
  check(
    `${path} location`,
    response.headers.get("location") === to,
    response.headers.get("location"),
  );
}

await waitUntilUp();

// Both apps, and a page of each that's a file next to a folder of the
// same name.
const home = await page("/");
const docs = await page("/docs");
await page("/blocks");
await page("/docs/components/button");

// One address per page, and a redirect that doesn't name a host: the
// container can't know the one a visitor sees.
await redirect("/blocks.html", "/blocks");
await redirect("/blocks/", "/blocks");
await redirect("/index.html", "/");
await redirect("/docs/", "/docs");
await redirect("/docs/index.html", "/docs");
await redirect("/blocks.html?x=1", "/blocks?x=1");

// The website's own 404 page, with the status that says so.
for (const path of ["/not-a-page", "/docs/not-a-page", "/.env"]) {
  const missing = await get(path);
  const type = missing.headers.get("content-type") ?? "";
  check(`${path} status`, missing.status === 404, missing.status);
  check(`${path} content type`, type.startsWith("text/html"), type);
  check(
    `${path} cache-control`,
    missing.headers.get("cache-control") === null,
    missing.headers.get("cache-control"),
  );
}

// A hashed file of each app is kept for good, and a missing one isn't.
for (const [name, html, prefix] of [
  ["website", home, "/_next/static/"],
  ["docs", docs, "/docs/_next/static/"],
]) {
  const start = html.indexOf(`"${prefix}`);
  const asset = start < 0 ? undefined : html.slice(start + 1).split('"')[0];
  check(`${name} page names a file under ${prefix}`, asset, "none");
  if (!asset) continue;

  const response = await get(asset);
  check(`${asset} status`, response.status === 200, response.status);
  check(
    `${asset} cache-control`,
    response.headers.get("cache-control")?.includes("immutable"),
    response.headers.get("cache-control"),
  );

  const gone = await get(`${prefix}chunks/not-a-file.js`);
  check(`missing ${name} file status`, gone.status === 404, gone.status);
  check(
    `missing ${name} file cache-control`,
    gone.headers.get("cache-control") === null,
    gone.headers.get("cache-control"),
  );
}

// What Next's router fetches ahead of a navigation, and what the shadcn
// CLI installs a block from.
for (const [path, wanted] of [
  ["/blocks.txt", "text/plain"],
  ["/docs/__next._tree.txt", "text/plain"],
  ["/r/registry.json", "application/json"],
  ["/site.json", "application/json"],
  ["/sitemap.xml", "xml"],
  ["/robots.txt", "text/plain"],
  // The icons, for a tab and for a home screen, of both apps.
  ["/favicon.ico", "image/"],
  ["/icon.svg", "image/svg+xml"],
  ["/apple-icon.png", "image/png"],
  ["/docs/icon.svg", "image/svg+xml"],
  ["/docs/favicon.ico", "image/"],
  ["/icons/icon-512.png", "image/png"],
  ["/manifest.webmanifest", "application/manifest+json"],
]) {
  const response = await get(path);
  const type = response.headers.get("content-type") ?? "";
  check(`${path} status`, response.status === 200, response.status);
  check(`${path} content type`, type.includes(wanted), type);
}

// On a page and on an error both.
for (const path of ["/", "/not-a-page"]) {
  const { headers } = await get(path);
  for (const [name, value] of [
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "SAMEORIGIN"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
  ]) {
    check(`${path} ${name}`, headers.get(name) === value, headers.get(name));
  }
  check(
    `${path} server`,
    headers.get("server") === "nginx",
    headers.get("server"),
  );
}

if (failures.length > 0) {
  console.error(`check-site-image: ${failures.length} of ${checked} failed`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`check-site-image: ${checked} checks passed against ${base}`);

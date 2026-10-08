import { defineConfig, devices } from "@playwright/test";

// A port of its own, so neither a running `next dev` nor the docs' tests get
// in the way.
const port = 3200;
const isCI = Boolean(process.env.CI);

// For the test that presses a code block's copy button. Only Chromium has
// these permissions to give. The other engines refuse to start with them.
const clipboard = {
  permissions: ["clipboard-read", "clipboard-write"],
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  // Three engines on a desktop, and the two phone ones that matter: Chrome
  // on Android and Safari on an iPhone.
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...clipboard } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...clipboard } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 15"] } },
  ],
  // Serves `out`, which after a build is the whole site: this app's pages
  // and the docs' under /docs. So `pnpm build` has to come first. The turbo
  // task takes care of that.
  webServer: {
    command: `node ../../scripts/serve-static.mjs ${port} out`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCI,
  },
});

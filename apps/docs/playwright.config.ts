import { defineConfig, devices } from "@playwright/test";

// Not 3000, so a running `next dev` doesn't get tested by accident.
const port = 3100;
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
  // Serves the exported site in `out`, the same files a host would serve, so
  // `pnpm build` has to come first. The turbo task takes care of that.
  webServer: {
    command: `node ../../scripts/serve-static.mjs ${port} out --under /docs`,
    url: `http://localhost:${port}/docs`,
    reuseExistingServer: !isCI,
  },
});

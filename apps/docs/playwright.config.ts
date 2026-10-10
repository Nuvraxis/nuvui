import { askedProjects } from "@nuvui/tooling/browsers";
import { defineConfig, devices } from "@playwright/test";

// Not 3000, so a running `next dev` doesn't get tested by accident.
//
// In CI the tests are cut into slices that run at the same time, and on a
// self-hosted machine they share its network and its cores. So each slice
// is given a port of its own and a number of workers, by .github/workflows/
// e2e.yml.
const port = Number(process.env.NUVUI_E2E_PORT ?? 3100);
const workers = Number(process.env.NUVUI_E2E_WORKERS) || undefined;
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
  // Left alone, Playwright uses half the cores. A CI runner with a slice
  // to itself has two, and one worker would take twice as long over the
  // same tests.
  workers: workers ?? (isCI ? "100%" : undefined),
  // The JSON is what scripts/e2e-comment.mjs reads, to write the failures
  // on the pull request.
  reporter: isCI
    ? [
        ["github"],
        ["html", { open: "never" }],
        ["json", { outputFile: "test-results/results.json" }],
      ]
    : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  // Three engines on a desktop, and the two phone ones that matter: Chrome
  // on Android and Safari on an iPhone. NUVUI_BROWSERS=chromium keeps the
  // two Chromium ones, for a quicker run while working on something.
  projects: askedProjects([
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...clipboard } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...clipboard } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 15"] } },
  ]),
  // Serves the exported site in `out`, the same files a host would serve, so
  // `pnpm build` has to come first. The turbo task takes care of that.
  webServer: {
    command: `node ../../scripts/serve-static.mjs ${port} out --under /docs`,
    url: `http://localhost:${port}/docs`,
    reuseExistingServer: !isCI,
  },
});

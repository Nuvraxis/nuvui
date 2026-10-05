import { defineConfig, devices } from "@playwright/test";

// Not 3000, so a running `next dev` doesn't get tested by accident.
const port = 3100;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
    // For the test that presses a code block's copy button.
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Serves the exported site in `out`, the same files a host would serve, so
  // `pnpm build` has to come first. The turbo task takes care of that.
  webServer: {
    command: `pnpm exec serve out --listen ${port} --no-request-logging --no-clipboard`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCI,
  },
});

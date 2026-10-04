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
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Runs against the production build, so `pnpm build` has to come first.
  // The turbo task takes care of that.
  webServer: {
    command: `pnpm exec next start --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCI,
  },
});

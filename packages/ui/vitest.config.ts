import { playwright } from "@vitest/browser-playwright";
import type { Page } from "playwright";
import { defineConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";
import pkg from "./package.json" with { type: "json" };

type Media = Parameters<Page["emulateMedia"]>[0];

// Called from tests through test/media.ts.
const emulateMedia: BrowserCommand<[media: Media]> = async (
  { page },
  media,
) => {
  await page.emulateMedia(media);
};

export default defineConfig({
  optimizeDeps: {
    // Bundled before the first test instead of when Vite first runs into
    // them. Discovering one mid-run reloads the page, and the reload can
    // leave two copies of React loaded, which breaks every hook.
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "vitest-browser-react",
      "axe-core",
      ...Object.keys(pkg.dependencies),
    ],
  },
  test: {
    include: ["{src,test}/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    // Component tests run in a real browser through Playwright. jsdom has no
    // layout, so it can't check focus rings, touch target sizes or color
    // contrast, and it needs polyfills for half of what Radix does.
    browser: {
      enabled: true,
      // Without a limit, a click or hover on something that has already gone
      // waits forever, and every test after it waits behind it.
      provider: playwright({ actionTimeout: 5000 }),
      headless: true,
      // Tests start at phone size, like the styles do. Keep this in step
      // with viewports.phone in test/media.ts.
      viewport: { width: 390, height: 844 },
      instances: [{ browser: "chromium" }],
      commands: { emulateMedia },
    },
  },
});

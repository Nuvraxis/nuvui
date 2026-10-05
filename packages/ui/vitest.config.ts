import { playwright } from "@vitest/browser-playwright";
import type { Page } from "playwright";
import { defineConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";

type Media = Parameters<Page["emulateMedia"]>[0];

// Called from tests through test/media.ts.
const emulateMedia: BrowserCommand<[media: Media]> = async (
  { page },
  media,
) => {
  await page.emulateMedia(media);
};

export default defineConfig({
  test: {
    include: ["{src,test}/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    // Component tests run in a real browser through Playwright. jsdom has no
    // layout, so it can't check focus rings, touch target sizes or color
    // contrast, and it needs polyfills for half of what Radix does.
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
      commands: { emulateMedia },
    },
  },
});

import { playwright } from "@vitest/browser-playwright";
import type { Page } from "playwright";
import { configDefaults, defineConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";
import pkg from "./package.json" with { type: "json" };

type Media = Parameters<Page["emulateMedia"]>[0];
type ContextOptions = NonNullable<
  NonNullable<Parameters<typeof playwright>[0]>["contextOptions"]
>;

// Called from tests through test/media.ts.
const emulateMedia: BrowserCommand<[media: Media]> = async (
  { page },
  media,
) => {
  await page.emulateMedia(media);
};

// Without a limit on actions, a click or hover on something that has already
// gone waits forever, and every test after it waits behind it.
const provider = (contextOptions: ContextOptions = {}) =>
  playwright({ actionTimeout: 5000, contextOptions });

const touchTests = "test/touch.test.tsx";

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
      provider: provider(),
      headless: true,
      // Tests start at phone size, like the styles do. Keep this in step
      // with viewports.phone in test/media.ts.
      viewport: { width: 390, height: 844 },
      // Two browser contexts, because whether the screen is a touch screen
      // can't be switched back and forth inside one. Touch emulation can be
      // turned on in a page, but turning it off again doesn't give the mouse
      // back everywhere: on Linux with no input devices, as in CI, the page
      // is left with no pointer at all. So every test runs with a mouse,
      // except the ones in one file, which run with a touch screen.
      instances: [
        {
          browser: "chromium",
          name: "mouse",
          exclude: [...configDefaults.exclude, touchTests],
        },
        {
          browser: "chromium",
          name: "touch",
          include: [touchTests],
          provider: provider({ hasTouch: true }),
        },
      ],
      commands: { emulateMedia },
    },
  },
});

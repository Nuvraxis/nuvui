import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineConfig } from "vitest/config";
import { askedBrowsers } from "./browsers.mjs";

// Called from tests through test/media.ts.
/** @type {import("vitest/node").BrowserCommand<[media: object]>} */
const emulateMedia = async ({ page }, media) => {
  await page.emulateMedia(media);
};

// A turn of the mouse wheel over an element, sent the way a real mouse sends
// it. An event built in the page wouldn't scroll anything, and it's the
// scrolling that the tests are after.
/** @type {import("vitest/node").BrowserCommand<[selector: string, deltaY: number]>} */
const wheel = async ({ page, iframe }, selector, deltaY) => {
  await iframe.locator(selector).hover();
  await page.mouse.wheel(0, deltaY);
};

// Without a limit on actions, a click or hover on something that has already
// gone waits forever, and every test after it waits behind it. Five seconds
// is plenty on a developer's machine. A CI runner has two cores for three
// browsers, and there a tap on something that's still sliding into place
// has been seen to take longer, so it gets three times as long.
const actionTimeout = process.env.CI ? 15_000 : 5000;
const provider = (contextOptions = {}) =>
  playwright({ actionTimeout, contextOptions });

const touchTests = "test/touch.test.tsx";

/**
 * The component tests of a published package, in real browsers.
 *
 * @param {object} options
 * @param {string[]} options.dependencies What the package's own code
 *   imports, by package name.
 */
export function browserTests({ dependencies }) {
  // All three engines, or the ones NUVUI_BROWSERS names.
  const browsers = askedBrowsers();

  return defineConfig({
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
        ...dependencies,
      ],
    },
    test: {
      include: ["{src,test}/**/*.test.{ts,tsx}"],
      // Chromium runs several test files at once, each in a page of its own.
      // Firefox and WebKit only treat one page as focused, so with files
      // side by side, the tests that follow keyboard focus fail in whichever
      // pages aren't it. With either of them in the run, files go one at a
      // time.
      fileParallelism: browsers.every((browser) => browser === "chromium"),
      setupFiles: [fileURLToPath(new URL("./test/setup.ts", import.meta.url))],
      // What runs after each test puts the page back as it was, and waits
      // for the page to do it. Vitest's ten seconds is less than that may
      // take on a busy machine. See parkPointer in test/setup.ts.
      hookTimeout: 60_000,
      // On a CI runner a browser now and then stops answering for longer
      // than any of these limits, and the test it was in fails for no
      // reason of its own. There a failed test gets two more goes, as the
      // end-to-end tests do. On a developer's machine it fails the first
      // time, so a test that's unsteady is seen.
      retry: process.env.CI ? 2 : 0,
      // Component tests run in a real browser through Playwright. jsdom has
      // no layout, so it can't check focus rings, touch target sizes or
      // color contrast, and it needs polyfills for half of what Radix does.
      browser: {
        enabled: true,
        provider: provider(),
        headless: true,
        // Tests start at phone size, like the styles do. Keep this in step
        // with viewports.phone in test/media.ts.
        viewport: { width: 390, height: 844 },
        // Two browser contexts, because whether the screen is a touch screen
        // can't be switched back and forth inside one. Touch emulation can
        // be turned on in a page, but turning it off again doesn't give the
        // mouse back everywhere: on Linux with no input devices, as in CI,
        // the page is left with no pointer at all. So every test runs with a
        // mouse, except the ones in one file, which run with a touch screen.
        instances: browsers.flatMap((browser) => [
          {
            browser,
            name: `${browser} mouse`,
            exclude: [...configDefaults.exclude, touchTests],
          },
          {
            browser,
            name: `${browser} touch`,
            include: [touchTests],
            provider: provider({ hasTouch: true }),
          },
        ]),
        commands: { emulateMedia, wheel },
      },
    },
  });
}

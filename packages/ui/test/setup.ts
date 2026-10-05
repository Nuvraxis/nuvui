import { afterEach, expect } from "vitest";
import { axeMatchers } from "./axe";
import { emulateMedia } from "./media";

expect.extend(axeMatchers);

// Media emulation and the theme attribute live on the page, not in the
// rendered component, so they'd leak into the next test.
afterEach(async () => {
  document.documentElement.removeAttribute("data-theme");
  await emulateMedia({ colorScheme: null, reducedMotion: null });
});

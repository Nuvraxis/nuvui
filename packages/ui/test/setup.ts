import { afterEach, expect } from "vitest";
import { userEvent } from "vitest/browser";
import { axeMatchers } from "./axe";
import { emulateMedia, emulateTouch, setViewport } from "./media";

expect.extend(axeMatchers);

// The mouse pointer stays where the last test left it, and test files share
// a page. A button rendered under it by the next test is hovered, and shows
// its hover color instead of the one being checked. The bottom corner is the
// spot least likely to have anything under it.
async function parkPointer() {
  await userEvent.hover(document.documentElement, {
    position: { x: window.innerWidth - 1, y: window.innerHeight - 1 },
    // The point is outside the element's own box once the page is empty.
    force: true,
  });
}

// All of this lives on the page rather than in the rendered component, so
// it would leak into the next test.
afterEach(async () => {
  document.documentElement.removeAttribute("data-theme");
  await emulateMedia({
    colorScheme: null,
    reducedMotion: null,
    forcedColors: null,
  });
  await emulateTouch(false);
  await setViewport("phone");
  await parkPointer();
});

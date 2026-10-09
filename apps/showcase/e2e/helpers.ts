import type { Frame, Locator, Page } from "@playwright/test";

// The pages are static HTML, so they're visible before React has attached
// its handlers. Tests that press keys or click straight away wait for that.
// The attribute is set by an effect, in this app's Hydrated component and in
// the docs app's provider.
export async function open(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator("html[data-hydrated]").waitFor();
}

// On the phone projects a press is a real touch, which takes a different
// path through Radix than a mouse click does.
export function press(locator: Locator, isMobile: boolean) {
  return isMobile ? locator.tap() : locator.click();
}

export const overflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

export const wcag = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// Run before axe. Playwright's Safari, as an iPhone, can report an
// element's style from before the page's theme was set: getComputedStyle
// gives black text and no background for a card that's drawn, and
// screenshots, with light text on a dark surface. axe works from what's
// reported, and so finds contrast failures that aren't on the screen. Any
// change of style makes the browser work everything out again. This is one
// that changes nothing anyone could see. A block's preview is a page in a
// frame, with the same theme and the same trouble, and axe looks inside
// it, so every frame gets the same.
export async function settleStyles(page: Page) {
  const settle = (frame: Frame) =>
    frame.evaluate(() => {
      document.body.style.setProperty("outline", "0");
      return getComputedStyle(document.body).outlineStyle;
    });

  await settle(page.mainFrame());
  for (const frame of page.frames().slice(1)) {
    // A preview that hasn't been scrolled to has no page yet, and asking
    // it anything waits for one. It's given a moment and then left.
    await Promise.race([
      settle(frame).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
  }
}

// The errors a page throws, for a test that expects none. Loading another
// page cancels whatever the router was fetching ahead for this one, and
// Safari reports each cancelled fetch as an error. Those aren't the page's,
// and are left out.
export function pageProblems(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (error) => {
    if (!/_rsc=.*access control checks/.test(error.message)) {
      problems.push(error.message);
    }
  });
  return problems;
}

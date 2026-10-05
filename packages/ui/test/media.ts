import { cdp, commands, page } from "vitest/browser";

export interface Media {
  colorScheme?: "light" | "dark" | null;
  reducedMotion?: "reduce" | "no-preference" | null;
  forcedColors?: "active" | "none" | null;
}

declare module "vitest/browser" {
  interface BrowserCommands {
    emulateMedia: (media: Media) => Promise<void>;
  }
}

// Changes what the browser reports for prefers-color-scheme,
// prefers-reduced-motion and forced-colors. Pass null to go back to the
// default. The command
// itself is defined in vitest.config.ts, since it runs on the Playwright side.
export function emulateMedia(media: Media): Promise<void> {
  return commands.emulateMedia(media);
}

// Makes the browser report (pointer: coarse) and (hover: none), the way a
// phone does. Playwright's emulateMedia has no option for this.
export async function emulateTouch(enabled: boolean): Promise<void> {
  await cdp().send("Emulation.setTouchEmulationEnabled", { enabled });
}

export const viewports = {
  phone: [390, 844],
  desktop: [1280, 800],
} as const;

// The test's iframe is resized from outside, and its resize event can arrive
// after the call has returned. Waiting for it here keeps it out of whatever
// runs next, where it would close an open select: Radix closes those when
// the window is resized.
export async function setViewport(name: keyof typeof viewports): Promise<void> {
  const [width, height] = viewports[name];
  if (window.innerWidth === width && window.innerHeight === height) return;

  const resized = new Promise<void>((resolve) => {
    window.addEventListener("resize", () => resolve(), { once: true });
    setTimeout(resolve, 1000);
  });
  await page.viewport(width, height);
  await resized;
}

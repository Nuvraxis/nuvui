import { commands, page } from "vitest/browser";

export interface Media {
  colorScheme?: "light" | "dark" | null;
  reducedMotion?: "reduce" | "no-preference" | null;
  forcedColors?: "active" | "none" | null;
}

declare module "vitest/browser" {
  interface BrowserCommands {
    emulateMedia: (media: Media) => Promise<void>;
    wheel: (selector: string, deltaY: number) => Promise<void>;
  }
}

// Changes what the browser reports for prefers-color-scheme,
// prefers-reduced-motion and forced-colors. Pass null to go back to the
// default. The command
// itself is defined in vitest.config.ts, since it runs on the Playwright side.
export function emulateMedia(media: Media): Promise<void> {
  return commands.emulateMedia(media);
}

// Turns the mouse wheel over the element the selector finds. It's a real
// wheel event from the browser, so it scrolls what a person's would.
export function wheel(selector: string, deltaY: number): Promise<void> {
  return commands.wheel(selector, deltaY);
}

export const viewports = {
  phone: [390, 844],
  desktop: [1280, 800],
} as const;

// The test's iframe is resized from outside, and its resize events arrive
// after the call has returned. There can be more than one: Firefox on Linux
// sends one for the width and another for the height. Any that arrives late
// lands in whatever runs next, where it closes an open select, because Radix
// closes those when the window is resized. So this waits until the size is
// right and no resize event has come for a moment.
export async function setViewport(name: keyof typeof viewports): Promise<void> {
  const [width, height] = viewports[name];
  if (window.innerWidth === width && window.innerHeight === height) return;

  const quiet = 100;
  const settled = new Promise<void>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      window.removeEventListener("resize", wait);
      clearTimeout(giveUp);
      resolve();
    };
    const wait = () => {
      clearTimeout(timer);
      if (window.innerWidth === width && window.innerHeight === height) {
        timer = setTimeout(finish, quiet);
      }
    };
    const giveUp = setTimeout(finish, 2000);
    window.addEventListener("resize", wait);
  });
  await page.viewport(width, height);
  await settled;
}

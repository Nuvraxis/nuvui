import { commands } from "vitest/browser";

export interface Media {
  colorScheme?: "light" | "dark" | null;
  reducedMotion?: "reduce" | "no-preference" | null;
}

declare module "vitest/browser" {
  interface BrowserCommands {
    emulateMedia: (media: Media) => Promise<void>;
  }
}

// Changes what the browser reports for prefers-color-scheme and
// prefers-reduced-motion. Pass null to go back to the default. The command
// itself is defined in vitest.config.ts, since it runs on the Playwright side.
export function emulateMedia(media: Media): Promise<void> {
  return commands.emulateMedia(media);
}

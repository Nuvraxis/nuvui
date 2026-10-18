/** The settings a player keeps between visits, with `persist`. */
export interface SavedSettings {
  volume?: number;
  muted?: boolean;
  rate?: number;
  /** The caption language chosen, or "" for captions off. */
  captions?: string;
  captionSize?: "small" | "medium" | "large";
  /** The height of the quality chosen, or "auto". */
  quality?: string;
}

export const defaultStorageKey = "nuvui-media";

// Storage can be missing, full or refused (a private window, a blocked
// cookie setting). Then nothing is kept, and the player plays as usual.
export function readSettings(key: string): SavedSettings {
  try {
    const text = window.localStorage.getItem(key);
    const value = text ? (JSON.parse(text) as unknown) : null;
    return value && typeof value === "object" ? (value as SavedSettings) : {};
  } catch {
    return {};
  }
}

export function writeSettings(key: string, change: SavedSettings): void {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ ...readSettings(key), ...change }),
    );
  } catch {
    // Nothing to do: the setting holds for this visit only.
  }
}

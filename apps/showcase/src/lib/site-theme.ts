// A theme made on the Themes page and put on the whole site. It's kept in
// localStorage as the code of the choice and the CSS made from it. The CSS
// is kept too so that the script below can put it in place before anything
// is drawn, without the generator, which is far too big to run in <head>.
export const siteThemeKey = "nuvui-site-theme";

// The theme is written as a preset, and <html> is given this name. A preset
// is the library's own way to scope a theme, and the nearest one wins, so
// the previews on the Themes page, which are presets too, keep their own
// colors inside a site that has this one.
export const sitePreset = "site";

const styleId = "site-theme";

export interface StoredTheme {
  /** The choice, as `encodeChoice` writes it. */
  code: string;
  css: string;
}

// Runs in <head>, after the script that sets data-theme. Anything that
// isn't what `apply` below would have stored is ignored.
export const siteThemeScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(siteThemeKey)})||"null");if(s&&typeof s.code==="string"&&typeof s.css==="string"){var e=document.createElement("style");e.id=${JSON.stringify(styleId)};e.textContent=s.css;document.head.appendChild(e);document.documentElement.setAttribute("data-preset",${JSON.stringify(sitePreset)})}}catch(e){}})()`;

const listeners = new Set<() => void>();

export function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The code of the theme the site has, or null when it has the default. */
export function read(): string | null {
  try {
    const stored = JSON.parse(localStorage.getItem(siteThemeKey) ?? "null");
    return typeof stored?.code === "string" ? stored.code : null;
  } catch {
    return null;
  }
}

function draw(css: string | null) {
  const root = document.documentElement;
  let style = document.getElementById(styleId);
  if (css === null) {
    style?.remove();
    root.removeAttribute("data-preset");
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.append(style);
  }
  style.textContent = css;
  root.setAttribute("data-preset", sitePreset);
}

/**
 * Draws whatever is stored, as the script in <head> did when the page
 * loaded. For a page that hears of a change made on another: a block's
 * preview is a page of its own, in a frame.
 */
export function redraw() {
  try {
    const stored = JSON.parse(localStorage.getItem(siteThemeKey) ?? "null");
    draw(
      typeof stored?.code === "string" && typeof stored?.css === "string"
        ? stored.css
        : null,
    );
  } catch {
    draw(null);
  }
}

/** Puts a theme on the site and remembers it. */
export function apply(theme: StoredTheme) {
  draw(theme.css);
  try {
    localStorage.setItem(siteThemeKey, JSON.stringify(theme));
  } catch {
    // Storage is off. The theme holds for this page.
  }
  for (const listener of listeners) listener();
}

/** Takes the theme off again, back to the library's default. */
export function clear() {
  draw(null);
  try {
    localStorage.removeItem(siteThemeKey);
  } catch {
    // Nothing was stored.
  }
  for (const listener of listeners) listener();
}

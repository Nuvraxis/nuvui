// The visitor's choice of light, dark or their system's setting. It's kept
// in localStorage under the key the docs app's theme switch uses, with the
// same three values, so a choice made on either carries to the other: both
// are one site on one address.
export const themeKey = "theme";

export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];

export function isTheme(value: unknown): value is Theme {
  return themes.includes(value as Theme);
}

// Runs in <head>, before anything is drawn, so a page never shows in one
// theme and then changes to another. The library's stylesheet understands
// data-theme="system" itself, so nothing here has to ask the system which
// it prefers, or listen for it changing.
export const themeScript = `(function(){var t="system";try{var s=localStorage.getItem(${JSON.stringify(themeKey)});if(s==="light"||s==="dark")t=s}catch(e){}document.documentElement.setAttribute("data-theme",t)})()`;

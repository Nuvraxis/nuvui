import {
  createTheme,
  type PresetName,
  presetNames,
  presets,
  toCss,
} from "@nuvui/theme";

const layerOrder = "@layer tokens, base, components;";

// The text of dist/themes/<name>.css. The build writes that file from this
// same call, and check-dist fails if the two ever differ, so the tests can
// use the presets without the package having been built first.
export function presetCss(name: PresetName): string {
  const css = toCss(createTheme(presets[name]), {
    preset: name,
    layer: "tokens",
  });
  return `${layerOrder}\n${css}`;
}

export function loadPresets(): void {
  if (document.querySelector("style[data-presets]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-presets", "");
  style.textContent = presetNames.map(presetCss).join("\n");
  document.head.append(style);
}

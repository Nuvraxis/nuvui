---
"@nuvui/react": minor
---

Five presets ship as `@nuvui/react/themes/<name>.css`: `ink`, `ledger`, `meadow`, `ember` and `high-contrast`. Import one and put `data-preset="<name>"` on `<html>` or on any element. Each sets every semantic color for light and dark, the radius scale and a density. Presets and `data-theme` can be nested in any order.

Density: `data-density="compact"`, `"default"` or `"comfortable"` sets how tall controls are with a mouse or trackpad. Touch screens keep their 44 pixel targets at every density.

New tokens: `--nuv-border-width`, `--nuv-disabled-opacity`, `--nuv-touch-size`, `--nuv-control-height-sm`, `-md` and `-lg`, and eight chart colors, `--color-chart-1` to `--color-chart-8`. The components now read these where they had fixed values, so the defaults look the same and each can be changed in one place. `--nuv-light` and `--nuv-dark` are two switches for writing a value that holds both modes.

New component variables: `--nuv-tabs-indicator-width` and `--nuv-toast-accent-width`.

A primary or danger button now moves away from its text color on hover: darker under white text, lighter under dark text. In the default theme that looks as it did. With a primary color that takes dark text, such as orange, hovering used to make the text harder to read.

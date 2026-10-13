<!-- Written by apps/docs/scripts/agent-skill.mjs from packages/ui/dist/tokens.css. Don't edit it here: run `pnpm skill`. -->

# Design tokens

Every token the library ships, as `@nuvui/react/tokens.css` has them, which `@nuvui/react/styles.css` includes. Use these in your own CSS, as `var(--color-primary)`, and never a color written out. To change a theme, set them again on `:root`, in a rule that isn't in a layer. [reference/theming.md](reference/theming.md) says what each group is for.

```css
@layer tokens, base, components;
/* Color scales from Tailwind CSS v4's default theme. MIT License, Copyright (c) Tailwind Labs, Inc. */
@layer tokens {
  :root {
    --color-black: #000;
    --color-white: #fff;
    --color-gray-50: oklch(98.5% 0.002 247.839);
    --color-gray-100: oklch(96.7% 0.003 264.542);
    --color-gray-200: oklch(92.8% 0.006 264.531);
    --color-gray-300: oklch(87.2% 0.01 258.338);
    --color-gray-400: oklch(70.7% 0.022 261.325);
    --color-gray-500: oklch(55.1% 0.027 264.364);
    --color-gray-600: oklch(44.6% 0.03 256.802);
    --color-gray-700: oklch(37.3% 0.034 259.733);
    --color-gray-800: oklch(27.8% 0.033 256.848);
    --color-gray-900: oklch(21% 0.034 264.665);
    --color-gray-950: oklch(13% 0.028 261.692);
    --color-blue-50: oklch(97% 0.014 254.604);
    --color-blue-100: oklch(93.2% 0.032 255.585);
    --color-blue-200: oklch(88.2% 0.059 254.128);
    --color-blue-300: oklch(80.9% 0.105 251.813);
    --color-blue-400: oklch(70.7% 0.165 254.624);
    --color-blue-500: oklch(62.3% 0.214 259.815);
    --color-blue-600: oklch(54.6% 0.245 262.881);
    --color-blue-700: oklch(48.8% 0.243 264.376);
    --color-blue-800: oklch(42.4% 0.199 265.638);
    --color-blue-900: oklch(37.9% 0.146 265.522);
    --color-blue-950: oklch(28.2% 0.091 267.935);
    --color-red-50: oklch(97.1% 0.013 17.38);
    --color-red-100: oklch(93.6% 0.032 17.717);
    --color-red-200: oklch(88.5% 0.062 18.334);
    --color-red-300: oklch(80.8% 0.114 19.571);
    --color-red-400: oklch(70.4% 0.191 22.216);
    --color-red-500: oklch(63.7% 0.237 25.331);
    --color-red-600: oklch(57.7% 0.245 27.325);
    --color-red-700: oklch(50.5% 0.213 27.518);
    --color-red-800: oklch(44.4% 0.177 26.899);
    --color-red-900: oklch(39.6% 0.141 25.723);
    --color-red-950: oklch(25.8% 0.092 26.042);
    --color-green-50: oklch(98.2% 0.018 155.826);
    --color-green-100: oklch(96.2% 0.044 156.743);
    --color-green-200: oklch(92.5% 0.084 155.995);
    --color-green-300: oklch(87.1% 0.15 154.449);
    --color-green-400: oklch(79.2% 0.209 151.711);
    --color-green-500: oklch(72.3% 0.219 149.579);
    --color-green-600: oklch(62.7% 0.194 149.214);
    --color-green-700: oklch(52.7% 0.154 150.069);
    --color-green-800: oklch(44.8% 0.119 151.328);
    --color-green-900: oklch(39.3% 0.095 152.535);
    --color-green-950: oklch(26.6% 0.065 152.934);
    --color-amber-50: oklch(98.7% 0.022 95.277);
    --color-amber-100: oklch(96.2% 0.059 95.617);
    --color-amber-200: oklch(92.4% 0.12 95.746);
    --color-amber-300: oklch(87.9% 0.169 91.605);
    --color-amber-400: oklch(82.8% 0.189 84.429);
    --color-amber-500: oklch(76.9% 0.188 70.08);
    --color-amber-600: oklch(66.6% 0.179 58.318);
    --color-amber-700: oklch(55.5% 0.163 48.998);
    --color-amber-800: oklch(47.3% 0.137 46.201);
    --color-amber-900: oklch(41.4% 0.112 45.904);
    --color-amber-950: oklch(27.9% 0.077 45.635);
  }
}
@layer tokens {
  :root {
    --font-sans:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
      "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
      "Segoe UI Symbol", "Noto Color Emoji";
    --font-mono:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    --text-xs: 0.75rem;
    --text-xs--line-height: calc(1 / 0.75);
    --text-sm: 0.875rem;
    --text-sm--line-height: calc(1.25 / 0.875);
    --text-base: 1rem;
    --text-base--line-height: calc(1.5 / 1);
    --text-lg: 1.125rem;
    --text-lg--line-height: calc(1.75 / 1.125);
    --text-xl: 1.25rem;
    --text-xl--line-height: calc(1.75 / 1.25);
    --text-2xl: 1.5rem;
    --text-2xl--line-height: calc(2 / 1.5);
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --tracking-tight: -0.025em;
    --tracking-normal: 0em;
    --tracking-wide: 0.025em;
    --leading-tight: 1.25;
    --leading-snug: 1.375;
    --leading-normal: 1.5;
    --leading-relaxed: 1.625;
  }
}
@layer tokens {
  :root {
    --spacing: 0.25rem;
    --breakpoint-sm: 40rem;
    --breakpoint-md: 48rem;
    --breakpoint-lg: 64rem;
    --breakpoint-xl: 80rem;
    --breakpoint-2xl: 96rem;
    --nuv-z-overlay: 1000;
    --nuv-z-popover: 1100;
    --nuv-z-toast: 1200;
  }
}
@layer tokens {
  :root {
    --radius-xs: 0.125rem;
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-xl: 0.75rem;
    --radius-full: calc(infinity * 1px);
  }
}
@layer tokens {
  :root {
    --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md:
      0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg:
      0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl:
      0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  }
}
@layer tokens {
  :root {
    --ease-in: cubic-bezier(0.4, 0, 1, 1);
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
    --nuv-duration-fast: 100ms;
    --nuv-duration-base: 150ms;
    --nuv-duration-slow: 250ms;
  }
}
@layer tokens {
  :root {
    --nuv-border-width: 1px;
    --nuv-disabled-opacity: 0.5;
    --nuv-touch-size: 2.75rem;
  }
  :root,
  [data-density=default] {
    --nuv-control-height-sm: 2rem;
    --nuv-control-height-md: 2.5rem;
    --nuv-control-height-lg: 3rem;
  }
  [data-density=compact] {
    --nuv-control-height-sm: 1.75rem;
    --nuv-control-height-md: 2.25rem;
    --nuv-control-height-lg: 2.75rem;
  }
  [data-density=comfortable] {
    --nuv-control-height-sm: 2.25rem;
    --nuv-control-height-md: 2.75rem;
    --nuv-control-height-lg: 3.25rem;
  }
}
@layer tokens {
  :root,
  [data-theme=light],
  [data-theme=system] {
    --color-background: var(--color-white);
    --color-foreground: var(--color-gray-950);
    --color-surface: var(--color-white);
    --color-surface-foreground: var(--color-gray-950);
    --color-muted: var(--color-gray-100);
    --color-muted-foreground: var(--color-gray-600);
    --color-primary: var(--color-blue-600);
    --color-primary-foreground: var(--color-white);
    --color-danger: var(--color-red-600);
    --color-danger-foreground: var(--color-white);
    --color-success: var(--color-green-700);
    --color-warning: var(--color-amber-700);
    --color-border: var(--color-gray-200);
    --color-border-strong: var(--color-gray-500);
    --color-ring: var(--color-blue-600);
    --nuv-light: initial;
    --nuv-dark: ;
    --color-overlay: rgb(0 0 0 / 0.5);
    --color-chart-1: oklch(54.6% 0.245 262.881);
    --color-chart-2: oklch(47% 0.157 37.304);
    --color-chart-3: oklch(51.1% 0.096 186.391);
    --color-chart-4: oklch(43.2% 0.232 292.759);
    --color-chart-5: oklch(66.6% 0.179 58.318);
    --color-chart-6: oklch(52.5% 0.223 3.958);
    --color-chart-7: oklch(60.9% 0.126 221.723);
    --color-chart-8: oklch(57.7% 0.245 27.325);
  }
  @media (prefers-color-scheme: dark) {
    [data-theme=system] {
      --color-background: var(--color-gray-950);
      --color-foreground: var(--color-gray-50);
      --color-surface: var(--color-gray-900);
      --color-surface-foreground: var(--color-gray-50);
      --color-muted: var(--color-gray-800);
      --color-muted-foreground: var(--color-gray-400);
      --color-primary: var(--color-blue-400);
      --color-primary-foreground: var(--color-gray-950);
      --color-danger: var(--color-red-400);
      --color-danger-foreground: var(--color-gray-950);
      --color-success: var(--color-green-400);
      --color-warning: var(--color-amber-400);
      --color-border: var(--color-gray-800);
      --color-border-strong: var(--color-gray-500);
      --color-ring: var(--color-blue-400);
      --nuv-light: ;
      --nuv-dark: initial;
      --color-overlay: rgb(0 0 0 / 0.7);
      --color-chart-1: oklch(70.7% 0.165 254.624);
      --color-chart-2: oklch(75% 0.183 55.934);
      --color-chart-3: oklch(77.7% 0.152 181.912);
      --color-chart-4: oklch(60.6% 0.25 292.717);
      --color-chart-5: oklch(87.9% 0.169 91.605);
      --color-chart-6: oklch(65.6% 0.241 354.308);
      --color-chart-7: oklch(86.5% 0.127 207.078);
      --color-chart-8: oklch(80.8% 0.114 19.571);
    }
  }
  [data-theme=dark] {
    --color-background: var(--color-gray-950);
    --color-foreground: var(--color-gray-50);
    --color-surface: var(--color-gray-900);
    --color-surface-foreground: var(--color-gray-50);
    --color-muted: var(--color-gray-800);
    --color-muted-foreground: var(--color-gray-400);
    --color-primary: var(--color-blue-400);
    --color-primary-foreground: var(--color-gray-950);
    --color-danger: var(--color-red-400);
    --color-danger-foreground: var(--color-gray-950);
    --color-success: var(--color-green-400);
    --color-warning: var(--color-amber-400);
    --color-border: var(--color-gray-800);
    --color-border-strong: var(--color-gray-500);
    --color-ring: var(--color-blue-400);
    --nuv-light: ;
    --nuv-dark: initial;
    --color-overlay: rgb(0 0 0 / 0.7);
    --color-chart-1: oklch(70.7% 0.165 254.624);
    --color-chart-2: oklch(75% 0.183 55.934);
    --color-chart-3: oklch(77.7% 0.152 181.912);
    --color-chart-4: oklch(60.6% 0.25 292.717);
    --color-chart-5: oklch(87.9% 0.169 91.605);
    --color-chart-6: oklch(65.6% 0.241 354.308);
    --color-chart-7: oklch(86.5% 0.127 207.078);
    --color-chart-8: oklch(80.8% 0.114 19.571);
  }
  [data-preset],
  [data-preset] [data-theme] {
    --color-background: var(--nuv-light, var(--nuv-preset-light-background, var(--color-white)))
      var(--nuv-dark, var(--nuv-preset-dark-background, var(--color-gray-950)));
    --color-foreground: var(--nuv-light, var(--nuv-preset-light-foreground, var(--color-gray-950)))
      var(--nuv-dark, var(--nuv-preset-dark-foreground, var(--color-gray-50)));
    --color-surface: var(--nuv-light, var(--nuv-preset-light-surface, var(--color-white)))
      var(--nuv-dark, var(--nuv-preset-dark-surface, var(--color-gray-900)));
    --color-surface-foreground: var(--nuv-light, var(--nuv-preset-light-surface-foreground, var(--color-gray-950)))
      var(--nuv-dark, var(--nuv-preset-dark-surface-foreground, var(--color-gray-50)));
    --color-muted: var(--nuv-light, var(--nuv-preset-light-muted, var(--color-gray-100)))
      var(--nuv-dark, var(--nuv-preset-dark-muted, var(--color-gray-800)));
    --color-muted-foreground: var(--nuv-light, var(--nuv-preset-light-muted-foreground, var(--color-gray-600)))
      var(--nuv-dark, var(--nuv-preset-dark-muted-foreground, var(--color-gray-400)));
    --color-primary: var(--nuv-light, var(--nuv-preset-light-primary, var(--color-blue-600)))
      var(--nuv-dark, var(--nuv-preset-dark-primary, var(--color-blue-400)));
    --color-primary-foreground: var(--nuv-light, var(--nuv-preset-light-primary-foreground, var(--color-white)))
      var(--nuv-dark, var(--nuv-preset-dark-primary-foreground, var(--color-gray-950)));
    --color-danger: var(--nuv-light, var(--nuv-preset-light-danger, var(--color-red-600)))
      var(--nuv-dark, var(--nuv-preset-dark-danger, var(--color-red-400)));
    --color-danger-foreground: var(--nuv-light, var(--nuv-preset-light-danger-foreground, var(--color-white)))
      var(--nuv-dark, var(--nuv-preset-dark-danger-foreground, var(--color-gray-950)));
    --color-success: var(--nuv-light, var(--nuv-preset-light-success, var(--color-green-700)))
      var(--nuv-dark, var(--nuv-preset-dark-success, var(--color-green-400)));
    --color-warning: var(--nuv-light, var(--nuv-preset-light-warning, var(--color-amber-700)))
      var(--nuv-dark, var(--nuv-preset-dark-warning, var(--color-amber-400)));
    --color-border: var(--nuv-light, var(--nuv-preset-light-border, var(--color-gray-200)))
      var(--nuv-dark, var(--nuv-preset-dark-border, var(--color-gray-800)));
    --color-border-strong: var(--nuv-light, var(--nuv-preset-light-border-strong, var(--color-gray-500)))
      var(--nuv-dark, var(--nuv-preset-dark-border-strong, var(--color-gray-500)));
    --color-ring: var(--nuv-light, var(--nuv-preset-light-ring, var(--color-blue-600)))
      var(--nuv-dark, var(--nuv-preset-dark-ring, var(--color-blue-400)));
  }
  [data-theme=light] {
    color-scheme: light;
  }
  [data-theme=dark] {
    color-scheme: dark;
  }
  [data-theme=system] {
    color-scheme: light dark;
  }
}
```

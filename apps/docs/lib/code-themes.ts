// Fumadocs' default GitHub themes put red and orange tokens and gray comments
// on a light gray block, which misses WCAG AA at code font sizes. These are
// the same palette with more contrast. Every place that highlights code
// spreads this in, so the MDX blocks, the previews, the playground and the
// props table all match.
export const codeHighlight = {
  themes: {
    light: "github-light-high-contrast",
    dark: "github-dark-high-contrast",
  },
  colorReplacements: {
    // Comments in the light theme are 4.46:1 on the code block's background.
    // One step darker clears 4.5:1.
    "github-light-high-contrast": { "#66707b": "#59636e" },
  },
} as const;

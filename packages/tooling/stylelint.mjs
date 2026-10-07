import { fileURLToPath } from "node:url";

// The class prefix. It's written out literally in the SCSS and in the
// components rather than interpolated from a variable, because Stylelint
// can't check a selector that contains #{...}.
const prefix = "nuv";

const word = "[a-z0-9]+(?:-[a-z0-9]+)*";
const bem = `^${prefix}-${word}(?:__${word})?(?:--${word})?$`;

/** @type {import("stylelint").Config} */
export default {
  // By its full path. Stylelint would otherwise look for it from the package
  // being linted, which doesn't depend on it.
  extends: [
    fileURLToPath(import.meta.resolve("stylelint-config-standard-scss")),
  ],
  rules: {
    "selector-class-pattern": [
      bem,
      {
        resolveNestedSelectors: true,
        message: (selector) =>
          `Expected "${selector}" to be BEM with the "${prefix}" prefix, like .${prefix}-block__element--modifier`,
      },
    ],
    // Radix portals render outside the component tree, so descendant
    // selectors can't be relied on. Nesting is only for states and at-rules.
    "max-nesting-depth": [
      1,
      {
        ignore: ["pseudo-classes"],
        ignoreAtRules: ["media", "supports", "include", "layer"],
      },
    ],
    "selector-max-compound-selectors": 2,
    "selector-max-id": 0,
    // Tailwind v4 pairs a font size with its line height as
    // --text-sm--line-height, which plain kebab-case rejects.
    "custom-property-pattern": [
      `^${word}(?:--${word})?$`,
      { message: "Expected custom property name to be kebab-case" },
    ],
    // Token values are copied from Tailwind's theme. Keeping its notation
    // means they can be compared against the source character for character.
    "hue-degree-notation": "number",
    "alpha-value-notation": "number",
    "value-keyword-case": ["lower", { ignoreProperties: ["/^--font-/"] }],
    // Blank lines group related tokens.
    "custom-property-empty-line-before": null,
  },
  overrides: [
    {
      // Everything outside the token files gets its colors from tokens. A
      // color written out here would stay the same in every theme. The
      // keyword transparent and the system colors that forced-colors mode
      // needs aren't named colors, so they still pass.
      files: ["src/**/*.scss"],
      ignoreFiles: ["src/styles/tokens/**"],
      rules: {
        "color-named": "never",
        "color-no-hex": true,
        "function-disallowed-list": [
          [
            "rgb",
            "rgba",
            "hsl",
            "hsla",
            "hwb",
            "lab",
            "lch",
            "oklab",
            "oklch",
            "color",
          ],
          {
            message: (name) =>
              `Unexpected color function "${name}". Use a color token, such as var(--color-primary)`,
          },
        ],
      },
    },
  ],
};

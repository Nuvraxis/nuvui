// Keep in sync with $prefix in src/styles/_config.scss.
const prefix = "nuv";

const word = "[a-z0-9]+(?:-[a-z0-9]+)*";
const bem = `^${prefix}-${word}(?:__${word})?(?:--${word})?$`;

/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard-scss"],
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
  },
};

import { readdirSync } from "node:fs";
import { bemConfig } from "@nuvui/tooling/stylelint";

// The library's rules, with the website's own prefix. A class with `nuv` in
// front is the library's, and nothing here should be mistaken for one.
const config = bemConfig("site");

const word = "[a-z0-9]+(?:-[a-z0-9]+)*";

// A block is copied into someone's app, so its classes have no prefix of
// ours. Each block is its own BEM block, named after its folder, and every
// class in its stylesheet has to start with that name. The rest of the
// rules are the library's: tokens for every color, and no deep nesting.
const blocks = readdirSync(new URL("./src/blocks", import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map(({ name }) => ({
    files: [`src/blocks/${name}/*.scss`],
    rules: {
      "selector-class-pattern": [
        `^${name}(?:__${word})?(?:--${word})?$`,
        {
          resolveNestedSelectors: true,
          message: (selector) =>
            `Expected "${selector}" to be BEM under the block's own name, like .${name}__element--modifier`,
        },
      ],
    },
  }));

export default {
  ...config,
  overrides: [...(config.overrides ?? []), ...blocks],
};

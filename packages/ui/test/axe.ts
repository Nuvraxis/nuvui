// A small stand-in for vitest-axe, which imports Node's `module` package and
// so can't load in a real browser.
import axeCore, {
  type AxeResults,
  type Result,
  type RunOptions,
} from "axe-core";

export function axe(
  element: Element,
  options: RunOptions = {},
): Promise<AxeResults> {
  return axeCore.run(element, options);
}

function describeViolation(violation: Result): string {
  const targets = violation.nodes.map((node) => `    ${node.target.join(" ")}`);
  return [
    `${violation.id} (${violation.impact ?? "unknown impact"}): ${violation.help}`,
    `  ${violation.helpUrl}`,
    ...targets,
  ].join("\n");
}

export const axeMatchers = {
  toHaveNoViolations(results: AxeResults) {
    const { violations } = results;
    return {
      pass: violations.length === 0,
      message: () =>
        violations.length === 0
          ? "Expected axe violations, but there were none"
          : `Expected no axe violations, but found ${violations.length}:\n\n${violations.map(describeViolation).join("\n\n")}`,
    };
  },
};

declare module "vitest" {
  // The type parameters have to match Vitest's own declaration to merge.
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > {
    toHaveNoViolations: () => R;
  }
}

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

// Radix renders tooltips, menus and select lists at the end of <body>, which
// is outside every landmark, and axe's "region" best-practice rule objects
// to that. A tooltip reaches screen readers through aria-describedby on its
// trigger, not by being found where it's rendered.
export const outsideLandmarks: RunOptions = {
  rules: { region: { enabled: false } },
};

// For an open menu or select list. On top of the rule above, this leaves out
// "aria-hidden-focus", which objects to the trigger: it's still focusable in
// principle while Radix hides the page behind the open list. Nothing can
// actually move focus to it, because Radix blocks Tab and pointer events
// outside the list until it closes. axe makes this allowance for dialogs and
// has no way to know it applies here.
export const behindOpenList: RunOptions = {
  rules: {
    region: { enabled: false },
    "aria-hidden-focus": { enabled: false },
  },
};

function describeViolation(violation: Result): string {
  // What axe measured goes in too. For a contrast failure that's the two
  // colors and their ratio, which is most of what there is to know.
  const targets = violation.nodes.map((node) => {
    const measured = [...node.any, ...node.all, ...node.none]
      .map((check) => check.message)
      .filter(Boolean)
      .join(" ");
    return `    ${node.target.join(" ")}
      ${measured}`;
  });
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

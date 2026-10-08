// Every engine by default. NUVUI_BROWSERS narrows it to the ones named, for
// a quicker run while working on something: NUVUI_BROWSERS=chromium. The
// component tests and the end-to-end tests both read it here, so one
// setting means the same thing to both.
export const engines = ["chromium", "firefox", "webkit"];

/** The engines to test in: all three, or the ones NUVUI_BROWSERS names. */
export function askedBrowsers() {
  const asked = process.env.NUVUI_BROWSERS?.split(",").map((name) =>
    name.trim(),
  );
  const browsers = engines.filter((name) => !asked || asked.includes(name));
  if (browsers.length === 0) {
    throw new Error(
      `NUVUI_BROWSERS is "${process.env.NUVUI_BROWSERS}". It takes any of ${engines.join(", ")}, separated by commas.`,
    );
  }
  return browsers;
}

/**
 * The Playwright projects to run, out of the ones a config lists. A project
 * is kept when its engine was asked for. Playwright's device descriptions
 * say which engine each is, and one that doesn't say is Chromium.
 *
 * @template {{ use?: { defaultBrowserType?: string } }} Project
 * @param {Project[]} projects
 * @returns {Project[]}
 */
export function askedProjects(projects) {
  const browsers = askedBrowsers();
  return projects.filter((project) =>
    browsers.includes(project.use?.defaultBrowserType ?? "chromium"),
  );
}

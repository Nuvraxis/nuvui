# Changesets

This folder holds pending release notes. Each `.md` file here describes one change to a published package, `@nuvui/react` or an add-on, and how it should bump the version.

If your pull request changes what gets published, add one:

```sh
pnpm changeset
```

Pick the bump type, write a sentence or two about what changed from a user's point of view, and commit the file it creates. Changes that only touch the docs site, tests or tooling don't need one.

The release workflow collects these files into each package's `CHANGELOG.md` when a version is cut. The tool's own docs are at https://changesets.dev.

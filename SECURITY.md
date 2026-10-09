# Security policy

## Supported versions

Fixes go into the latest release of each package: `@nuvui/react`, `@nuvui/date-picker`, `@nuvui/table` and `@nuvui/charts`. Older versions aren't patched.

## Reporting a vulnerability

Please don't open a public issue or pull request for a security problem.

Report it privately through GitHub: go to the [Security tab](https://github.com/Nuvraxis/nuvui/security) of this repository and choose "Report a vulnerability".

TODO(Nuvraxis): private vulnerability reporting has to be switched on in the repository settings before that button exists. Either enable it or replace this section with an email address.

Include what you found, how to reproduce it, and which version you tested. If you have a fix in mind, say so, but a clear report is enough.

## What counts

`@nuvui/react` is a set of React components and CSS. The kinds of problems we'd treat as security issues are things like a component that lets untrusted content run script, or a compromised file in the published package.

Bugs in Radix UI, React or Next.js should go to those projects. If you're not sure where a problem belongs, report it here and we'll work it out.

# Consumer fixtures

Two small apps that use `@nuvui/react`, `@nuvui/date-picker` and `@nuvui/table` the way someone outside this repository would: installed from tarballs, not linked from the workspace.

- `vite`: a Vite and React app.
- `next`: a Next.js app whose page is a server component.

They aren't workspace packages and have no `node_modules` here. `pnpm test:consumers` copies each one to a temporary folder, points its `@nuvui` dependencies at freshly packed tarballs, installs, type-checks and builds it, and then reads the output. It needs the packages built first, so run `pnpm build` before it.

What that catches, and nothing inside the workspace would: a path in the `exports` map that isn't in the tarball, a stylesheet that didn't get packed, types that only resolve next to the source, a `"use client"` line lost on the way to `dist`, an add-on whose peer dependency on the core doesn't resolve, an import of one locale that drags every other locale into the bundle, and a table made with one feature that ships the others anyway.

The script is `scripts/test-consumers.mjs`. To keep the temporary folders and look at a failure, run it with `--keep`.

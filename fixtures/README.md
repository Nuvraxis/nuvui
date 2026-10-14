# Consumer fixtures

Three small apps that use `@nuvui/react`, `@nuvui/date-picker`, `@nuvui/table`, `@nuvui/charts`, `@nuvui/barcodes`, `@nuvui/chat`, `@nuvui/kanban`, `@nuvui/editor`, `@nuvui/emoji` and `@nuvui/map` the way someone outside this repository would: installed from tarballs, not linked from the workspace.

- `vite`: a Vite and React app.
- `next`: a Next.js app whose page is a server component.
- `react18`: a Vite app on React 18.2 and its types, the oldest React the packages say they work with. Its app is also rendered to HTML by React 18's server renderer, which runs every component's render on React 18.

They aren't workspace packages and have no `node_modules` here. `pnpm test:consumers` copies each one to a temporary folder, points its `@nuvui` dependencies at freshly packed tarballs, installs, type-checks and builds it, and then reads the output. It needs the packages built first, so run `pnpm build` before it.

What that catches, and nothing inside the workspace would: a path in the `exports` map that isn't in the tarball, a stylesheet that didn't get packed, types that only resolve next to the source, a `"use client"` line lost on the way to `dist`, an add-on whose peer dependency on the core doesn't resolve, an import of one locale that drags every other locale into the bundle, a table made with one feature that ships the others anyway, and a chart that can't be rendered from a server component's page.

The script is `scripts/test-consumers.mjs`. To keep the temporary folders and look at a failure, run it with `--keep`.

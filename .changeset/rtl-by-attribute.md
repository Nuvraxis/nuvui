---
"@nuvui/react": patch
"@nuvui/date-picker": patch
"@nuvui/table": patch
---

Mirroring for right-to-left pages now works in a Next.js build.

- What has to be mirrored where a page reads right to left was written with `:dir(rtl)`: the arrows of Breadcrumb, Pagination, Tree, submenus and the data table, the side a Sheet and a Sidebar slide in from, the bars of Progress and HoldToConfirm, the sweep of TextShimmer and the ends of a range in Calendar. A build that supports browsers without `:dir()`, which is Next.js by default, rewrites that to a list of `:lang()` selectors, so none of it was mirrored on a page that set `dir="rtl"` without one of those languages. These rules now go by the `dir` attribute, on the element or around it. That also works in Chrome before 120, which has no `:dir()`.
- A new `rtl` mixin in `@nuvui/react/scss/mixins` writes the same selector for your own styles.

# Recipes

The screens people ask for most, and what to build each from. Where a block already does it, start from the block: it's the components put together the way they're meant to be, with the states and the small screens worked out. [blocks.md](blocks.md) has every block and the command that adds one.

A block is a starting point, to be changed. Its data is made up and stands in for the app's.

## A sign-in screen

Start from the block `sign-in`, or `sign-in-sso` for a company account, `sign-up`, `forgot-password`, `verify-code`.

What it's made of: `Field` around each `Input` and `PasswordInput`, a `Button` with `type="submit"`, an `Alert` for an error that belongs to no field.

Read: [rules/forms.md](rules/forms.md), [reference/forms.md](reference/forms.md), [reference/components/field.md](reference/components/field.md).

## A form with fields and errors

No block is only this. Build it from [reference/forms.md](reference/forms.md), which has a whole form each way: with the browser's validation, and with React Hook Form.

1. A plain `<form>`, with `noValidate` if a library does the checking.
2. Each control in a `Field`, with a `FieldLabel`, and the control inside `FieldControl`.
3. Each control has a `name`.
4. A message per field in `FieldError`. It renders nothing while it's empty.
5. One `Button` with `type="submit"`.
6. On a submit with errors, move the focus to the first control that has one.

For a settings page, the blocks `profile-form`, `notifications`, `appearance` and `danger-zone` are each a form of a different kind.

## A table of data

Start from the block `table-toolbar`: search, a filter, a column chooser, a menu on each row, and actions for the rows that are ticked.

For less than that, [reference/table/index.md](reference/table/index.md) has a data table in two steps. Add what's needed from the pages beside it: sorting, filtering, pagination, row-selection, column-visibility. For rows that a server sorts and pages: [reference/table/server.md](reference/table/server.md). For many thousands of rows: [reference/table/virtualization.md](reference/table/virtualization.md).

For rows with nothing to do but be read, `Table` alone is enough: [reference/table/table.md](reference/table/table.md).

Don't forget the other states. The block `page-states` is one page with its rows, waiting for them, with none, and after a request that failed.

## A page with a sidebar

Start from the block `app-shell` for the whole of an app's screen: a sidebar that folds to its icons, a bar on top, the page, and a panel on the far side that closes and is a sheet on a phone. `sidebar-nested` is navigation in two levels, and `dashboard` a whole screen with a sidebar in it.

What it's made of: `SidebarProvider` around the layout, `Sidebar` with its parts, and the page's content beside it. [reference/components/sidebar.md](reference/components/sidebar.md) has the parts, and how the sidebar becomes a sheet on a phone.

Mark the page that's open, give the `nav` a name, and keep the page's own content in a `main`.

## A dashboard

Start from the block `dashboard`: a sidebar, four figures with how each has changed, a chart, and a table of recent orders. It needs `@nuvui/charts` and `@nuvui/table`.

The figures are `Stat` with `Trend`. The chart is Recharts in a `ChartContainer`: [reference/charts/index.md](reference/charts/index.md). The block `figures` is the row of figures alone.

## A themed app

Nothing to build: theming is CSS.

1. Pick a preset if one is close, and load its stylesheet after the core's: `import "@nuvui/react/themes/ink.css"`.
2. Set the brand's colors on `:root`, in a rule that's in no layer: `--color-primary`, `--color-primary-foreground`, `--color-ring`. Give dark its own values beside them. [reference/theming.md](reference/theming.md) shows how.
3. `data-theme="system"` on `<html>` to follow the reader's system, or `light` or `dark`.
4. A switch for dark mode sets that attribute, and remembers it. There's no provider.

Check the contrast of any color you set: 4.5 to 1 for text, 3 to 1 for the edge of a control. [tokens.md](tokens.md) has every token.

## A chat with an assistant

Start from the block `assistant-chat` for a whole screen, `assistant-sidebar` for one with past conversations, `ask-panel` for a panel beside a record, `support-chat` for a help desk that opens from a corner.

The components draw the conversation. Fetching and streaming the reply is the app's: [reference/chat/index.md](reference/chat/index.md) says how the props line up with what a fetch gives.

## A board of tasks

Start from the block `task-board`, or `deal-pipeline` for one that adds up each column. [reference/kanban/index.md](reference/kanban/index.md) says what the board keeps and what the app keeps.

## A map of places

Start from the block `branch-finder` for a list beside a map, `delivery-route` for a way with stops, `charging-map` for many places gathered into clusters.

Before any of them works: the worker's address, and a tile provider the app's owner has chosen. [rules/packages.md](rules/packages.md) has both.

## A marketing page

The blocks `nav-bar`, `hero`, `feature-grid`, `pricing`, `faq`, `reviews`, `case-studies` and `footer` are the parts of one.

## When there's no block

1. Find the components in the table in [SKILL.md](SKILL.md), and read each one's reference file.
2. Write the structure with the library's components, and the layout around them the way the app styles things.
3. Add the states: nothing to show, waiting, something went wrong.
4. Check it at 320 pixels wide, with the keyboard, and in dark mode.

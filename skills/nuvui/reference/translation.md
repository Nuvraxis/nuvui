<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/translation.mdx. Don't edit it here: run `pnpm skill`. -->

# Translation

Every piece of text nuvui writes by itself, such as "Close" and "Loading", with the prop that changes each one. A list for translators, taken from the components' own types.

Almost all the text in an interface built with nuvui is yours: the labels, the headings, what's on the buttons. A few words the components write themselves, mostly names for screen readers on buttons that are only an icon. Each has a prop, with an English default.

This page lists all of them. The tables are made from the components' types when the docs are built, so a default shown here is the one in the code.

## How to translate them

Pass the prop wherever you render the component. With many dialogs in an app, that's easiest in a component of your own that wraps the library's:

```tsx
import { DialogContent, type DialogContentProps } from "@nuvui/react";
import { useTranslations } from "your-i18n-library";

export function AppDialogContent(props: DialogContentProps) {
  const t = useTranslations();
  return <DialogContent closeLabel={t("close")} {...props} />;
}
```

There's no provider that takes all the strings at once. A prop is found by TypeScript when its name changes, works in a server component, and keeps a component's text next to the component.

Text direction is a separate matter, covered in [right-to-left](right-to-left.md).

## Components

### Breadcrumb

The trail is a landmark named "Breadcrumb". Pass `aria-label` to `Breadcrumb` to change it.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"More"` | What a screen reader says for the three dots. |

### Combobox

On `ComboboxContent`:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Search"` | The search field's name, and the popup's. |
| `listLabel` | `string` | `"Options"` | The list's name. |
| `searchPlaceholder` | `string` |  | The search field's placeholder. There's none by default. |

On `ComboboxLoading`:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Loading"` | What a screen reader hears while options are fetched, when the part has no children. |

What `ComboboxEmpty` says is its children, which you write.

### Command

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Search"` | The search field's name. |

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Suggestions"` | The list's name. |

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Loading"` | What a screen reader hears while items are fetched, when the part has no children. |

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `title` | `string` | `"Command palette"` | The dialog's name. It isn't drawn. |

### Compare

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `beforeLabel` | `string` | `"Before"` | The name of before, on the picture and on the switch. |
| `afterLabel` | `string` | `"After"` | The name of after, on the picture and on the switch. |
| `dividerLabel` | `string` | `"Before and after"` | The divider's name, which a screen reader reads as a slider. |
| `valueLabel` | `((position: number, before: string, after: string) => string)` | `(position, before, after) => '${position}% ${before}, ${100 - position}% ${after}'` | What a screen reader says the divider's position is, given the position and the two names. |
| `switchLabel` | `string` | `"Show"` | The name of the switch, when one picture shows at a time. |

### Dialog and Sheet

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `closeLabel` | `string` | `"Close"` | The name of the close button in the corner. |

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `closeLabel` | `string` | `"Close"` | The name of the close button in the corner. |

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Change size", or "Dismiss" in a sheet with no stops` | The name of the bar a sheet is dragged by, which says what pressing it does. |

An alert dialog has no close button, and nothing of its own to translate.

### FileUpload

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` | `ReactNode` | `"Drop files here, or choose them from your device"` | The words in the drop area. |
| `removeLabel` | `((name: string) => string)` | `(name) => 'Remove ${name}'` | The name of the button that removes a file from the list, given the file's name. |
| `formatSize` | `((bytes: number) => string)` | `The size in the visitor's own number format, such as "1.2 MB"` | How a file's size is written. The default uses the browser's language for the number and the unit. |

Why a file was refused is yours to say. `onReject` gives you the reason as `"type"`, `"size"` or `"count"`.

### HoldToConfirm

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `hint` | `string` | `"Hold down to confirm."` | What a screen reader says about the button, and says again when it's let go of too soon. |
| `againLabel` | `string` | `"Press again to confirm."` | What a screen reader says after the first of two presses. |

What the button says is its children, which you write. Start it with the words for "Hold to".

### Navbar

On `NavbarMenu`:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Menu"` | The name of the button that opens the links on a narrow screen, and the title of the panel. |
| `closeLabel` | `string` | `"Close"` | The name of the button that closes that panel. |

### NumberField

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `incrementLabel` | `string` | `"Increase"` | The name of the button that raises the number. |
| `decrementLabel` | `string` | `"Decrease"` | The name of the button that lowers it. |

How the number is written, and how what's typed is read, follows its `format`, which takes a `locale`.

### OtpField

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `inputLabel` | `((position: number, length: number) => string)` | `(position, length) => 'Character ${position} of ${length}'` | The name of each box, given its position and how many there are. |

### Pagination

The bar is a landmark named "Pagination". Pass `aria-label` to `Pagination` to change it. `PaginationPrevious` and `PaginationNext` say "Previous" and "Next" unless you give them children.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"More pages"` | What a screen reader says for the three dots. |

### PasswordInput

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `showLabel` | `string` | `"Show password"` | The name of the button while the password is hidden. |
| `hideLabel` | `string` | `"Hide password"` | The name of the button while the password is shown. |

### Rating

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `itemLabel` | `((value: number, max: number) => string)` | `(value) => (value === 1 ? "1 star" : '${value} stars')` | The name of one star, given its number and how many there are. |
| `valueLabel` | `((value: number, max: number) => string)` | `(value, max) => '${value} out of ${max}'` | The name of a rating that can't be changed, given its value and how many stars there are. |

### Sidebar

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Sidebar"` | The sidebar's name as a landmark, and the name of the panel it becomes on a phone. |
| `closeLabel` | `string` | `"Close"` | The name of the button that closes that panel. |

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Toggle sidebar"` | The name of the button that opens and closes the sidebar. |

### Spinner

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Loading"` | What a screen reader hears when the spinner appears. |

### Stepper

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `completedLabel` | `string` | `"Completed"` | What a screen reader says after the title of a step that's done. |

### Toast

On `Toaster`:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `closeLabel` | `string` | `"Close"` | The name of the close button on each toast. |
| `toastLabel` | `string` | `"Notification"` | What a screen reader says before the text of each toast. |

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` |  | The name of the list of toasts as a landmark. It's `"Notifications ({hotkey})"` unless you say otherwise, and `{hotkey}` is filled in for you. |

### Trend

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `upLabel` | `string` | `"Up"` | What a screen reader says before the amount of a rise. |
| `downLabel` | `string` | `"Down"` | What a screen reader says before the amount of a fall. |
| `flatLabel` | `string` | `"No change"` | What a screen reader says for no change, in place of the amount. |

How the amount itself is written follows its `format`, which takes a `locale`. So does every [`FormattedNumber`](components/formatted-number.md): pass it the language your app is in.

## Dates

A calendar's month and day names, and the names a screen reader hears on its buttons, come from a `locale`. [Dates](date-picker/index.md#languages) has how to pass one. These are what the two fields add, on `DatePicker` and `DateRangePicker`:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `calendarLabel` | `string` | `"Choose date"` | The name of the button that opens the calendar. `"Choose date"` on a date picker. |
| `title` | `string` | `"Choose date"` | The name of the calendar's panel, and the heading of the sheet on a phone. `"Choose date"` on a date picker. |
| `closeLabel` | `string` | `"Close"` | The name of the sheet's close button. |
| `invalidMessage` | `string` | `"Enter a valid date."` | What the browser shows for text that isn't a date. |
| `startLabel` | `string` | `"Start date"` | The name of the first field. A range only. |
| `endLabel` | `string` | `"End date"` | The name of the second field. A range only. |
| `orderMessage` | `string` | `"The end date is before the start date."` | What the browser shows for a range typed the wrong way round. A range only. |

## Tables

A data table takes all its text in one prop, `labels`. Pass the ones to change:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `search` (required) | `string` |  | The search field's name and placeholder. |
| `columns` (required) | `string` |  | The column chooser's button. |
| `empty` (required) | `string` |  | Shown in place of rows when there are none. |
| `noMatches` (required) | `string` |  | Shown in place of rows when a filter leaves none. |
| `clearFilters` (required) | `string` |  |  |
| `error` (required) | `string` |  | Shown when `error` is `true` and not a message of your own. |
| `retry` (required) | `string` |  |  |
| `selectAll` (required) | `string` |  |  |
| `selectPage` (required) | `string` |  | The header checkbox of a table with pages. |
| `selectRow` (required) | `(row: string) => string` |  |  |
| `rowName` (required) | `(position: number) => string` |  | A row's name when it has no `rowHeader` column: its place in the list. |
| `expandRow` (required) | `(row: string) => string` |  |  |
| `collapseRow` (required) | `(row: string) => string` |  |  |
| `selected` (required) | `(count: number) => string` |  |  |
| `clearSelection` (required) | `string` |  |  |
| `bulkActions` (required) | `string` |  | The name of the bar that holds the actions for selected rows. |
| `pagination` (required) | `string` |  |  |
| `rowsPerPage` (required) | `string` |  |  |
| `pageRange` (required) | `(from: number, to: number, total: number) => string` |  | "21-40 of 143". |
| `page` (required) | `(page: number, pages: number) => string` |  |  |
| `firstPage` (required) | `string` |  |  |
| `previousPage` (required) | `string` |  |  |
| `nextPage` (required) | `string` |  |  |
| `lastPage` (required) | `string` |  |  |
| `resizeColumn` (required) | `(column: string) => string` |  |  |
| `filterColumn` (required) | `(column: string) => string` |  |  |
| `sortedAscending` (required) | `(column: string) => string` |  | Read out after a sort. |
| `sortedDescending` (required) | `(column: string) => string` |  |  |
| `sortCleared` (required) | `string` |  |  |
| `results` (required) | `(count: number) => string` |  | Read out after a filter changes how many rows there are. |

`empty` and `error`, on `DataTable`, replace "No rows." and the error message for one table.

## Charts

A chart writes no text of its own. Its name is the `aria-label` you give it, a series is named by its `label` in the config, and numbers are written by `formatValue`.

## Flow diagrams

A diagram's name is the `aria-label` you give it, and a node's is its `label`. What it adds, the meaning of each shape, where a node leads, the buttons and what's said as it changes, is in one prop, `labels`:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `roleDescription` | `string` |  | What kind of thing the diagram is, read after its name. |
| `shapes` | `Partial<Record<FlowShape, string>>` |  | What each shape means, read after a node's name. |
| `leadsTo` | `((targets: FlowLinkTarget[]) => string)` |  | Where a node leads, read after its name and shown in the list. |
| `instructions` | `string` |  | How to get around the diagram with the keyboard. |
| `editInstructions` | `string` |  | How to change it with the keyboard, read after `instructions`. |
| `controls` | `string` |  | The name of the group of buttons. |
| `zoomIn` | `string` |  |  |
| `zoomOut` | `string` |  |  |
| `fit` | `string` |  |  |
| `showList` | `string` |  | The button that shows the diagram as a list. |
| `hideList` | `string` |  |  |
| `list` | `string` |  | The name of the list. |
| `showMore` | `((count: number) => string)` |  | The button at the end of a long list. |
| `find` | `((label: string) => string)` |  | A step's button in the list, which finds it in the diagram. |
| `removeLink` | `((from: string, to: string) => string)` |  | A link's button in the list of an editable diagram. |
| `linking` | `((from: string) => string)` |  | Said when a link is started with the keyboard. |
| `linked` | `((from: string, to: string) => string)` |  | Said when a link is made. |
| `linkCancelled` | `string` |  | Said when a link that was started is let go. |
| `moved` | `((labels: string[]) => string)` |  | Said when nodes are moved. |
| `removed` | `((nodes: number, links: number) => string)` |  | Said when nodes and links are removed. |

## What isn't text

- A [field](components/field.md) marks a required label with `*`, which `FieldLabel` changes with `requiredIndicator`. Screen readers don't hear it. They hear "required" from the control, in the browser's own language.
- A [progress bar](components/progress.md) says its value as a percentage, such as "40%". `getValueLabel` changes that.
- Messages a browser shows for a field that fails its own validation, such as a required one left empty, are the browser's and in its language.

## What hasn't been checked

The list was made by searching the source of the four packages for text, and by reading what Radix UI, cmdk, react-day-picker and Recharts add by themselves. It was not checked by running an interface in another language through a screen reader.

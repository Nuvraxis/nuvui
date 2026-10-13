# Text and direction

## The words a component writes itself

Nearly all the text in an interface is the app's: labels, headings, what's on the buttons. A few words the components write themselves, mostly names for screen readers on buttons that are only an icon: "Close" on a dialog, "Loading" on a spinner, "More pages" in a pagination. Each is a prop, with an English default.

```tsx
// In an app with translations
<DialogContent closeLabel={t("close")}>…</DialogContent>
<Spinner label={t("loading")} />
```

- [reference/translation.md](../reference/translation.md) lists every one for the core, by component, with its prop and its default.
- The add-ons take theirs together, in a `labels` prop: `DataTable`, `Kanban`, `MapView` and others. Each one's reference file has a "Translation" or "Text and translation" section.
- There's no provider that takes all the strings at once. With many dialogs in an app, wrap the library's part in a component of the app's that passes the prop.

When the app has translations, pass these props wherever you render one of those components. When it has none and is in English, leave them.

Dates and numbers follow a locale and not these props: `FormattedNumber` and the date picker take one. [reference/date-picker/index.md](../reference/date-picker/index.md) covers the calendar's.

## Right to left

Arabic, Hebrew and other languages that read from the right need two things, and both:

```tsx
import { DirectionProvider } from "@nuvui/react";

<html lang="ar" dir="rtl">
  <body>
    <DirectionProvider dir="rtl">{children}</DirectionProvider>
  </body>
</html>
```

`dir="rtl"` mirrors the layout: text, padding, which side a sheet comes from. `DirectionProvider` tells the components that work with arrow keys which way is forward: tabs, sliders, menus that open a submenu. With only the first, a slider looks mirrored and its arrow keys go the wrong way. [reference/right-to-left.md](../reference/right-to-left.md) has what each one changes.

In CSS of your own, write for both directions from the start:

- `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-end`, `text-align: start`. Not `left` and `right`.
- An icon that points, such as an arrow for "next", has to be mirrored. One that doesn't point, such as a clock, stays.
- Numbers, code and phone numbers stay left to right: put `dir="ltr"` on that element.

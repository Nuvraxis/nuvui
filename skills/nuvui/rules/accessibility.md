# Accessibility

The components handle what a component can: roles, focus, the keyboard, what's announced. Each reference file has a section, "What the component handles", and another, "What you need to handle". The second is a list of things only the app can do. Do them.

## Names

Everything a person can press or type in needs a name a screen reader can say.

```tsx
// Wrong: a button nobody can name
<Button intent="ghost">
  <Trash />
</Button>

// Right
<Button intent="ghost" aria-label="Delete invoice 1042">
  <Trash aria-hidden="true" />
</Button>
```

- A button with only an icon: `aria-label`, saying what it does and to what.
- A control: a `FieldLabel`, through `Field`. See [forms.md](forms.md).
- A dialog, a sheet, a popover with a heading: its `...Title` part.
- A table: a caption. A chart: `aria-label`. A map: `aria-label`.
- In a list, names that tell the rows apart: "Delete invoice 1042", not "Delete" twenty times.

## Landmarks

Every `nav` on a page needs its own name, since a page usually has more than one:

```tsx
<NavbarNav aria-label="Main">…</NavbarNav>
<Breadcrumb>…</Breadcrumb>          {/* named "Breadcrumb" already */}
<nav aria-label="Account">…</nav>
```

A page has one `main`, and one `h1`. Headings go down a level at a time and aren't picked for their size: set the size in CSS.

## Not by color alone

A status needs words or a shape as well as its color: a `Badge` that says "Overdue", an icon beside the red text. A chart's series are told apart by pattern or dash as well as by color, which the chart components can do. A required field says so, and isn't only a red star.

## The keyboard

- Everything that works with a pointer has to work with the keyboard. Use `Button` and the library's components and it does. An `onClick` on a `div` doesn't.
- Don't take the focus ring away. It's the library's, and it follows the theme.
- When something opens, the focus goes into it, and comes back when it closes. The overlays do this, so don't move the focus yourself around them. The one time you do: when what had the focus is gone, such as the row a dialog has just deleted, or its trigger. Then the focus would be lost, so put it somewhere that makes sense: the next row, the list's heading, a line that says what happened. Give that element `tabIndex={-1}` if it isn't something that takes the focus.
- Menus, tabs, radio groups and toolbars are one stop for the Tab key, and the arrow keys move inside them. Don't add `tabIndex` to their items.

## Things that change by themselves

What appears without being asked for has to be said: use `toast()`, or put the text in an element with `role="status"`. What's gone wrong goes in an `Alert`, which has the role for it. A `FieldError` is different: it's read with its control and not announced by itself, so after a submit with errors, move the focus to the first control that has one.

Content that's loading says so. `Spinner` and `Skeleton` have what's needed. Put the name of what's loading in the `Spinner`'s label where there's more than one.

## Touch and small screens

- Every target is at least 44 pixels on a touch screen. The components are. Keep it true for what you add, and don't shrink a control with CSS on a phone.
- Nothing scrolls sideways at 320 pixels wide. A wide table scrolls inside its own box.
- Motion is wrapped in `prefers-reduced-motion: no-preference`.

## In a test

When writing tests for what you build, find elements the way a person does, by role and name: `getByRole("button", { name: "Save" })`. If that can't find something, a screen reader can't either.

One thing to know when testing with a real browser: some Radix controls act on an arrow key a moment after it goes down. Wait for the result, the focused or selected element, and don't assert on the same tick as the key press.

# Putting components together

## A component is its parts

Most components are several parts, each exported by name, and you write all of them. There's no single tag that takes everything as props.

```tsx
// Wrong: props that don't exist
<Dialog title="Delete this project?" trigger={<Button>Delete</Button>} />

// Right
<Dialog>
  <DialogTrigger asChild>
    <Button intent="danger">Delete</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>Delete this project?</DialogTitle>
    <DialogDescription>This can't be undone.</DialogDescription>
    <DialogFooter>
      <DialogClose asChild>
        <Button intent="secondary">Cancel</Button>
      </DialogClose>
      <Button intent="danger">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

The reference file for a component begins with a working example, and lists each part and what it's for. Copy the structure from there. Don't guess a part's name from another library: check it.

Things that are always needed:

- `Dialog`, `AlertDialog`, `Sheet`: a `...Title` inside the content. It's the name a screen reader says. Where the design shows no title, hide it with `VisuallyHidden`. Don't leave it out.
- `Select`: `SelectTrigger` with a `SelectValue` in it, and `SelectContent` with `SelectItem`s. Each item needs a `value`.
- `Tabs`: each `TabsTrigger` and its `TabsContent` share a `value`.
- `Tooltip`: `TooltipTrigger` and `TooltipContent`. A tooltip names a control. It isn't a place for things to read or press.
- `Accordion`: `type="single"` or `type="multiple"`, and a `value` on each item.

## `asChild`

A part with `asChild` renders no element of its own. It gives its props, its classes and its behavior to the one child inside it.

```tsx
// A trigger that is your button
<DialogTrigger asChild>
  <Button>Open</Button>
</DialogTrigger>

// A link that looks like a button
<Button asChild>
  <a href="/pricing">See pricing</a>
</Button>

// With a router's link
<Button asChild>
  <Link href="/pricing">See pricing</Link>
</Button>
```

- Without `asChild`, a trigger renders its own `<button>`. A `Button` inside it would be a button in a button, which is invalid and breaks the keyboard.
- The child has to be one element, and has to pass on the props and the ref it's given. An element such as `<a>` does, and so does any nuvui component. A component of your own has to spread its props and forward its ref.
- Not every part takes it. One that draws something of its own beside your content, such as a dialog's content with its close button or a checkbox with its tick, doesn't, and TypeScript says so.

## A link is a link

Something that goes to another page is an `<a>`, so it can be opened in a new tab and is announced as a link. Make it look like a button with `<Button asChild>`. Don't put `onClick={() => router.push(...)}` on a button.

## Kept by you, or by the component

Anything that opens, selects or holds a value works both ways:

```tsx
// The component keeps it. Say how it begins.
<Tabs defaultValue="account">

// You keep it. Give both the value and what's called when it should change.
<Tabs value={tab} onValueChange={setTab}>
```

Give `value` with `onValueChange`, `open` with `onOpenChange`, `checked` with `onCheckedChange`. A `value` with no handler is stuck. Don't give both `value` and `defaultValue`.

The handlers are named for what changed, `onValueChange`, `onCheckedChange`, `onOpenChange`, and are called with the new value, not with an event. Native elements, `Input`, `Textarea`, `NativeSelect`, keep `onChange` with an event.

## Use the component that exists

| Don't build | Use |
| --- | --- |
| A box that says there's nothing here | `Empty` |
| A colored box with a message | `Alert` |
| A message that slides in and goes | `toast()`, with `Toaster` rendered once |
| A pulsing gray box | `Skeleton` |
| A spinning circle | `Spinner` |
| A pill with a status | `Badge` |
| A line between things | `Separator` |
| A label and a number | `Stat`, with `Trend` for the change |
| A number written with separators or as money | `FormattedNumber` |
| A row with a picture, a title and an action | `Item` |
| Keys to press | `Kbd` |
| Text for screen readers only | `VisuallyHidden` |

## Toasts

```tsx
// Once, near the root
import { Toaster } from "@nuvui/react";

<body>
  {children}
  <Toaster />
</body>
```

```tsx
// Anywhere, in a client component
import { toast } from "@nuvui/react";

toast("Changes saved");
```

A second `Toaster` shows every toast twice. [reference/components/toast.md](../reference/components/toast.md) has the kinds and the options.

## Icons

The core components draw their own few icons. For the rest there's `@nuvui/icons`, and an app that already has an icon set keeps using it. An icon inside a button sits beside the text as a child, and is hidden from screen readers when there's text. A button with only an icon needs `aria-label`:

```tsx
import { TrashIcon } from "@nuvui/icons";

<Button aria-label="Delete invoice" intent="ghost">
  <TrashIcon />
</Button>
```

An icon from `@nuvui/icons` is hidden from screen readers unless it has a `title` or an `aria-label`, so it needs no `aria-hidden`. Its names are in [reference/icons/index.md](../reference/icons/index.md).

## Refs and other props

Every component forwards its ref to its element and passes on the props it doesn't use, so `id`, `data-*`, `aria-*`, `style` and event handlers work as they do on the element.

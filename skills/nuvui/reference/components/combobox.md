<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/combobox.mdx. Don't edit it here: run `pnpm skill`. -->

# Combobox

A select with a search field. It holds one value or several, filters as you type, and works with a label, the keyboard and forms.

Use a combobox to pick from a list that's too long to scan: a country, a customer, a teammate. It looks like a [select](select.md) until it's opened, and then there's a field to type in and the list shrinks to what matches.

With a dozen options or fewer, a select is simpler to use. With three or four, show them all.

```tsx
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";

const timeZones = [
  "Africa/Lagos",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Pacific/Auckland",
];

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor="time-zone">Time zone</label>
      <Combobox defaultValue="Europe/Berlin">
        <ComboboxTrigger id="time-zone">
          <ComboboxValue placeholder="Pick a time zone" />
        </ComboboxTrigger>
        <ComboboxContent
          aria-label="Time zone"
          label="Search time zones"
          searchPlaceholder="Search"
        >
          <ComboboxEmpty>No time zone found.</ComboboxEmpty>
          {timeZones.map((zone) => (
            <ComboboxItem key={zone} value={zone}>
              {zone}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Combobox` | Holds the value and the open state. Renders nothing itself, apart from a hidden input when it has a `name`. |
| `ComboboxTrigger` | The control on the page. It shows the value and an arrow. |
| `ComboboxValue` | The text inside the trigger: what's picked, or the placeholder. |
| `ComboboxContent` | The popup. It holds the search field, and the list its children go in. |
| `ComboboxItem` | One option. |
| `ComboboxGroup` | Options that belong together, under a heading. |
| `ComboboxSeparator` | A line between groups. |
| `ComboboxEmpty` | What's shown while nothing matches. |
| `ComboboxLoading` | What's shown while the options are being fetched. |

These are separate exports, not properties of `Combobox`. `Combobox.Item` isn't available, because property access on a client component doesn't work from a server component.

## Props

### Combobox

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `multiple` | `false` | `false` | Lets more than one option be picked. The value is then a list. |
| `value` | `string` |  | The picked option's value, when you control it. `""` is none. |
| `defaultValue` | `string` |  | The option picked to begin with, when you don't control it. |
| `onValueChange` | `((value: string) => void)` |  | Called with the new value when an option is picked. |
| `open` | `boolean` |  | Whether the list is open, when you control it. |
| `defaultOpen` | `boolean` | `false` | Whether the list starts open, when you don't control it. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when the list opens or closes. |
| `disabled` | `boolean` | `false` | Disables the trigger. |
| `name` | `string` |  | The name the value is sent under when a form is submitted. With `multiple`, each value is sent under it. |
| `form` | `string` |  | The `id` of the form the value belongs to, if it isn't inside it. |
| `children` | `ReactNode` |  |  |

With `multiple`, `value` and `defaultValue` are arrays of strings, and `onValueChange` is called with one.

### ComboboxValue

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `placeholder` | `ReactNode` |  | What's shown while nothing is picked. |
| `children` | `ReactNode` |  | What's shown for the picked value. Left out, it's the value itself, or with `multiple` the values with commas between them. |

### ComboboxContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Search"` | The search field's name, for screen readers. It names the popup as well, unless that has an `aria-label` of its own. Translate it with the rest of your interface. |
| `listLabel` | `string` | `"Options"` | The list's name, for screen readers. Translate it with the rest of your interface. |
| `searchPlaceholder` | `string` |  | The search field's placeholder. |
| `search` | `string` |  | What's typed in the search field, when you control it. |
| `onSearchChange` | `((search: string) => void)` |  | Called with the text when the search field changes. |
| `shouldFilter` | `boolean` | `true` | Whether the list is filtered as you type. Turn it off when the options are fetched for each search, and already are the matches. |
| `filter` | `CommandFilter` | `comboboxFilter` | Scores an option against the search. Zero hides it, and options with a higher score come first. It's given the option's text as the first keyword. |
| `loop` | `boolean` | `false` | Whether the arrow keys go round from the last option to the first. |
| `align` | `"center" \| "end" \| "start"` | `"start"` | Which edge of the trigger the list lines up with. |
| `sideOffset` | `number` | `6` | The gap between the trigger and the list, in pixels. |
| `collisionPadding` | `number \| Partial<Record<"bottom" \| "left" \| "right" \| "top", number>>` | `8` | How close the list may get to the edge of the screen, in pixels. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the list is rendered into. Set this when the list should pick up a `data-theme` from a section of the page. |

It also takes what Radix's popover content takes, such as `side` and `onEscapeKeyDown`. The [Radix Popover reference](https://www.radix-ui.com/primitives/docs/components/popover#content) lists them.

### ComboboxItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What the option stands for. It's what `value` and `onValueChange` deal in, and it has to differ from every other option's. |
| `textValue` | `string` |  | The text the search looks through. Left out, it's the children when they're a string. Give it when they aren't. |
| `keywords` | `string[]` |  | Other words that should find this option. |
| `disabled` | `boolean` | `false` | Whether the option can be picked. |
| `onSelect` | `((value: string) => void)` |  | Called with the option's value when it's picked. |

### ComboboxGroup

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `heading` | `ReactNode` |  | The text over the group's options. It also names the group. |

### ComboboxSeparator

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `alwaysRender` | `boolean` | `false` | Whether the line stays while something is typed in the search field. Left off, it goes, because the groups it was between may have gone. |

### ComboboxLoading

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Loading"` | What a screen reader is told while this is shown, and what's drawn if there are no children. Translate it with the rest of your interface. |

`ComboboxTrigger` is a `button` and takes what a button takes. `ComboboxEmpty` is a `div`.

## Values and what's shown for them

An option's `value` is what your code and the form get. Its children are what people see. In the first example the two are the same, so the trigger can show the value as it is.

When they differ, say what to show. The list isn't on the page while it's closed, so the component can't look an option's text up for you: pass it to `ComboboxValue` as children.

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";
import { useState } from "react";

const countries = [
  { code: "BR", name: "Brazil" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "DE", name: "Germany" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "MX", name: "México" },
  { code: "NG", name: "Nigeria" },
  { code: "SE", name: "Sweden" },
];

export default function Example() {
  const [code, setCode] = useState("");
  const country = countries.find((item) => item.code === code);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor="country">Country</label>
      <Combobox value={code} onValueChange={setCode} name="country">
        <ComboboxTrigger id="country">
          <ComboboxValue placeholder="Pick a country">
            {country?.name}
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent
          aria-label="Country"
          label="Search countries"
          searchPlaceholder="Search"
        >
          <ComboboxEmpty>No country found.</ComboboxEmpty>
          {countries.map((item) => (
            <ComboboxItem key={item.code} value={item.code}>
              {item.name}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <output style={{ fontSize: 14 }}>
        {code ? `The form gets "${code}".` : "Nothing picked yet."}
      </output>
    </div>
  );
}
```

Each option's `value` has to differ from every other option's.

## Several values

With `multiple`, the value is a list. Picking an option adds it, picking it again takes it out, and the list stays open.

```tsx
"use client";

import {
  Badge,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";
import { useState } from "react";

const labels = [
  "Billing",
  "Bug",
  "Documentation",
  "Feature request",
  "Performance",
  "Security",
];

export default function Example() {
  const [picked, setPicked] = useState(["Bug", "Security"]);

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 280 }}>
      <label htmlFor="labels">Labels</label>
      <Combobox multiple value={picked} onValueChange={setPicked}>
        <ComboboxTrigger id="labels">
          <ComboboxValue placeholder="Add labels">
            {picked.length === 1 ? picked[0] : `${picked.length} labels`}
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent
          aria-label="Labels"
          label="Search labels"
          searchPlaceholder="Search"
        >
          <ComboboxEmpty>No label found.</ComboboxEmpty>
          {labels.map((label) => (
            <ComboboxItem key={label} value={label}>
              {label}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {picked.map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
      </div>
    </div>
  );
}
```

The trigger is a button, so it can't hold a remove button for each value. Show what's picked next to it, as the badges are here, if people need to see all of it at once.

## Groups

```tsx
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";

export default function Example() {
  return (
    <Combobox>
      <ComboboxTrigger aria-label="Assignee">
        <ComboboxValue placeholder="Assign to" />
      </ComboboxTrigger>
      <ComboboxContent label="Search people" searchPlaceholder="Search">
        <ComboboxEmpty>Nobody by that name.</ComboboxEmpty>
        <ComboboxGroup heading="Design">
          <ComboboxItem value="Ada Okafor">Ada Okafor</ComboboxItem>
          <ComboboxItem value="Mei Tanaka">Mei Tanaka</ComboboxItem>
        </ComboboxGroup>
        <ComboboxSeparator />
        <ComboboxGroup heading="Engineering">
          <ComboboxItem value="José Álvarez">José Álvarez</ComboboxItem>
          <ComboboxItem value="Priya Nair">Priya Nair</ComboboxItem>
          <ComboboxItem value="Tom Becker" disabled>
            Tom Becker
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxContent>
    </Combobox>
  );
}
```

A group whose options have all been filtered out goes with them. The separators go while there's something in the search field, because the groups they were between may have gone.

## How the search matches

An option stays while its text contains what was typed. Upper and lower case are the same, and so are letters with and without accents: `jose` finds José. The options keep the order you wrote them in.

The text that's searched is the option's children when they're a string. When they aren't, give `textValue`. `keywords` adds other words that should find the option. The `value` itself isn't searched, so an id doesn't turn up by accident.

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";
import { useState } from "react";

const people = [
  { id: "u_1", name: "Ada Okafor", email: "ada@example.com", team: "design" },
  { id: "u_2", name: "José Álvarez", email: "jose@example.com", team: "api" },
  { id: "u_3", name: "Mei Tanaka", email: "mei@example.com", team: "design" },
  { id: "u_4", name: "Priya Nair", email: "priya@example.com", team: "web" },
];

export default function Example() {
  const [id, setId] = useState("u_2");
  const person = people.find((item) => item.id === id);

  return (
    <Combobox value={id} onValueChange={setId}>
      <ComboboxTrigger aria-label="Owner">
        <ComboboxValue placeholder="Pick an owner">
          {person?.name}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent label="Search people" searchPlaceholder="Name or team">
        <ComboboxEmpty>Nobody found.</ComboboxEmpty>
        {people.map((item) => (
          <ComboboxItem
            key={item.id}
            value={item.id}
            textValue={item.name}
            keywords={[item.email, item.team]}
          >
            <span style={{ display: "grid" }}>
              <span>{item.name}</span>
              <span style={{ fontSize: 12 }}>{item.email}</span>
            </span>
          </ComboboxItem>
        ))}
      </ComboboxContent>
    </Combobox>
  );
}
```

Pass `filter` to match some other way. It's called with the value, the search and the keywords, where the first keyword is the option's text, and returns a number: zero hides the option, and options with a higher number come first.

```tsx
<ComboboxContent
  // Only options that start with what was typed.
  filter={(value, search, keywords) =>
    keywords?.[0]?.toLowerCase().startsWith(search.toLowerCase()) ? 1 : 0
  }
>
```

`comboboxFilter` is the filter used by default, exported so that yours can fall back on it.

## Options from a server

For a list too long to send in one go, fetch the matches as the person types. Control the search text with `search` and `onSearchChange`, and turn `shouldFilter` off, because what comes back is already the matches.

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxLoading,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";
import { useEffect, useState } from "react";

const customers = [
  "Acme Corporation",
  "Blue Harbor Logistics",
  "Cedar & Stone",
  "Delta Freight",
  "Evergreen Health",
  "Fjord Analytics",
  "Globex",
  "Harbor Light Media",
];

// Stands in for a request to your server.
function searchCustomers(text: string): Promise<string[]> {
  const matches = customers.filter((name) =>
    name.toLowerCase().includes(text.toLowerCase()),
  );
  return new Promise((resolve) => setTimeout(() => resolve(matches), 600));
}

export default function Example() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    setLoading(true);
    searchCustomers(search).then((matches) => {
      // An answer to an older search can arrive after a newer one.
      if (!current) return;
      setResults(matches);
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, [search]);

  return (
    <Combobox>
      <ComboboxTrigger aria-label="Customer">
        <ComboboxValue placeholder="Pick a customer" />
      </ComboboxTrigger>
      <ComboboxContent
        label="Search customers"
        searchPlaceholder="Search"
        search={search}
        onSearchChange={setSearch}
        // The server has already done the filtering.
        shouldFilter={false}
      >
        {loading ? <ComboboxLoading label="Loading customers" /> : null}
        <ComboboxEmpty>No customer found.</ComboboxEmpty>
        {loading
          ? null
          : results.map((name) => (
              <ComboboxItem key={name} value={name}>
                {name}
              </ComboboxItem>
            ))}
      </ComboboxContent>
    </Combobox>
  );
}
```

Render `ComboboxLoading` while a request is out. `ComboboxEmpty` waits while it's there: nothing has been found yet, which isn't the same as nothing matching.

The component keeps every option on the page, so a list of thousands is slow to open. Fetching as you type is the way to handle a list that long.

## In a form

Give `Combobox` a `name` and it renders a hidden input that carries the value. With `multiple` there's one input for each value, all under the same name. A single combobox with nothing picked sends an empty value, as a select does.

Inside a [field](field.md), wrap the trigger in `FieldControl`. The label, the description and the error are then tied to it.

```tsx
"use client";

import {
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@nuvui/react";
import { useState } from "react";

const plans = ["Starter", "Team", "Business", "Enterprise"];

export default function Example() {
  const [plan, setPlan] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && !plan ? "Pick a plan to continue." : undefined;

  return (
    <form
      style={{ display: "grid", gap: 16, width: "100%", maxWidth: 280 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Field required>
        <FieldLabel>Plan</FieldLabel>
        <Combobox value={plan} onValueChange={setPlan} name="plan">
          <FieldControl>
            <ComboboxTrigger style={{ inlineSize: "100%" }}>
              <ComboboxValue placeholder="Pick a plan" />
            </ComboboxTrigger>
          </FieldControl>
          <ComboboxContent
            aria-label="Plan"
            label="Search plans"
            searchPlaceholder="Search"
          >
            <ComboboxEmpty>No plan found.</ComboboxEmpty>
            {plans.map((name) => (
              <ComboboxItem key={name} value={name}>
                {name}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
        <FieldDescription>You can change it later.</FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit">Continue</Button>
    </form>
  );
}
```

The hidden input can't be `required` in the way the browser checks, so a required combobox is checked by your own code or your form library, as this example does.

## Width

The trigger is at least 12rem wide and grows with the text in it, up to the width of its container. Set `--nuv-combobox-width: 100%` to make it fill the container.

A value that's still too long is cut short with an ellipsis. The popup is at least as wide as the trigger.

## On small screens

The trigger is 44 pixels tall on a touch screen and 40 with a mouse. Options are 44 and 32. The search field's text is 16 pixels on a touch screen, because iOS zooms the page in when a field with smaller text takes focus.

The popup is never taller than the room around the trigger, and the list scrolls inside it under the search field. On a phone the keyboard comes up once the field has focus and covers part of the screen, so less of the list shows there. That's the price of a search field, and a reason to use a [native select](native-select.md) for a short list on a form that's mostly filled in on phones.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd>, <kbd>Space</kbd>, <kbd>↓</kbd> or <kbd>↑</kbd> | On the trigger, opens the list with focus in the search field. |
| Typing | Filters the list. The first match becomes the active option. |
| <kbd>↓</kbd> and <kbd>↑</kbd> | Move to the next or previous option. Disabled options are skipped. |
| <kbd>Home</kbd> and <kbd>End</kbd> | Move to the first or last option. They don't move the caret in the search field. |
| <kbd>Enter</kbd> | Picks the active option. With one value that closes the list. With `multiple` it stays open. |
| <kbd>Esc</kbd> | Closes the list and keeps the value it had. |
| <kbd>Tab</kbd> | Closes the list and puts focus back on the trigger. The next <kbd>Tab</kbd> moves on from there. |

### What the component handles

- The trigger has `role="combobox"`, with `aria-expanded` and `aria-haspopup="dialog"`. A plain button that's named by a label loses its own text to a screen reader. With this role the label is the name and the text is the value, the way a select is read.
- The popup is a dialog that holds the search field and the list. The field has `role="combobox"` and controls the list, which has `role="listbox"`. Each group is named by its heading.
- Focus stays in the search field. The field's `aria-activedescendant` says which option the arrow keys are on, and that option has `aria-selected`. The library that does the filtering, cmdk, leaves that attribute empty until an arrow key is pressed. This component keeps it right from the moment the list opens.
- The picked option has `aria-checked`. With `multiple`, every option says whether it's checked.
- When nothing matches, the text of `ComboboxEmpty` is put in a status region next to the list, so a screen reader says it. The copy that's drawn inside the list is hidden from screen readers, because a list of options may only hold options. `ComboboxLoading` works the same way.
- The active option is filled with the primary color. That fill has at least 3:1 contrast with the popup, and the text on it keeps 4.5:1. Where the browser forces its own colors, as Windows high contrast does, the option has an outline instead.
- The search field shows that it has focus with a line in the ring color along the bottom of its row.
- <kbd>Tab</kbd> closes the list. The popup is rendered at the end of the page, so without that, the next stop would be the browser's own buttons.
- The popup only animates when the visitor hasn't asked for reduced motion.

### What you need to handle

- Give the trigger a name. Use a `<label>` whose `htmlFor` matches the trigger's `id`, a [field](field.md), or `aria-label`.
- Don't use the placeholder as the label. It goes away once something is picked.
- `label` on `ComboboxContent` names the search field, and the popup too. Give the popup an `aria-label` of its own, such as the field's name, if hearing "Search" twice isn't what you want.
- Translate `label`, `listLabel` and the text of `ComboboxEmpty` and `ComboboxLoading` with the rest of your interface.
- When the value is wrong, set `aria-invalid` on the trigger and say what's wrong in text. A field does both.

### What hasn't been checked

The tests check the roles, names and states that a browser passes on to a screen reader. What each screen reader then says hasn't been checked by a person. `aria-checked` on an option is in the ARIA standard, and screen readers differ in how they read it.

## CSS variables

The trigger sits in the page, so its variables can be set on it or on anything around it. The popup renders at the end of `<body>`, so set the others on `:root` or `body`, or straight on `ComboboxContent`.

```css
.filters {
  --nuv-combobox-width: 100%;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-combobox-width` | `12rem` | The narrowest the trigger gets. Set it to 100% to fill the container. |
| `--nuv-combobox-border` | `var(--color-border-strong)` | Border color of the trigger. |
| `--nuv-combobox-radius` | `var(--radius-md)` | Corner radius of the trigger. |
| `--nuv-combobox-bg` | `var(--color-surface)` | Background color of the trigger. |
| `--nuv-combobox-fg` | `var(--color-foreground)` | Text color of the trigger once something is picked. |
| `--nuv-combobox-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Minimum height of the trigger. The default differs between touch screens and a mouse. |
| `--nuv-combobox-content-border` | `var(--color-border)` | Border color of the popup, and the color of the lines inside it. |
| `--nuv-combobox-content-radius` | `var(--radius-lg)` | Corner radius of the popup. |
| `--nuv-combobox-content-bg` | `var(--color-surface)` | Background color of the popup. |
| `--nuv-combobox-content-shadow` | `var(--shadow-lg)` | Shadow under the popup. |
| `--nuv-combobox-content-fg` | `var(--color-surface-foreground)` | Text color of the popup. |
| `--nuv-combobox-input-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Minimum height of the search field. The default differs between touch screens and a mouse. |
| `--nuv-combobox-input-font-size` | `var(--text-base)`, `var(--text-sm)` | Size of the search field's text. Keep it at 16 pixels or more on touch screens. |
| `--nuv-combobox-input-placeholder` | `var(--color-muted-foreground)` | Color of the search field's placeholder. |
| `--nuv-combobox-list-height` | `18rem` | The tallest the list gets before it scrolls. It's shorter when there's less room. |
| `--nuv-combobox-item-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-sm)` | Minimum height of an option. The default differs between touch screens and a mouse. |
| `--nuv-combobox-highlight-bg` | `var(--color-primary)` | Background of the active option, from the pointer or the arrow keys. Keep it at 3:1 against the popup. |
| `--nuv-combobox-highlight-fg` | `var(--color-primary-foreground)` | Text color of that option. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-combobox` | ComboboxTrigger. |
| `.nuv-combobox__body` | The element inside the popup that holds the search field and the list. |
| `.nuv-combobox__content` | ComboboxContent, the popup. |
| `.nuv-combobox__empty` | ComboboxEmpty. |
| `.nuv-combobox__icon` | The arrow in the trigger. |
| `.nuv-combobox__indicator` | The check at the end of a picked option. |
| `.nuv-combobox__input` | The search field. |
| `.nuv-combobox__item` | ComboboxItem. |
| `.nuv-combobox__label` | A group's heading. |
| `.nuv-combobox__list` | The part that scrolls, with the options in it. |
| `.nuv-combobox__loading` | ComboboxLoading. |
| `.nuv-combobox__search` | The row the search field is in. |
| `.nuv-combobox__search-icon` | The magnifying glass in that row. |
| `.nuv-combobox__separator` | ComboboxSeparator. |
| `.nuv-combobox__status` | The region a screen reader hears "no results" and "loading" from. It isn't drawn. |
| `.nuv-combobox__value` | ComboboxValue. It's what cuts a long value short. |

The trigger has `data-state`, which is `open` or `closed`, and its value part has `data-placeholder` while nothing is picked. An option has `data-selected="true"` while it's the active one, `data-state`, which is `checked` or `unchecked`, and `data-disabled="true"` when it can't be picked.

## Server components

The combobox parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a combobox together inside a server component, as the first example on this page does. It only needs a client component of your own when you control `value` or `search`, or pass a function such as `onValueChange` or `filter`.

## Themed sections

A popup opened from inside a `data-theme="dark"` section doesn't inherit that theme, because it isn't rendered inside the section. Pass the section's element as `container` to `ComboboxContent` and it will be.

## What it's built on

The list and its filtering are [cmdk](https://github.com/pacocoursey/cmdk), and the popup is Radix's popover. Both are installed with the library. Radix has no combobox of its own.

Four things are done differently from cmdk on its own. The active option is always announced. The match is on letters in a row and not on scattered ones. The separator is hidden from screen readers. And a screen reader is told when nothing matches. The [command](command.md) page says more about the first.

## Do and don't

**Do**

- Put a visible label above or beside it.
- Order the options in a way people can predict: alphabetical, or most used first.
- Write `ComboboxEmpty` so that it says what wasn't found: "No customer found", not "No results".

**Don't**

- Don't use one for a handful of options. A [select](select.md) or a [radio group](radio-group.md) is quicker.
- Don't use one for actions. That's a [command](command.md) palette or a [dropdown menu](dropdown-menu.md).
- Don't put thousands of options in it. Fetch the matches as the person types.

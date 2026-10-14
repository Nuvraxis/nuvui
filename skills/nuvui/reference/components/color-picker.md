<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/color-picker.mdx. Don't edit it here: run `pnpm skill`. -->

# ColorPicker

Picks a color with an area and a hue slider, a field to type into, and presets.

Use a color picker where someone chooses a color that isn't on a short list: a brand color, the color of a label or a chart series. It's built from parts, so a picker can be all of them in a popover, or only a row of presets.

```tsx
"use client";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "@nuvui/react";

const presets = [
  { value: "#dc2626", name: "Red" },
  { value: "#ea580c", name: "Orange" },
  { value: "#ca8a04", name: "Yellow" },
  { value: "#16a34a", name: "Green" },
  { value: "#2563eb", name: "Blue" },
  { value: "#7c3aed", name: "Violet" },
];

export default function Example() {
  return (
    <ColorPicker defaultValue="#2563eb">
      <ColorPickerTrigger aria-label="Brand color" />
      <ColorPickerContent>
        <ColorPickerArea />
        <ColorPickerHue />
        <ColorPickerInput />
        <ColorPickerSwatches aria-label="Presets">
          {presets.map((preset) => (
            <ColorPickerSwatch
              key={preset.value}
              value={preset.value}
              aria-label={preset.name}
            />
          ))}
        </ColorPickerSwatches>
      </ColorPickerContent>
    </ColorPicker>
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
  ColorPicker,
  ColorPickerTrigger,
  ColorPickerContent,
  ColorPickerPanel,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerSwatches,
  ColorPickerSwatch,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `ColorPicker` | Keeps the color. It draws nothing itself. |
| `ColorPickerTrigger` | The button that opens the popover. It shows the color as a swatch and as text. |
| `ColorPickerContent` | The popover, with a panel in it. |
| `ColorPickerPanel` | The parts, one under the other. Use it by itself for a picker in the page. |
| `ColorPickerArea` | The square to pick from: more color to the right, lighter towards the top. |
| `ColorPickerHue` | The slider for the hue. |
| `ColorPickerInput` | A field to type the color into. |
| `ColorPickerSwatches` | A set of presets. |
| `ColorPickerSwatch` | One preset, picked with a press. |

Every part but the first is optional. Leave out what you don't want.

The color is always a string, `#rrggbb`, in lower case. There's no transparency.

## In the page

Without a trigger and a popover, `ColorPickerPanel` puts the picker where you write it.

```tsx
"use client";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerPanel,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [color, setColor] = useState("#0d9488");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <ColorPicker value={color} onValueChange={setColor}>
        <ColorPickerPanel>
          <ColorPickerArea />
          <ColorPickerHue />
          <ColorPickerInput />
        </ColorPickerPanel>
      </ColorPicker>
      <p style={{ margin: 0, fontSize: 14 }}>The color is {color}.</p>
    </div>
  );
}
```

## Presets only

Where the colors to choose from are a list you've decided, leave out the area, the slider and the field. Give each swatch a name. Here the trigger shows the name in place of the hex.

```tsx
"use client";

import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "@nuvui/react";
import { useState } from "react";

// The colors a label can have, and no others.
const labels = [
  { value: "#b91c1c", name: "Urgent" },
  { value: "#c2410c", name: "Waiting" },
  { value: "#15803d", name: "Done" },
  { value: "#1d4ed8", name: "In review" },
  { value: "#6d28d9", name: "Idea" },
  { value: "#475569", name: "Archived" },
];

export default function Example() {
  const [color, setColor] = useState("#15803d");
  const name = labels.find((label) => label.value === color)?.name;

  return (
    <ColorPicker value={color} onValueChange={setColor}>
      <ColorPickerTrigger aria-label="Label color">{name}</ColorPickerTrigger>
      <ColorPickerContent>
        <ColorPickerSwatches aria-label="Label colors">
          {labels.map((label) => (
            <ColorPickerSwatch
              key={label.value}
              value={label.value}
              aria-label={label.name}
            />
          ))}
        </ColorPickerSwatches>
      </ColorPickerContent>
    </ColorPicker>
  );
}
```

## Saving the color

`onValueChange` is called all through a drag, many times a second. That's right for a preview. To save, use `onValueCommit`, which is called once the color has settled: when a drag ends, a key is pressed, a preset is chosen, or a typed color is entered.

```tsx
"use client";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerPanel,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [color, setColor] = useState("#db2777");
  const [saved, setSaved] = useState<string[]>([]);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <ColorPicker
        value={color}
        onValueChange={setColor}
        // Once for each drag, where onValueChange is called all through it.
        onValueCommit={(value) => setSaved((before) => [...before, value])}
      >
        <ColorPickerPanel>
          <ColorPickerArea />
          <ColorPickerHue />
        </ColorPickerPanel>
      </ColorPicker>
      <p role="status" style={{ margin: 0, fontSize: 14 }}>
        Saved {saved.length} {saved.length === 1 ? "time" : "times"}
        {saved.length > 0 ? `, last as ${saved.at(-1)}` : ""}.
      </p>
    </div>
  );
}
```

## In a form

`name` puts the color in a form under that name. To give the trigger a label and a description, wrap it in a [field](field.md)'s `FieldControl`.

```tsx
"use client";

import {
  Button,
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerTrigger,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [sent, setSent] = useState("");

  return (
    <form
      style={{ display: "grid", gap: 16, justifyItems: "start" }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSent(`Sent accent=${String(data.get("accent"))}`);
      }}
    >
      <Field>
        <FieldLabel>Accent color</FieldLabel>
        <ColorPicker name="accent" defaultValue="#7c3aed">
          <FieldControl>
            <ColorPickerTrigger />
          </FieldControl>
          <ColorPickerContent>
            <ColorPickerArea />
            <ColorPickerHue />
            <ColorPickerInput />
          </ColorPickerContent>
        </ColorPicker>
        <FieldDescription>Used for links and buttons.</FieldDescription>
      </Field>
      <Button type="submit">Save</Button>
      <p role="status" style={{ margin: 0, minBlockSize: 20, fontSize: 14 }}>
        {sent}
      </p>
    </form>
  );
}
```

## ColorPicker props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string` |  | The color, as `#rrggbb`, when you control it. |
| `defaultValue` | `string` | `"#000000"` | The color at first, when you don't. |
| `onValueChange` | `((value: string) => void)` |  | Called with the color as it changes, many times during a drag. |
| `onValueCommit` | `((value: string) => void)` |  | Called with the color once it's settled: when a drag ends, a key is pressed, a preset is chosen, or a typed color is entered. The place to save from. |
| `disabled` | `boolean` | `false` | Stops the color being changed, and the trigger from opening. |
| `name` | `string` |  | Puts the color in a form under this name. |
| `open` | `boolean` |  | Whether the popover is open, when you control it. |
| `defaultOpen` | `boolean` |  | Whether it's open at first, when you don't. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when the popover opens or closes. |
| `children` | `ReactNode` |  | The trigger and the content, or the panel alone for a picker in the page. |

## ColorPickerTrigger props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` | `ReactNode` |  | What the button shows after the swatch. Left out, it's the color as text, `#rrggbb`. |

It also takes what a `button` takes, including `ref` and `className`.

## ColorPickerContent props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `aria-label` | `string` | `"Color picker"` | The popover's name for a screen reader. It's a dialog, and a dialog has to have one. |

It also takes what a [popover](popover.md)'s `PopoverContent` takes: `side`, `align`, `showArrow`, `container` and the rest. It's aligned to the start of the trigger unless you say otherwise.

## ColorPickerArea props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `aria-label` | `string` | `"Saturation and brightness"` | The thumb's name for a screen reader. |
| `getValueText` | `((saturation: number, brightness: number) => string)` | `"Saturation 50%, brightness 50%"` | What a screen reader says for where the thumb is. It's given the saturation and the brightness, each from 0 to 100. |

It also takes what a `div` takes, including `ref` and `className`.

## ColorPickerHue props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `aria-label` | `string` | `"Hue"` | The slider's name for a screen reader. |

## ColorPickerInput props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `aria-label` | `string` | `"Hex color"` | The field's name for a screen reader. |

It also takes what an `input` takes, but for `value` and `type`.

## ColorPickerSwatch props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | The color it picks, as `#rrggbb`. |

It also takes what a `button` takes. `ColorPickerSwatches` and `ColorPickerPanel` take what a `div` takes.

## Working with the color yourself

The functions the picker uses are exported too, for checking a color someone typed elsewhere or working out a shade.

```tsx
import { hexToHsv, hsvToHex, parseHex } from "@nuvui/react";

parseHex("2563EB"); // "#2563eb"
parseHex("#fa0"); // "#ffaa00"
parseHex("blue"); // null

const { h, s, v } = hexToHsv("#2563eb");
hsvToHex({ h, s, v: v / 2 }); // the same blue, half as bright
```

## Accessibility

There's no ARIA pattern for a color picker. Each part follows the pattern for what it is: a [slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) for the area and the hue, a text field, and buttons.

### Keyboard

| Where | Key | What it does |
| --- | --- | --- |
| The trigger | Enter, Space | Opens the popover. Escape closes it and focus goes back. |
| The area | Right, Left | More and less saturation, by 1. |
| The area | Up, Down | Lighter and darker, by 1. |
| The area | Shift and an arrow | By 10. |
| The area | Page Up, Page Down | Lighter and darker, by 10. |
| The area | Home, End | No saturation, and all of it. |
| The hue | Arrows | Round the hues, by 1 degree. Shift, Page Up and Page Down go by 10. |
| The hue | Home, End | The first hue and the last, which are both red. |
| The field | Enter | Takes what's typed as the color, if it is one. |
| A preset | Enter, Space | Picks it. |

Tab moves between the parts, in the order you wrote them.

### What the component handles

- The popover is a dialog with a name, "Color picker", which `aria-label` on `ColorPickerContent` changes.
- The area's thumb is a `slider` whose value is said in words: "Saturation 62%, brightness 80%". A slider has one value and this has two, so the words are where both are told.
- The trigger's color is its description, so a screen reader says it after the name, whatever the name comes from: `aria-label`, a `label`, or a field.
- The preset that's the color now has `aria-pressed="true"`, and a ring inside it that doesn't depend on telling two colors apart.
- A thumb has a white ring with a dark line round it, so it shows on any color.
- Typing something that isn't a color marks the field invalid. Leaving the field puts back the color it had.
- Where the browser forces its own colors, the area, the hue track, the swatches and the thumbs keep theirs. They're what's being shown, and without them there'd be nothing to pick from.
- The area and the hue aren't turned round in a right-to-left page, and their arrow keys go with what's drawn: Right is always more saturation.

### What you need to handle

- Name the trigger: with `aria-label`, or with a label through a field.
- Name each preset with `aria-label`, such as "Red". Without one its name is its hex, which says little to someone who can't see it.
- Name the set of presets with `aria-label` on `ColorPickerSwatches`.
- In another language, give the parts their words: `aria-label` on the content, the area, the hue and the field, and `getValueText` on the area.
- The picker doesn't check that the color can be read against anything. If it's for text or for something text sits on, check the contrast yourself and say when it's too low.
- Don't make the area the only way in. Someone who can't tell the colors apart, or can't see them, needs the field or named presets.

## On small screens

The popover keeps to the screen, and the panel is as wide as it. A preset is 44 pixels square with a finger and 24 with a mouse. A drag in the area or along the hue moves the thumb and not the page.

## CSS variables

Set any of these on a part, or on anything around it. A popover is drawn at the end of the page, so for one, set them on `ColorPickerContent`.

```css
.brand-picker {
  --nuv-color-picker-area-height: 12rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-color-picker-gap` | `calc(var(--spacing) * 3)` | Space between the parts. |
| `--nuv-color-picker-width` | `15rem` | Width of the panel. |
| `--nuv-color-picker-trigger-border` | `var(--color-border-strong)` | Color of the trigger's edge. |
| `--nuv-color-picker-radius` | `var(--radius-md)` | Corner radius of the trigger and the area. |
| `--nuv-color-picker-trigger-bg` | `var(--color-surface)` | Background of the trigger. |
| `--nuv-color-picker-color` | `transparent` | Set by the component: the color a swatch or a thumb shows. |
| `--nuv-color-picker-area-height` | `10rem` | Height of the area. |
| `--nuv-color-picker-hue` | `transparent` | Set by the component: the area's hue at full strength. |
| `--nuv-color-picker-y` | `0%` | Set by the component: where the area's thumb is, down. |
| `--nuv-color-picker-x` | `0%` | Set by the component: where the area's thumb is, across. |
| `--nuv-color-picker-thumb-size` | `1.25rem` | Size of the two thumbs. |
| `--nuv-color-picker-track-size` | `0.75rem` | Thickness of the hue track. |
| `--nuv-color-picker-hues` | `none` | Set by the component: the gradient of the hue track. |
| `--nuv-color-picker-swatch-gap` | `calc(var(--spacing) * 2)` | Space between presets. |
| `--nuv-color-picker-swatch-size` | `var(--nuv-touch-size)`, `calc(var(--spacing) * 6)` | Size of a preset. Larger by default with a finger than with a mouse. |
| `--nuv-color-picker-swatch-radius` | `var(--radius-sm)` | Corner radius of a preset. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-color-picker` | ColorPickerPanel |
| `.nuv-color-picker__area` | ColorPickerArea |
| `.nuv-color-picker__area-thumb` | The area's thumb. |
| `.nuv-color-picker__content` | ColorPickerContent, with the popover's own class. |
| `.nuv-color-picker__hue` | ColorPickerHue |
| `.nuv-color-picker__hue-thumb` | The thumb of the hue slider. |
| `.nuv-color-picker__hue-track` | The track of the hue slider. |
| `.nuv-color-picker__input` | ColorPickerInput, with the input's own class. |
| `.nuv-color-picker__swatch` | ColorPickerSwatch |
| `.nuv-color-picker__swatches` | ColorPickerSwatches |
| `.nuv-color-picker__trigger` | ColorPickerTrigger |
| `.nuv-color-picker__trigger-swatch` | The swatch in the trigger. |
| `.nuv-color-picker__value` | The color as text, in the trigger. |
| `.nuv-color-picker__value--hidden` | The same, when the trigger shows something else: read and not drawn. |

A disabled panel and area have `data-disabled`.

## Server components

ColorPicker starts with `"use client"`: it keeps the color. You can render it from a server component as long as you leave out `onValueChange`, `onValueCommit` and `onOpenChange`, since a function can't be passed from the server. With `name`, a form still gets the color.

## Do and don't

**Do**

- Offer presets for the colors people most often want. Most never touch the area.
- Save from `onValueCommit`, and preview from `onValueChange`.

**Don't**

- Don't use it to choose between a few named things. That's a [select](select.md) or a [radio group](radio-group.md), with the color as decoration.
- Don't leave out both the field and the presets. The area alone can't be used without seeing it.

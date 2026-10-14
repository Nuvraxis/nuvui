# Styling

nuvui's styles are plain CSS, built from SCSS, in three cascade layers: `tokens`, `base`, `components`. Every rule of a component is on a class that begins with `nuv-`. Nothing in it is a Tailwind utility, and nothing in it needs Tailwind.

## Load the stylesheet, once

A component never imports CSS. The app does, once, where every page gets it:

```tsx
// app/layout.tsx, or the file the app starts in
import "@nuvui/react/styles.css";
import "@nuvui/table/styles.css"; // each add-on that's used, after the core
```

A component that renders as bare, unstyled HTML means its stylesheet isn't loaded. Don't fix that by writing styles for it.

## Change a look in this order

1. **A prop.** `intent`, `size`, `variant`, `orientation`. The reference file's props table lists them.
2. **A component variable.** Each component reads `--nuv-<component>-*` variables, listed in its reference file under "CSS variables". Set one on the component or on anything around it.
3. **A token.** `--color-primary`, `--radius-md`, `--spacing`. Changing one changes everything that reads it. [tokens.md](../tokens.md) has them all.

```css
/* Wrong: fighting the component with a heavier selector */
.toolbar .nuv-button {
  border-radius: 9999px !important;
}

/* Right: the variable the button reads */
.toolbar {
  --nuv-button-radius: var(--radius-full);
}
```

You never need `!important` or a longer selector. The library's rules are in cascade layers, and a rule that's in no layer beats every rule in one, whichever file loads first. If the app's own CSS is in layers, the layer with the overrides has to come after `tokens` and `components`.

## Every color is a token

```css
/* Wrong */
.invoice__total {
  color: #16a34a;
}

/* Right */
.invoice__total {
  color: var(--color-success);
}
```

The semantic colors have a value for light and one for dark, and each pair is checked for contrast. A color written out has neither. Use the semantic ones, `--color-primary`, `--color-foreground`, `--color-muted-foreground`, `--color-border`, `--color-surface`, `--color-danger`, `--color-success`, `--color-warning`, and not the raw scales such as `--color-blue-600`, which don't change in dark mode. Text on a filled color uses its pair: `--color-primary-foreground` on `--color-primary`.

The same goes for a color in JSX: `style={{ color: "var(--color-danger)" }}`, never `"red"`.

## `className` places a component, it doesn't restyle it

Every component takes `className` and `style`, and merges yours with its own. Use them to put the component somewhere: a margin, a grid area, a width.

```tsx
// Wrong: utilities standing in for the component's own look
<Button className="rounded-full bg-green-600 px-8 text-white">Save</Button>

// Right: the look is a prop and a variable, the class is for the layout
<Button intent="primary" className="settings__save">Save</Button>
```

If the app has Tailwind, its utilities are fine for the layout around components, such as `className="mt-4 w-full"`. [reference/tailwind.md](../reference/tailwind.md) says how to set the layer order so the two don't fight, and how to get `bg-primary` and the like from the library's tokens. If the app has no Tailwind, don't add it.

## Dark mode and density are attributes

```html
<html data-theme="system" data-density="comfortable">
```

- `data-theme` is `light`, `dark` or `system`. Without it, everything is light. It can go on any element, to theme part of a page.
- `data-density` sets how tall controls are with a mouse. [reference/theming.md](../reference/theming.md) has the levels.
- There's no theme provider, no theme object and no hook. Don't write one. A switch for dark mode sets the attribute on `<html>`.

A preset is one more stylesheet, after the core's: `import "@nuvui/react/themes/ink.css"`. [reference/theming.md](../reference/theming.md) lists them.

## Your own CSS

Write it the way the app already does: its CSS modules, its SCSS, its Tailwind. Where the app has no styles of its own yet, the default is a plain CSS file beside the component, imported by it, with class names in BEM. Not inline styles, and not a new tool.

The examples in the reference files lay things out with inline `style`, in pixels. That's to keep each example in one file. Don't copy it: in an app, the layout goes in a stylesheet, in tokens.

For a screen or a block you write, follow what the library and its blocks do:

- **BEM, with your block's name.** `.invoice`, `.invoice__total`, `.invoice--overdue`. Never a class that begins with `nuv-`: those are the library's, and may change.
- **Tokens for everything that has one**: colors, `calc(var(--spacing) * 4)` for space, `var(--radius-md)`, `var(--text-sm)`.
- **Smallest screen first.** Write the phone's layout, and add to it at a breakpoint.
- **Logical properties**: `inline-size`, `margin-inline-start`, `inset-inline-end`, so the layout mirrors where text reads from the right.
- **Targets of 44 pixels** on a touch screen.

With Sass, the library's mixins do the breakpoints, the focus ring and hover that doesn't stick on touch:

```scss
@use "@nuvui/react/scss/mixins";

.invoice__row {
  display: grid;
  gap: calc(var(--spacing) * 2);

  @include mixins.breakpoint("md") {
    grid-template-columns: 1fr auto;
  }

  @include mixins.focus-ring;
}
```

[reference/scss.md](../reference/scss.md) lists them. Without Sass, write the media query and use `:focus-visible` with `outline: 2px solid var(--color-ring)`.

A CSS variable can't be read in a media query, so in plain CSS a breakpoint is written out. They're the ones in [tokens.md](../tokens.md): `sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem, `2xl` 96rem.

```css
.invoice__row {
  display: grid;
  gap: calc(var(--spacing) * 2);
}

@media (min-width: 48rem) {
  .invoice__row {
    grid-template-columns: 1fr auto;
  }
}
```

The library styles its components and little else. A page's own frame, its width, the space around it, its headings, is the app's to write.

## Under a Content Security Policy

A site that sends a Content Security Policy needs `style-src-attr 'unsafe-inline'` for nuvui. Components set some styles on the element, such as how far a progress bar has filled, and a page rendered on a server sends them as `style` attributes. Without that line they're dropped, and a progress bar is empty, a slider's handle sits at the start and a scroll area doesn't scroll. Keep `style-src` itself strict: the one `<style>` element in the library is `ScrollArea`'s, and it takes the policy's nonce as `nonce`. The whole policy, line by line: [reference/content-security-policy.md](../reference/content-security-policy.md).

Don't fix a blocked style by moving it into a `<style>` element, or by adding `'unsafe-inline'` to `style-src`.

## Don't

- Don't copy a component's CSS into the app to change it. Set its variables.
- Don't style a `nuv-` class that the reference doesn't list. The listed classes and variables are what's kept from one version to the next.
- Don't set a `z-index` to get an overlay on top. Dialogs, popovers and toasts are stacked by the library's own tokens.
- Don't animate without `prefers-reduced-motion: no-preference` around it.

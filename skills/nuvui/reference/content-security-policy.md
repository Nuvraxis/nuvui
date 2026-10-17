<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/content-security-policy.mdx. Don't edit it here: run `pnpm skill`. -->

# Content Security Policy

The policy a site with a strict Content Security Policy needs for nuvui, what each line is for, and what breaks without it.

A Content Security Policy tells the browser what a page may load and run. nuvui works under a strict one, with one allowance: `style` attributes. This page says which, and why.

## The policy

These are the lines nuvui needs. Your framework adds its own, mostly for its scripts.

```txt title="Content-Security-Policy"
default-src 'self';
style-src 'self' 'nonce-{nonce}';
style-src-attr 'unsafe-inline';
img-src 'self' blob:;
connect-src 'self';
worker-src 'self' blob:;
```

`{nonce}` is a value made fresh for every response. It needs a server that sends each page. A site exported as static files has no nonce to give, and a component that needs one can't be used there under this policy.

| Line | What it's for |
| --- | --- |
| `style-src 'self'` | The packages' stylesheets, served from your site. |
| `'nonce-{nonce}'` | The one `<style>` element in the library, written by `ScrollArea`. Pass it the same value: `<ScrollArea nonce={nonce}>`. No other component writes a `<style>` element. |
| `style-src-attr 'unsafe-inline'` | `style` attributes in the HTML. See below. |
| `img-src blob:` | A picture of a file before it's sent, in `PromptInput`, and saving a barcode or a QR code as a PNG. Leave it out if you use neither. |
| `worker-src blob:` | Where MapLibre starts its worker from, for `@nuvui/map`. With `setMapWorkerUrl` pointing at a file on your site, `'self'` is enough. |

No package runs code from a string, so `script-src` needs no `'unsafe-eval'`. The chat package's code colors come from Shiki's JavaScript engine, which needs no WebAssembly either.

## Why `style` attributes

A component sets some of its styles on the element itself, where the value is only known while it runs: how far a progress bar has filled, where a slider's handle sits, the colors of a chart's series. So do the libraries under it: Radix places its own parts this way, and Recharts sizes its charts this way.

A page that's built in the browser sets these from JavaScript, and a policy doesn't stop that. A page rendered on a server sends them in its HTML, as `style` attributes, and without `style-src-attr 'unsafe-inline'` the browser drops them. React doesn't put them back when it takes the page over. On a page rendered on a server, this is what goes wrong:

| Component | Without `style` attributes |
| --- | --- |
| `Progress` | The bar is empty, whatever its value. |
| `Slider` | The filled part is empty, and the handle is at the start. |
| `ScrollArea` | The box doesn't scroll. |
| A chart | The series lose their colors. |
| `Rating` | A part of a star isn't filled. |
| `AspectRatio` | The box has no height. |
| `ColorPicker` | The swatch in the trigger is empty. |
| `TextReveal` | The lines rise together rather than one after another. |
| `Compare` | Until the page's script runs, the divider is in the middle, whatever `defaultPosition` says. It sets the position again once it runs. |
| `DataTable` | A nested row isn't indented. |
| `Checkbox`, `RadioGroup`, `Switch` and `Select` in a form | Radix's hidden copy of the control shows on the page. |

A `style` attribute can only style the element it's on. It can't select other elements, so it can't be used to read what's on the page, which is what a `<style>` element can be made to do. That's why the line is allowed and `<style>` elements stay behind the nonce.

## The add-on packages

- **`@nuvui/map`:** the tiles and the style come from a provider. Add its address to `connect-src`.
- **`@nuvui/chat`:** what your app sends a model and gets back is your app's own requests, under your `connect-src`.
- **`@nuvui/flow`:** nothing. Every position is an SVG attribute, so a diagram sent by a server is drawn whole under a policy without `style-src-attr 'unsafe-inline'`.
- **`@nuvui/barcodes`:** a picture laid over a QR code is fetched once to save it in the file, from its own address, under `connect-src`.

## How it was checked

Every page of these docs was loaded in Chromium under this policy, with the scripts allowed, and nothing the packages draw was blocked. The same pages with `style` attributes blocked gave the table above. A test in the docs repeats the first for the components in that table, in each browser the docs are tested in.

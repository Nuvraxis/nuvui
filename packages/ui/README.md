# @nuvui/react

React components built on Radix UI primitives and styled with plain SCSS and BEM class names.

There are sixty-six components. This is early: the package is on npm as a 0.x version, and before 1.0 a minor version may rename or remove things. The [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does, and the [repository README](https://github.com/Nuvraxis/nuvui#readme) says where things stand.

```sh
pnpm add @nuvui/react
```

```tsx
import "@nuvui/react/styles.css";
import { Button } from "@nuvui/react";

export default function Page() {
  return <Button>Save changes</Button>;
}
```

The docs are at https://nuvui.nuvraxis.com/docs, with a page for each component.

## License

MIT

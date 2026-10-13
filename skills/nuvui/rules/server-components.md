# Server components

This matters in Next.js's app router and anywhere else with React Server Components. In an app that's all client, such as one built with Vite alone, none of it applies.

## The components carry the directive

A part that holds state, uses an effect or listens for events has `"use client"` at the top of its own file in the package, and the package's build checks that it's still there. So a server component can render it:

```tsx
// app/page.tsx: a server component, with no directive
import { Dialog, DialogContent, DialogTitle, DialogTrigger, Button } from "@nuvui/react";

export default function Page() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Details</DialogTitle>
      </DialogContent>
    </Dialog>
  );
}
```

Some components have no state and no directive, and render on the server as they are: `Badge`, `Button`, `Card`, `Alert`, `Input`, `Skeleton`, `Spinner`, `Stat` and others. Each reference file has a "Server components" section that says which kind its component is.

Don't add `"use client"` to a file only because it imports from `@nuvui/react`.

## When your file needs it

Put `"use client"` at the top of a file of yours when that file:

- calls a hook: `useState`, `useEffect`, a form library's, `useDataTable`;
- passes a function as a prop: `onClick`, `onValueChange`, `onOpenChange`;
- passes a function as a child, which a few components take, such as `MapClusters`;
- calls `toast()`.

A function can't cross from a server component to a client one. A server action is the exception, in Next.js: a function in a file marked `"use server"` can be imported into a client file and called from a handler there.

Otherwise it can't. That's the usual cause of the error about functions not being passable to client components: an `onValueChange` written in a server component. Move the part with the handler into a small client component, and leave the page around it on the server.

## Fetch on the server, pass down

```tsx
// app/people/page.tsx: server
export default async function Page() {
  const people = await getPeople();
  return <PeopleTable people={people} />;
}
```

```tsx
// app/people/people-table.tsx: client, because of the hook
"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
```

What's passed down has to be plain data: no functions, no class instances. A `Date` is fine.

## The ones that are always client, in your file

- **A chart.** The file a chart is written in has `"use client"`: Recharts measures the page.
- **A data table.** `useDataTable` is a hook.
- **A map.** `MapView` renders from a server component with plain props, and draws in the browser. `setMapWorkerUrl` is called from a client file.
- **The editor.** Load it lazily, with `next/dynamic` or `lazy`: it's large.

## Stylesheets

Import the stylesheets in the root layout, which is a server component. They're plain CSS files: no loader, no plugin, and nothing that needs the client.

## What's rendered before the browser has it

Dates and times differ between the server and the reader's browser: the day, the time zone. Don't render "today" on the server. [reference/date-picker/index.md](../reference/date-picker/index.md) covers what the date components do about it and what's left to you.

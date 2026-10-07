---
"@nuvui/react": minor
---

Eight components for overlays, menus and navigation.

- `AlertDialog`, with `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction` and `AlertDialogCancel`: a dialog that asks one question. A click outside doesn't close it, and focus starts on the button that changes nothing. Its two buttons are the library's `Button` and take its props.
- `Sheet`, with `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetBody`, `SheetFooter` and `SheetClose`: a panel that slides in from an edge of the screen. `side` is `"start"`, `"end"`, `"top"` or `"bottom"`, and follows the reading direction.
- `HoverCard`, with `HoverCardTrigger` and `HoverCardContent`: a preview of where a link leads, shown when the pointer rests on it.
- `ContextMenu`, with the same parts as `DropdownMenu`: a menu that opens on a right click, or on a long press on a touch screen.
- `Menubar`, with `MenubarMenu`, `MenubarTrigger`, `MenubarContent` and the same items as `DropdownMenu`: a row of menus for an application.
- `NavigationMenu`, with `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent` and `NavigationMenuLink`: a row of links for a site's header, where some entries open a panel of more links.
- `Breadcrumb`, with `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` and `BreadcrumbEllipsis`.
- `Pagination`, with `PaginationList`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext` and `PaginationEllipsis`, and a function, `paginationRange`, that works out which page numbers to show.

Each has variables of its own. An alert dialog doesn't read `--nuv-dialog-*`, and a context menu doesn't read `--nuv-dropdown-menu-*`.

Three things differ from the Radix primitives underneath:

- A click on a `NavigationMenuTrigger` whose panel the pointer has just opened leaves the panel open. Radix closes it there.
- A menu in a `Menubar` has no exit animation. With one, moving to the next menu closed the whole bar.
- A tap on a `HoverCardTrigger` no longer makes Chrome log "Unable to preventDefault inside passive event listener invocation".

Added to an existing component:

- `DropdownMenuShortcut`: the keys that do the same as an item, shown at the end of its row. `ContextMenu` and `Menubar` have the same part. It's hidden from screen readers, so set `aria-keyshortcuts` on the item as well.

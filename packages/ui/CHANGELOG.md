# @nuvui/react

## 0.1.1

### Patch Changes

- [#26](https://github.com/Nuvraxis/nuvui/pull/26) [`3e9922d`](https://github.com/Nuvraxis/nuvui/commit/3e9922d8100e8fba75ae5cc354d8d79fb00bfdf1) Thanks [@sajanv88](https://github.com/sajanv88)! - Each package's README said the package hadn't been released and that the docs would live at nuvui.nuvraxis.com. It now gives the install command and links to the docs, which are there.

## 0.1.0

### Minor Changes

- [#18](https://github.com/Nuvraxis/nuvui/pull/18) [`96ea5b0`](https://github.com/Nuvraxis/nuvui/commit/96ea5b066337f2af55990c7c1ab5d2b6167c689d) Thanks [@sajanv88](https://github.com/sajanv88)! - A pass over the names before they're frozen.
  
  - `asChild` is no longer in the types of a part that puts something of its own beside its children, where it could never work: `DialogContent`, `SheetContent`, `PopoverContent`, `TooltipContent`, `SelectTrigger`, `SelectContent`, `SelectItem`, `Checkbox`, `Switch`, `RadioGroupItem`, `Slider`, `Progress`, `ScrollArea`, `OtpField`, `AccordionTrigger`, `AccordionContent`, `NavigationMenu`, `NavigationMenuTrigger`, the checkbox items, radio items and submenu triggers of the three menus, and the parts of `Combobox` and `Command` that hold a list or a status.
  - `Slider`'s `valueText` is now `getValueLabel`, the name `Progress` has for the same thing.
  - A menu item's plain `intent` is `"neutral"`, as on `Badge` and a toast. It was `"default"`. This is on `DropdownMenuItem`, `ContextMenuItem` and `MenubarItem`.
  - A toast takes the intents `"info"` and `"warning"`, as `Alert` does. A warning toast interrupts a screen reader, as a danger toast and a warning alert do.

- [#8](https://github.com/Nuvraxis/nuvui/pull/8) [`f1888c3`](https://github.com/Nuvraxis/nuvui/commit/f1888c3dd1ae3d577a019a5e90736cddbbbea98e) Thanks [@sajanv88](https://github.com/sajanv88)! - Three components built from the others: a combobox, a command list and a sidebar.
  
  - `Combobox`, with `ComboboxTrigger`, `ComboboxValue`, `ComboboxContent`, `ComboboxItem`, `ComboboxGroup`, `ComboboxSeparator`, `ComboboxEmpty` and `ComboboxLoading`: a select with a search field. It holds one value, or several with `multiple`, and sends them with a form when it has a `name`. An option stays while its text contains what was typed, whatever the case and the accents, and `filter` changes that. `comboboxFilter` is the default one.
  - `Command`, with `CommandInput`, `CommandList`, `CommandItem`, `CommandGroup`, `CommandSeparator`, `CommandShortcut`, `CommandEmpty` and `CommandLoading`: a search field over a list of commands. `CommandDialog` puts it in a dialog, and its `shortcut` opens and closes it with Ctrl or Command and a letter.
  - `Sidebar`, with `SidebarProvider`, `SidebarMain`, `SidebarTrigger`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarSeparator`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuBadge`, `SidebarMenuSub`, `SidebarMenuSubItem` and `SidebarMenuSubButton`, and the `useSidebar` hook. It collapses to a strip of icons or off the screen, is a panel over the page below the `md` breakpoint, and remembers its state in a cookie named `nuv-sidebar`. Ctrl+B or Command+B collapses and expands it.
  
  Combobox and Command use [cmdk](https://github.com/pacocoursey/cmdk) 1.1.1 for the list and its filtering, which is a new dependency. Three things differ from cmdk on its own:
  
  - The search field's `aria-activedescendant` always names the active option. cmdk leaves it empty until an arrow key is pressed, and after a letter is erased it names the wrong option.
  - The separator is decoration, hidden from screen readers. cmdk's has `role="separator"`, which a list of options isn't allowed to hold.
  - "No results" and "Loading" are put in a status region next to the list, so a screen reader says them.
  
  `@radix-ui/react-use-controllable-state` is a direct dependency now. It was already installed through the other Radix packages.

- [#7](https://github.com/Nuvraxis/nuvui/pull/7) [`593695e`](https://github.com/Nuvraxis/nuvui/commit/593695e160e11aa9dd63d6f47ce4cdb4093ac63e) Thanks [@sajanv88](https://github.com/sajanv88)! - Fifteen components for display and layout, and a provider for right-to-left apps.
  
  - `Card`, with `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent` and `CardFooter`.
  - `Badge`: a short label, with `intent` and a `variant` of `"solid"` or `"outline"`.
  - `Alert`, with `AlertTitle`, `AlertDescription` and `AlertActions`: a message in the page, with an icon for each `intent`. `warning` and `danger` have `role="alert"`, and `info` and `success` have `role="status"`.
  - `Avatar`, with `AvatarImage`, `AvatarFallback` and `AvatarGroup`.
  - `Empty`, with `EmptyMedia`, `EmptyTitle`, `EmptyDescription` and `EmptyActions`: what a screen shows when there's nothing to list.
  - `Skeleton`: a placeholder for content that's loading, as a block, a line of text or a circle.
  - `Spinner`: a status with a label for screen readers. With an empty label it's decoration.
  - `Progress`: a bar for a known amount, or a moving one when `value` is left out.
  - `Kbd`: a key on the keyboard.
  - `Separator`: a line, across or upright. It's decorative unless told otherwise, which is the opposite of the Radix primitive's default.
  - `AspectRatio`: a box that keeps its shape. The ratio is a prop, or a CSS variable that a media query can change.
  - `Collapsible`, with `CollapsibleTrigger` and `CollapsibleContent`.
  - `ScrollArea`: a box that scrolls, with a scrollbar drawn the same everywhere. It shows the scrollbar whenever there's something to scroll, and it's a tab stop with a name while nothing inside it can take focus.
  - `Toolbar`, with `ToolbarButton`, `ToolbarLink`, `ToolbarSeparator`, `ToolbarToggleGroup` and `ToolbarToggleItem`. A toggle group inside it is a group and not a second toolbar.
  - `VisuallyHidden`: text for screen readers. With `focusable` it shows while it has focus, for a skip link.
  - `DirectionProvider` and `useDirection`, also at `@nuvui/react/direction`. The styles follow the `dir` attribute by themselves. The provider is what makes the arrow keys, sliders and submenus follow it too.
  
  `AspectRatio` and `VisuallyHidden` are plain CSS and don't use the Radix primitives of the same name.
  
  The Radix packages are all moved to their current releases. The two that are pinned, behind `OtpField` and `PasswordInput`, are now 0.1.17 and 0.1.12.

- [`4fd9569`](https://github.com/Nuvraxis/nuvui/commit/4fd9569dd181fb77194aebdcca84ed76247d0884) Thanks [@sajanv88](https://github.com/sajanv88)! - First components, along with the design tokens and base styles they're built on: Accordion, Button, Checkbox, Dialog, DropdownMenu, Popover, Select, Switch, Tabs, Toast and Tooltip.
  
  Toast comes with a `toast()` function that can be called from any client component, and a `Toaster` that shows what it sends.

- [#4](https://github.com/Nuvraxis/nuvui/pull/4) [`28459a2`](https://github.com/Nuvraxis/nuvui/commit/28459a2bb5bbab719610be3a7cdd95078bae10c7) Thanks [@sajanv88](https://github.com/sajanv88)! - Fifteen components for forms.
  
  - `Label`, `Input`, `Textarea` and `NativeSelect`: the browser's own elements with the library's styles. `Textarea` has `autoResize`, which grows it with its text.
  - `Field`, with `FieldLabel`, `FieldControl`, `FieldDescription` and `FieldError`: ties a label, a hint and an error message to any control, with the ids and ARIA attributes filled in. It takes its error from you, so it works with any form library.
  - `Fieldset` and `FieldsetLegend`: a named group of fields.
  - `InputGroup`, with `InputGroupAddon` and `InputGroupButton`: text, icons and small buttons inside an input's box.
  - `PasswordInput`: a password field with a button that shows what was typed.
  - `OtpField`: a row of boxes for a one-time code.
  - `RadioGroup` and `RadioGroupItem`.
  - `Slider`, with one handle or several.
  - `Toggle`, and `ToggleGroup` with `ToggleGroupItem`.
  - `ButtonGroup`: joins buttons, inputs and select triggers into one strip.
  - `FileUpload`: a drop area around a file input, with a list of the chosen files and limits on type, size and count.
  
  `PasswordInput` and `OtpField` wrap Radix primitives that are still at version 0.1. The package pins those two to an exact version.
  
  Changed in existing components:
  
  - Button, Checkbox, Switch and the Select trigger now fade when the browser disables them, as it does inside a `<fieldset disabled>`. Before, only their own `disabled` prop did.
  - `SelectTrigger` no longer passes a `required` prop on to its button, which has no such attribute. Set `required` on `Select`.

- [#5](https://github.com/Nuvraxis/nuvui/pull/5) [`803ca37`](https://github.com/Nuvraxis/nuvui/commit/803ca371a159e47e0b883445e25a351bcb84ee7b) Thanks [@sajanv88](https://github.com/sajanv88)! - Eight components for overlays, menus and navigation.
  
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

- [`e4fef87`](https://github.com/Nuvraxis/nuvui/commit/e4fef8740a1021d9f55c3ddf049412b44cb4c557) Thanks [@sajanv88](https://github.com/sajanv88)! - Five presets ship as `@nuvui/react/themes/<name>.css`: `ink`, `ledger`, `meadow`, `ember` and `high-contrast`. Import one and put `data-preset="<name>"` on `<html>` or on any element. Each sets every semantic color for light and dark, the radius scale and a density. Presets and `data-theme` can be nested in any order.
  
  Density: `data-density="compact"`, `"default"` or `"comfortable"` sets how tall controls are with a mouse or trackpad. Touch screens keep their 44 pixel targets at every density.
  
  New tokens: `--nuv-border-width`, `--nuv-disabled-opacity`, `--nuv-touch-size`, `--nuv-control-height-sm`, `-md` and `-lg`, and eight chart colors, `--color-chart-1` to `--color-chart-8`. The components now read these where they had fixed values, so the defaults look the same and each can be changed in one place. `--nuv-light` and `--nuv-dark` are two switches for writing a value that holds both modes.
  
  New component variables: `--nuv-tabs-indicator-width` and `--nuv-toast-accent-width`.
  
  A primary or danger button now moves away from its text color on hover: darker under white text, lighter under dark text. In the default theme that looks as it did. With a primary color that takes dark text, such as orange, hovering used to make the text harder to read.

- [#3](https://github.com/Nuvraxis/nuvui/pull/3) [`e47ff84`](https://github.com/Nuvraxis/nuvui/commit/e47ff846062fb1a742ff56d4021a06a8a5eebbc5) Thanks [@sajanv88](https://github.com/sajanv88)! - Toast shows three toasts at a time and holds the rest back until one closes. `Toaster` has a `limit` prop to change the number.
  
  Dialog has two new parts, `DialogHeader` and `DialogBody`. With a body, the title and the buttons stay in view while the content scrolls.
  
  Popover can draw an arrow that points at its trigger, with `showArrow`. Its content now sits inside a `nuv-popover__body` element, which has the padding and does the scrolling.
  
  A dialog body or a popover that scrolls, and has nothing inside that takes focus, becomes a tab stop so it can be scrolled from the keyboard.

### Patch Changes

- [#11](https://github.com/Nuvraxis/nuvui/pull/11) [`c59eabf`](https://github.com/Nuvraxis/nuvui/commit/c59eabfef3028bd4d4a0417ca88dc88d978f706d) Thanks [@sajanv88](https://github.com/sajanv88)! - `Select` has a new variable, `--nuv-select-content-max-height`, for the most height its list takes before it scrolls. The list still never goes past the room on the screen.

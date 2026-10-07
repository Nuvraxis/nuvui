---
"@nuvui/react": minor
---

Three components built from the others: a combobox, a command list and a sidebar.

- `Combobox`, with `ComboboxTrigger`, `ComboboxValue`, `ComboboxContent`, `ComboboxItem`, `ComboboxGroup`, `ComboboxSeparator`, `ComboboxEmpty` and `ComboboxLoading`: a select with a search field. It holds one value, or several with `multiple`, and sends them with a form when it has a `name`. An option stays while its text contains what was typed, whatever the case and the accents, and `filter` changes that. `comboboxFilter` is the default one.
- `Command`, with `CommandInput`, `CommandList`, `CommandItem`, `CommandGroup`, `CommandSeparator`, `CommandShortcut`, `CommandEmpty` and `CommandLoading`: a search field over a list of commands. `CommandDialog` puts it in a dialog, and its `shortcut` opens and closes it with Ctrl or Command and a letter.
- `Sidebar`, with `SidebarProvider`, `SidebarMain`, `SidebarTrigger`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarSeparator`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuBadge`, `SidebarMenuSub`, `SidebarMenuSubItem` and `SidebarMenuSubButton`, and the `useSidebar` hook. It collapses to a strip of icons or off the screen, is a panel over the page below the `md` breakpoint, and remembers its state in a cookie named `nuv-sidebar`. Ctrl+B or Command+B collapses and expands it.

Combobox and Command use [cmdk](https://github.com/pacocoursey/cmdk) 1.1.1 for the list and its filtering, which is a new dependency. Three things differ from cmdk on its own:

- The search field's `aria-activedescendant` always names the active option. cmdk leaves it empty until an arrow key is pressed, and after a letter is erased it names the wrong option.
- The separator is decoration, hidden from screen readers. cmdk's has `role="separator"`, which a list of options isn't allowed to hold.
- "No results" and "Loading" are put in a status region next to the list, so a screen reader says them.

`@radix-ui/react-use-controllable-state` is a direct dependency now. It was already installed through the other Radix packages.

---
"@nuvui/react": minor
---

A pass over the names before they're frozen.

- `asChild` is no longer in the types of a part that puts something of its own beside its children, where it could never work: `DialogContent`, `SheetContent`, `PopoverContent`, `TooltipContent`, `SelectTrigger`, `SelectContent`, `SelectItem`, `Checkbox`, `Switch`, `RadioGroupItem`, `Slider`, `Progress`, `ScrollArea`, `OtpField`, `AccordionTrigger`, `AccordionContent`, `NavigationMenu`, `NavigationMenuTrigger`, the checkbox items, radio items and submenu triggers of the three menus, and the parts of `Combobox` and `Command` that hold a list or a status.
- `Slider`'s `valueText` is now `getValueLabel`, the name `Progress` has for the same thing.
- A menu item's plain `intent` is `"neutral"`, as on `Badge` and a toast. It was `"default"`. This is on `DropdownMenuItem`, `ContextMenuItem` and `MenubarItem`.
- A toast takes the intents `"info"` and `"warning"`, as `Alert` does. A warning toast interrupts a screen reader, as a danger toast and a warning alert do.

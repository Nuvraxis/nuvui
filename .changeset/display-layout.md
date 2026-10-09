---
"@nuvui/react": minor
---

Fifteen components for display and layout, and a provider for right-to-left apps.

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

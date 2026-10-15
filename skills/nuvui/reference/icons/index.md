<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/icons/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Icons

The @nuvui/icons package. 317 line icons drawn for nuvui, in three styles, each a React component in the color of the text around it and an SVG file.

`@nuvui/icons` is a set of 317 line icons drawn for this library, on a 24 pixel grid, in three styles. Each one is a React component and an SVG file. They're MIT licensed like the rest of nuvui: they were drawn for it, and none was traced or adapted from another set.

The components in `@nuvui/react` don't use this package. They draw their few icons themselves, so the core doesn't depend on it, and you install it only if you want the icons.

## Install

```sh
pnpm add @nuvui/icons
```

It needs React and nothing else. There's no stylesheet to import, and it works without `@nuvui/react`.

## Use an icon

```tsx
import { Button } from "@nuvui/react";
import { ArrowRightIcon } from "@nuvui/icons";

export function Next() {
  return (
    <Button>
      Next <ArrowRightIcon size={16} />
    </Button>
  );
}
```

Every icon's name is its name in the set, written as a component, with `Icon` at the end: `arrow-right` is `ArrowRightIcon`, and `map` is `MapIcon`. That's its only name. A bare `Map` or `Image` would hide JavaScript's own in the file that imports it.

## Three styles

| Style | Import from | How it's drawn |
| --- | --- | --- |
| Standard | `@nuvui/icons` | Round ends, sharp corners. |
| Rounded | `@nuvui/icons/rounded` | Round ends, and corners rounded by 1.5 pixels, or 0.5 on icons that come to a point. |
| Sharp | `@nuvui/icons/sharp` | Square ends and mitered corners. |

The three have the same icons by the same names, so a style is changed by changing where the imports come from. Pick one for an app: icons in two styles side by side look like a mistake.

Rounded and Standard only differ at a corner where two lines meet. An icon without one, such as an arrow whose head meets its shaft at the point, is the same drawing in both.

## Size and color

An icon is 24 pixels square unless `size` says otherwise. A number is pixels, and a string is any CSS length, so `size="1em"` follows the text's size.

The line is the color of the text around it (`currentColor`), so an icon in a button or a link takes that color, in every theme, on hover and when disabled. No color is written into an icon.

The line is 1.5 units thick on the 24 unit grid, and it grows and shrinks with the icon. At 16 pixels it's a pixel wide. `strokeWidth` changes it, in the same units.

Where the browser forces its own colors, as Windows' contrast themes do, the text's color is forced and the icon follows it.

## For screen readers

An icon is hidden from screen readers unless it's given a name, which is right for one beside words that say the same thing. Give it a `title` when nothing else says what it means:

```tsx
<ArrowRightIcon title="Next page" />
```

With a `title` or an `aria-label`, the icon is announced as a picture by that name. A `title` becomes the icon's `aria-label` as well as its tooltip, since Safari doesn't take a picture's name from its `<title>`. An icon alone in a button is better left hidden and the button named instead, with `aria-label` on the button, since it's the button that's pressed.

## In a right-to-left layout

An icon is drawn the same way in either direction. One that points the way of reading, such as an arrow for "next", has to be turned around on a right-to-left page. A clock or a check mark doesn't. Whether an arrow points the way of reading depends on what it means where it's used, so that's left to you, with a selector on the `dir` attribute:

```css
[dir="rtl"] .next-icon {
  transform: scaleX(-1);
}
```

[Right-to-left](../right-to-left.md) has the rest, and the SCSS mixin that writes that selector.

## In a server component

Icons have no state and no `"use client"`. A server component renders them as markup, and no script is sent for them.

## What gets bundled

Each icon is a module of its own, and the package says it has no side effects, so a bundler leaves out every icon a page doesn't import. One icon is under half a kilobyte, compressed.

Without that pruning, in a development server, importing from the package loads all 317. Next.js prunes during development too for packages listed in `experimental.optimizePackageImports`:

```js title="next.config.mjs"
export default {
  experimental: {
    optimizePackageImports: ["@nuvui/icons"],
  },
};
```

## An icon of your own

`createIcon` makes a component that's drawn and behaves the way the set's own are, from shapes on the same 24 unit grid:

```tsx
import { createIcon } from "@nuvui/icons";

export const FrameIcon = createIcon("FrameIcon", "standard", [
  ["rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }],
]);
```

The first argument names it in React's developer tools. The second is the style whose ends and corners it takes.

## SVG files and the list of icons

Every icon also ships as an SVG file, for an email, a slide or a page that isn't React: `@nuvui/icons/svg/standard/arrow-right.svg`, with `rounded` and `sharp` beside `standard`. The files draw in `currentColor` too, which is black where nothing sets a color.

`@nuvui/icons/manifest.json` lists every icon's name, its component's name and its category. The grid below is built from it.

## All the icons

| Category | Icons |
| --- | --- |
| Arrows | `ArrowRightIcon`, `ArrowLeftIcon`, `ArrowUpIcon`, `ArrowDownIcon`, `ArrowUpRightIcon`, `ArrowUpLeftIcon`, `ArrowDownRightIcon`, `ArrowDownLeftIcon`, `ChevronRightIcon`, `ChevronLeftIcon`, `ChevronUpIcon`, `ChevronDownIcon`, `ChevronsRightIcon`, `ChevronsLeftIcon`, `ChevronsUpIcon`, `ChevronsDownIcon`, `ArrowLeftRightIcon`, `ArrowUpDownIcon`, `RotateCwIcon`, `RotateCcwIcon`, `UndoIcon`, `RedoIcon`, `CornerDownRightIcon`, `ExpandIcon`, `CollapseIcon`, `MoveIcon` |
| Navigation | `MenuIcon`, `CloseIcon`, `HomeIcon`, `SearchIcon`, `MoreHorizontalIcon`, `MoreVerticalIcon`, `GridIcon`, `ListIcon`, `SidebarIcon`, `LayoutDashboardIcon`, `ExternalLinkIcon`, `FilterIcon`, `LogOutIcon`, `LogInIcon`, `MaximizeIcon`, `PlusIcon`, `MinusIcon`, `SlidersIcon`, `CheckIcon` |
| Actions | `EditIcon`, `TrashIcon`, `CopyIcon`, `ClipboardIcon`, `SaveIcon`, `DownloadIcon`, `UploadIcon`, `ShareIcon`, `PinIcon`, `LockIcon`, `UnlockIcon`, `EyeIcon`, `EyeOffIcon`, `BookmarkIcon`, `StarIcon`, `HeartIcon`, `FlagIcon`, `BellIcon`, `BellOffIcon`, `RefreshIcon`, `LinkIcon`, `SettingsIcon`, `ZoomInIcon`, `ZoomOutIcon`, `PrintIcon`, `SendIcon`, `ReplyIcon`, `ForwardIcon`, `ArchiveIcon`, `InboxIcon`, `TagIcon`, `PlusCircleIcon`, `MinusCircleIcon`, `XCircleIcon`, `CheckCircleIcon`, `GripVerticalIcon`, `PowerIcon`, `PaperclipIcon` |
| Files & media | `FileIcon`, `FileTextIcon`, `FilePlusIcon`, `FileMinusIcon`, `FileCheckIcon`, `FileXIcon`, `FileCodeIcon`, `FolderIcon`, `FolderOpenIcon`, `FolderPlusIcon`, `FolderMinusIcon`, `ImageIcon`, `CameraIcon`, `VideoIcon`, `PlayIcon`, `PauseIcon`, `StopIcon`, `SkipForwardIcon`, `SkipBackIcon`, `FastForwardIcon`, `RewindIcon`, `VolumeIcon`, `VolumeXIcon`, `MicIcon`, `MicOffIcon`, `MusicIcon`, `CloudIcon`, `CloudDownloadIcon`, `CloudUploadIcon`, `FilmIcon`, `HeadphonesIcon`, `ShuffleIcon`, `RepeatIcon`, `DiscIcon`, `SpeakerIcon` |
| Status | `InfoIcon`, `HelpCircleIcon`, `AlertCircleIcon`, `AlertTriangleIcon`, `AlertOctagonIcon`, `XOctagonIcon`, `BanIcon`, `LoaderIcon`, `ClockIcon`, `CalendarIcon`, `CalendarCheckIcon`, `TimerIcon`, `ShieldIcon`, `ShieldCheckIcon`, `ShieldAlertIcon`, `ActivityIcon`, `ZapIcon`, `CircleIcon`, `SquareIcon`, `TriangleIcon`, `HexagonIcon`, `OctagonIcon`, `DiamondIcon`, `WifiIcon`, `WifiOffIcon`, `BatteryIcon`, `BatteryChargingIcon`, `ThumbsUpIcon`, `ThumbsDownIcon`, `HourglassIcon`, `LightbulbIcon`, `CheckSquareIcon`, `XSquareIcon`, `MinusSquareIcon` |
| Communication | `MailIcon`, `MailOpenIcon`, `MessageCircleIcon`, `MessageSquareIcon`, `PhoneIcon`, `PhoneCallIcon`, `AtSignIcon`, `UserIcon`, `UsersIcon`, `UserPlusIcon`, `UserMinusIcon`, `UserCheckIcon`, `UserXIcon`, `HashIcon`, `SmileIcon`, `FrownIcon`, `MehIcon`, `MegaphoneIcon`, `RssIcon`, `GlobeIcon`, `IdCardIcon`, `LaughIcon`, `WinkIcon`, `SurprisedIcon`, `AngryIcon`, `SleepyIcon`, `HeartEyesIcon`, `CoolIcon`, `EmojiPickerIcon` |
| Commerce | `ShoppingCartIcon`, `ShoppingBagIcon`, `CreditCardIcon`, `DollarSignIcon`, `EuroSignIcon`, `PercentIcon`, `GiftIcon`, `PackageIcon`, `TruckIcon`, `ReceiptIcon`, `WalletIcon`, `StoreIcon`, `BanknoteIcon`, `CoinsIcon`, `BarcodeIcon`, `QrCodeIcon`, `ScaleIcon`, `BuildingIcon`, `BriefcaseIcon` |
| Data & charts | `BarChartIcon`, `BarChartHorizontalIcon`, `LineChartIcon`, `AreaChartIcon`, `PieChartIcon`, `DonutChartIcon`, `TrendingUpIcon`, `TrendingDownIcon`, `DatabaseIcon`, `ServerIcon`, `TableIcon`, `ColumnsIcon`, `RowsIcon`, `LayersIcon`, `SortAscIcon`, `SortDescIcon`, `SigmaIcon`, `GaugeIcon`, `ScatterChartIcon`, `KanbanIcon`, `CalculatorIcon`, `NetworkIcon`, `WorkflowIcon`, `FilterXIcon`, `FilterPlusIcon`, `FilterCheckIcon`, `FilterActiveIcon`, `FilterOffIcon`, `FilterListIcon`, `SearchFilterIcon`, `TableFilterIcon`, `SlidersVerticalIcon` |
| Developer | `CodeIcon`, `CodeSlashIcon`, `TerminalIcon`, `TerminalWindowIcon`, `GitBranchIcon`, `GitCommitIcon`, `GitMergeIcon`, `GitPullRequestIcon`, `CpuIcon`, `HardDriveIcon`, `BugIcon`, `BracesIcon`, `BracketsIcon`, `KeyboardIcon`, `MonitorIcon`, `SmartphoneIcon`, `TabletIcon`, `LaptopIcon`, `KeyIcon`, `RocketIcon`, `PlugIcon`, `ScanLineIcon`, `FlaskIcon`, `BotIcon`, `SparklesIcon`, `GitForkIcon`, `GitCompareIcon`, `GitGraphIcon`, `GitCherryPickIcon`, `GitStashIcon`, `DiffIcon`, `RepositoryIcon`, `IssueOpenIcon`, `IssueClosedIcon`, `GitPullRequestDraftIcon`, `GitPullRequestClosedIcon` |
| Text editing | `BoldIcon`, `ItalicIcon`, `UnderlineIcon`, `StrikethroughIcon`, `AlignLeftIcon`, `AlignCenterIcon`, `AlignRightIcon`, `AlignJustifyIcon`, `ListChecksIcon`, `HeadingIcon`, `QuoteIcon`, `TypeIcon`, `IndentIcon`, `OutdentIcon`, `TextCursorIcon`, `PilcrowIcon`, `EraserIcon`, `SpellCheckIcon`, `WrapTextIcon`, `RemoveFormattingIcon` |
| Objects | `MapPinIcon`, `MapIcon`, `CompassIcon`, `NavigationIcon`, `PaletteIcon`, `DropletIcon`, `ThermometerIcon`, `FlameIcon`, `LeafIcon`, `AwardIcon`, `TrophyIcon`, `CrownIcon`, `UmbrellaIcon`, `CoffeeIcon`, `CarIcon`, `AnchorIcon`, `ScissorsIcon`, `TargetIcon`, `CrosshairIcon`, `LanguagesIcon`, `AccessibilityIcon`, `GemIcon`, `GraduationCapIcon`, `BookIcon`, `BookOpenIcon`, `WatchIcon`, `UtensilsIcon`, `SunIcon`, `MoonIcon` |

## Props

Each icon takes these, and anything an `<svg>` element takes. Its `ref` is the `<svg>`.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `size` | `string \| number` | `24` | Width and height. A number is in pixels. |
| `strokeWidth` | `string \| number` | `1.5` | How thick the lines are, in the units of the 24 by 24 grid the icon is drawn on, so it grows and shrinks with `size`. |
| `title` | `string` |  | What the icon means, for a screen reader, when nothing next to it says so. Without it, or an `aria-label`, the icon is hidden from screen readers, which is right for one beside text that says the same. |

## The Figma file

The icons are drawn in Figma, and the file is yours to download: [NuvUI_Icons_Figma_File.fig](https://nuvui.nuvraxis.com/docs/NuvUI_Icons_Figma_File.fig). Import it from Figma's file browser, or drag it in. Each icon is a component with a variant for each style, so a design made with them uses the same icons, by the same names, as the code. It's MIT licensed like the package.

The download is a copy, saved when the icons last changed. It has the icons and nothing else of the file's: no comments and no version history.

## Where they come from

The icons are drawn in a Figma file, one component for each with a variant for each style. A script in the repository exports them as SVG, makes every file the same, and fails if one breaks the set's rules: a size other than 24 by 24, a color other than the set's ink, or a name that isn't lower case words joined by hyphens. The SVG files are committed, and the components are generated from them when the package is built.

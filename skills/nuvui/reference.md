<!-- Written by apps/docs/scripts/agent-skill.mjs from the docs' pages. Don't edit it here: run `pnpm skill`. -->

# Reference

A file for each page of the docs. Read the one for a component before using it: its parts, its props, a working example of each thing it does, what it handles for accessibility and what it leaves to you.

## Guides

- [Getting started](reference/index.md): Install nuvui, load its stylesheet once, and render your first component.
- [Theming and tokens](reference/theming.md): How nuvui's design tokens are layered, the presets that ship with it, density, how to override tokens for a site, a section or one component, and a live editor to try changes in.
- [Using with Tailwind](reference/tailwind.md): Run nuvui next to Tailwind CSS v4. Set the cascade layer order, turn the semantic colors into utilities, and decide whose theme values win.
- [Using with SCSS](reference/scss.md): Load nuvui's Sass mixins into your own stylesheets, change the breakpoints, and see which build tools resolve the package's SCSS entry.
- [Forms](reference/forms.md): Build a form from nuvui's fields, validate it with the browser or with React Hook Form, and show errors that a screen reader reads with the control.
- [Right-to-left](reference/right-to-left.md): Use nuvui in Arabic, Hebrew, Persian and other languages that read from the right, with the dir attribute and DirectionProvider.
- [Translation](reference/translation.md): Every piece of text nuvui writes by itself, such as "Close" and "Loading", with the prop that changes each one. A list for translators, taken from the components' own types.
- [Support policy](reference/support.md): Which versions of React, Node and browsers nuvui works with, which of those are tested, how versions are numbered, and what a fix in a supported setup means.
- [Content Security Policy](reference/content-security-policy.md): The policy a site with a strict Content Security Policy needs for nuvui, what each line is for, and what breaks without it.

## @nuvui/react: components

- [Accordion](reference/components/accordion.md): A stack of headings that each open a panel of content below them.
- [ActionBar](reference/components/action-bar.md): A bar that appears while something is selected, with what can be done to it, and tells a screen reader how much is selected.
- [Alert](reference/components/alert.md): A message that sits in the page, with an icon and a color that say what kind of message it is.
- [Alert dialog](reference/components/alert-dialog.md): A dialog that stops everything to ask one question, with a button to go ahead and a button to back out.
- [AnimatedNumber](reference/components/animated-number.md): A number that moves to its new value. The digits that change roll like a counter or pop in, and the rest stay still. It's still for anyone who asked for less motion.
- [AspectRatio](reference/components/aspect-ratio.md): A box that keeps its shape at any width, for pictures, videos, maps and anything else that loads late.
- [Avatar](reference/components/avatar.md): A small picture of a person or a thing, with initials or an icon in its place when there's no picture.
- [Badge](reference/components/badge.md): A short label that says what state something is in, or how many of something there are.
- [Breadcrumb](reference/components/breadcrumb.md): A trail of links that shows where the current page sits in a site, from the top level down.
- [Button](reference/components/button.md): A button with four intents and three sizes. It can also lend its styles to a link.
- [ButtonGroup](reference/components/button-group.md): Joins buttons, and the inputs or selects next to them, into one strip with shared edges.
- [Card](reference/components/card.md): A box with an edge that groups a title, some content and the actions that go with them.
- [Carousel](reference/components/carousel.md): Slides to move through by dragging or with buttons, with dots or thumbnails to go straight to one.
- [Checkbox](reference/components/checkbox.md): A box that's checked, unchecked or partly checked. It works with a label and submits with a form.
- [ChoiceCard](reference/components/choice-card.md): A checkbox or a radio button drawn as a card, with room for a title and a description, where the whole card can be pressed.
- [Collapsible](reference/components/collapsible.md): A button that shows and hides a piece of content below it.
- [ColorPicker](reference/components/color-picker.md): Picks a color with an area and a hue slider, a field to type into, and presets.
- [Combobox](reference/components/combobox.md): A select with a search field. It holds one value or several, filters as you type, and works with a label, the keyboard and forms.
- [Command](reference/components/command.md): A search field over a list of commands that filters as you type, in the page or in a dialog opened with a shortcut.
- [Compare](reference/components/compare.md): Two pictures of the same thing, before and after, in one box. A divider dragged by its handle shows part of each, or a switch shows one at a time.
- [Confetti](reference/components/confetti.md): A burst of confetti from an element, for a moment worth marking, such as a first sale or a finished setup. The pieces fall back and rest on the element. It's decoration, and isn't thrown for anyone who asked for less motion.
- [Context menu](reference/components/context-menu.md): A menu of actions that opens where someone right-clicks, or presses and holds on a touch screen.
- [Dialog](reference/components/dialog.md): A modal window that takes over the page until it's closed. A sheet on phones, centered on larger screens.
- [Dropdown menu](reference/components/dropdown-menu.md): A menu of actions that opens from a button, with keyboard navigation, checkable items and submenus.
- [Empty](reference/components/empty.md): What a list, a table or a search shows when it has nothing in it, with a way to get something into it.
- [Field](reference/components/field.md): Ties a label, a hint and an error message to a form control, with the ids and ARIA attributes a screen reader needs.
- [Fieldset](reference/components/fieldset.md): Groups related form controls under one heading that screen readers read with the group.
- [FileUpload](reference/components/file-upload.md): A drop area around the browser's own file input, with a list of the chosen files. It submits with a form like any file input.
- [FormattedNumber](reference/components/formatted-number.md): A number written the way a language and region write it, as plain digits, a currency, a percentage or a short form.
- [HoldToConfirm](reference/components/hold-to-confirm.md): A button that acts only after it's been held down, with the wait drawn along its edge, for things that can't be undone.
- [HoloCard](reference/components/holo-card.md): A 3D tilting card with a pointer-tracked holographic glare and texture overlay, built for membership cards, passes, and collectibles.
- [Hover card](reference/components/hover-card.md): A card with a preview of where a link leads, shown when the pointer rests on the link. It doesn't appear on touch screens.
- [ImageZoom](reference/components/image-zoom.md): A picture that's drawn larger where it's pointed at. A mouse zooms in by resting on it or with a click, a tap zooms in where the finger is, and a button in its corner does the same from the keyboard.
- [Input](reference/components/input.md): A one-line text field. It's the browser's own input with the library's styles, so every type and attribute works.
- [InputGroup](reference/components/input-group.md): An input with text, an icon or a small button inside the same box, before or after what's typed.
- [Item](reference/components/item.md): A row with a picture, a title, a description and something to do at its end, and a list that groups rows into a panel.
- [Kbd](reference/components/kbd.md): A key on the keyboard, drawn as a key cap, for writing out shortcuts.
- [Label](reference/components/label.md): The text that names a form control. A click on it goes to the control, and a double click doesn't select its words.
- [ListView](reference/components/list-view.md): A list whose rows can be selected and can each hold buttons, moved through with the arrow keys.
- [Menubar](reference/components/menubar.md): A row of menus across the top of an application, like the File, Edit and View of a desktop program.
- [NativeSelect](reference/components/native-select.md): The browser's own select, styled to match the other fields. On a phone it opens the system picker.
- [Navbar](reference/components/navbar.md): The bar across the top of a site or an app, with its links in the bar on a wide screen and in a panel behind a button on a narrow one.
- [Navigation menu](reference/components/navigation-menu.md): A row of links for a site's header, where some entries open a panel with more links under them.
- [NumberField](reference/components/number-field.md): A field for a number that can be typed or stepped, with limits, a step size, and the number written for a language and region.
- [OtpField](reference/components/otp-field.md): A row of boxes for a one-time code, one character each. Typing moves along them, and a pasted code fills them all.
- [Pagination](reference/components/pagination.md): Links to the pages of a long list, with Previous and Next and a helper that works out which page numbers to show.
- [PasswordInput](reference/components/password-input.md): A password field with a button that shows what was typed and hides it again.
- [PinnedList](reference/components/pinned-list.md): A list in two groups, what's pinned at the top and the rest under it. Each item has a pin, and pressing it slides the item to the other group while the others make room.
- [Popover](reference/components/popover.md): A small panel that opens next to a button and stays until it's dismissed.
- [Progress](reference/components/progress.md): A bar that fills as a task gets done.
- [RadioGroup](reference/components/radio-group.md): A set of options where exactly one can be picked. It works with labels, the arrow keys and forms.
- [Rating](reference/components/rating.md): Stars to rate something with, or to show how it was rated, down to part of a star.
- [Resizable](reference/components/resizable.md): Panels with a handle between them to drag, side by side or one above another.
- [ScrollArea](reference/components/scroll-area.md): A box that scrolls, with a scrollbar that looks the same in every browser and on every system.
- [ScrollProgress](reference/components/scroll-progress.md): A bar that fills as the page, or a box, is scrolled, to show how far through it the reader is. It's drawn for the eye only, and still for anyone who asked for less motion.
- [Select](reference/components/select.md): A control for picking one option from a list. It works with a label, the keyboard and forms.
- [Separator](reference/components/separator.md): A thin line between two pieces of content, across or upright.
- [Sheet](reference/components/sheet.md): A panel that slides in from an edge of the screen and takes over the page until it's closed.
- [Sidebar](reference/components/sidebar.md): An app's navigation down the side of the screen. It collapses to a strip of icons, becomes a panel on a phone, and remembers how it was left.
- [Skeleton](reference/components/skeleton.md): A gray box in the shape of content that's still loading.
- [Slider](reference/components/slider.md): A handle on a track for picking a number from a range, or two handles for picking both ends of one.
- [Spinner](reference/components/spinner.md): A ring that turns while something is being done and there's no way to say how far along it is.
- [Stat](reference/components/stat.md): One figure for a dashboard, with what it counts, the number, how it changed, and room for a small chart.
- [Stepper](reference/components/stepper.md): Where someone is in a row of steps, with the ones that are done, the current one and the ones still to come, across or down.
- [Switch](reference/components/switch.md): An on and off control for a setting that takes effect right away.
- [TableOfContents](reference/components/table-of-contents.md): The headings of a page as a list of links, with the one being read marked as the page scrolls.
- [Tabs](reference/components/tabs.md): Panels of content with a row of tabs to switch between them. The row scrolls sideways when it doesn't fit the screen.
- [TextReveal](reference/components/text-reveal.md): Lines of text that rise into place one after another, for a heading that opens a page. It's still for anyone who asked for less motion, and the text is in the page from the server.
- [TextShimmer](reference/components/text-shimmer.md): Text with a highlight that moves across it, for a short wait such as "Thinking". It's still for anyone who asked for less motion.
- [Textarea](reference/components/textarea.md): A text field for several lines. It can grow with what's typed into it.
- [Timeline](reference/components/timeline.md): Events in the order they happened, each with a marker on a line, a title, a time and a description.
- [Toast](reference/components/toast.md): A brief message at the edge of the screen that goes away on its own. You show one by calling toast().
- [Toggle](reference/components/toggle.md): A button that stays pressed until it's pressed again, for turning one thing on and off.
- [ToggleGroup](reference/components/toggle-group.md): A strip of toggles that share one value. One can be pressed at a time, or several.
- [Toolbar](reference/components/toolbar.md): A row of buttons, links and toggles that the Tab key treats as one stop, with the arrow keys moving inside it.
- [Tooltip](reference/components/tooltip.md): A short line of text that appears when a control is hovered or focused. It doesn't appear on touch screens.
- [Tree](reference/components/tree.md): Rows that open to show more rows, moved through with the arrow keys, with one or many of them selected.
- [Trend](reference/components/trend.md): Which way a number moved and by how much, as an arrow, an amount and a color, with the direction in words for a screen reader.
- [VisuallyHidden](reference/components/visually-hidden.md): Text that's in the page for screen readers and drawn nowhere.

## @nuvui/date-picker

- [Dates](reference/date-picker/index.md): The @nuvui/date-picker package. A calendar, a date field and a date range field, installed next to @nuvui/react, with locales and time zones.
- [Calendar](reference/date-picker/calendar.md): A month of days to pick from. It holds one day, several days or a range, moves by keyboard, and takes a locale, a week start and a time zone.
- [DatePicker](reference/date-picker/date-picker.md): A date field you can type into, with a button that opens a calendar. It works with a label, the keyboard and plain forms, and opens as a sheet on a phone.
- [DateRangePicker](reference/date-picker/date-range-picker.md): Two date fields in one box, for the first and the last day, with one calendar that picks both. Each day can be typed, and each is submitted under its own name.

## @nuvui/table

- [Tables](reference/table/index.md): The @nuvui/table package. Styled table elements, and a data table on TanStack Table 9 with sorting, filtering, pagination, selection, pinned and resizable columns, expanding rows, a server mode and virtual rows.
- [Table](reference/table/table.md): The elements of a table, styled. A real table with a caption, column and row headings, a sticky header, a pinned column, and a box that scrolls sideways and can be reached from the keyboard.
- [DataTable](reference/table/data-table.md): A finished table from a TanStack Table instance. Headings that sort, a search field, a column chooser, checkboxes and a pagination bar, each one there when the table has the feature for it, with loading, empty and error states.
- [Sorting](reference/table/sorting.md): Sort a data table by clicking a heading. Ascending, descending and off, a sort by several columns with Shift, aria-sort on the heading, and a message read out after each sort.
- [Filtering](reference/table/filtering.md): Filter a data table with a search field over every column, a filter on one column, or both. With a debounce, a count read out for screen readers, and a way back when nothing matches.
- [Table pagination](reference/table/pagination.md): Split a data table into pages. A bar with rows per page, which rows are showing out of how many, and buttons for the first, previous, next and last page that keep keyboard focus.
- [Row selection](reference/table/row-selection.md): Select rows in a data table with a checkbox on each row and one for all of them, select a range with Shift, and act on the selection from a bar that shows while anything is selected.
- [Column visibility](reference/table/column-visibility.md): Let people choose which columns a data table shows, from a menu with a tick for each column. Columns can start hidden, and some can be kept from being hidden.
- [Column pinning](reference/table/column-pinning.md): Keep columns in view while a data table scrolls sideways. Pin to the start or the end, several to a side, with offsets that are measured for you and follow the direction of the text.
- [Column resizing](reference/table/column-resizing.md): Let people drag the edge of a data table's column to resize it, or do it from the keyboard. Columns have set widths in a fixed layout, with a least and a most.
- [Expanding rows](reference/table/expanding.md): Open a data table's row to show a panel of details under it, or the rows nested under it in a tree. With a named button that says whether the row is open.
- [Server mode](reference/table/server.md): A data table whose sorting, filtering and paging are done by your API. The table reports what's being asked for, you fetch it, and it shows what comes back, with loading and error states.
- [Virtual rows](reference/table/virtualization.md): A data table that draws only the rows in view, for thousands of rows in one scroll. Real table rows, a sticky header, keyboard focus that survives scrolling, and row counts for screen readers.
- [Coming from TanStack Table 8](reference/table/migrating.md): What changes in your table code between TanStack Table 8 and 9, for people bringing version 8 tables to @nuvui/table. The hook, features, row models, state, pinning, sizing and sorting names.

## @nuvui/charts

- [Charts](reference/charts/index.md): The @nuvui/charts package. Recharts 3 charts that take their colors from the theme, with a tooltip and a legend that match the library, pattern fills, and a table of the same numbers for screen readers.
- [ChartContainer](reference/charts/chart.md): The box a Recharts chart goes in. It sizes the chart, sets a CSS variable for each series from a config, styles the axes and grid from the tokens, and holds the legend, the patterns and a table of the same numbers.
- [Area chart](reference/charts/area.md): Area charts with Recharts' AreaChart in a ChartContainer. One series, stacked series and a gradient fill, colored from the theme.
- [Bar chart](reference/charts/bar.md): Bar charts with Recharts' BarChart in a ChartContainer. Grouped, stacked with totals, and horizontal bars, colored from the theme, with pattern fills.
- [Line chart](reference/charts/line.md): Line charts with Recharts' LineChart in a ChartContainer. Several series colored from the theme, with dashes that tell them apart without color.
- [Pie chart](reference/charts/pie.md): Pie and donut charts with Recharts' PieChart in a ChartContainer. Each slice colored and named from the config, with pattern fills and a total in the middle.
- [Radar chart](reference/charts/radar.md): Radar charts with Recharts' RadarChart in a ChartContainer. Series compared across several axes, colored from the theme, with a polar grid styled from the tokens.
- [Radial chart](reference/charts/radial.md): Radial bar charts with Recharts' RadialBarChart in a ChartContainer. Bars bent into rings, each colored and named from the config.
- [Chart tooltip](reference/charts/tooltip.md): ChartTooltip, Recharts' tooltip drawn like the library's other floating panels. It names each series from the config, shows its color or pattern, formats values, and is a live region for screen readers.
- [Composed chart](reference/charts/composed.md): Bars, lines and a target line in one chart, with Recharts' ComposedChart in a ChartContainer.
- [Scatter chart](reference/charts/scatter.md): Scatter charts with Recharts' ScatterChart in a ChartContainer. Groups of points on two number axes, colored from the theme and told apart by shape.

## @nuvui/barcodes

- [Barcodes](reference/barcodes/index.md): The @nuvui/barcodes package. Barcodes in seventeen kinds and QR codes, drawn as SVG, installed next to @nuvui/react.
- [Barcode](reference/barcodes/barcode.md): Bars for a scanner, drawn as SVG. Code 128, Code 39, EAN, UPC, ITF, MSI, Codabar and Pharmacode, with the value written underneath.
- [QRCode](reference/barcodes/qrcode.md): A QR code drawn as SVG, with four levels of error correction and room in the middle for a logo or the Swiss cross.

## @nuvui/chat

- [Chat](reference/chat/index.md): The @nuvui/chat package. The parts of a conversation with an assistant, installed next to @nuvui/react. Messages, the scrolling around them, markdown and code, the box a prompt is written in, files, sources, tool calls, reasoning and the list of past conversations.
- [Conversation](reference/chat/conversation.md): The messages of a chat in a box that scrolls. It starts at the latest message, stays there while a reply arrives, and stops following when the reader scrolls up.
- [Message](reference/chat/message.md): One message in a conversation, from the person or from the assistant, with room for a picture, a line of details and a row of actions.
- [MessageLoader](reference/chat/message-loader.md): Three dots for the wait between sending a message and the first words of the reply.
- [Markdown](reference/chat/markdown.md): A reply's markdown drawn with the library's own type. Headings, lists, tables, links and code, safe to give text a model wrote, and able to take text that's still arriving.
- [CodeBlock](reference/chat/code-block.md): Code in a box of its own, with its language over it, a button that copies it, and colors from a highlighter you plug in. One for Shiki is ready-made.
- [PromptInput](reference/chat/prompt-input.md): The box a prompt is written in. A field that grows with the text, sends on Enter, takes files, and has a row under it for buttons, with a button that sends or stops.
- [PromptSuggestion](reference/chat/prompt-suggestion.md): Prompts to start from, as buttons in a row that wraps, for a conversation with nothing in it yet.
- [Attachment](reference/chat/attachment.md): A file shown in a message or waiting in the prompt box, with its name, its size, a picture where there is one, and a button that takes it out.
- [Source](reference/chat/source.md): What a reply was drawn from. A line under the reply that says how many sources there are and opens to a numbered list of links.
- [ToolCall](reference/chat/tool-call.md): Something an assistant did, or asks to do, with a tool. A card with the tool's name and where the call stands, which opens to what was asked and what came back, and asks for approval when it needs it.
- [Reasoning](reference/chat/reasoning.md): How an assistant got to its reply. A line over the reply that opens to the steps it took, open while it works and closed once it has answered.
- [ThreadList](reference/chat/thread-list.md): The conversations someone has had, for a sidebar. A list where one is open and the others can be opened, grouped under headings, with room for buttons on each row.

## @nuvui/kanban

- [Boards](reference/kanban/index.md): The @nuvui/kanban package. A board of columns with cards that are moved between and within them with a mouse, a finger or the keyboard, installed next to @nuvui/react.
- [Kanban](reference/kanban/kanban.md): A board of columns with cards that are moved between and within them. A mouse drags a card, a finger holds it and then drags, and the keyboard moves it from its handle. Every move is read out.

## @nuvui/editor

- [Editor](reference/editor/index.md): The @nuvui/editor package. A rich text editor on Tiptap, installed next to @nuvui/react, with a toolbar, a menu on the selection, links, a character count, and HTML as its value.
- [RichTextEditor](reference/editor/rich-text-editor.md): A box to write formatted text in. Bold and italic, headings, lists, quotes, code and links, from a toolbar, from the keyboard, or from a small menu over selected text. Its value is HTML.

## @nuvui/emoji

- [Emoji](reference/emoji/index.md): The @nuvui/emoji package. An emoji picker with search, groups, skin tones and recently used emoji, in a list that draws only the rows in view, and a reaction button with a count, installed next to @nuvui/react.
- [EmojiPicker](reference/emoji/emoji-picker.md): A panel to pick an emoji from, with a search box, the emoji in their groups, a choice of skin tone and the ones picked before. It draws the device's own emoji, and only the rows in view.
- [EmojiReaction](reference/emoji/emoji-reaction.md): A button with an emoji and how many reacted with it, pressed when the reader is one of them. For the row of reactions under a message or a comment.

## @nuvui/map

- [Map](reference/map/index.md): The @nuvui/map package. A map on MapLibre, installed next to @nuvui/react, with markers and popups that are React elements and controls that are the library's own buttons. It needs map tiles from a provider you choose.
- [MapView](reference/map/map-view.md): A map on MapLibre, with markers that are read by name, popups, and controls that are the library's own buttons. It takes the arrow keys, says when it's loading, and says when it can't be drawn.
- [MapRoute](reference/map/map-route.md): A line on a map through a list of places, for a way that was driven or one that's planned. It's drawn in the theme's colors, with an edge that keeps it seen on a map of any color.
- [MapClusters](reference/map/map-clusters.md): Many places on a map, gathered into one button with a number on it where they're near each other, and drawn apart as the map zooms in. Each gathering and each place is a button with a name.

## @nuvui/flow

- [Flow diagrams](reference/flow/index.md): The @nuvui/flow package. Boxes, circles and other shapes joined by arrows, drawn as SVG, in a view that pans and zooms, and edited with a pointer or the keyboard.
- [Flow](reference/flow/flow.md): A diagram of shapes joined by arrows, drawn as SVG, in a frame that pans and zooms. Nodes are dragged, joined and removed with a pointer or the keyboard, and only what's in view is drawn.

## @nuvui/media

- [Media](reference/media/index.md): The @nuvui/media package. A video player and an audio player with captions in the theme, chapters, a waveform to seek on, a transcript that follows along, streaming with hls.js or dashjs, and controls for a pointer, a finger and the keyboard.
- [VideoPlayer](reference/media/video-player.md): A video with its own controls. Play, seek with chapters and previews, volume, speed, quality, captions drawn in the theme, picture in picture and fullscreen, from a pointer, a finger or the keyboard. Plays files, and HLS and DASH streams.
- [AudioPlayer](reference/media/audio-player.md): A sound with its own controls. Play, seek on a bar or a waveform, the time, volume and speed, from a pointer, a finger or the keyboard. One row, a podcast layout, or a voice message small enough for a chat. Plays files, and HLS and DASH streams.
- [MediaTranscript](reference/media/media-transcript.md): The words of a player's captions as text beside it or under it, with the line being said marked and kept in view, and a press on a line to play from there.

## @nuvui/backgrounds

- [Backgrounds](reference/backgrounds/index.md): The @nuvui/backgrounds package. Moving backgrounds for a hero, a sign-in page or an empty state, in the theme's colors, quiet enough to put text over, still for anyone who asked for less motion, and with no dependencies.
- [GradientBackground](reference/backgrounds/gradient-background.md): Soft fields of the theme's colors that drift and change places slowly. Drawn in CSS alone, so it works in a server component and looks the same before any script has run.
- [GridBackground](reference/backgrounds/grid-background.md): A grid of lines or dots that fades out from the middle, with a soft light under the pointer that lights the lines near it.
- [StarsBackground](reference/backgrounds/stars-background.md): A starfield: dots of several sizes drifting the way the page reads, the nearer ones larger and faster, leaning away from the pointer a little.
- [TopographyBackground](reference/backgrounds/topography-background.md): Contour lines of a land that shifts slowly, as on a map. The pointer raises a hill where it is, and a press sends a wave across.
- [HexagonBackground](reference/backgrounds/hexagon-background.md): A grid of hexagons. The ones under the pointer light up in the accent color and fade after it, and now and then one lights on its own.
- [FireworksBackground](reference/backgrounds/fireworks-background.md): Rockets that rise from the bottom and burst into sparks in the theme's chart colors, which fall and fade. A press bursts one where it lands.
- [HoleBackground](reference/backgrounds/hole-background.md): A tunnel of rings receding into the distance, with motes rising through it toward the viewer. The far end leans toward the pointer, and a press speeds it up for a moment.
- [GlyphBackground](reference/backgrounds/glyph-background.md): A field of characters lit by glows that wander over it. The pointer leaves a trail of light, a press sends a ring of it outward, and now and then a character changes.

## @nuvui/3d

- [3D](reference/3d/index.md): The @nuvui/3d package. A viewer for 3D models on react-three-fiber and three.js, for glTF, GLB and STL files, from your site or picked by the person. It needs React 19.
- [ModelViewer](reference/3d/model-viewer.md): A 3D model to turn and zoom with a pointer, a finger or the keys, for glTF, GLB and STL files from your site or picked by the person. It has a poster, says what it can't show in words, and is read by its name.

## @nuvui/icons

- [Icons](reference/icons/index.md): The @nuvui/icons package. 317 line icons drawn for nuvui, in three styles, each a React component in the color of the text around it and an SVG file.

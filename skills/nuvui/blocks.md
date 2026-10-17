<!-- Written by apps/docs/scripts/agent-skill.mjs from the website's blocks. Don't edit it here: run `pnpm skill`. -->

# Blocks

A block is a part of an app, such as a sign-in screen or a table with a toolbar, built from the library's components: one TSX file and one SCSS file, to copy into an app and change. There are 66. Each is shown at https://nuvui.nuvraxis.com/blocks.

Before building a screen from nothing, look here for one that's close. To add one, with the packages it needs:

```sh
pnpm dlx shadcn@latest add https://nuvui.nuvraxis.com/r/<name>.json
```

That's shadcn's command line tool, reading this site's registry. It copies the block's files and installs what it lists. It doesn't need the project to use shadcn's components.

A block's files aren't in this skill. To read one without adding it, fetch them:

- https://raw.githubusercontent.com/Nuvraxis/nuvui/main/apps/showcase/src/blocks/<name>/<name>.tsx
- https://raw.githubusercontent.com/Nuvraxis/nuvui/main/apps/showcase/src/blocks/<name>/<name>.scss

A block is a starting point and does more than most requests ask for. Take its structure, and leave out what wasn't asked for. Where it can't be fetched, build from the reference files: they have everything a block uses.

A block's SCSS uses the library's mixins, `@use "@nuvui/react/scss/mixins"`, so the app needs Sass. In an app without it, write the same rules as plain CSS: rules/styling.md says what each mixin stands for. Its classes begin with the block's own name, and its colors are the theme's tokens.

## Accounts

- **Forgotten password** (`forgot-password`): One field, and a message that says what happens next. Needs `@nuvui/react`, `lucide-react`.
- **Set up in steps** (`onboarding`): Three steps to a new workspace: a plan chosen from cards, seats and extras, and a summary to check, with a stepper that says where you are. Needs `@nuvui/react`.
- **Getting started checklist** (`setup-checklist`): Five steps to a new workspace with a bar that fills as they're done. The last one throws confetti up from the bar, and says in words, for everyone, that the setup is finished. Needs `@nuvui/react`.
- **Sign in** (`sign-in`): Email and password, with the product's name beside the form on a wide screen. Needs `@nuvui/react`, `lucide-react`.
- **Sign in with a company account** (`sign-in-sso`): A work email that leads to the company's own sign-in, with a password as the other way in. Needs `@nuvui/react`, `lucide-react`.
- **Sign up** (`sign-up`): Name, work email and a new password, with the terms to agree to. Needs `@nuvui/react`, `lucide-react`.
- **Enter a code** (`verify-code`): Six digits sent by email, sent off when the last one is typed. Needs `@nuvui/react`, `lucide-react`.

## Chat

- **Assistant chat** (`assistant-chat`): A whole conversation with an assistant: messages that follow a reply as it arrives and draw its markdown, prompts to start from, copy and try again under each answer, and a box to write in that sends on Enter, takes files and stops a reply. Needs `@nuvui/chat`, `@nuvui/react`.
- **Assistant beside a record** (`assistant-sidebar`): An invoice with an assistant in a panel beside it that answers about that invoice: prompts to start from, a reply that can be stopped, and copy under each answer. On a phone the panel takes the whole screen. Needs `@nuvui/chat`, `@nuvui/react`, `lucide-react`.
- **Assistant workspace** (`assistant-workspace`): An assistant with its past conversations down the side. A reply is drawn from its markdown and shows the steps it took, the tools it called and its sources, a call that sends something waits to be approved, and the box to write in takes files. On a phone the list opens in a sheet. Needs `@nuvui/chat`, `@nuvui/react`, `lucide-react`.
- **Message reactions** (`message-reactions`): Messages with emoji reactions under them: each an EmojiReaction, a button with a count that joins a reaction or takes yours away, and a button that opens an emoji picker in a popover to add another. What was done is said to a screen reader. Needs `@nuvui/emoji`, `@nuvui/react`.
- **Support chat** (`support-chat`): A help desk in the corner of a page: a button that opens a conversation in a popover, replies to choose from, automatic answers, and a hand-over to a person. Needs `@nuvui/chat`, `@nuvui/react`, `lucide-react`.
- **Team messages** (`team-chat`): Messages between people: a list of conversations with what's unread, and the open one beside it with names, times and a box to write in. On a phone it's the list, then the conversation, with a way back. Needs `@nuvui/chat`, `@nuvui/react`, `lucide-react`.

## Dashboard

- **Activity list** (`activity`): Who did what and when, newest first, with what to show when there's nothing yet. Needs `@nuvui/react`, `lucide-react`.
- **Ask a question** (`ask-panel`): A question in a field or from a list of examples, words that shimmer while it's worked on, and the answer in their place. Needs `@nuvui/react`.
- **Dashboard** (`dashboard`): A whole screen: a sidebar, four figures with how each has changed, a chart of revenue against target, and a table of recent orders. Needs `@nuvui/react`, `@nuvui/charts`, `@nuvui/table`, `@tanstack/react-table`, `recharts`, `lucide-react`.
- **Figures with trends** (`figures`): Four numbers, each with its change against last month and a small chart of the last twelve. Needs `@nuvui/react`, `@nuvui/charts`, `recharts`.
- **Figures that roll** (`live-figures`): Four of today's figures, each with its change since the last refresh. A refresh rolls each digit that changed to its new value, and a sentence under them, which a screen reader reads out, says the one that matters most. Needs `@nuvui/react`, `lucide-react`.
- **What's new** (`whats-new`): Release notes to read one at a time, by swiping or with Back and Next, with dots that show how many there are and a Done on the last. Needs `@nuvui/react`, `lucide-react`.

## Data

- **Approvals** (`approvals`): Requests to approve or decline, each with its own two buttons, and a bar for deciding several at once. The arrow keys move between requests and Tab goes into the one it's at. Needs `@nuvui/react`, `lucide-react`.
- **Find a branch** (`branch-finder`): A list of branches beside a map of the same ones. A search narrows both and the map fits what's left, and choosing a branch in the list opens it on the map, as pressing its marker does in the list. The map's tiles come from a provider you choose. Needs `@nuvui/map`, `maplibre-gl`, `@nuvui/react`.
- **Charging points** (`charging-map`): Charging points on a map, gathered into one button with a number on it where they're near each other, beside a list of the same ones. A switch leaves only those with a socket free, and choosing one in the list goes to it on the map and opens it. The map's tiles come from a provider you choose. Needs `@nuvui/map`, `maplibre-gl`, `@nuvui/react`.
- **Deal pipeline** (`deal-pipeline`): A sales pipeline as a board. Each column adds up the worth of its deals and the heading adds up what's still open, both following a deal as it's moved. A button adds a deal to the first column, and a deal that's won is locked where it is. Needs `@nuvui/kanban`, `@nuvui/react`.
- **Delivery route** (`delivery-route`): A van's round: the stops in order as a list, each done, next or planned, beside a map with the way drawn on it, solid for what's behind the van and in dashes for what's ahead. Choosing a stop in the list opens it on the map, as pressing its number does in the list. The map's tiles come from a provider you choose. Needs `@nuvui/map`, `maplibre-gl`, `@nuvui/react`.
- **Detail panel beside a list** (`detail-panel`): A list where a row opens a panel at the side, with tabs for what there is to know about it. Needs `@nuvui/react`, `lucide-react`.
- **Event ticket** (`event-ticket`): A ticket to show at the door: the event, when and where it is, the seat and who holds it, and a QR code to scan with the same code written under it and a link beside it. Needs `@nuvui/barcodes`, `@nuvui/react`.
- **File browser** (`file-browser`): Folders and files in a tree, with the chosen one's details in a panel beside it. A folder's panel lists what's inside, and choosing from there opens the tree to it. Files and folders can be moved by dragging, with the keyboard, or from a list in the panel. Needs `@nuvui/react`, `lucide-react`.
- **Filters in a sentence and a sheet** (`filter-sheet`): A list whose two main filters are selects in the sentence that describes it, with the rest in a sheet that opens half way up and can be pulled taller or swiped away. Needs `@nuvui/react`, `lucide-react`.
- **Photograph to review** (`image-review`): A retouched photograph to approve or send back, with a switch between the original and the retouched one, a list of what the retoucher changed, and a status that says what was decided. Needs `@nuvui/react`, `lucide-react`.
- **List with an action bar** (`inbox`): Messages to tick, and a bar that appears with what can be done to the ticked ones: mark as read, archive, and delete by holding the button down. Needs `@nuvui/react`, `lucide-react`.
- **Empty, loading and error** (`page-states`): One page in each state it can be in: with its rows, waiting for them, with none yet, and after a request that failed. Needs `@nuvui/react`, `lucide-react`.
- **Query editor** (`query-editor`): A query above and its rows below, with a handle between them to give either more room. The sizes are remembered for the next visit. Needs `@nuvui/react`, `@nuvui/table`, `@tanstack/react-table`, `lucide-react`.
- **Shipping label** (`shipping-label`): A parcel's label: who it's from and who it's for, the service and the weight, the tracking number as a barcode with the number under it, a QR code that opens the tracking page, and buttons that save the barcode as a file. Needs `@nuvui/barcodes`, `@nuvui/react`.
- **Table with a toolbar** (`table-toolbar`): A table to work in: search, a filter by status, a column chooser, a menu on each row, and actions for the rows that are ticked. Needs `@nuvui/react`, `@nuvui/table`, `@tanstack/react-table`, `lucide-react`.
- **Task board** (`task-board`): A plan's tasks in four columns. A card is dragged to another column or moved there with the keyboard, each card has a menu that moves it for anyone who'd sooner not drag, the review column takes only so many, and a line under the heading says what was moved. Needs `@nuvui/kanban`, `@nuvui/react`.

## Editor

- **Announcement editor** (`announcement-editor`): A form that writes an announcement: a title, and a body in a rich text editor with a limit and a count. Beside it the announcement is shown as its readers will see it, drawn by the editor itself so nothing in it can run, and publishing with nothing written says what's missing. Needs `@nuvui/editor`, `@nuvui/react`.
- **Comment thread** (`comment-thread`): Comments on a record, and a small rich text editor under them with a toolbar cut down to bold, italic, code, lists and links. A posted comment joins the list, each one drawn by a read-only editor so nothing in it can run, and posting nothing says what's missing. Needs `@nuvui/editor`, `@nuvui/react`.
- **Document editor** (`document-editor`): A page of a knowledge base being edited: a title, a body in a rich text editor with the whole toolbar, and beside it the page's headings as an outline with a count of words, both read from the HTML as it's written. It says whether there are unsaved changes, and they can be saved or thrown away. Needs `@nuvui/editor`, `@nuvui/react`.

## Flows

- **Approval path** (`approval-flow`): A purchase request's way to an order as a diagram: the steps that are done, the one it waits at, the ones to come, and a way it didn't need to take, dashed. A step selected with a click or the keyboard shows who has it and when, in a panel beside it. Needs `@nuvui/flow`, `@nuvui/react`.
- **Workflow builder** (`workflow-builder`): An automation drawn as a diagram and edited in place: steps are dragged onto a grid and joined from their edges, with a pointer or the keyboard, buttons add a trigger, a condition or an action after the selected step, and a panel beside it renames or removes the step that's selected. Needs `@nuvui/flow`, `@nuvui/react`.

## Layout

- **App shell** (`app-shell`): The four parts of an app's screen together: a sidebar that folds to its icons, a bar across the top, the page, and a panel on the far side that closes. On a narrow screen the sidebar and the panel open over the page. Needs `@nuvui/react`, `lucide-react`.
- **Page with its contents** (`article`): A long page with a list of its headings that marks the one being read: beside the text on a wide screen, and behind a button on a narrow one. Needs `@nuvui/react`, `lucide-react`.
- **Page header** (`page-header`): A breadcrumb, the page's title with its status, and the actions for the page. Needs `@nuvui/react`, `lucide-react`.
- **Sidebar that folds to icons** (`sidebar-icons`): An app's navigation with a workspace at the top and the person's menu at the bottom. It folds down to a strip of icons, and is a panel on a phone. Needs `@nuvui/react`, `lucide-react`.
- **Sidebar with sections** (`sidebar-nested`): Navigation in two levels. A section opens to show its pages, and the open page is marked. Needs `@nuvui/react`, `lucide-react`.
- **Top bar** (`top-bar`): A bar across the top with the product's name, the pages, a search that opens a command palette, and the person's menu. On a narrow screen the pages are in a panel. Needs `@nuvui/react`, `lucide-react`.

## Marketing

- **Before and after** (`before-after`): A section of a release page: an app's screen before the release and after it in one box, split by a line that's dragged across, beside a list of what changed in words. Needs `@nuvui/react`, `lucide-react`.
- **Customer stories** (`case-studies`): Cards with a figure, what it measures and a quote, in a row that's swiped or moved with arrows. One shows on a phone, two on a tablet and three on a desktop. Needs `@nuvui/react`.
- **Questions and answers** (`faq`): A heading beside a list of questions, each one opening to its answer, one at a time. Needs `@nuvui/react`.
- **Feature grid** (`feature-grid`): A heading and six cards, each with an icon, a title and a sentence, laid out as many to a row as fit. Needs `@nuvui/react`, `lucide-react`.
- **Footer** (`footer`): The foot of a site: the name with a line about it, three lists of links, and the legal links under a rule. Needs `@nuvui/react`, `lucide-react`.
- **Hero** (`hero`): The top of a product's home page: a line of news, the headline, two actions, and a frame where a picture of the product goes. Needs `@nuvui/react`, `lucide-react`.
- **Hero that rises in** (`launch-hero`): The top of a launch page: the headline rises into place a line at a time, under a line that names the release, with the words that explain it and two actions. The headline is in the page from the server, and still for anyone who asked for less motion. Needs `@nuvui/react`, `lucide-react`.
- **Navigation bar** (`nav-bar`): A site's top bar, on Navbar: a menu with a panel under one entry, two actions, and on a phone one button that opens every link in a panel. Needs `@nuvui/react`, `lucide-react`.
- **Pricing table** (`pricing`): Three plans side by side with what each includes, and a switch between paying by the month and by the year. Needs `@nuvui/react`, `lucide-react`.
- **Product gallery** (`product-gallery`): Photographs of a product to swipe through, with a thumbnail for each and arrows over the picture, beside its name, its price and a button to buy it. Needs `@nuvui/react`, `lucide-react`.
- **Reviews** (`reviews`): An average rating with how the stars are shared out, a few reviews, and a form to leave one that asks for a number of stars. Needs `@nuvui/react`.

## Settings

- **Appearance settings** (`appearance`): A workspace's colors, each a row with a color picker at its end, a picture of them in use, and a warning where white text couldn't be read on one. Needs `@nuvui/react`.
- **Audit log** (`audit-log`): Who did what and when, newest first, with a search and two date fields that narrow it to a span of days. Needs `@nuvui/react`, `@nuvui/table`, `@nuvui/date-picker`, `@tanstack/react-table`, `lucide-react`.
- **Billing and plan** (`billing`): The plan with the seats in use, the card it's paid with, and a table of past invoices to download. Needs `@nuvui/react`, `@nuvui/table`, `@tanstack/react-table`, `lucide-react`.
- **Danger zone** (`danger-zone`): The actions that can't be taken back, with a dialog that asks for the workspace's name to be typed before it deletes. Needs `@nuvui/react`.
- **Member card** (`member-card`): A membership page with the member's card as an object: it tilts under the pointer with a glare and an embossed texture on its face and the name and number floating over them, and lies flat for a finger and for anyone who asked for less motion. The number is hidden but for its last four digits until it's asked for, and beside the card are the member's tier, points and perks. Needs `@nuvui/react`.
- **Notification preferences** (`notifications`): Switches in groups, each with a line that says what it turns on, sent as one form. Needs `@nuvui/react`.
- **Profile form** (`profile-form`): A person's picture, name, email and a few words about them, with a picture that shows as soon as it's chosen. Needs `@nuvui/react`.
- **Set a status** (`set-status`): A form for the status shown beside someone's name: an emoji picked from a picker in a popover, a few words, and when it clears. The status as it stands is shown over the form, and saving with no words says what's missing. Needs `@nuvui/emoji`, `@nuvui/react`.
- **Team members** (`team-members`): The people in a workspace with a role each, invitations that haven't been taken up, and a dialog to invite someone. Needs `@nuvui/react`, `@nuvui/table`, `@tanstack/react-table`, `lucide-react`.

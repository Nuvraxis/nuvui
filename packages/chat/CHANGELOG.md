# @nuvui/chat

## 0.1.3

### Patch Changes

- Updated dependencies [[`edff9a4`](https://github.com/Nuvraxis/nuvui/commit/edff9a4b8620d36176a4875fad6e00e6b53c121d)]:
  - @nuvui/react@0.7.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`15bf3c3`](https://github.com/Nuvraxis/nuvui/commit/15bf3c38570b5b1952dcadc34f90c39ae9fdc592)]:
  - @nuvui/react@0.6.0

## 0.1.1

### Patch Changes

- [#62](https://github.com/Nuvraxis/nuvui/pull/62) [`679eae4`](https://github.com/Nuvraxis/nuvui/commit/679eae458b8565660a5bfbc31a9c1f1bd8d64db8) Thanks [@sajanv88](https://github.com/sajanv88)! - `createShikiHighlighter` colors the first code in a language to the end of each line on a slow machine. Shiki stops a line after half a second, and the first code in a language spends most of that building its patterns, so on a slow phone a line could be left part colored. The first time now gets five seconds.

## 0.1.0

### Minor Changes

- [#55](https://github.com/Nuvraxis/nuvui/pull/55) [`2297f73`](https://github.com/Nuvraxis/nuvui/commit/2297f73598bd6bbe14b076c29471a1caab310d6d) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for a conversation with an assistant: the messages, the scrolling around them, the box a prompt is written in, and what a reply comes with.
  
  - `Conversation`, with `ConversationContent`, `ConversationScrollButton` and `ConversationEmpty`. The messages scroll in a box that starts at the latest one and keeps it in view while a reply arrives. When the reader scrolls up it stops following, and a button to go back appears. `useConversation` gives the same to a part of your own.
  - `Message`, with `MessageContent`, `MessageMeta`, `MessageActions`, `MessageAction` and `MessageCopyAction`. The person's own messages sit at the end of the row in a bubble and the assistant's at the start. Each is said to a screen reader with who it's from, and one that's `streaming` is read once it's whole.
  - `MessageLoader`, three dots for the wait before a reply starts.
  - `Markdown`, at `@nuvui/chat/markdown`. A reply's markdown drawn with the library's type: headings, lists, tables, links, quotes and code. HTML in the text is shown as text, unsafe addresses are dropped, and pictures aren't loaded unless `allowImages` says so. With `streaming`, what's open at the end of text that's still arriving is closed for the moment. `closeMarkdown` is the function behind that.
  - `CodeBlock`, code with its language over it and a button that copies it. A `highlighter` you pass in colors it, and `createShikiHighlighter` at `@nuvui/chat/shiki` is one for Shiki, loaded when code is first colored, with colors that are the theme's.
  - `PromptInput`, with `PromptInputTextarea`, `PromptInputToolbar`, `PromptInputTools` and `PromptInputSubmit`. The field grows with its text. Enter sends and Shift with Enter starts a line, the other way round on a touch screen. While it's `busy` nothing is sent, and with `onStop` the button stops the reply.
  - `PromptSuggestions` and `PromptSuggestion`, prompts to start from.
  - `PromptInputAttach` and `PromptInputAttachments`, with which the prompt box takes files: picked, pasted, or dropped on it. They wait in the box and are handed to `onSubmit` with the text, as `onSubmit(text, { files, event })`. `accept`, `maxFiles` and `maxFileSize` turn files away, and `onFilesReject` says which and why.
  - `Attachments` and `Attachment`, a file in a message or waiting to be sent: its name, its size, a picture where there is one, and states for uploading and failed.
  - `Sources`, with `SourcesTrigger`, `SourcesContent` and `Source`. What a reply was drawn from, as a numbered list of links that opens under it.
  - `ToolCall`, with `ToolCallTrigger`, `ToolCallContent`, `ToolCallInput`, `ToolCallOutput`, `ToolCallError` and `ToolCallApproval`. A card for something the assistant did with a tool, with where the call stands in words, what was asked and what came back, and a question with two buttons for a call that waits to be allowed.
  - `Reasoning`, with `ReasoningTrigger`, `ReasoningContent`, `ReasoningSteps` and `ReasoningStep`. The steps the assistant took, open while it works and closed once it has answered, unless the reader chose otherwise.
  - `ThreadList`, with `ThreadListGroup` and `ThreadListItem`. The list of past conversations for a sidebar, built on the core's `ListView`: one Tab stop, arrow keys between conversations, and room for buttons on each row.
  - It takes messages as props and fetches nothing, and uploads nothing. `@nuvui/react` is its peer dependency. `@nuvui/chat/markdown` brings react-markdown and remark-gfm, which only an app that imports that entry loads. `shiki` is an optional peer dependency, for `@nuvui/chat/shiki`.

### Patch Changes

- Updated dependencies [[`0fc08bc`](https://github.com/Nuvraxis/nuvui/commit/0fc08bc21adea0d24f54ef688a3575243d4694a3)]:
  - @nuvui/react@0.5.0

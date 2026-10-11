---
"@nuvui/chat": minor
---

A new package, for a conversation with an assistant: the messages, the scrolling around them, the box a prompt is written in, and what a reply comes with.

- `Conversation`, with `ConversationContent`, `ConversationScrollButton` and `ConversationEmpty`. The messages scroll in a box that starts at the latest one and keeps it in view while a reply arrives. When the reader scrolls up it stops following, and a button to go back appears. `useConversation` gives the same to a part of your own.
- `Message`, with `MessageContent`, `MessageMeta`, `MessageActions`, `MessageAction` and `MessageCopyAction`. The person's own messages sit at the end of the row in a bubble and the assistant's at the start. Each is said to a screen reader with who it's from, and one that's `streaming` is read once it's whole.
- `MessageLoader`, three dots for the wait before a reply starts.
- `PromptInput`, with `PromptInputTextarea`, `PromptInputToolbar`, `PromptInputTools` and `PromptInputSubmit`. The field grows with its text. Enter sends and Shift with Enter starts a line, the other way round on a touch screen. While it's `busy` nothing is sent, and with `onStop` the button stops the reply.
- `PromptSuggestions` and `PromptSuggestion`, prompts to start from.
- `PromptInputAttach` and `PromptInputAttachments`, with which the prompt box takes files: picked, pasted, or dropped on it. They wait in the box and are handed to `onSubmit` with the text, as `onSubmit(text, { files, event })`. `accept`, `maxFiles` and `maxFileSize` turn files away, and `onFilesReject` says which and why.
- `Attachments` and `Attachment`, a file in a message or waiting to be sent: its name, its size, a picture where there is one, and states for uploading and failed.
- `Sources`, with `SourcesTrigger`, `SourcesContent` and `Source`. What a reply was drawn from, as a numbered list of links that opens under it.
- `ToolCall`, with `ToolCallTrigger`, `ToolCallContent`, `ToolCallInput`, `ToolCallOutput`, `ToolCallError` and `ToolCallApproval`. A card for something the assistant did with a tool, with where the call stands in words, what was asked and what came back, and a question with two buttons for a call that waits to be allowed.
- `Reasoning`, with `ReasoningTrigger`, `ReasoningContent`, `ReasoningSteps` and `ReasoningStep`. The steps the assistant took, open while it works and closed once it has answered, unless the reader chose otherwise.
- `ThreadList`, with `ThreadListGroup` and `ThreadListItem`. The list of past conversations for a sidebar, built on the core's `ListView`: one Tab stop, arrow keys between conversations, and room for buttons on each row.
- It takes messages as props and fetches nothing, and uploads nothing. It has no dependency but `@nuvui/react`.

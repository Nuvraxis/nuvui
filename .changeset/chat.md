---
"@nuvui/chat": minor
---

A new package, for a conversation with an assistant. This is its first part: the messages, the scrolling around them and the box a prompt is written in.

- `Conversation`, with `ConversationContent`, `ConversationScrollButton` and `ConversationEmpty`. The messages scroll in a box that starts at the latest one and keeps it in view while a reply arrives. When the reader scrolls up it stops following, and a button to go back appears. `useConversation` gives the same to a part of your own.
- `Message`, with `MessageContent`, `MessageMeta`, `MessageActions`, `MessageAction` and `MessageCopyAction`. The person's own messages sit at the end of the row in a bubble and the assistant's at the start. Each is said to a screen reader with who it's from, and one that's `streaming` is read once it's whole.
- `MessageLoader`, three dots for the wait before a reply starts.
- `PromptInput`, with `PromptInputTextarea`, `PromptInputToolbar`, `PromptInputTools` and `PromptInputSubmit`. The field grows with its text. Enter sends and Shift with Enter starts a line, the other way round on a touch screen. While it's `busy` nothing is sent, and with `onStop` the button stops the reply.
- `PromptSuggestions` and `PromptSuggestion`, prompts to start from.
- It takes messages as props and fetches nothing. It has no dependency but `@nuvui/react`.

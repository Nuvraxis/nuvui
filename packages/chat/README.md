# @nuvui/chat

The parts of a conversation with an assistant, for [`@nuvui/react`](https://www.npmjs.com/package/@nuvui/react): messages, the scrolling around them, the box a prompt is written in, and what a reply comes with: files, sources, tool calls and reasoning. And the list of past conversations.

This is early: the package is a 0.x version, and before 1.0 a minor version may rename or remove things. The [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does, and the [repository README](https://github.com/Nuvraxis/nuvui#readme) says where things stand.

```sh
pnpm add @nuvui/chat @nuvui/react
```

```tsx
"use client";

import "@nuvui/react/styles.css";
import "@nuvui/chat/styles.css";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageContent,
  MessageLoader,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";

export function Chat({ messages, waiting, replying, send, stop }) {
  return (
    <Conversation style={{ blockSize: "100dvh" }}>
      <ConversationContent aria-label="Conversation">
        {messages.map((message) => (
          <Message
            key={message.id}
            from={message.role}
            streaming={replying && message === messages.at(-1)}
          >
            <MessageContent>{message.text}</MessageContent>
          </Message>
        ))}
        {waiting ? (
          <Message from="assistant" streaming>
            <MessageLoader />
          </Message>
        ) : null}
      </ConversationContent>
      <ConversationScrollButton />
      <PromptInput busy={waiting || replying} onStop={stop} onSubmit={send}>
        <PromptInputTextarea aria-label="Message" placeholder="Ask anything" />
        <PromptInputToolbar>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
    </Conversation>
  );
}
```

## What's in it

- `Conversation`: the messages in a box that scrolls. It starts at the latest message and keeps it in view while a reply arrives. When the reader scrolls up, it stops following, and a button to go back appears.
- `Message`: one message, from the person or from the assistant, with room for a picture, a line of details and a row of actions. `MessageCopyAction` copies it.
- `MessageLoader`: three dots for the wait before a reply starts.
- `Markdown`, at `@nuvui/chat/markdown`: a reply's markdown drawn with the library's type. HTML in the text is shown as text, pictures aren't loaded unless you say so, and text that's still arriving is drawn as what it's about to be.
- `CodeBlock`: code with its language and a button that copies it. Colors come from a highlighter you plug in, and one for Shiki is ready at `@nuvui/chat/shiki`.
- `PromptInput`: the box a prompt is written in. The field grows with its text, Enter sends, and the button to send becomes a button to stop while a reply is on its way. With `PromptInputAttach` and `PromptInputAttachments` it takes files, picked, pasted or dropped, and hands them over with the text.
- `PromptSuggestion`: prompts to start from.
- `Attachment`: a file, in a message or waiting to be sent.
- `Sources`: what a reply was drawn from, as a numbered list of links that opens.
- `ToolCall`: something the assistant did with a tool, in a card that opens, with a question and two buttons for a call that has to be allowed first.
- `Reasoning`: the steps the assistant took, open while it works and closed after.
- `ThreadList`: the list of past conversations, for a sidebar.

## What it leaves to you

It takes messages as props and tells you when something is sent. It doesn't talk to a model or to a server, and it doesn't upload a file: it hands you the `File` objects. So it works with whatever you fetch with.

`MessageContent` shows text with its line breaks and takes whatever you render yourself. For a model's reply, put a `Markdown` in it.

## For a screen reader

The messages are a log: a message is read when it's added. One that's still arriving is marked as busy with `streaming` and read once it's whole. Each starts with who it's from, in words that are read and not seen. The tests check the roles, names and states. What each screen reader then says hasn't been checked by a person.

## Dependencies

`@nuvui/react` is a peer dependency. The parts that open are built on its Collapsible, and the thread list on its ListView.

Two things come from outside, each for one entry:

- `@nuvui/chat/markdown` reads markdown with [react-markdown](https://github.com/remarkjs/react-markdown) and [remark-gfm](https://github.com/remarkjs/remark-gfm). They're installed with the package and loaded only by an app that imports that entry, which is about 42 kB compressed. `Markdown` isn't exported from `@nuvui/chat` for that reason. Both are ESM only: with `require`, that entry needs Node 20.19, or 22.12 and later.
- `@nuvui/chat/shiki` uses [Shiki](https://shiki.style), an optional peer dependency. Install it if you use that entry.

The docs are at https://nuvui.nuvraxis.com/docs/chat.

## License

MIT

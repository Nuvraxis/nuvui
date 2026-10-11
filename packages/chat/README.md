# @nuvui/chat

The parts of a conversation with an assistant, for [`@nuvui/react`](https://www.npmjs.com/package/@nuvui/react): messages, the scrolling around them, and the box a prompt is written in.

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
- `PromptInput`: the box a prompt is written in. The field grows with its text, Enter sends, and the button to send becomes a button to stop while a reply is on its way.
- `PromptSuggestion`: prompts to start from.

## What it leaves to you

It takes messages as props and tells you when something is sent. It doesn't talk to a model or to a server, so it works with whatever you fetch with.

Markdown and highlighted code in a reply, files, sources and tool calls are planned and aren't here yet. `MessageContent` shows text with its line breaks and takes whatever you render yourself.

## For a screen reader

The messages are a log: a message is read when it's added. One that's still arriving is marked as busy with `streaming` and read once it's whole. Each starts with who it's from, in words that are read and not seen. The tests check the roles, names and states. What each screen reader then says hasn't been checked by a person.

## Dependencies

`@nuvui/react` is a peer dependency, and the only one besides React.

The docs are at https://nuvui.nuvraxis.com/docs/chat.

## License

MIT

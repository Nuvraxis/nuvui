import { Message, MessageContent, MessageMeta } from "@nuvui/chat";
import { Avatar, AvatarFallback } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <Message
        from="user"
        label={null}
        avatar={
          <Avatar>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        }
      >
        <MessageMeta>Ada Lovelace · 09:41</MessageMeta>
        <MessageContent>Is the March report ready?</MessageContent>
      </Message>
      <Message
        from="assistant"
        label={null}
        avatar={
          <Avatar>
            <AvatarFallback>N</AvatarFallback>
          </Avatar>
        }
      >
        <MessageMeta>Northwind assistant · 09:41</MessageMeta>
        <MessageContent>
          It is. Revenue is up 8% on February, and two invoices are overdue.
        </MessageContent>
      </Message>
    </div>
  );
}

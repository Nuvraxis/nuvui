import { Message, MessageContent } from "@nuvui/chat";

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
      <Message from="user">
        <MessageContent>Can I move an invoice to another month?</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>
          Yes, while it's still a draft. Open the invoice, choose Edit, and
          change the date. An invoice that's been sent can't be moved: void it
          and send a new one.
        </MessageContent>
      </Message>
    </div>
  );
}

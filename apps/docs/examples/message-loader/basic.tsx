import { Message, MessageLoader } from "@nuvui/chat";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: "1.5rem", inlineSize: "100%" }}>
      <Message from="assistant" streaming>
        <MessageLoader />
      </Message>
      <Message from="assistant" streaming>
        <MessageLoader>Searching the invoices</MessageLoader>
      </Message>
    </div>
  );
}

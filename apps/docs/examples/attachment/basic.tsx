import { Attachment, Attachments, Message, MessageContent } from "@nuvui/chat";

// A picture that needs no server: three bars of a chart.
const chart = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect width="36" height="36" fill="#e5e7eb"/><path d="M8 28V18h5v10zm8 0V10h5v18zm8 0V15h5v13z" fill="#374151"/></svg>',
)}`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 520 }}>
      <Message from="user">
        <MessageContent>
          Here are the two files. Is the total in the chart right?
        </MessageContent>
        <Attachments aria-label="Files with this message">
          <Attachment
            name="october-invoices.pdf"
            detail="PDF"
            size={248_000}
            href="#october-invoices"
          />
          <Attachment
            name="revenue-by-month.png"
            size={86_400}
            src={chart}
            href="#revenue-by-month"
          />
        </Attachments>
      </Message>
    </div>
  );
}

import {
  Message,
  MessageContent,
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@nuvui/chat";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 520 }}>
      <Message from="assistant">
        <MessageContent>
          An invoice is due 30 days after it's sent, and a reminder goes out on
          day 31. Late fees start at day 45.
        </MessageContent>
        <Sources>
          <SourcesTrigger>3 sources</SourcesTrigger>
          <SourcesContent>
            <Source
              href="https://example.com/help/payment-terms"
              title="Payment terms"
            />
            <Source
              href="https://www.example.com/help/reminders"
              title="When reminders are sent"
            />
            <Source
              href="#billing-policy"
              title="Billing policy, section 4"
              site="Your workspace"
            />
          </SourcesContent>
        </Sources>
      </Message>
    </div>
  );
}

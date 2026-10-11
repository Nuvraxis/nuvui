import {
  Message,
  MessageContent,
  Reasoning,
  ReasoningContent,
  ReasoningStep,
  ReasoningSteps,
  ReasoningTrigger,
} from "@nuvui/chat";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 520 }}>
      <Message from="assistant">
        <Reasoning defaultOpen>
          <ReasoningTrigger>Thought for 6 seconds</ReasoningTrigger>
          <ReasoningContent>
            <ReasoningSteps>
              <ReasoningStep label="Looked up Contoso's open invoices">
                Two are past their due date.
              </ReasoningStep>
              <ReasoningStep label="Checked the payment terms">
                30 days, with a reminder on day 31.
              </ReasoningStep>
              <ReasoningStep label="Worked out how late each one is" />
            </ReasoningSteps>
          </ReasoningContent>
        </Reasoning>
        <MessageContent>
          Two invoices are overdue: INV-1042 by 12 days and INV-1057 by 3.
        </MessageContent>
      </Message>
    </div>
  );
}

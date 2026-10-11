import {
  ToolCall,
  ToolCallContent,
  ToolCallError,
  ToolCallInput,
  ToolCallOutput,
  ToolCallTrigger,
} from "@nuvui/chat";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <ToolCall status="done" defaultOpen>
        <ToolCallTrigger>Search invoices</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput value={{ status: "overdue", customer: "Contoso" }} />
          <ToolCallOutput
            value={[
              { number: "INV-1042", amount: 4200, daysLate: 12 },
              { number: "INV-1057", amount: 1150, daysLate: 3 },
            ]}
          />
        </ToolCallContent>
      </ToolCall>
      <ToolCall status="running">
        <ToolCallTrigger>Look up the customer</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput value={{ name: "Contoso" }} />
        </ToolCallContent>
      </ToolCall>
      <ToolCall status="error">
        <ToolCallTrigger>Read the bank feed</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput
            value={{ account: "Operating", since: "2026-10-01" }}
          />
          <ToolCallError>
            The bank didn't answer within 30 seconds.
          </ToolCallError>
        </ToolCallContent>
      </ToolCall>
    </div>
  );
}

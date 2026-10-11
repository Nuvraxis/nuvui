"use client";

import {
  Attachment,
  Attachments,
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationScrollButton,
  Message,
  MessageContent,
  MessageLoader,
  PromptInput,
  PromptInputAttach,
  PromptInputAttachments,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptSuggestion,
  PromptSuggestions,
  Reasoning,
  ReasoningContent,
  ReasoningStep,
  ReasoningSteps,
  ReasoningTrigger,
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
  ThreadList,
  ThreadListGroup,
  ThreadListItem,
  ToolCall,
  ToolCallApproval,
  ToolCallContent,
  ToolCallInput,
  ToolCallOutput,
  type ToolCallStatus,
  ToolCallTrigger,
} from "@nuvui/chat";
import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@nuvui/react";
import { Menu, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import "./assistant-workspace.scss";

type Call = {
  name: string;
  status: ToolCallStatus;
  input: unknown;
  output?: unknown;
  question?: string;
};
type Turn = {
  id: number;
  from: "user" | "assistant";
  text: string;
  files?: { name: string; size: number }[];
  thought?: string;
  steps?: string[];
  call?: Call;
  sources?: { href: string; title: string; site?: string }[];
};
type Thread = { id: string; title: string; when: string; turns: Turn[] };

// Everything here is made up, and stands in for what your server keeps:
// the conversations, what the tools were asked and what they answered.
const saved: Thread[] = [
  {
    id: "contoso",
    title: "Overdue invoices for Contoso",
    when: "Today",
    turns: [
      { id: 1, from: "user", text: "Which Contoso invoices are overdue?" },
      {
        id: 2,
        from: "assistant",
        thought: "Thought for 4 seconds",
        steps: [
          "Looked up Contoso's open invoices",
          "Checked each against its due date",
        ],
        call: {
          name: "Search invoices",
          status: "done",
          input: { customer: "Contoso", status: "overdue" },
          output: [
            { number: "INV-1042", amount: 4200, daysLate: 12 },
            { number: "INV-1057", amount: 1150, daysLate: 3 },
          ],
        },
        text: "Two invoices are overdue. INV-1042 is 12 days late, at 4,200. INV-1057 is 3 days late, at 1,150.",
        sources: [
          {
            href: "#customer-contoso",
            title: "Customer record: Contoso",
            site: "Your workspace",
          },
          {
            href: "#payment-terms",
            title: "Payment terms",
            site: "Your workspace",
          },
        ],
      },
      { id: 3, from: "user", text: "Send them a reminder for the older one." },
      {
        id: 4,
        from: "assistant",
        text: "I can send it from billing@northwind.example. It needs your go-ahead first.",
        call: {
          name: "Send a reminder",
          status: "approval",
          input: { invoice: "INV-1042", to: "accounts@contoso.example" },
          question: "Send a reminder for INV-1042 to Contoso?",
        },
      },
    ],
  },
  {
    id: "terms",
    title: "What our payment terms say",
    when: "Yesterday",
    turns: [
      { id: 1, from: "user", text: "When is an invoice late?" },
      {
        id: 2,
        from: "assistant",
        text: "An invoice is due 30 days after it's sent. A reminder goes out on day 31, and late fees start at day 45.",
        sources: [
          {
            href: "#payment-terms",
            title: "Payment terms",
            site: "Your workspace",
          },
        ],
      },
    ],
  },
  {
    id: "forecast",
    title: "Cash forecast for the next quarter, by month and by customer",
    when: "Last week",
    turns: [
      { id: 1, from: "user", text: "What comes in next quarter?" },
      {
        id: 2,
        from: "assistant",
        text: "About 310,000 if everyone pays on time: 98,000 in October, 104,000 in November and 108,000 in December.",
      },
    ],
  },
];

const starters = [
  "Who hasn't paid yet?",
  "Summarize last month's invoices",
  "Draft a reminder for an overdue invoice",
];

// What the stand-in assistant does with any question.
const steps = [
  "Read the question",
  "Looked through your invoices",
  "Wrote the answer",
];
const answer =
  "I'm a stand-in, so this is the same answer to every question. A real assistant is fetched from your server, and its steps, its tool calls and its sources go where these are.";

export default function AssistantWorkspace() {
  const [threads, setThreads] = useState(saved);
  const [openId, setOpenId] = useState<string | null>("contoso");
  // Where the assistant is thinking, and how many steps it has taken.
  const [thinking, setThinking] = useState<{
    thread: string;
    taken: number;
  } | null>(null);
  const [menu, setMenu] = useState(false);
  // The tool that's at work, standing in for a request to your server.
  const work = useRef<ReturnType<typeof setTimeout>>(undefined);
  const next = useRef(100);
  // The button that starts a new conversation, beside the conversation
  // and in the sheet.
  const fresh = useRef<HTMLButtonElement>(null);
  const freshInSheet = useRef<HTMLButtonElement>(null);
  const open = threads.find((thread) => thread.id === openId);
  const busy = thinking !== null && thinking.thread === openId;

  useEffect(() => () => clearTimeout(work.current), []);

  const add = useCallback((thread: string, turn: Omit<Turn, "id">) => {
    const id = next.current;
    next.current += 1;
    setThreads((now) =>
      now.map((other) =>
        other.id === thread
          ? { ...other, turns: [...other.turns, { ...turn, id }] }
          : other,
      ),
    );
  }, []);

  // A step every 700 milliseconds, and then the answer.
  useEffect(() => {
    if (!thinking) return;
    const timer = setTimeout(() => {
      if (thinking.taken < steps.length) {
        setThinking({ ...thinking, taken: thinking.taken + 1 });
        return;
      }
      add(thinking.thread, {
        from: "assistant",
        text: answer,
        thought: "Thought for 2 seconds",
        steps,
      });
      setThinking(null);
    }, 700);
    return () => clearTimeout(timer);
  }, [thinking, add]);

  function ask(text: string, files: File[] = []) {
    const turn = {
      from: "user" as const,
      text,
      files: files.map(({ name, size }) => ({ name, size })),
    };
    let thread = openId;
    if (thread === null) {
      // The first question starts the conversation, and names it.
      thread = `new-${next.current}`;
      const started = {
        id: thread,
        title: text || (files[0]?.name ?? "New conversation"),
        when: "Today",
        turns: [],
      };
      setThreads((now) => [started, ...now]);
      setOpenId(thread);
    }
    add(thread, turn);
    setThinking({ thread, taken: 0 });
  }

  // Moves a call on, in the conversation that's open.
  function setCall(turn: Turn, call: Partial<Call>) {
    setThreads((now) =>
      now.map((thread) =>
        thread.id === openId
          ? {
              ...thread,
              turns: thread.turns.map((other) =>
                other.id === turn.id && other.call
                  ? { ...other, call: { ...other.call, ...call } }
                  : other,
              ),
            }
          : thread,
      ),
    );
  }

  function approve(turn: Turn) {
    const thread = openId;
    if (thread === null) return;
    setCall(turn, { status: "running" });
    work.current = setTimeout(() => {
      setCall(turn, { status: "done", output: "Sent." });
      add(thread, {
        from: "assistant",
        text: "The reminder is on its way to Contoso.",
      });
    }, 1400);
  }

  function deny(turn: Turn) {
    if (openId === null) return;
    setCall(turn, { status: "denied" });
    add(openId, { from: "assistant", text: "I haven't sent anything." });
  }

  function remove(thread: Thread) {
    setThreads((now) => now.filter((other) => other.id !== thread.id));
    if (thread.id === openId) setOpenId(null);
    if (thinking?.thread === thread.id) setThinking(null);
    // The row that had focus is gone.
    (menu ? freshInSheet : fresh).current?.focus();
  }

  function choose(id: string | null) {
    setOpenId(id);
    setMenu(false);
  }

  const days = [...new Set(threads.map((thread) => thread.when))];
  // The list is drawn twice: beside the conversation where there's room,
  // and in a sheet where there isn't. Only one of the two is ever shown.
  const list = (place: "side" | "sheet") => (
    <>
      <Button
        ref={place === "side" ? fresh : freshInSheet}
        intent="secondary"
        className="assistant-workspace__new"
        onClick={() => choose(null)}
      >
        <Plus aria-hidden="true" size={16} />
        New conversation
      </Button>
      <ThreadList
        aria-label="Past conversations"
        className="assistant-workspace__threads"
        value={openId}
        onValueChange={choose}
      >
        {days.map((day) => (
          <ThreadListGroup key={day} label={day}>
            {threads
              .filter((thread) => thread.when === day)
              .map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  value={thread.id}
                  actions={
                    <Button
                      intent="ghost"
                      size="sm"
                      className="assistant-workspace__icon"
                      aria-label={`Delete ${thread.title}`}
                      onClick={() => remove(thread)}
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </Button>
                  }
                >
                  {thread.title}
                </ThreadListItem>
              ))}
          </ThreadListGroup>
        ))}
      </ThreadList>
    </>
  );

  return (
    <div className="assistant-workspace">
      <aside className="assistant-workspace__side" aria-label="Conversations">
        {list("side")}
      </aside>

      <main className="assistant-workspace__main">
        <header className="assistant-workspace__head">
          <Button
            intent="ghost"
            className="assistant-workspace__icon assistant-workspace__menu"
            aria-label="Show conversations"
            onClick={() => setMenu(true)}
          >
            <Menu aria-hidden="true" size={18} />
          </Button>
          <h1 className="assistant-workspace__title">
            {open?.title ?? "New conversation"}
          </h1>
        </header>

        <Conversation
          key={openId ?? "new"}
          className="assistant-workspace__conversation"
        >
          <ConversationContent aria-label="Conversation with the billing assistant">
            {!open ? (
              <ConversationEmpty>
                <p className="assistant-workspace__hello">
                  Ask about invoices, customers and what's overdue.
                </p>
                <PromptSuggestions>
                  {starters.map((starter) => (
                    <PromptSuggestion
                      key={starter}
                      onClick={() => ask(starter)}
                    >
                      {starter}
                    </PromptSuggestion>
                  ))}
                </PromptSuggestions>
              </ConversationEmpty>
            ) : null}

            {open?.turns.map((turn) => (
              <Message key={turn.id} from={turn.from}>
                {turn.steps ? (
                  <Reasoning>
                    <ReasoningTrigger>{turn.thought}</ReasoningTrigger>
                    <ReasoningContent>
                      <ReasoningSteps>
                        {turn.steps.map((step) => (
                          <ReasoningStep key={step} label={step} />
                        ))}
                      </ReasoningSteps>
                    </ReasoningContent>
                  </Reasoning>
                ) : null}
                {turn.text ? (
                  <MessageContent>{turn.text}</MessageContent>
                ) : null}
                {turn.files && turn.files.length > 0 ? (
                  <Attachments aria-label="Files with this message">
                    {turn.files.map((file) => (
                      <Attachment key={file.name} {...file} />
                    ))}
                  </Attachments>
                ) : null}
                {turn.call ? (
                  <ToolCall status={turn.call.status}>
                    <ToolCallTrigger>{turn.call.name}</ToolCallTrigger>
                    <ToolCallContent>
                      <ToolCallInput value={turn.call.input} />
                      {turn.call.output !== undefined ? (
                        <ToolCallOutput value={turn.call.output} />
                      ) : null}
                    </ToolCallContent>
                    <ToolCallApproval
                      onApprove={() => approve(turn)}
                      onDeny={() => deny(turn)}
                    >
                      {turn.call.question}
                    </ToolCallApproval>
                  </ToolCall>
                ) : null}
                {turn.sources ? (
                  <Sources>
                    <SourcesTrigger>
                      {turn.sources.length === 1
                        ? "1 source"
                        : `${turn.sources.length} sources`}
                    </SourcesTrigger>
                    <SourcesContent>
                      {turn.sources.map((source) => (
                        <Source key={source.href} {...source} />
                      ))}
                    </SourcesContent>
                  </Sources>
                ) : null}
              </Message>
            ))}

            {busy && thinking ? (
              <Message from="assistant" streaming>
                <Reasoning streaming>
                  <ReasoningTrigger />
                  <ReasoningContent>
                    <ReasoningSteps>
                      {steps.slice(0, thinking.taken + 1).map((step, index) => (
                        <ReasoningStep
                          key={step}
                          label={step}
                          status={index === thinking.taken ? "active" : "done"}
                        />
                      ))}
                    </ReasoningSteps>
                  </ReasoningContent>
                </Reasoning>
                <MessageLoader />
              </Message>
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />

          <div className="assistant-workspace__foot">
            <PromptInput
              busy={busy}
              maxFiles={4}
              onStop={() => setThinking(null)}
              onSubmit={(text, { files }) => ask(text, files)}
            >
              <PromptInputAttachments />
              <PromptInputTextarea
                aria-label="Message to the billing assistant"
                placeholder="Ask about your invoices"
              />
              <PromptInputToolbar>
                <PromptInputTools>
                  <PromptInputAttach />
                </PromptInputTools>
                <PromptInputSubmit />
              </PromptInputToolbar>
            </PromptInput>
            <p className="assistant-workspace__note">
              Answers are written by a model and can be wrong. Check a figure
              before you act on it.
            </p>
          </div>
        </Conversation>
      </main>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="start">
          <SheetHeader>
            <SheetTitle>Conversations</SheetTitle>
          </SheetHeader>
          <SheetBody className="assistant-workspace__sheet">
            {list("sheet")}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}

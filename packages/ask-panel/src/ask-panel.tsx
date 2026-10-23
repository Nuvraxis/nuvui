"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationScrollButton,
  Message,
  MessageActions,
  MessageContent,
  MessageCopyAction,
  MessageLoader,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptSuggestion,
  PromptSuggestions,
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@nuvui/chat";
import { Markdown } from "@nuvui/chat/markdown";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { AskError, type AskSource, askQuestion } from "./client";
import { createTurnstile } from "./turnstile";

export interface AskPanelProps {
  /** The ask service, such as `/api/ask`. */
  endpoint: string;
  /** Turnstile's site key. Without one, no check is made in the page. */
  turnstileSiteKey?: string;
  /**
   * Where Azure OpenAI answers from, such as "Sweden Central", said in the
   * note on what happens to a question.
   */
  region?: string;
  /** Questions to start from. */
  suggestions?: string[];
  /** The button that opens the panel, styled by the site. */
  triggerClassName?: string;
  /** What the button says. */
  trigger?: ReactNode;
}

interface Turn {
  id: number;
  from: "user" | "assistant";
  text: string;
  sources?: AskSource[];
}

const defaultSuggestions = [
  "How do I start using nuvui in a Next.js app?",
  "How do I make a data table sortable?",
  "How do I change the theme's colors?",
];

// What a visitor is told for each way a question can go unanswered. None
// of them blames the person or says something they can't act on.
function messageFor(error: unknown) {
  if (!(error instanceof AskError)) return "Something went wrong. Try again.";
  switch (error.code) {
    case "limited":
      return `You've asked a lot in a short time. Try again in ${error.retryAfter ?? 60} seconds.`;
    case "busy":
      return "A lot of people are asking right now. Try again in a moment.";
    case "denied":
      return "The check that you're a person didn't pass. Try again.";
    case "filtered":
      return "That can't be answered here. Try asking about nuvui.";
    case "invalid":
      return "Ask a question of up to 1,000 characters.";
    case "timeout":
      return "The answer took too long. Try again, or ask something shorter.";
    default:
      return "Something went wrong. Try again.";
  }
}

/**
 * A button that opens a panel at the side of the page, where a visitor
 * asks about nuvui and gets an answer written from the docs, with links to
 * the pages it came from.
 */
export function AskPanel({
  endpoint,
  turnstileSiteKey,
  region,
  suggestions = defaultSuggestions,
  triggerClassName,
  trigger = "Ask AI",
}: AskPanelProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [reply, setReply] = useState<{
    text: string;
    sources: AskSource[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const check = useRef<ReturnType<typeof createTurnstile> | null>(null);
  const widget = useRef<HTMLDivElement>(null);
  const next = useRef(1);

  useEffect(
    () => () => {
      controller.current?.abort();
      check.current?.remove();
    },
    [],
  );

  function add(turn: Omit<Turn, "id">) {
    const id = next.current;
    next.current += 1;
    setTurns((now) => [...now, { id, ...turn }]);
  }

  async function ask(question: string) {
    if (controller.current) return;
    setError(null);
    add({ from: "user", text: question });
    const current = new AbortController();
    controller.current = current;
    let text = "";
    let sources: AskSource[] = [];
    setReply({ text, sources });
    try {
      let turnstile: string | undefined;
      if (turnstileSiteKey && widget.current) {
        check.current ??= createTurnstile(turnstileSiteKey, widget.current);
        turnstile = await check.current.token();
      }
      await askQuestion({
        endpoint,
        question,
        turnstile,
        signal: current.signal,
        onSources: (found) => {
          sources = found;
          setReply({ text, sources });
        },
        onText: (piece) => {
          text += piece;
          setReply({ text, sources });
        },
      });
      add({ from: "assistant", text, sources });
    } catch (failure) {
      if (current.signal.aborted) {
        // What arrived before it was stopped stays, as the answer.
        if (text) add({ from: "assistant", text, sources });
      } else {
        if (text) add({ from: "assistant", text, sources });
        setError(
          failure instanceof Error && failure.message === "Turnstile failed"
            ? messageFor(new AskError("denied"))
            : messageFor(failure),
        );
      }
    } finally {
      controller.current = null;
      setReply(null);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className={triggerClassName}>
          {trigger}
        </button>
      </SheetTrigger>
      <SheetContent side="end" size="md" className="nuv-ask-panel">
        <SheetHeader>
          <SheetTitle>Ask AI</SheetTitle>
          <SheetDescription>
            Answers are written from the nuvui docs, by a model, and can be
            wrong. Each links to the pages it came from.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="nuv-ask-panel__body">
          <Conversation className="nuv-ask-panel__conversation">
            <ConversationContent aria-label="Questions and answers">
              {turns.length === 0 && !reply ? (
                <ConversationEmpty>
                  <PromptSuggestions>
                    {suggestions.map((suggestion) => (
                      <PromptSuggestion
                        key={suggestion}
                        onClick={() => void ask(suggestion)}
                      >
                        {suggestion}
                      </PromptSuggestion>
                    ))}
                  </PromptSuggestions>
                </ConversationEmpty>
              ) : null}

              {turns.map((turn) => (
                <Message key={turn.id} from={turn.from}>
                  <MessageContent>
                    {turn.from === "assistant" ? (
                      <Markdown headingOffset={2}>{turn.text}</Markdown>
                    ) : (
                      turn.text
                    )}
                  </MessageContent>
                  {turn.from === "assistant" ? (
                    <>
                      <SourcesFor sources={turn.sources} />
                      <MessageActions>
                        <MessageCopyAction text={turn.text} />
                      </MessageActions>
                    </>
                  ) : null}
                </Message>
              ))}

              {reply ? (
                <Message from="assistant" streaming>
                  {reply.text ? (
                    <MessageContent>
                      <Markdown streaming headingOffset={2}>
                        {reply.text}
                      </Markdown>
                    </MessageContent>
                  ) : (
                    <MessageLoader />
                  )}
                </Message>
              ) : null}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </SheetBody>
        <SheetFooter className="nuv-ask-panel__foot">
          {error ? (
            <p role="alert" className="nuv-ask-panel__error">
              {error}
            </p>
          ) : null}
          <PromptInput
            busy={reply !== null}
            onStop={() => controller.current?.abort()}
            onSubmit={(text) => void ask(text)}
          >
            <PromptInputTextarea
              aria-label="Your question about nuvui"
              placeholder="Ask about nuvui"
              maxLength={1000}
            />
            <PromptInputToolbar>
              <PromptInputSubmit />
            </PromptInputToolbar>
          </PromptInput>
          <div ref={widget} className="nuv-ask-panel__check" />
          <p className="nuv-ask-panel__note">
            Your question is sent to Azure OpenAI
            {region ? ` in ${region}` : ""} to be answered. nuvui doesn't keep
            it. Microsoft may keep it for a while to check for abuse.
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function SourcesFor({ sources }: { sources?: AskSource[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <Sources>
      <SourcesTrigger>
        {sources.length === 1 ? "1 page" : `${sources.length} pages`}
      </SourcesTrigger>
      <SourcesContent>
        {sources.map((source) => (
          <li key={source.url}>
            <Source href={source.url} title={source.title} site="nuvui docs" />
          </li>
        ))}
      </SourcesContent>
    </Sources>
  );
}

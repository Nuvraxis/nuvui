"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationScrollButton,
  Message,
  MessageAction,
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
} from "@nuvui/chat";
import { Markdown } from "@nuvui/chat/markdown";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  /** For an answer, the question it answers, to ask again. */
  question?: string;
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
 * A button that opens a card floating at the bottom of the page, where a
 * visitor asks about nuvui and gets an answer written from the docs, with
 * links to the pages it came from. The page stays usable behind it, so an
 * answer can be read next to the page it's about.
 */
export function AskPanel({
  endpoint,
  turnstileSiteKey,
  region,
  suggestions = defaultSuggestions,
  triggerClassName,
  trigger = "Ask AI",
}: AskPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [reply, setReply] = useState<{
    text: string;
    sources: AskSource[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const check = useRef<ReturnType<typeof createTurnstile> | null>(null);
  const widget = useRef<HTMLDivElement | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const next = useRef(1);

  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );

  // The card leaves the page when it's closed, and Turnstile's widget with
  // it. The next question makes a new one in the new card.
  const attachWidget = useCallback((node: HTMLDivElement | null) => {
    widget.current = node;
    if (!node) {
      check.current?.remove();
      check.current = null;
    }
  }, []);

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
      add({ from: "assistant", text, sources, question });
    } catch (failure) {
      // What arrived before it was stopped or failed stays, as the answer.
      if (text) add({ from: "assistant", text, sources, question });
      if (!current.signal.aborted) {
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
    // Not modal: there's no overlay, the page scrolls, and a click on it
    // leaves the card open. Escape and the close button close it.
    <Dialog modal={false}>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          {trigger}
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={
          expanded ? "nuv-ask-panel nuv-ask-panel--expanded" : "nuv-ask-panel"
        }
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          textarea.current?.focus();
        }}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="nuv-ask-panel__card">
          <div className="nuv-ask-panel__head">
            <DialogTitle className="nuv-ask-panel__title">Ask AI</DialogTitle>
            <MessageAction
              label={expanded ? "Make smaller" : "Make bigger"}
              aria-pressed={expanded}
              onClick={() => setExpanded((now) => !now)}
            >
              {expanded ? <ShrinkIcon /> : <ExpandIcon />}
            </MessageAction>
            <DialogClose asChild>
              <MessageAction label="Close">
                <CloseIcon />
              </MessageAction>
            </DialogClose>
          </div>

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

              {turns.map((turn) =>
                turn.from === "user" ? (
                  <Message key={turn.id} from="user">
                    <MessageContent>{turn.text}</MessageContent>
                  </Message>
                ) : (
                  <Message key={turn.id} from="assistant">
                    <SourcesFor sources={turn.sources} />
                    <MessageContent>
                      <Markdown headingOffset={2}>{turn.text}</Markdown>
                    </MessageContent>
                    <MessageActions>
                      <MessageCopyAction text={turn.text} />
                      {turn.question ? (
                        <MessageAction
                          label="Ask again"
                          disabled={reply !== null}
                          onClick={() => {
                            if (turn.question) void ask(turn.question);
                          }}
                        >
                          <AgainIcon />
                        </MessageAction>
                      ) : null}
                    </MessageActions>
                  </Message>
                ),
              )}

              {reply ? (
                <Message from="assistant" streaming>
                  <SourcesFor sources={reply.sources} />
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

          <div className="nuv-ask-panel__foot">
            {error ? (
              <p role="alert" className="nuv-ask-panel__error">
                {error}
              </p>
            ) : null}
            <div ref={attachWidget} className="nuv-ask-panel__check" />
            <DialogDescription className="nuv-ask-panel__note">
              Answers are written from the nuvui docs by a model, and can be
              wrong. Your question is sent to Azure OpenAI
              {region ? ` in ${region}` : ""} to be answered. nuvui doesn't keep
              it. Microsoft may keep it for a while to check for abuse.
            </DialogDescription>
          </div>
        </div>

        <PromptInput
          className="nuv-ask-panel__bar"
          busy={reply !== null}
          onStop={() => controller.current?.abort()}
          onSubmit={(text) => void ask(text)}
        >
          <PromptInputTextarea
            ref={textarea}
            aria-label="Your question about nuvui"
            placeholder="Ask about nuvui"
            maxLength={1000}
          />
          <PromptInputToolbar>
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
      </DialogContent>
    </Dialog>
  );
}

// The pages an answer was written from, as links above it.
function SourcesFor({ sources }: { sources?: AskSource[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <ul className="nuv-ask-panel__sources" aria-label="From these pages">
      {sources.map((source) => (
        <li key={source.url}>
          <a className="nuv-ask-panel__source" href={source.url}>
            {source.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function ExpandIcon() {
  return (
    <Icon>
      <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" />
    </Icon>
  );
}

function ShrinkIcon() {
  return (
    <Icon>
      <path d="M13.5 6.5h-4v-4M2.5 9.5h4v4M9.5 6.5 14 2M6.5 9.5 2 14" />
    </Icon>
  );
}

function CloseIcon() {
  return (
    <Icon>
      <path d="M3.5 3.5l9 9m0-9l-9 9" />
    </Icon>
  );
}

function AgainIcon() {
  return (
    <Icon>
      <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v2.5h-2.5" />
    </Icon>
  );
}

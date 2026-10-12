"use client";

import {
  RichTextEditor,
  RichTextEditorContent,
  RichTextEditorFormats,
  RichTextEditorLink,
  RichTextEditorToolbar,
} from "@nuvui/editor";
import { Button, ToolbarSeparator } from "@nuvui/react";
import { type FormEvent, useId, useState } from "react";
import "./comment-thread.scss";

interface Comment {
  id: number;
  author: string;
  when: string;
  html: string;
}

// Made up, and stands in for the comments your server has kept.
const kept: Comment[] = [
  {
    id: 1,
    author: "Priya Nair",
    when: "Yesterday at 16:20",
    html: "<p>The customer asked for the invoice to be split in two:</p><ul><li><p>Licences, due now</p></li><li><p>Onboarding, due when it's done</p></li></ul>",
  },
  {
    id: 2,
    author: "Tom Becker",
    when: "Today at 09:05",
    html: '<p>Fine by finance, as long as both parts carry the <strong>same purchase order number</strong>. The rule is on <a href="https://example.com/finance/invoices">the invoicing page</a>.</p>',
  },
];

// Who is writing. Your app knows this from the session.
const me = "Dana Whitfield";

export default function CommentThread() {
  const id = useId();
  const [comments, setComments] = useState(kept);
  const [draft, setDraft] = useState("");
  const [missing, setMissing] = useState(false);
  const [said, setSaid] = useState("");

  function post(event: FormEvent) {
    event.preventDefault();
    if (draft === "") {
      setMissing(true);
      setSaid("");
      return;
    }
    // Here the HTML goes to your server, which checks it again before
    // it keeps it.
    setComments((now) => [
      ...now,
      { id: now.length + 1, author: me, when: "Just now", html: draft },
    ]);
    setDraft("");
    setSaid("Comment posted.");
  }

  return (
    <main className="comment-thread">
      <header className="comment-thread__head">
        <h1 className="comment-thread__title">Invoice INV-2041</h1>
        <p className="comment-thread__text">
          Notes between the people working on it. The customer doesn't see them.
        </p>
      </header>
      <section className="comment-thread__section" aria-labelledby={id}>
        <h2 className="comment-thread__heading" id={id}>
          Comments ({comments.length})
        </h2>
        <ol className="comment-thread__list">
          {comments.map((comment) => (
            <li key={comment.id} className="comment-thread__comment">
              <p className="comment-thread__by">
                <span className="comment-thread__author">{comment.author}</span>
                <span className="comment-thread__when">{comment.when}</span>
              </p>
              {/* The editor, read only and with nothing around the text.
                  It reads the HTML through the rules it writes with, so
                  nothing in a comment is run. */}
              <RichTextEditor
                aria-label={`Comment from ${comment.author}, ${comment.when}`}
                className="comment-thread__read"
                readOnly
                headingLevels={[]}
                value={comment.html}
              >
                <RichTextEditorContent />
              </RichTextEditor>
            </li>
          ))}
        </ol>
      </section>
      <form className="comment-thread__form" onSubmit={post} noValidate>
        <span className="comment-thread__label" id={`${id}-label`}>
          Add a comment
        </span>
        <RichTextEditor
          aria-labelledby={`${id}-label`}
          aria-required
          aria-invalid={missing || undefined}
          aria-describedby={missing ? `${id}-error` : undefined}
          placeholder="Write a comment"
          headingLevels={[]}
          value={draft}
          onValueChange={(html) => {
            setDraft(html);
            setMissing(false);
          }}
        >
          <RichTextEditorToolbar>
            <RichTextEditorFormats
              items={["bold", "italic", "code"]}
              aria-label="Text style"
            />
            <ToolbarSeparator />
            <RichTextEditorFormats
              items={["bulletList", "orderedList"]}
              aria-label="Lists"
            />
            <ToolbarSeparator />
            <RichTextEditorLink />
          </RichTextEditorToolbar>
          <RichTextEditorContent />
        </RichTextEditor>
        {missing ? (
          <p id={`${id}-error`} className="comment-thread__error">
            Write a comment before you post it.
          </p>
        ) : null}
        <div className="comment-thread__actions">
          <Button type="submit">Comment</Button>
          <p className="comment-thread__said" role="status">
            {said}
          </p>
        </div>
      </form>
    </main>
  );
}

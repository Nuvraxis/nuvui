"use client";

import { RichTextEditor, RichTextEditorContent } from "@nuvui/editor";
import { Button, Input } from "@nuvui/react";
import { type FormEvent, useId, useState } from "react";
import "./announcement-editor.scss";

// How long the body can be, in characters of text.
const most = 600;

// Made up, and stands in for a draft your server has kept.
const draft = {
  title: "Billing moves to the new plans on 1 November",
  body: '<p>From <strong>1 November</strong> every workspace is on one of the new plans.</p><ul><li><p>Your price stays the same until your next renewal.</p></li><li><p>Seats can be added from the billing page at any time.</p></li></ul><p>Questions go to <a href="mailto:billing@example.com">billing@example.com</a>.</p>',
};

export default function AnnouncementEditor() {
  const id = useId();
  const [title, setTitle] = useState(draft.title);
  const [body, setBody] = useState(draft.body);
  const [missing, setMissing] = useState<{ title: boolean; body: boolean }>({
    title: false,
    body: false,
  });
  const [said, setSaid] = useState("");

  function publish(event: FormEvent) {
    event.preventDefault();
    const now = { title: title.trim() === "", body: body === "" };
    setMissing(now);
    if (now.title || now.body) {
      setSaid("");
      return;
    }
    // Here the title and the HTML go to your server, which checks the
    // HTML again before it keeps it.
    setSaid(`Published "${title.trim()}".`);
  }

  return (
    <main className="announcement-editor">
      <header className="announcement-editor__head">
        <h1 className="announcement-editor__title">New announcement</h1>
        <p className="announcement-editor__text">
          Everyone in the workspace sees it at the top of their home page.
        </p>
      </header>
      <div className="announcement-editor__columns">
        <form
          className="announcement-editor__form"
          onSubmit={publish}
          noValidate
        >
          <div className="announcement-editor__field">
            <label
              className="announcement-editor__label"
              htmlFor={`${id}-title`}
            >
              Title
            </label>
            <Input
              id={`${id}-title`}
              value={title}
              aria-required
              aria-invalid={missing.title || undefined}
              aria-describedby={missing.title ? `${id}-title-error` : undefined}
              onChange={(event) => {
                setTitle(event.target.value);
                setMissing((now) => ({ ...now, title: false }));
              }}
            />
            {missing.title ? (
              <p
                id={`${id}-title-error`}
                className="announcement-editor__error"
              >
                Give the announcement a title.
              </p>
            ) : null}
          </div>
          <div className="announcement-editor__field">
            <span className="announcement-editor__label" id={`${id}-body`}>
              Announcement
            </span>
            <RichTextEditor
              aria-labelledby={`${id}-body`}
              aria-required
              aria-invalid={missing.body || undefined}
              aria-describedby={missing.body ? `${id}-body-error` : undefined}
              placeholder="What should everyone know?"
              maxLength={most}
              headingLevels={[3]}
              value={body}
              onValueChange={(html) => {
                setBody(html);
                setMissing((now) => ({ ...now, body: false }));
              }}
            />
            {missing.body ? (
              <p id={`${id}-body-error`} className="announcement-editor__error">
                Write the announcement before you publish it.
              </p>
            ) : null}
          </div>
          <div className="announcement-editor__actions">
            <Button type="submit">Publish</Button>
            <Button
              type="button"
              intent="secondary"
              onClick={() => {
                setTitle("");
                setBody("");
                setSaid("");
              }}
            >
              Start again
            </Button>
          </div>
          <p className="announcement-editor__said" role="status">
            {said}
          </p>
        </form>
        <section
          className="announcement-editor__preview"
          aria-labelledby={`${id}-preview`}
        >
          <h2 className="announcement-editor__heading" id={`${id}-preview`}>
            As it will be read
          </h2>
          <article className="announcement-editor__card">
            <h3 className="announcement-editor__name">
              {title.trim() || "No title yet"}
            </h3>
            {body === "" ? (
              <p className="announcement-editor__empty">Nothing written yet.</p>
            ) : (
              // The editor again, read only and with nothing around the
              // text. It reads the HTML through the rules it writes with,
              // so nothing in it is run, which putting the HTML straight
              // in the page wouldn't promise.
              <RichTextEditor
                aria-label="The announcement as it will be read"
                className="announcement-editor__read"
                readOnly
                headingLevels={[3]}
                value={body}
              >
                <RichTextEditorContent />
              </RichTextEditor>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

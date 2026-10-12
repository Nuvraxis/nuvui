"use client";

import { RichTextEditor } from "@nuvui/editor";
import { Button, Input } from "@nuvui/react";
import { useEffect, useId, useState } from "react";
import "./document-editor.scss";

// Made up, and stands in for a page your server has kept.
const kept = {
  title: "How refunds work",
  body: "<h2>Who can ask</h2><p>Anyone with the <strong>billing</strong> role can ask for a refund on an invoice paid in the last 60 days.</p><h2>How long it takes</h2><p>We answer within two working days.</p><h3>Card payments</h3><p>The money is back on the card in five to ten days.</p><h3>Bank transfers</h3><p>We need the account's details again, since we don't keep them.</p>",
};

interface Heading {
  level: number;
  text: string;
}

// The headings in the HTML, and how many words it has. Read in a
// document that's never shown, so nothing in the HTML is run or loaded.
function read(html: string): { headings: Heading[]; words: number } {
  const page = new DOMParser().parseFromString(html, "text/html");
  const headings = Array.from(page.body.querySelectorAll("h2, h3")).map(
    (heading) => ({
      level: Number(heading.tagName.slice(1)),
      text: heading.textContent?.trim() ?? "",
    }),
  );
  const text = Array.from(page.body.children)
    .map((child) => child.textContent ?? "")
    .join(" ");
  return {
    headings: headings.filter((heading) => heading.text !== ""),
    words: text.split(/\s+/).filter(Boolean).length,
  };
}

export default function DocumentEditor() {
  const id = useId();
  const [title, setTitle] = useState(kept.title);
  const [body, setBody] = useState(kept.body);
  const [saved, setSaved] = useState(kept);
  const [seen, setSeen] = useState<{ headings: Heading[]; words: number }>({
    headings: [],
    words: 0,
  });

  // After the page is in a browser, where there's a parser to read
  // the HTML with.
  useEffect(() => {
    setSeen(read(body));
  }, [body]);

  const changed = title !== saved.title || body !== saved.body;
  const minutes = Math.max(1, Math.round(seen.words / 200));

  return (
    <main className="document-editor">
      <header className="document-editor__head">
        <div className="document-editor__intro">
          <h1 className="document-editor__title">Edit page</h1>
          <p className="document-editor__state" role="status">
            {changed ? "Unsaved changes" : "All changes saved"}
          </p>
        </div>
        <div className="document-editor__actions">
          <Button
            type="button"
            intent="secondary"
            onClick={() => {
              setTitle(saved.title);
              setBody(saved.body);
            }}
          >
            Discard changes
          </Button>
          <Button
            type="button"
            onClick={() => {
              // Here the title and the HTML go to your server, which
              // checks the HTML again before it keeps it.
              setSaved({ title, body });
            }}
          >
            Save
          </Button>
        </div>
      </header>
      <div className="document-editor__columns">
        <div className="document-editor__page">
          <div className="document-editor__field">
            <label className="document-editor__label" htmlFor={`${id}-title`}>
              Title
            </label>
            <Input
              id={`${id}-title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="document-editor__field">
            <span className="document-editor__label" id={`${id}-body`}>
              Page
            </span>
            <RichTextEditor
              aria-labelledby={`${id}-body`}
              placeholder="Start with a heading"
              value={body}
              onValueChange={setBody}
            />
          </div>
        </div>
        <aside
          className="document-editor__aside"
          aria-labelledby={`${id}-outline`}
        >
          <h2 className="document-editor__heading" id={`${id}-outline`}>
            On this page
          </h2>
          {seen.headings.length === 0 ? (
            <p className="document-editor__none">
              Headings you write are listed here.
            </p>
          ) : (
            <ol className="document-editor__outline">
              {seen.headings.map((heading, index) => (
                <li
                  // Two headings can say the same thing. Their place in
                  // the page is what tells them apart.
                  key={`${index}-${heading.text}`}
                  className="document-editor__entry"
                  data-level={heading.level}
                >
                  {heading.text}
                </li>
              ))}
            </ol>
          )}
          <p className="document-editor__count">
            {seen.words} {seen.words === 1 ? "word" : "words"}, about {minutes}{" "}
            min to read
          </p>
        </aside>
      </div>
    </main>
  );
}

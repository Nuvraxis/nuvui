"use client";

import {
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  SearchQuery,
  setSearchQuery,
} from "@codemirror/search";
import type { EditorState } from "@codemirror/state";
import { Button } from "@nuvui/react/button";
import { Input } from "@nuvui/react/input";
import { Toggle } from "@nuvui/react/toggle";
import { type FormEvent, type KeyboardEvent, useEffect, useRef } from "react";
import { useCodeEditor, useViewValue } from "./context";

// Counted up to this many. Past it, the count says "1000+" rather than go
// through every match of a single letter in a long file on each key.
const most = 1000;

// How many matches there are, and which is the one selected.
function matchesOf(state: EditorState) {
  const query = getSearchQuery(state);
  if (!query.search || !query.valid) return "0,0";
  const { from, to } = state.selection.main;
  const cursor = query.getCursor(state);
  let total = 0;
  let current = 0;
  for (let next = cursor.next(); !next.done; next = cursor.next()) {
    total += 1;
    if (next.value.from === from && next.value.to === to) current = total;
    if (total >= most) break;
  }
  return `${current},${total}`;
}

const paths = {
  previous: "M4 10l4-4 4 4",
  next: "M4 6l4 4 4-4",
  close: "M4 4l8 8M12 4l-8 8",
};

function Glyph({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

// The letters on an option are a picture of what it does, and the stylesheet
// draws them from the attribute. As text they'd be words on the button that
// its name doesn't have, which WCAG's label in name asks against.
function Option({
  label,
  pressed,
  onChange,
  glyph,
  className = "nuv-code-editor__glyph",
}: {
  label: string;
  pressed: boolean;
  onChange: (pressed: boolean) => void;
  glyph: string;
  className?: string;
}) {
  return (
    <Toggle
      size="sm"
      aria-label={label}
      title={label}
      pressed={pressed}
      onPressedChange={onChange}
      className="nuv-code-editor__search-option"
    >
      <span className={className} data-glyph={glyph} aria-hidden="true" />
    </Toggle>
  );
}

/**
 * Find and replace, drawn where CodeMirror puts its search panel: Ctrl-F
 * or Cmd-F opens it. Enter finds the next match and Shift-Enter the one
 * before, and Escape goes back to the code.
 */
export function SearchPanel() {
  const { view, store, labels, locked } = useCodeEditor("CodeEditor");
  const find = useRef<HTMLInputElement>(null);
  // Drawn when the query or the matches change.
  const asked = useViewValue(
    view,
    store,
    (now) => {
      const query = getSearchQuery(now.state);
      return JSON.stringify([
        query.search,
        query.replace,
        query.caseSensitive,
        query.wholeWord,
        query.regexp,
      ]);
    },
    "",
  );
  const counted = useViewValue(
    view,
    store,
    (now) => matchesOf(now.state),
    "0,0",
  );

  // CodeMirror looks for the field to focus before React has drawn it.
  useEffect(() => {
    find.current?.focus();
    find.current?.select();
  }, []);

  if (!view || !asked) return null;
  const query = getSearchQuery(view.state);
  const [current = 0, total = 0] = counted.split(",").map(Number);

  const change = (
    next: Partial<{
      search: string;
      replace: string;
      caseSensitive: boolean;
      wholeWord: boolean;
      regexp: boolean;
    }>,
  ) => {
    view.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: query.search,
          replace: query.replace,
          caseSensitive: query.caseSensitive,
          wholeWord: query.wholeWord,
          regexp: query.regexp,
          ...next,
        }),
      ),
    });
  };

  const close = () => {
    closeSearchPanel(view);
    view.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  const onFindKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) findPrevious(view);
      else findNext(view);
    }
  };

  const onReplaceKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      replaceNext(view);
    }
  };

  const shown = total >= most ? `${most}+` : labels.matches(current, total);

  return (
    // biome-ignore lint/a11y/useSemanticElements: a form with the search role is what a screen reader knows as a search, and the element of its own isn't in every browser this supports
    <form
      role="search"
      aria-label={labels.search}
      className="nuv-code-editor__search-form"
      onKeyDown={onKeyDown}
      onSubmit={(event: FormEvent) => event.preventDefault()}
    >
      <div className="nuv-code-editor__search-row">
        <Input
          ref={find}
          aria-label={labels.find}
          placeholder={labels.find}
          value={query.search}
          onChange={(event) => change({ search: event.target.value })}
          onKeyDown={onFindKey}
          aria-invalid={query.search && !query.valid ? true : undefined}
          className="nuv-code-editor__search-field"
          {...{ "main-field": "true" }}
        />
        <span
          aria-live="polite"
          aria-atomic="true"
          className="nuv-code-editor__matches"
        >
          {query.search ? shown : ""}
        </span>
        <Button
          type="button"
          intent="ghost"
          size="sm"
          aria-label={labels.findPrevious}
          title={labels.findPrevious}
          disabled={total === 0}
          onClick={() => findPrevious(view)}
          className="nuv-code-editor__search-button"
        >
          <Glyph path={paths.previous} />
        </Button>
        <Button
          type="button"
          intent="ghost"
          size="sm"
          aria-label={labels.findNext}
          title={labels.findNext}
          disabled={total === 0}
          onClick={() => findNext(view)}
          className="nuv-code-editor__search-button"
        >
          <Glyph path={paths.next} />
        </Button>
        <Option
          label={labels.matchCase}
          pressed={query.caseSensitive}
          onChange={(caseSensitive) => change({ caseSensitive })}
          glyph="Aa"
        />
        <Option
          label={labels.wholeWord}
          pressed={query.wholeWord}
          onChange={(wholeWord) => change({ wholeWord })}
          glyph="ab"
          className="nuv-code-editor__glyph nuv-code-editor__whole-word"
        />
        <Option
          label={labels.regexp}
          pressed={query.regexp}
          onChange={(regexp) => change({ regexp })}
          glyph=".*"
        />
        <Button
          type="button"
          intent="ghost"
          size="sm"
          aria-label={labels.closeSearch}
          title={labels.closeSearch}
          onClick={close}
          className="nuv-code-editor__search-button nuv-code-editor__search-close"
        >
          <Glyph path={paths.close} />
        </Button>
      </div>
      {locked ? null : (
        <div className="nuv-code-editor__search-row">
          <Input
            aria-label={labels.replace}
            placeholder={labels.replace}
            value={query.replace}
            onChange={(event) => change({ replace: event.target.value })}
            onKeyDown={onReplaceKey}
            className="nuv-code-editor__search-field"
          />
          <Button
            type="button"
            intent="secondary"
            size="sm"
            disabled={total === 0}
            onClick={() => replaceNext(view)}
          >
            {labels.replaceNext}
          </Button>
          <Button
            type="button"
            intent="secondary"
            size="sm"
            disabled={total === 0}
            onClick={() => replaceAll(view)}
          >
            {labels.replaceAll}
          </Button>
        </div>
      )}
    </form>
  );
}

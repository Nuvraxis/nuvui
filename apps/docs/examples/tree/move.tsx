"use client";

import { Button, Tree, TreeItem, type TreeMove } from "@nuvui/react";
import { useState } from "react";

// A section has pages, even if none yet. A page has none and can't.
interface Entry {
  id: string;
  name: string;
  pages?: Entry[];
}

const start: Entry[] = [
  {
    id: "guides",
    name: "Guides",
    pages: [
      { id: "install", name: "Install" },
      { id: "theme", name: "Choose a theme" },
      { id: "forms", name: "Forms" },
    ],
  },
  {
    id: "reference",
    name: "Reference",
    pages: [{ id: "tokens", name: "Tokens" }],
  },
  { id: "drafts", name: "Drafts", pages: [] },
  { id: "changelog", name: "Changelog" },
];

const find = (entries: Entry[], id: string): Entry | undefined => {
  for (const entry of entries) {
    if (entry.id === id) return entry;
    const inside = find(entry.pages ?? [], id);
    if (inside) return inside;
  }
};

// The entries with a move made: the moved ones taken out of where they
// were, and put back at the place the move names.
function moved(entries: Entry[], move: TreeMove): Entry[] {
  const taken: Entry[] = [];
  const take = (from: Entry[]): Entry[] =>
    from.flatMap((entry) => {
      if (move.values.includes(entry.id)) {
        taken.push(entry);
        return [];
      }
      return [entry.pages ? { ...entry, pages: take(entry.pages) } : entry];
    });
  const put = (into: Entry[]): Entry[] =>
    into.flatMap((entry) => {
      if (entry.id !== move.target) {
        return [entry.pages ? { ...entry, pages: put(entry.pages) } : entry];
      }
      if (move.position === "before") return [...taken, entry];
      if (move.position === "after") return [entry, ...taken];
      return [{ ...entry, pages: [...(entry.pages ?? []), ...taken] }];
    });
  return put(take(entries));
}

export default function Example() {
  const [entries, setEntries] = useState(start);

  const rows = (list: Entry[]) =>
    list.map((entry) => (
      <TreeItem key={entry.id} value={entry.id} label={entry.name}>
        {entry.pages && entry.pages.length > 0 ? rows(entry.pages) : null}
      </TreeItem>
    ));

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Tree
        aria-label="Pages"
        defaultExpanded={["guides"]}
        onMove={(move) => setEntries((now) => moved(now, move))}
        // Only a section can have pages put inside it.
        canDrop={(move) =>
          move.position !== "inside" ||
          find(entries, move.target)?.pages !== undefined
        }
      >
        {rows(entries)}
      </Tree>
      <div>
        <Button size="sm" intent="secondary" onClick={() => setEntries(start)}>
          Put back
        </Button>
      </div>
    </div>
  );
}

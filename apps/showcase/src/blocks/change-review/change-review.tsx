"use client";

import { DiffEditor, type DiffEditorSummary } from "@nuvui/editor/code";
import { Badge, Button } from "@nuvui/react";
import { useMemo, useState } from "react";
import "./change-review.scss";

interface File {
  path: string;
  language: string;
  before: string;
  after: string;
}

const files: File[] = [
  {
    path: "src/checkout/shipping.ts",
    language: "typescript",
    before: `export const shipping = {
  carrier: "Northwind Freight",
  days: 5,
  freeOver: 80,
};

export function cost(total: number) {
  if (total > shipping.freeOver) return 0;
  return 6.5;
}

export function arrives(placed: Date) {
  const day = new Date(placed);
  day.setDate(day.getDate() + shipping.days);
  return day;
}
`,
    after: `export const shipping = {
  carrier: "Northwind Freight",
  days: 3,
  freeOver: 60,
};

export function cost(total: number, express = false) {
  if (total >= shipping.freeOver) return 0;
  return express ? 12 : 6.5;
}

export function arrives(placed: Date) {
  const day = new Date(placed);
  day.setDate(day.getDate() + shipping.days);
  return day;
}
`,
  },
  {
    path: "src/checkout/summary.css",
    language: "css",
    before: `.summary {
  display: grid;
  gap: 8px;
}

.summary__total {
  font-weight: 600;
}
`,
    after: `.summary {
  display: grid;
  gap: 12px;
}

.summary__total {
  font-size: 1.125rem;
  font-weight: 600;
}

.summary__express {
  color: var(--color-muted-foreground);
}
`,
  },
  {
    path: "config/stores.yaml",
    language: "yaml",
    before: `stores:
  - name: Harbor Street
    opens: "08:00"
  - name: Mill Lane
    opens: "09:00"
`,
    after: `stores:
  - name: Harbor Street
    opens: "07:30"
  - name: Mill Lane
    opens: "09:00"
  - name: Quayside
    opens: "08:00"
`,
  },
];

// Lines added and removed between two texts, from the longest run of
// lines they share. Enough for files of this size, to count them before
// one's opened.
function count(before: string, after: string): DiffEditorSummary {
  const a = before.split("\n");
  const b = after.split("\n");
  const width = b.length + 1;
  // How many lines the two share from each pair of places onward.
  const shared = new Int32Array((a.length + 1) * width);
  const at = (i: number, j: number) => shared[i * width + j] ?? 0;
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      shared[i * width + j] =
        a[i] === b[j]
          ? at(i + 1, j + 1) + 1
          : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }
  const same = at(0, 0);
  // Each stretch of lines that differ is one change.
  let changes = 0;
  let inside = false;
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      i += 1;
      j += 1;
      inside = false;
      continue;
    }
    if (!inside) changes += 1;
    inside = true;
    if (j < b.length && (i >= a.length || at(i, j + 1) >= at(i + 1, j))) {
      j += 1;
    } else {
      i += 1;
    }
  }
  return { changes, added: b.length - same, removed: a.length - same };
}

export default function ChangeReview() {
  const [chosen, setChosen] = useState(files[0]?.path ?? "");
  const [texts, setTexts] = useState(() =>
    Object.fromEntries(files.map((file) => [file.path, file.after])),
  );
  // Each file's original, with the changes that were kept written in, so
  // they stay kept when the file is opened again.
  const [originals, setOriginals] = useState(() =>
    Object.fromEntries(files.map((file) => [file.path, file.before])),
  );
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(
      files.map((file) => [file.path, count(file.before, file.after)]),
    ),
  );
  const file = files.find((item) => item.path === chosen) ?? files[0];

  const totals = useMemo(
    () =>
      Object.values(counts).reduce(
        (sum, each) => ({
          files: sum.files + (each.changes > 0 ? 1 : 0),
          added: sum.added + each.added,
          removed: sum.removed + each.removed,
        }),
        { files: 0, added: 0, removed: 0 },
      ),
    [counts],
  );

  if (!file) return null;

  return (
    <div className="change-review">
      <header className="change-review__head">
        <div className="change-review__heading">
          <h1 className="change-review__title">
            Faster shipping for small orders
          </h1>
          <p className="change-review__meta">
            {totals.files === 0
              ? "Every change has been kept or undone."
              : `${totals.files} ${totals.files === 1 ? "file" : "files"} changed, ${totals.added} lines added, ${totals.removed} removed.`}
          </p>
        </div>
        <Button disabled={totals.files > 0}>Merge</Button>
      </header>

      <div className="change-review__body">
        <nav aria-label="Changed files" className="change-review__files">
          <ul className="change-review__list">
            {files.map((item) => {
              const each = counts[item.path];
              return (
                <li key={item.path}>
                  <button
                    type="button"
                    aria-current={item.path === chosen ? "true" : undefined}
                    onClick={() => setChosen(item.path)}
                    className="change-review__file"
                  >
                    <span className="change-review__path">{item.path}</span>
                    {each && each.changes > 0 ? (
                      <span className="change-review__counts">
                        <span className="change-review__added">
                          +{each.added}
                        </span>
                        <span className="change-review__removed">
                          −{each.removed}
                        </span>
                      </span>
                    ) : (
                      <Badge intent="success">Done</Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <DiffEditor
          // A file of its own, with its own folds and cursor.
          key={file.path}
          aria-label={`Changes to ${file.path}`}
          original={originals[file.path] ?? file.before}
          onOriginalChange={(next) =>
            setOriginals((before) => ({ ...before, [file.path]: next }))
          }
          modified={texts[file.path]}
          onModifiedChange={(next, summary) => {
            setTexts((before) => ({ ...before, [file.path]: next }));
            setCounts((before) => ({ ...before, [file.path]: summary }));
          }}
          language={file.language}
          editable
          collapseUnchanged={{ margin: 2 }}
          className="change-review__diff"
        />
      </div>
    </div>
  );
}

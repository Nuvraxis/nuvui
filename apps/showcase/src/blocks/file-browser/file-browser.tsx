"use client";

import {
  Badge,
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tree,
  TreeItem,
  type TreeMove,
} from "@nuvui/react";
import { Download, File, Folder, FolderOpen, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import "./file-browser.scss";

// Made-up files for a made-up team. Nothing here is real data.

interface Entry {
  id: string;
  name: string;
  // A folder has entries, even if none. A file has a size.
  entries?: Entry[];
  size?: string;
  changed?: string;
  by?: string;
}

const start: Entry[] = [
  {
    id: "contracts",
    name: "Contracts",
    entries: [
      {
        id: "contracts/2026",
        name: "2026",
        entries: [
          {
            id: "contracts/2026/northwind.pdf",
            name: "northwind.pdf",
            size: "184 KB",
            changed: "October 2",
            by: "Ada Lovelace",
          },
          {
            id: "contracts/2026/contoso.pdf",
            name: "contoso.pdf",
            size: "212 KB",
            changed: "September 18",
            by: "Bo Jensen",
          },
        ],
      },
      {
        id: "contracts/template.docx",
        name: "template.docx",
        size: "48 KB",
        changed: "June 30",
        by: "Cleo Park",
      },
    ],
  },
  {
    id: "reports",
    name: "Reports",
    entries: [
      {
        id: "reports/q3.xlsx",
        name: "q3.xlsx",
        size: "1.2 MB",
        changed: "October 6",
        by: "Bo Jensen",
      },
      {
        id: "reports/q3-summary.pdf",
        name: "q3-summary.pdf",
        size: "96 KB",
        changed: "October 7",
        by: "Ada Lovelace",
      },
    ],
  },
  { id: "archive", name: "Archive", entries: [] },
  {
    id: "handbook.pdf",
    name: "handbook.pdf",
    size: "2.4 MB",
    changed: "August 12",
    by: "Cleo Park",
  },
];

// What the top of the tree is called in the list of places to move to.
// Not an id any entry has.
const top = "/";

// Every entry by its id, with the ids of the folders it's inside.
function indexOf(files: Entry[]) {
  const index = new Map<string, { entry: Entry; inside: string[] }>();
  const add = (entries: Entry[], inside: string[]) => {
    for (const entry of entries) {
      index.set(entry.id, { entry, inside });
      if (entry.entries) add(entry.entries, [...inside, entry.id]);
    }
  };
  add(files, []);
  return index;
}

// The files with a move made: the moved entries taken out of where they
// were, and put back at the place the move names.
function moved(files: Entry[], move: TreeMove): Entry[] {
  const taken: Entry[] = [];
  const take = (from: Entry[]): Entry[] =>
    from.flatMap((entry) => {
      if (move.values.includes(entry.id)) {
        taken.push(entry);
        return [];
      }
      return [
        entry.entries ? { ...entry, entries: take(entry.entries) } : entry,
      ];
    });
  const put = (into: Entry[]): Entry[] =>
    into.flatMap((entry) => {
      if (entry.id !== move.target) {
        return [
          entry.entries ? { ...entry, entries: put(entry.entries) } : entry,
        ];
      }
      if (move.position === "before") return [...taken, entry];
      if (move.position === "after") return [entry, ...taken];
      return [{ ...entry, entries: [...(entry.entries ?? []), ...taken] }];
    });
  return put(take(files));
}

const count = (entries: Entry[]) =>
  `${entries.length} ${entries.length === 1 ? "item" : "items"}`;

export default function FileBrowser() {
  // Keep these on your server, and change them there from `move`.
  const [files, setFiles] = useState(start);
  const [expanded, setExpanded] = useState(["contracts"]);
  const [selected, setSelected] = useState(["contracts/template.docx"]);
  const index = useMemo(() => indexOf(files), [files]);
  const found = index.get(selected[0] ?? "");
  // Where the chosen entry could be moved to: the top, and every folder
  // but itself and the folders inside it.
  const places = found
    ? [...index.values()].filter(
        ({ entry, inside }) =>
          entry.entries !== undefined &&
          entry.id !== found.entry.id &&
          !inside.includes(found.entry.id),
      )
    : [];

  const move = (change: TreeMove) => setFiles((now) => moved(now, change));

  // From the panel, for anyone who can't drag: the same move, chosen from
  // a list.
  function moveTo(id: string, folder: string) {
    if (folder === top) {
      const last = files.filter((entry) => entry.id !== id).at(-1);
      if (last) move({ values: [id], target: last.id, position: "after" });
      return;
    }
    move({ values: [id], target: folder, position: "inside" });
    const inside = index.get(folder)?.inside ?? [];
    setExpanded((current) => [...new Set([...current, ...inside, folder])]);
  }

  // From the panel: selects an entry, and opens the folders it's inside so
  // the tree shows where it is.
  function show(id: string) {
    const inside = index.get(id)?.inside ?? [];
    setExpanded((current) => [...new Set([...current, ...inside])]);
    setSelected([id]);
  }

  const rows = (entries: Entry[]) =>
    entries.map((entry) => {
      const open = expanded.includes(entry.id);
      const Icon = entry.entries ? (open ? FolderOpen : Folder) : File;
      return (
        <TreeItem
          key={entry.id}
          value={entry.id}
          textValue={entry.name}
          label={
            <>
              <Icon
                aria-hidden="true"
                size={16}
                className="file-browser__icon"
              />
              {entry.name}
            </>
          }
        >
          {/* A folder with nothing in it is still a folder, and can't be
              opened: there's nothing to show. */}
          {entry.entries && entry.entries.length > 0
            ? rows(entry.entries)
            : null}
        </TreeItem>
      );
    });

  return (
    <main className="file-browser">
      <header className="file-browser__head">
        <h1 className="file-browser__title">Files</h1>
        <p className="file-browser__text">
          Arrow keys move through the folders, and a letter jumps to a name.
          Drag a row to move it, or hold Alt and press an arrow.
        </p>
      </header>
      <div className="file-browser__panes">
        <Tree
          aria-label="Folders and files"
          className="file-browser__tree"
          selectionMode="single"
          value={selected}
          onValueChange={setSelected}
          expanded={expanded}
          onExpandedChange={setExpanded}
          onMove={move}
          // Only a folder can have things put in it.
          canDrop={({ target, position }) =>
            position !== "inside" ||
            index.get(target)?.entry.entries !== undefined
          }
        >
          {rows(files)}
        </Tree>
        <section
          className="file-browser__detail"
          aria-labelledby="file-browser-name"
        >
          {found ? (
            <>
              <div className="file-browser__name">
                <h2 id="file-browser-name" className="file-browser__heading">
                  {found.entry.name}
                </h2>
                <Badge variant="outline">
                  {found.entry.entries ? "Folder" : "File"}
                </Badge>
              </div>
              <p className="file-browser__path">
                {[
                  "Files",
                  ...found.inside.map((id) => index.get(id)?.entry.name),
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
              {found.entry.entries ? (
                found.entry.entries.length > 0 ? (
                  <>
                    <p className="file-browser__text">
                      {count(found.entry.entries)}
                    </p>
                    <ul className="file-browser__list">
                      {found.entry.entries.map((entry) => (
                        <li key={entry.id}>
                          <Button
                            intent="ghost"
                            className="file-browser__entry"
                            onClick={() => show(entry.id)}
                          >
                            {entry.entries ? (
                              <Folder aria-hidden="true" size={16} />
                            ) : (
                              <File aria-hidden="true" size={16} />
                            )}
                            {entry.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="file-browser__text">
                    There's nothing in this folder.
                  </p>
                )
              ) : (
                <>
                  <dl className="file-browser__facts">
                    <div>
                      <dt className="file-browser__term">Size</dt>
                      <dd className="file-browser__value">
                        {found.entry.size}
                      </dd>
                    </div>
                    <div>
                      <dt className="file-browser__term">Changed</dt>
                      <dd className="file-browser__value">
                        {found.entry.changed}
                      </dd>
                    </div>
                    <div>
                      <dt className="file-browser__term">By</dt>
                      <dd className="file-browser__value">{found.entry.by}</dd>
                    </div>
                  </dl>
                  {/* What these do is yours to write. */}
                  <div className="file-browser__actions">
                    <Button>
                      <Download aria-hidden="true" size={16} />
                      Download
                    </Button>
                    <Button intent="secondary">
                      <Share2 aria-hidden="true" size={16} />
                      Share
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <h2 id="file-browser-name" className="file-browser__heading">
              Choose a file
            </h2>
          )}
          {found ? (
            <Field className="file-browser__move">
              <FieldLabel>Move to</FieldLabel>
              <Select
                value={found.inside.at(-1) ?? top}
                onValueChange={(folder) => moveTo(found.entry.id, folder)}
              >
                <FieldControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FieldControl>
                <SelectContent>
                  <SelectItem value={top}>Files</SelectItem>
                  {places.map((place) => (
                    <SelectItem key={place.entry.id} value={place.entry.id}>
                      {[
                        ...place.inside.map((id) => index.get(id)?.entry.name),
                        place.entry.name,
                      ].join(" / ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                The same as dragging it there in the tree.
              </FieldDescription>
            </Field>
          ) : null}
        </section>
      </div>
    </main>
  );
}

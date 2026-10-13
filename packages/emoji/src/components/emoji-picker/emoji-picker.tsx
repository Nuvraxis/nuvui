"use client";

import { useDirection } from "@nuvui/react/direction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@nuvui/react/dropdown-menu";
import { Input } from "@nuvui/react/input";
import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type EmojiGroup,
  type EmojiItem,
  emojiGroups,
  toItems,
} from "../../data/rows";
import { cx } from "../../utils/cx";

/** No tone, which is the yellow of the emoji itself, and five from light to dark. */
export type EmojiSkinTone = 0 | 1 | 2 | 3 | 4 | 5;

export interface EmojiPickerLabels {
  /** The name of the search box, and what's written in it while it's empty. */
  search?: string;
  /** The name of the list of emoji. */
  list?: string;
  /** The name of the row of buttons that jump to a group. */
  groups?: string;
  /** The heading over the ones picked before. */
  recent?: string;
  /** The heading over what a search found. */
  results?: string;
  /** The name of each group. */
  group?: Partial<Record<EmojiGroup, string>>;
  /** The name of the control for the skin tone. */
  skinTone?: string;
  /** The six tones, from none to dark. */
  skinTones?: [string, string, string, string, string, string];
  /** Said after a search, with how many it found. */
  found?: (count: number) => string;
  /** Shown and said while the list is on its way. */
  loading?: string;
}

const groupNames: Record<EmojiGroup, string> = {
  smileys: "Smileys and emotion",
  people: "People and body",
  animals: "Animals and nature",
  food: "Food and drink",
  travel: "Travel and places",
  activities: "Activities",
  objects: "Objects",
  symbols: "Symbols",
  flags: "Flags",
};

const english = {
  search: "Search emoji",
  list: "Emoji",
  groups: "Emoji groups",
  recent: "Recently used",
  results: "Search results",
  skinTone: "Skin tone",
  skinTones: [
    "Default",
    "Light",
    "Medium-light",
    "Medium",
    "Medium-dark",
    "Dark",
  ] as [string, string, string, string, string, string],
  found: (count: number) =>
    count === 0
      ? "No emoji found"
      : count === 1
        ? "1 emoji found"
        : `${count} emoji found`,
  loading: "Loading emoji",
};

// What stands for each group on its button. The words are in its name.
const signs: Record<EmojiGroup | "recent", string> = {
  recent: "🕒",
  smileys: "😀",
  people: "👋",
  animals: "🐶",
  food: "🍎",
  travel: "🚗",
  activities: "⚽",
  objects: "💡",
  symbols: "🔣",
  flags: "🏁",
};

const hands = ["✋", "✋🏻", "✋🏼", "✋🏽", "✋🏾", "✋🏿"];

export interface EmojiPickerOwnProps {
  /**
   * Called when an emoji is picked, with the emoji as text, in the skin
   * tone that's set, and with what the list knows about it.
   */
  onEmojiSelect?: (emoji: string, item: EmojiItem) => void;
  /**
   * The emoji to list, when the ones it comes with aren't the ones you
   * want: another language's names, or fewer. Without it, the list it
   * comes with is loaded when the picker is first drawn.
   */
  data?: EmojiItem[];
  /**
   * The newest version of Emoji to list. Newer ones are left out, since
   * a device that doesn't have them draws an empty box.
   * @default 15
   */
  emojiVersion?: number;
  /** The skin tone, when you keep it. Use it with `onSkinToneChange`. */
  skinTone?: EmojiSkinTone;
  /**
   * The skin tone to begin with, when it's kept here.
   * @default 0
   */
  defaultSkinTone?: EmojiSkinTone;
  /** Called when another skin tone is chosen. */
  onSkinToneChange?: (tone: EmojiSkinTone) => void;
  /**
   * The emoji picked before, newest first, when you keep them. Use it
   * with `onRecentChange`. An empty list shows none.
   */
  recent?: string[];
  /** Called with the new list when an emoji is picked. */
  onRecentChange?: (recent: string[]) => void;
  /**
   * How many picked emoji are remembered.
   * @default 16
   */
  maxRecent?: number;
  /**
   * The name the recent emoji and the skin tone are kept under in the
   * browser's local storage. `null` keeps nothing there.
   * @default "nuvui-emoji"
   */
  storageKey?: string | null;
  /**
   * Whether flags are listed. `"auto"` lists them where the device draws
   * them, which Windows doesn't.
   * @default "auto"
   */
  flags?: boolean | "auto";
  /**
   * Puts the caret in the search box when it's first drawn.
   * @default false
   */
  autoFocus?: boolean;
  /** What's said and not drawn, and the headings, for another language. */
  labels?: EmojiPickerLabels;
}

export interface EmojiPickerProps
  extends EmojiPickerOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof EmojiPickerOwnProps> {}

// The list it comes with is asked for once, however many pickers there are.
let builtIn: Promise<EmojiItem[]> | undefined;
const load = () => {
  builtIn ??= import("../../data/en").then((file) => toItems(file.rows));
  return builtIn;
};

interface Kept {
  recent?: string[];
  tone?: EmojiSkinTone;
}

function readKept(key: string | null): Kept {
  if (!key) return {};
  try {
    const kept = JSON.parse(localStorage.getItem(key) ?? "{}") as Kept;
    return {
      recent: Array.isArray(kept.recent)
        ? kept.recent.filter((entry) => typeof entry === "string")
        : undefined,
      tone:
        typeof kept.tone === "number" && kept.tone >= 0 && kept.tone <= 5
          ? kept.tone
          : undefined,
    };
  } catch {
    // Storage that's turned off, or something else's under the same name.
    return {};
  }
}

function writeKept(key: string | null, change: Kept) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({ ...readKept(key), ...change }));
  } catch {
    // Full, or turned off. The picker works without it.
  }
}

// Whether the device draws a flag as a flag. Windows draws its two
// letters, and a device with no emoji at all draws a box. Either is
// drawn in the text's one color, where a flag has several.
function drawsFlags(): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return false;
    context.textBaseline = "top";
    context.font =
      '16px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    context.fillText("🇫🇷", 0, 0);
    const { data } = context.getImageData(0, 0, 24, 24);
    for (let index = 0; index < data.length; index += 4) {
      const [red, green, blue, alpha] = [
        data[index] ?? 0,
        data[index + 1] ?? 0,
        data[index + 2] ?? 0,
        data[index + 3] ?? 0,
      ];
      if (alpha > 0 && (red !== green || green !== blue)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u);

// Every word of what's typed begins a word of the emoji's name or of one
// of the other words it's found by.
function matches(item: EmojiItem, typed: string[]): boolean {
  const known = [...words(item.label), ...(item.tags ?? [])];
  return typed.every((word) => known.some((entry) => entry.startsWith(word)));
}

// The same, by the name alone. An emoji named for what was typed comes
// before one that's only found by it: "rocket" is the rocket first, and
// then the astronauts.
function named(item: EmojiItem, typed: string[]): boolean {
  const known = words(item.label);
  return typed.every((word) => known.some((entry) => entry.startsWith(word)));
}

// An emoji with the mark taken off that asks for it to be drawn in color.
// Some lists write the mark and some don't, and it's the same emoji to
// whoever picked it.
const bare = (emoji: string) => emoji.replaceAll("\uFE0F", "");

interface Section {
  key: EmojiGroup | "recent" | "results";
  title: string;
  items: EmojiItem[];
}

type Row =
  | { kind: "heading"; section: Section }
  // `from` is the place of its first emoji among all the emoji listed.
  | { kind: "emoji"; section: Section; from: number; items: EmojiItem[] };

// How many rows beyond the ones in view are drawn, each way.
const spare = 3;

const none: string[] = [];

/**
 * A panel to pick an emoji from: a search box, the emoji in their groups,
 * a row of buttons that jump to a group, a choice of skin tone, and the
 * ones picked before. It draws the device's own emoji, and only the rows
 * in view. Put it in a popover, or on the page as it is.
 */
export const EmojiPicker = forwardRef<HTMLDivElement, EmojiPickerProps>(
  function EmojiPicker(
    {
      onEmojiSelect,
      data,
      emojiVersion = 15,
      skinTone,
      defaultSkinTone = 0,
      onSkinToneChange,
      recent,
      onRecentChange,
      maxRecent = 16,
      storageKey = "nuvui-emoji",
      flags = "auto",
      autoFocus = false,
      labels: given,
      className,
      ...props
    },
    ref,
  ) {
    const id = useId();
    const direction = useDirection();
    const labels = useMemo(
      () => ({
        ...english,
        ...given,
        group: { ...groupNames, ...given?.group },
      }),
      [given],
    );

    const [loaded, setLoaded] = useState<EmojiItem[] | null>(null);
    useEffect(() => {
      if (data) return;
      let wanted = true;
      load().then((items) => {
        if (wanted) setLoaded(items);
      });
      return () => {
        wanted = false;
      };
    }, [data]);
    const all = data ?? loaded;

    // What the browser kept is read after the first draw, since a server
    // has no storage to read and the two have to draw the same thing.
    const [kept, setKept] = useState<Kept>({});
    const [flagged, setFlagged] = useState(flags === true);
    useEffect(() => {
      setKept(readKept(storageKey));
    }, [storageKey]);
    useEffect(() => {
      setFlagged(flags === "auto" ? drawsFlags() : flags);
    }, [flags]);

    const [ownTone, setOwnTone] = useState<EmojiSkinTone | undefined>();
    const tone = skinTone ?? ownTone ?? kept.tone ?? defaultSkinTone;
    function chooseTone(next: EmojiSkinTone) {
      setOwnTone(next);
      writeKept(storageKey, { tone: next });
      onSkinToneChange?.(next);
    }

    // The list of recent ones that's drawn is the one there was when the
    // picker was drawn. Picking adds to what's kept and not to what's
    // shown, so emoji don't move under the pointer as they're picked.
    // Kept by you, it's what you give.
    const picked = useRef<string[] | null>(null);
    const shownRecent = recent ?? kept.recent ?? none;

    const [query, setQuery] = useState("");
    const typed = useMemo(() => words(query).filter(Boolean), [query]);
    const searching = typed.length > 0;

    const listed = useMemo(
      () =>
        (all ?? []).filter(
          (item) =>
            (item.version ?? 0) <= emojiVersion &&
            (flagged || item.group !== "flags"),
        ),
      [all, emojiVersion, flagged],
    );

    const grouped = useMemo<Section[]>(() => {
      const byEmoji = new Map(listed.map((item) => [bare(item.emoji), item]));
      const before = shownRecent
        .map((emoji) => byEmoji.get(bare(emoji)))
        .filter((item): item is EmojiItem => item !== undefined);
      return [
        { key: "recent" as const, title: labels.recent, items: before },
        ...emojiGroups.map((group) => ({
          key: group,
          title: labels.group[group] ?? groupNames[group],
          items: listed.filter((item) => item.group === group),
        })),
      ].filter((section) => section.items.length > 0);
    }, [listed, shownRecent, labels]);

    const hits = useMemo(() => {
      if (!searching) return [];
      const all = listed.filter((item) => matches(item, typed));
      return [
        ...all.filter((item) => named(item, typed)),
        ...all.filter((item) => !named(item, typed)),
      ];
    }, [searching, listed, typed]);

    const sections = useMemo<Section[]>(
      () =>
        searching
          ? [
              {
                key: "results",
                title: labels.results,
                items: hits,
              },
            ]
          : grouped,
      [searching, grouped, hits, labels],
    );

    // The size of a cell and of a heading come from the stylesheet, which
    // is where a touch screen makes them larger. They're read from an
    // element that's given them and never seen.
    const viewport = useRef<HTMLDivElement>(null);
    const sizer = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLDivElement>(null);
    const [box, setBox] = useState({
      cell: 36,
      heading: 28,
      width: 0,
      height: 0,
    });
    useEffect(() => {
      const scroller = viewport.current;
      const measure = sizer.current;
      const inside = canvas.current;
      if (!scroller || !measure || !inside) return;
      const read = () =>
        setBox((now) => {
          const next = {
            cell: measure.offsetWidth || now.cell,
            heading: measure.offsetHeight || now.heading,
            // The room the rows have, which is the list's less its
            // padding and its scrollbar.
            width: inside.clientWidth,
            height: scroller.clientHeight,
          };
          return next.cell === now.cell &&
            next.heading === now.heading &&
            next.width === now.width &&
            next.height === now.height
            ? now
            : next;
        });
      read();
      const observer = new ResizeObserver(read);
      observer.observe(scroller);
      observer.observe(measure);
      observer.observe(inside);
      return () => observer.disconnect();
    }, []);
    const columns = Math.max(1, Math.floor(box.width / box.cell));

    const { rows, tops, total, cells, rowOf } = useMemo(() => {
      const rows: Row[] = [];
      const cells: EmojiItem[] = [];
      const rowOf: number[] = [];
      for (const section of sections) {
        rows.push({ kind: "heading", section });
        for (let at = 0; at < section.items.length; at += columns) {
          const items = section.items.slice(at, at + columns);
          for (const item of items) {
            rowOf.push(rows.length);
            cells.push(item);
          }
          rows.push({
            kind: "emoji",
            section,
            from: cells.length - items.length,
            items,
          });
        }
      }
      const tops: number[] = [];
      let total = 0;
      for (const row of rows) {
        tops.push(total);
        total += row.kind === "heading" ? box.heading : box.cell;
      }
      return { rows, tops, total, cells, rowOf };
    }, [sections, columns, box.heading, box.cell]);

    const heightOf = (row: number) =>
      rows[row]?.kind === "heading" ? box.heading : box.cell;

    const [scrolled, setScrolled] = useState(0);
    // The emoji the arrow keys are on, by its place among all listed.
    const [active, setActive] = useState<number | null>(null);

    // A new search, or a list that's changed, starts from the top.
    // biome-ignore lint/correctness/useExhaustiveDependencies: these are what make the list another list
    useEffect(() => {
      setActive(null);
      setScrolled(0);
      if (viewport.current) viewport.current.scrollTop = 0;
    }, [query, all, flagged, emojiVersion]);

    // The first row any of which is in view, and the last.
    let first = 0;
    while (first < rows.length - 1 && (tops[first + 1] ?? 0) <= scrolled) {
      first += 1;
    }
    let last = first;
    while (
      last < rows.length - 1 &&
      (tops[last + 1] ?? 0) < scrolled + box.height
    ) {
      last += 1;
    }
    const drawn = new Set<number>();
    for (
      let row = Math.max(0, first - spare);
      row <= Math.min(rows.length - 1, last + spare);
      row += 1
    ) {
      drawn.add(row);
    }
    // The row the keys are on is always drawn, so that what the list says
    // is active is there to be found.
    if (active !== null && rowOf[active] !== undefined) {
      drawn.add(rowOf[active] as number);
    }

    const current = rows[first]?.section.key;

    const reveal = useCallback(
      (row: number) => {
        const scroller = viewport.current;
        if (!scroller) return;
        const top = tops[row] ?? 0;
        const bottom =
          top + (rows[row]?.kind === "heading" ? box.heading : box.cell);
        // The heading over a group's first row comes into view with it.
        const above =
          rows[row - 1]?.kind === "heading" ? (tops[row - 1] ?? top) : top;
        if (above < scroller.scrollTop) scroller.scrollTop = above;
        else if (bottom > scroller.scrollTop + scroller.clientHeight) {
          scroller.scrollTop = bottom - scroller.clientHeight;
        }
      },
      [tops, rows, box.heading, box.cell],
    );

    function moveTo(next: number) {
      const to = Math.min(cells.length - 1, Math.max(0, next));
      if (cells.length === 0) return;
      setActive(to);
      reveal(rowOf[to] as number);
    }

    function pick(index: number) {
      const item = cells[index];
      if (!item) return;
      const emoji = (tone > 0 && item.skins?.[tone - 1]) || item.emoji;
      const before =
        picked.current ?? recent ?? readKept(storageKey).recent ?? [];
      const next = [
        item.emoji,
        ...before.filter((entry) => bare(entry) !== bare(item.emoji)),
      ].slice(0, maxRecent);
      picked.current = next;
      writeKept(storageKey, { recent: next });
      onRecentChange?.(next);
      onEmojiSelect?.(emoji, item);
    }

    // The emoji in the row above or below, in the same column, or the
    // last one of a row that's shorter.
    function vertical(from: number, by: 1 | -1): number {
      const row = rowOf[from] as number;
      const column = from - (rows[row] as Extract<Row, { kind: "emoji" }>).from;
      let to = row + by;
      while (rows[to] && rows[to]?.kind !== "emoji") to += by;
      const target = rows[to];
      if (target?.kind !== "emoji") return from;
      return target.from + Math.min(column, target.items.length - 1);
    }

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      if (cells.length === 0) return;
      const at = active ?? 0;
      const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      const back = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      const row = rows[rowOf[at] as number] as Extract<Row, { kind: "emoji" }>;
      const page = Math.max(1, Math.floor(box.height / box.cell) - 1);

      let to: number | null = null;
      if (active === null && event.key.startsWith("Arrow")) to = 0;
      else if (event.key === forward) to = at + 1;
      else if (event.key === back) to = at - 1;
      else if (event.key === "ArrowDown") to = vertical(at, 1);
      else if (event.key === "ArrowUp") to = vertical(at, -1);
      else if (event.key === "Home") {
        to = event.ctrlKey || event.metaKey ? 0 : row.from;
      } else if (event.key === "End") {
        to =
          event.ctrlKey || event.metaKey
            ? cells.length - 1
            : row.from + row.items.length - 1;
      } else if (event.key === "PageDown" || event.key === "PageUp") {
        to = at;
        for (let step = 0; step < page; step += 1) {
          to = vertical(to, event.key === "PageDown" ? 1 : -1);
        }
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (active !== null) pick(active);
        return;
      }
      if (to === null) return;
      event.preventDefault();
      moveTo(to);
    }

    // A group asked for in the middle of a search: the search is put
    // away first, and the jump waits for the groups to be drawn again.
    const wanted = useRef<Section["key"] | null>(null);
    // biome-ignore lint/correctness/useExhaustiveDependencies: it's the rows being new that this waits for
    useEffect(() => {
      if (!wanted.current || searching) return;
      const key = wanted.current;
      wanted.current = null;
      jump(key);
    }, [rows, searching]);

    function jump(key: Section["key"]) {
      if (searching) {
        wanted.current = key;
        setQuery("");
        return;
      }
      const scroller = viewport.current;
      const row = rows.findIndex(
        (entry) => entry.kind === "heading" && entry.section.key === key,
      );
      if (!scroller || row < 0) return;
      scroller.scrollTop = tops[row] ?? 0;
      setScrolled(scroller.scrollTop);
    }

    const cellId = (index: number) => `${id}-emoji-${index}`;
    const found = searching ? labels.found(cells.length) : "";
    const toned = (item: EmojiItem) =>
      (tone > 0 && item.skins?.[tone - 1]) || item.emoji;

    return (
      <div
        ref={ref}
        data-loading={all ? undefined : ""}
        className={cx("nuv-emoji-picker", className)}
        {...props}
      >
        <div className="nuv-emoji-picker__head">
          <Input
            type="search"
            aria-label={labels.search}
            placeholder={labels.search}
            autoFocus={autoFocus}
            autoComplete="off"
            enterKeyHint="search"
            className="nuv-emoji-picker__search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && cells.length > 0) {
                event.preventDefault();
                viewport.current?.focus();
                moveTo(active ?? 0);
              } else if (
                event.key === "Enter" &&
                searching &&
                cells.length > 0
              ) {
                // What was searched for is most often the first found.
                event.preventDefault();
                pick(0);
              }
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`${labels.skinTone}: ${labels.skinTones[tone]}`}
                title={labels.skinTone}
                className="nuv-emoji-picker__tone"
              >
                <span aria-hidden="true">{hands[tone]}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={String(tone)}
                onValueChange={(next: string) =>
                  chooseTone(Number(next) as EmojiSkinTone)
                }
              >
                {hands.map((hand, index) => (
                  <DropdownMenuRadioItem key={hand} value={String(index)}>
                    <span aria-hidden="true" className="nuv-emoji-picker__hand">
                      {hand}
                    </span>
                    {labels.skinTones[index]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="nuv-emoji-picker__body">
          {/* biome-ignore lint/a11y/useSemanticElements: a table can't draw only the rows in view */}
          <div
            ref={viewport}
            role="grid"
            tabIndex={0}
            // A grid with no rows in it is no grid. The words under it say
            // that nothing was found.
            hidden={all !== null && cells.length === 0}
            aria-label={labels.list}
            aria-busy={all ? undefined : true}
            aria-rowcount={rows.length}
            aria-colcount={columns}
            aria-activedescendant={active === null ? undefined : cellId(active)}
            className="nuv-emoji-picker__viewport"
            onScroll={(event) => setScrolled(event.currentTarget.scrollTop)}
            onKeyDown={onKeyDown}
            onFocus={() => {
              // Somewhere for the keys to start from: the first in view.
              if (active !== null || cells.length === 0) return;
              const row = rows.findIndex(
                (entry, index) => index >= first && entry.kind === "emoji",
              );
              const entry = rows[row];
              if (entry?.kind === "emoji") setActive(entry.from);
            }}
          >
            <div
              ref={sizer}
              aria-hidden="true"
              className="nuv-emoji-picker__sizer"
            />
            <div
              ref={canvas}
              role="presentation"
              className="nuv-emoji-picker__rows"
              style={{ blockSize: total }}
            >
              {[...drawn]
                .sort((a, b) => a - b)
                .map((index) => {
                  const row = rows[index] as Row;
                  const style = {
                    insetBlockStart: tops[index],
                    blockSize: heightOf(index),
                  };
                  if (row.kind === "heading") {
                    return (
                      // biome-ignore lint/a11y/useSemanticElements: the list is a grid of divs, so that only the rows in view are drawn, and the focus is the list's own
                      // biome-ignore lint/a11y/useFocusableInteractive: the list is a grid of divs, so that only the rows in view are drawn, and the focus is the list's own
                      <div
                        key={`heading-${row.section.key}`}
                        role="row"
                        aria-rowindex={index + 1}
                        className="nuv-emoji-picker__row"
                        style={style}
                      >
                        {/* biome-ignore lint/a11y/useSemanticElements: the list is a grid of divs, so that only the rows in view are drawn, and the focus is the list's own */}
                        {/* biome-ignore lint/a11y/useFocusableInteractive: the list is a grid of divs, so that only the rows in view are drawn, and the focus is the list's own */}
                        <div
                          role="columnheader"
                          aria-colspan={columns}
                          className="nuv-emoji-picker__heading"
                        >
                          {row.section.title}
                        </div>
                      </div>
                    );
                  }
                  return (
                    // biome-ignore lint/a11y/useSemanticElements: the list is a grid of divs, so that only the rows in view are drawn, and the focus is the list's own
                    // biome-ignore lint/a11y/useFocusableInteractive: the list is a grid of divs, so that only the rows in view are drawn, and the focus is the list's own
                    <div
                      key={`row-${row.section.key}-${row.from}`}
                      role="row"
                      aria-rowindex={index + 1}
                      className="nuv-emoji-picker__row"
                      style={{
                        ...style,
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                      }}
                    >
                      {row.items.map((item, column) => {
                        const place = row.from + column;
                        return (
                          // biome-ignore lint/a11y/useKeyWithClickEvents: the keys are the list's own, which holds the focus and says which emoji they're on
                          // biome-ignore lint/a11y/useSemanticElements: the list is a grid of divs, so that only the rows in view are drawn, and the focus is the list's own
                          // biome-ignore lint/a11y/useFocusableInteractive: the list is a grid of divs, so that only the rows in view are drawn, and the focus is the list's own
                          <div
                            key={item.emoji}
                            id={cellId(place)}
                            role="gridcell"
                            aria-colindex={column + 1}
                            aria-label={item.label}
                            title={item.label}
                            data-active={place === active ? "" : undefined}
                            className="nuv-emoji-picker__emoji"
                            onClick={() => {
                              setActive(place);
                              pick(place);
                            }}
                          >
                            {toned(item)}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          </div>
          {all ? null : (
            <p className="nuv-emoji-picker__note">{labels.loading}</p>
          )}
          {all && cells.length === 0 ? (
            <p className="nuv-emoji-picker__note">{labels.found(0)}</p>
          ) : null}
        </div>
        <p role="status" className="nuv-emoji-picker__status">
          {found}
        </p>
        <nav aria-label={labels.groups} className="nuv-emoji-picker__groups">
          {grouped.map((section) => (
            <button
              key={section.key}
              type="button"
              aria-label={section.title}
              title={section.title}
              aria-current={
                !searching && current === section.key ? "true" : undefined
              }
              className="nuv-emoji-picker__group"
              onClick={() => jump(section.key)}
            >
              <span aria-hidden="true">{signs[section.key as EmojiGroup]}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  },
);

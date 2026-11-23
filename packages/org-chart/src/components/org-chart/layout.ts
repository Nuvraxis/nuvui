import type {
  OrgChartCardSize,
  OrgChartOrientation,
  OrgChartPerson,
} from "./types";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Who reports to whom, as the chart draws it. */
export interface Hierarchy {
  /** Each person by id. A second person with an id already taken is left out. */
  people: Map<string, OrgChartPerson>;
  /** The people at the top, in the order they were given. */
  roots: string[];
  /** Each manager's direct reports, in the order they were given. */
  reports: Map<string, string[]>;
  /** Each person's manager in the chart, or null at the top. */
  manager: Map<string, string | null>;
  /** How far down each person is. The top is 1. */
  level: Map<string, number>;
}

const none: readonly string[] = [];

export function reportsOf(hierarchy: Hierarchy, id: string) {
  return hierarchy.reports.get(id) ?? none;
}

/**
 * The people as a tree. A manager who isn't in the chart, or a person who
 * is their own, makes someone a top. A loop, where people report to each
 * other in a circle, is broken at the first of them in the list, who
 * becomes a top, so everyone is drawn once.
 */
export function buildHierarchy(list: readonly OrgChartPerson[]): Hierarchy {
  const people = new Map<string, OrgChartPerson>();
  for (const person of list) {
    if (!people.has(person.id)) people.set(person.id, person);
  }

  const manager = new Map<string, string | null>();
  const reports = new Map<string, string[]>();
  const roots: string[] = [];
  for (const [id, person] of people) {
    const above = person.managerId;
    const known = above != null && above !== id && people.has(above);
    manager.set(id, known ? above : null);
    if (known) {
      const under = reports.get(above);
      if (under) under.push(id);
      else reports.set(above, [id]);
    } else {
      roots.push(id);
    }
  }

  const level = new Map<string, number>();
  const walk = (top: string) => {
    const stack: [string, number][] = [[top, 1]];
    while (stack.length > 0) {
      const [id, depth] = stack.pop() as [string, number];
      level.set(id, depth);
      const under = reports.get(id);
      if (!under) continue;
      for (let i = under.length - 1; i >= 0; i--) {
        stack.push([under[i] as string, depth + 1]);
      }
    }
  };
  for (const id of roots) walk(id);

  // Whoever is left is in a loop.
  for (const id of people.keys()) {
    if (level.has(id)) continue;
    const above = manager.get(id);
    if (above != null) {
      const under = reports.get(above) ?? [];
      under.splice(under.indexOf(id), 1);
      if (under.length === 0) reports.delete(above);
    }
    manager.set(id, null);
    roots.push(id);
    walk(id);
  }

  return { people, roots, reports, manager, level };
}

/** The managers above someone, nearest first. */
export function managersOf(hierarchy: Hierarchy, id: string): string[] {
  const out: string[] = [];
  let above = hierarchy.manager.get(id) ?? null;
  while (above !== null) {
    out.push(above);
    above = hierarchy.manager.get(above) ?? null;
  }
  return out;
}

/** Everyone who has someone reporting to them. */
export function managers(hierarchy: Hierarchy): string[] {
  return [...hierarchy.reports.keys()];
}

export interface LayoutOptions {
  orientation: OrgChartOrientation;
  card: OrgChartCardSize;
  rtl: boolean;
  /**
   * Whether a manager whose reports manage no one shown has them in a
   * column under them, rather than a row. Only top to bottom.
   */
  stack: boolean;
}

export interface Layout {
  /** Where each card that's shown is. */
  cards: Map<string, Rect>;
  /** The cards that are shown, each manager before their reports. */
  order: string[];
  /** The lines from managers to their reports, as one path. */
  lines: string;
  width: number;
  height: number;
}

// The space between cards, in the chart's units. Across is between
// colleagues, down is between a manager and their reports, and leaves
// room for the button on the manager's card.
export const gaps = {
  across: 20,
  down: 64,
  tops: 48,
  // A column of reports: how far in from the manager's edge, how far
  // under them, and how far apart, which is more when one of them has a
  // closed team and its button sits between two cards.
  indent: 36,
  columnTop: 36,
  column: 14,
  columnWithButtons: 28,
};

interface Box {
  /** The subtree's size across, and down. */
  across: number;
  down: number;
  /** Where the card is across, from the subtree's start. */
  at: number;
  /** Each report's subtree's place, from this one's. */
  kids: { id: string; across: number; down: number }[];
  column: boolean;
}

/**
 * Places the cards of the people who are shown. A manager's reports are
 * shown when the manager is in `open`.
 *
 * The chart is worked out along two lines, across (between colleagues) and
 * down (from a manager to their reports), which are x and y top to bottom,
 * and y and x sideways. Each subtree is a box: its reports' boxes side by
 * side, with the manager centered over the first and last report.
 */
export function layoutChart(
  hierarchy: Hierarchy,
  open: ReadonlySet<string>,
  options: LayoutOptions,
): Layout {
  const vertical = options.orientation === "vertical";
  const across = vertical ? options.card.width : options.card.height;
  const down = vertical ? options.card.height : options.card.width;
  const stack = vertical && options.stack;
  const boxes = new Map<string, Box>();

  const shown = (id: string) =>
    open.has(id) ? reportsOf(hierarchy, id) : none;

  // After every report's box is known, so it goes up the tree from the
  // bottom without calling itself.
  const measureAll = (top: string) => {
    const pending: string[] = [top];
    const order: string[] = [];
    while (pending.length > 0) {
      const id = pending.pop() as string;
      order.push(id);
      for (const kid of shown(id)) pending.push(kid);
    }
    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i] as string;
      boxes.set(id, measure(id));
    }
  };

  const measure = (id: string): Box => {
    const kids = shown(id);
    if (kids.length === 0) {
      return { across, down, at: 0, kids: [], column: false };
    }
    const kidBoxes = kids.map((kid) => boxes.get(kid) as Box);

    if (
      stack &&
      kids.length > 1 &&
      kidBoxes.every((box) => box.kids.length === 0)
    ) {
      const gap = kids.some((kid) => reportsOf(hierarchy, kid).length > 0)
        ? gaps.columnWithButtons
        : gaps.column;
      return {
        across: gaps.indent + across,
        down: down + gaps.columnTop + kids.length * (down + gap) - gap,
        at: 0,
        kids: kids.map((kid, i) => ({
          id: kid,
          across: gaps.indent,
          down: down + gaps.columnTop + i * (down + gap),
        })),
        column: true,
      };
    }

    const starts: number[] = [];
    let next = 0;
    for (const box of kidBoxes) {
      starts.push(next);
      next += box.across + gaps.across;
    }
    const width = next - gaps.across;
    const first = (starts[0] as number) + (kidBoxes[0] as Box).at + across / 2;
    const lastIndex = kidBoxes.length - 1;
    const last =
      (starts[lastIndex] as number) +
      (kidBoxes[lastIndex] as Box).at +
      across / 2;
    let at = (first + last) / 2 - across / 2;
    const shift = at < 0 ? -at : 0;
    at += shift;
    return {
      across: Math.max(width + shift, at + across),
      down: down + gaps.down + Math.max(...kidBoxes.map((box) => box.down)),
      at,
      kids: kids.map((kid, i) => ({
        id: kid,
        across: (starts[i] as number) + shift,
        down: down + gaps.down,
      })),
      column: false,
    };
  };

  for (const top of hierarchy.roots) measureAll(top);

  // Places each card, and the lines to its reports, in the two lines'
  // terms, then turns them into x and y.
  const placed: { id: string; across: number; down: number }[] = [];
  const segments: [number, number, number, number][] = [];
  const place = (top: string, fromAcross: number) => {
    const pending: [string, number, number][] = [[top, fromAcross, 0]];
    while (pending.length > 0) {
      const [id, a, d] = pending.pop() as [string, number, number];
      const box = boxes.get(id) as Box;
      const cardAt = a + box.at;
      placed.push({ id, across: cardAt, down: d });
      if (box.kids.length > 0) {
        const end = d + down;
        if (box.column) {
          const spine = cardAt + gaps.indent / 2;
          const lastKid = box.kids[box.kids.length - 1] as Box["kids"][number];
          segments.push([spine, end, spine, d + lastKid.down + down / 2]);
          for (const kid of box.kids) {
            const middle = d + kid.down + down / 2;
            segments.push([spine, middle, a + kid.across, middle]);
          }
        } else {
          const center = cardAt + across / 2;
          const bar = end + gaps.down / 2;
          const centers = box.kids.map(
            (kid) =>
              a + kid.across + (boxes.get(kid.id) as Box).at + across / 2,
          );
          segments.push([center, end, center, bar]);
          const low = Math.min(center, ...centers);
          const high = Math.max(center, ...centers);
          if (high > low) segments.push([low, bar, high, bar]);
          for (const kidCenter of centers) {
            segments.push([kidCenter, bar, kidCenter, end + gaps.down]);
          }
        }
      }
      // Pushed last first, so they come off in order.
      for (let i = box.kids.length - 1; i >= 0; i--) {
        const kid = box.kids[i] as Box["kids"][number];
        pending.push([kid.id, a + kid.across, d + kid.down]);
      }
    }
  };

  let start = 0;
  let total = 0;
  let deepest = 0;
  for (const top of hierarchy.roots) {
    const box = boxes.get(top) as Box;
    place(top, start);
    total = start + box.across;
    deepest = Math.max(deepest, box.down);
    start += box.across + gaps.tops;
  }

  const width = vertical ? total : deepest;
  const height = vertical ? deepest : total;
  const x = (a: number, d: number) => {
    const value = vertical ? a : d;
    return options.rtl ? width - value : value;
  };
  const y = (a: number, d: number) => (vertical ? d : a);
  const round = (n: number) => Math.round(n * 100) / 100;

  const cards = new Map<string, Rect>();
  const order: string[] = [];
  for (const card of placed) {
    const left = x(card.across, card.down);
    cards.set(card.id, {
      x: options.rtl ? left - options.card.width : left,
      y: y(card.across, card.down),
      width: options.card.width,
      height: options.card.height,
    });
    order.push(card.id);
  }

  const lines = segments
    .map(
      ([a1, d1, a2, d2]) =>
        `M${round(x(a1, d1))} ${round(y(a1, d1))}L${round(x(a2, d2))} ${round(y(a2, d2))}`,
    )
    .join("");

  return { cards, order, lines, width, height };
}

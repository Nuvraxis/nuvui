"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@nuvui/react/avatar";
import { Badge } from "@nuvui/react/badge";
import { Button } from "@nuvui/react/button";
import { useDirection } from "@nuvui/react/direction";
import { Input } from "@nuvui/react/input";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  memo,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import { englishLabels, type OrgChartLabels } from "./labels";
import {
  buildHierarchy,
  type Hierarchy,
  layoutChart,
  managersOf,
  type Rect,
  reportsOf,
} from "./layout";
import type {
  OrgChartCardInfo,
  OrgChartCardSize,
  OrgChartOrientation,
  OrgChartPerson,
  OrgChartViewport,
} from "./types";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Around the chart when it's fitted, and between a card brought into view
// and the frame's edge, in pixels.
const padding = 24;
// The least a chart starts at. One that only fits smaller starts here
// instead, at its top, and the fit button shows the whole of it.
const readable = 0.6;
// How far a pointer goes before a press is a pan.
const panThreshold = 4;

/** What the chart does when its buttons or an app ask. */
export interface OrgChartHandle {
  /** Shows the whole chart. */
  fit(): void;
  zoomIn(): void;
  zoomOut(): void;
  /**
   * Shows a person: opens their managers' teams, moves the view so their
   * card is in the middle, and makes it the card Tab goes to.
   */
  reveal(id: string): void;
  /** Where the view is now. */
  getViewport(): OrgChartViewport;
}

export interface OrgChartOwnProps {
  /** The chart's name, for a screen reader. Required. */
  "aria-label": string;
  /** Everyone in the chart, each with the id of their manager. */
  people: OrgChartPerson[];
  /**
   * `vertical` puts each manager above their reports. `horizontal` puts
   * them before their reports along the line, which is to the left, or to
   * the right where the page reads right to left.
   * @default "vertical"
   */
  orientation?: OrgChartOrientation;
  /** The ids of the managers whose reports are shown, when you keep them. */
  expanded?: string[];
  /**
   * The managers whose reports are shown at first, when you don't keep
   * them. Every manager's when not given.
   */
  defaultExpanded?: string[];
  /** Called with the ids of the managers whose reports are shown, when they change. */
  onExpandedChange?: (expanded: string[]) => void;
  /** The chosen person's id, when you keep it. */
  selected?: string | null;
  /** The person chosen at first, when you don't keep it. @default null */
  defaultSelected?: string | null;
  /**
   * Called when a person is chosen, with a click or Enter, and with null
   * when Escape clears the choice.
   */
  onSelectedChange?: (id: string | null) => void;
  /** Called on a double click on a card, or Enter on one. */
  onPersonOpen?: (id: string) => void;
  /**
   * What goes inside a card in place of the photo, the name, the title and
   * the department. A card drawn this way is named for a screen reader by
   * what's in it.
   */
  renderCard?: (person: OrgChartPerson, info: OrgChartCardInfo) => ReactNode;
  /**
   * The size of every card, in pixels at a zoom of 1.
   * @default { width: 240, height: 76 }
   */
  cardSize?: OrgChartCardSize;
  /**
   * Whether a manager whose reports manage no one has them in a column
   * under them, rather than in a row, which keeps a chart narrow. Only in
   * a vertical chart.
   * @default true
   */
  compact?: boolean;
  /** The zoom and fit buttons. @default true */
  controls?: boolean;
  /** The box that finds a person by their name, title or department. @default true */
  search?: boolean;
  /** @default 0.1 */
  minZoom?: number;
  /** @default 2 */
  maxZoom?: number;
  /**
   * Where the view starts. When not given, the whole chart if it fits at a
   * size that can be read, and its top if it doesn't.
   */
  defaultViewport?: OrgChartViewport;
  /** Called when the view stops moving. */
  onViewportChange?: (viewport: OrgChartViewport) => void;
  /** The chart's own words, for translating. */
  labels?: OrgChartLabels;
  /** The chart's methods: fit, zoom and reveal. */
  handleRef?: Ref<OrgChartHandle>;
}

export interface OrgChartProps
  extends OrgChartOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof OrgChartOwnProps | "children"> {}

const defaultCard: OrgChartCardSize = { width: 240, height: 76 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Compared without case or accents, so "jose" finds José.
const fold = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();

function initials(name: string | undefined) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const first = Array.from(words[0] ?? "")[0] ?? "";
  const last =
    words.length > 1 ? (Array.from(words.at(-1) ?? "")[0] ?? "") : "";
  return `${first}${last}`.toLocaleUpperCase();
}

interface Point {
  x: number;
  y: number;
}

type Gesture =
  | {
      kind: "press" | "pan";
      id: number;
      start: Point;
      viewport: OrgChartViewport;
    }
  | {
      kind: "pinch";
      distance: number;
      middle: Point;
      viewport: OrgChartViewport;
    };

type Move = "center" | "nearest" | "none";

export const OrgChart = forwardRef<HTMLDivElement, OrgChartProps>(
  function OrgChart(
    {
      "aria-label": ariaLabel,
      people,
      orientation = "vertical",
      expanded: expandedProp,
      defaultExpanded,
      onExpandedChange,
      selected: selectedProp,
      defaultSelected = null,
      onSelectedChange,
      onPersonOpen,
      renderCard,
      cardSize = defaultCard,
      compact = true,
      controls = true,
      search = true,
      minZoom = 0.1,
      maxZoom = 2,
      defaultViewport,
      onViewportChange,
      labels: labelsProp,
      handleRef,
      className,
      dir,
      ...props
    },
    ref,
  ) {
    const labels = useMemo(
      () => ({ ...englishLabels, ...labelsProp }),
      [labelsProp],
    );
    const uid = `nuv-org-chart-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const rtl = useDirection(dir as "ltr" | "rtl" | undefined) === "rtl";
    const vertical = orientation === "vertical";

    const hierarchy = useMemo(() => buildHierarchy(people), [people]);

    // Every manager's team is open until one is closed. Until then there's
    // no list, so a manager who comes with new data starts open too.
    const [ownExpanded, setOwnExpanded] = useState<string[] | null>(
      defaultExpanded ?? null,
    );
    const open = useMemo(() => {
      const list = expandedProp ?? ownExpanded;
      return new Set(list ?? hierarchy.reports.keys());
    }, [expandedProp, ownExpanded, hierarchy]);

    const [ownSelected, setOwnSelected] = useState(defaultSelected);
    const selected = selectedProp === undefined ? ownSelected : selectedProp;

    const { width: cardWidth, height: cardHeight } = cardSize;
    const layout = useMemo(
      () =>
        layoutChart(hierarchy, open, {
          orientation,
          card: { width: cardWidth, height: cardHeight },
          rtl,
          stack: compact,
        }),
      [hierarchy, open, orientation, cardWidth, cardHeight, rtl, compact],
    );

    // What handlers need, read where they run so they never go stale.
    const latest = useRef({
      hierarchy,
      layout,
      open,
      selected,
      labels,
      minZoom,
      maxZoom,
      vertical,
      rtl,
      onExpandedChange,
      onSelectedChange,
      onPersonOpen,
      onViewportChange,
      expandedControlled: expandedProp !== undefined,
      selectedControlled: selectedProp !== undefined,
    });
    latest.current = {
      hierarchy,
      layout,
      open,
      selected,
      labels,
      minZoom,
      maxZoom,
      vertical,
      rtl,
      onExpandedChange,
      onSelectedChange,
      onPersonOpen,
      onViewportChange,
      expandedControlled: expandedProp !== undefined,
      selectedControlled: selectedProp !== undefined,
    };

    const frameRef = useRef<HTMLDivElement>(null);
    const layerRef = useRef<HTMLDivElement>(null);
    const [measured, setMeasured] = useState(false);
    const [message, setMessage] = useState("");

    const announce = useCallback((text: string) => {
      // The same words twice in a row still have to be heard twice.
      setMessage((previous) => (previous === text ? `${text} ` : text));
    }, []);

    // The view -------------------------------------------------------------

    const view = useRef<OrgChartViewport>({ x: 0, y: 0, zoom: 1 });
    const size = useRef<{ width: number; height: number } | null>(null);
    const queued = useRef(false);
    const restTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    // Whether the view is still the fitted one. While it is, it's fitted
    // again when the frame changes size. A pan or a zoom ends it.
    const fitted = useRef(false);

    // Writes the transform straight onto the layer, once a frame. A pan or
    // a zoom never renders React.
    const applyView = useCallback(() => {
      queued.current = false;
      const { x, y, zoom } = view.current;
      const layer = layerRef.current;
      if (layer) {
        layer.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
      }
    }, []);

    const setView = useCallback(
      (next: OrgChartViewport, fit = false) => {
        fitted.current = fit;
        const { minZoom: min, maxZoom: max } = latest.current;
        view.current = { ...next, zoom: clamp(next.zoom, min, max) };
        if (!queued.current) {
          queued.current = true;
          requestAnimationFrame(applyView);
        }
        clearTimeout(restTimer.current);
        restTimer.current = setTimeout(() => {
          latest.current.onViewportChange?.(view.current);
        }, 150);
      },
      [applyView],
    );

    const fitView = useCallback((): OrgChartViewport | null => {
      const frame = size.current;
      const { layout: l, minZoom: min, maxZoom: max } = latest.current;
      if (!frame || l.order.length === 0) return null;
      const zoom = clamp(
        Math.min(
          (frame.width - padding * 2) / l.width,
          (frame.height - padding * 2) / l.height,
        ),
        min,
        Math.min(1, max),
      );
      return {
        zoom,
        x: (frame.width - l.width * zoom) / 2,
        y: (frame.height - l.height * zoom) / 2,
      };
    }, []);

    const fit = useCallback(() => {
      const next = fitView();
      if (next) setView(next, true);
    }, [fitView, setView]);

    // Where the chart starts: fitted, unless that's too small to read, and
    // then at its top person, at a size that can be read.
    const startView = useCallback((): {
      viewport: OrgChartViewport;
      fitted: boolean;
    } | null => {
      const whole = fitView();
      const frame = size.current;
      const { layout: l, hierarchy: h, minZoom: min } = latest.current;
      if (!whole || !frame) return null;
      const top = l.cards.get(h.roots[0] ?? "");
      if (whole.zoom >= readable || !top) {
        return { viewport: whole, fitted: true };
      }
      const zoom = Math.max(readable, min);
      if (latest.current.vertical) {
        return {
          viewport: {
            zoom,
            x: frame.width / 2 - (top.x + top.width / 2) * zoom,
            y: padding - top.y * zoom,
          },
          fitted: false,
        };
      }
      return {
        viewport: {
          zoom,
          x: latest.current.rtl
            ? frame.width - padding - (top.x + top.width) * zoom
            : padding - top.x * zoom,
          y: frame.height / 2 - (top.y + top.height / 2) * zoom,
        },
        fitted: false,
      };
    }, [fitView]);

    const zoomBy = useCallback(
      (factor: number, around?: Point) => {
        const frame = size.current;
        if (!frame) return;
        const v = view.current;
        const at = around ?? { x: frame.width / 2, y: frame.height / 2 };
        const { minZoom: min, maxZoom: max } = latest.current;
        const zoom = clamp(v.zoom * factor, min, max);
        setView({
          zoom,
          x: at.x - ((at.x - v.x) / v.zoom) * zoom,
          y: at.y - ((at.y - v.y) / v.zoom) * zoom,
        });
      },
      [setView],
    );

    const center = useCallback(
      (rect: Rect) => {
        const frame = size.current;
        if (!frame) return;
        const v = view.current;
        setView({
          zoom: v.zoom,
          x: frame.width / 2 - (rect.x + rect.width / 2) * v.zoom,
          y: frame.height / 2 - (rect.y + rect.height / 2) * v.zoom,
        });
      },
      [setView],
    );

    // Pans just enough to bring a card into view, as the arrow keys move.
    const bringIntoView = useCallback(
      (rect: Rect) => {
        const frame = size.current;
        if (!frame) return;
        const v = view.current;
        const nudge = (start: number, end: number, room: number) => {
          if (end - start > room - padding * 2)
            return room / 2 - (start + end) / 2;
          if (start < padding) return padding - start;
          if (end > room - padding) return room - padding - end;
          return 0;
        };
        const left = rect.x * v.zoom + v.x;
        const top = rect.y * v.zoom + v.y;
        const dx = nudge(left, left + rect.width * v.zoom, frame.width);
        const dy = nudge(top, top + rect.height * v.zoom, frame.height);
        if (dx || dy) setView({ ...v, x: v.x + dx, y: v.y + dy });
      },
      [setView],
    );

    // Measured once in the browser, then whenever the frame changes size.
    // Until then the chart is placed the way a server places it: its top
    // person at the top in the middle, or at the start, at its own size.
    useIsomorphicLayoutEffect(() => {
      const element = frameRef.current;
      if (!element) return;
      const read = () => ({
        width: element.clientWidth,
        height: element.clientHeight,
      });
      size.current = read();
      if (defaultViewport) {
        view.current = defaultViewport;
      } else {
        const start = startView();
        if (start) {
          view.current = start.viewport;
          fitted.current = start.fitted;
        }
      }
      setMeasured(true);
      const observer = new ResizeObserver(() => {
        const before = size.current;
        const now = read();
        size.current = now;
        if (
          fitted.current &&
          (now.width !== before?.width || now.height !== before?.height)
        ) {
          fit();
        }
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    useIsomorphicLayoutEffect(() => {
      if (measured) applyView();
    }, [measured, applyView]);

    useEffect(() => () => clearTimeout(restTimer.current), []);

    // Who is shown, chosen and focused -------------------------------------

    const [active, setActive] = useState<string | null>(null);
    // The card Tab goes to: the active one while it's shown, or else the
    // nearest manager of it who is, or the first card.
    const current = useMemo(() => {
      if (active !== null) {
        if (layout.cards.has(active)) return active;
        for (const above of managersOf(hierarchy, active)) {
          if (layout.cards.has(above)) return above;
        }
      }
      return layout.order[0] ?? null;
    }, [active, layout, hierarchy]);

    // Set before a render that shows a card, and acted on once it has: the
    // card the view goes to, how, and whether it takes focus.
    const pending = useRef<{ id: string; move: Move; focus: boolean } | null>(
      null,
    );
    // A card that stays where it is on the screen while the chart around
    // it changes, as when its team opens or closes.
    const anchor = useRef<{ id: string; rect: Rect } | null>(null);
    const [revision, setRevision] = useState(0);

    // A card with focus that this render hides, because a team closed
    // around it, hands the focus to the nearest manager still shown. It's
    // read here, before the card leaves the page and the focus with it,
    // whatever closed the team.
    const focusedNow =
      typeof document === "undefined" ? null : focusedCardIn(layerRef.current);
    if (focusedNow !== null && !layout.cards.has(focusedNow) && current) {
      pending.current = { id: current, move: "none", focus: true };
    }

    const changeExpanded = useCallback((next: Set<string>) => {
      const list = [...next];
      if (!latest.current.expandedControlled) setOwnExpanded(list);
      latest.current.onExpandedChange?.(list);
    }, []);

    // The teams the find box opened on the way to a match, which it closes
    // again when the next match isn't under them. One opened or closed by
    // hand is the reader's, and is left as it is.
    const openedByFind = useRef(new Set<string>());

    const setOpen = useCallback(
      (id: string, value: boolean) => {
        const { open: now, hierarchy: h, layout: l } = latest.current;
        openedByFind.current.delete(id);
        if (reportsOf(h, id).length === 0 || now.has(id) === value) return;
        const next = new Set(now);
        if (value) next.add(id);
        else next.delete(id);
        const rect = l.cards.get(id);
        if (rect) anchor.current = { id, rect };
        changeExpanded(next);
      },
      [changeExpanded],
    );

    const choose = useCallback((id: string | null) => {
      if (latest.current.selected === id) return;
      if (!latest.current.selectedControlled) setOwnSelected(id);
      latest.current.onSelectedChange?.(id);
    }, []);

    // Opens every manager above someone, and goes to them once they're
    // drawn.
    const show = useCallback(
      (id: string, move: Move, focus: boolean, found = false) => {
        const { hierarchy: h, open: now } = latest.current;
        if (!h.people.has(id)) return;
        const path = managersOf(h, id);
        const closed = path.filter((above) => !now.has(above));
        pending.current = { id, move, focus };
        setActive(id);
        const next = new Set([...now, ...closed]);
        if (found) {
          const onPath = new Set(path);
          for (const opened of openedByFind.current) {
            if (!onPath.has(opened)) next.delete(opened);
          }
          openedByFind.current = new Set([
            ...[...openedByFind.current].filter((each) => onPath.has(each)),
            ...closed,
          ]);
        }
        if (next.size !== now.size || closed.length > 0) changeExpanded(next);
        // Nothing may change but this, when the card is drawn already.
        setRevision((n) => n + 1);
      },
      [changeExpanded],
    );

    useIsomorphicLayoutEffect(() => {
      // Keeps the card that was opened or closed where it was.
      const held = anchor.current;
      anchor.current = null;
      if (held && measured) {
        const rect = layout.cards.get(held.id);
        if (rect) {
          const v = view.current;
          setView({
            ...v,
            x: v.x + (held.rect.x - rect.x) * v.zoom,
            y: v.y + (held.rect.y - rect.y) * v.zoom,
          });
        }
      }

      const goal = pending.current;
      if (!goal) return;
      const rect = layout.cards.get(goal.id);
      if (!rect) return;
      pending.current = null;
      if (measured) {
        if (goal.move === "center") center(rect);
        else if (goal.move === "nearest") bringIntoView(rect);
      }
      if (goal.focus) {
        layerRef.current
          ?.querySelector<HTMLElement>(`[data-id="${CSS.escape(goal.id)}"]`)
          ?.focus({ preventScroll: true });
      }
    }, [layout, revision, measured]);

    useImperativeHandle(
      handleRef,
      () => ({
        fit,
        zoomIn: () => zoomBy(1.25),
        zoomOut: () => zoomBy(0.8),
        reveal: (id: string) => show(id, "center", false),
        getViewport: () => view.current,
      }),
      [fit, zoomBy, show],
    );

    // Finding --------------------------------------------------------------

    const [query, setQuery] = useState("");
    const [matchIndex, setMatchIndex] = useState(0);
    // Everyone, each manager before their reports, shown or not.
    const everyone = useMemo(() => treeOrder(hierarchy), [hierarchy]);
    const matchesFor = useCallback(
      (text: string) => {
        const wanted = fold(text.trim());
        if (!wanted) return [];
        return everyone.filter((id) => {
          const person = hierarchy.people.get(id);
          return [person?.name, person?.title, person?.department].some(
            (field) => field !== undefined && fold(field).includes(wanted),
          );
        });
      },
      [everyone, hierarchy],
    );
    const matches = useMemo(() => matchesFor(query), [matchesFor, query]);
    const matchSet = useMemo(() => new Set(matches), [matches]);
    const currentMatch = matches[matchIndex] ?? null;

    const goToMatch = (index: number, list: string[]) => {
      if (list.length === 0) return;
      const at = ((index % list.length) + list.length) % list.length;
      const id = list[at] as string;
      setMatchIndex(at);
      show(id, "center", false, true);
      const person = hierarchy.people.get(id) as OrgChartPerson;
      announce(labels.found(cardName(person, labels), at + 1, list.length));
    };

    const onQueryChange = (text: string) => {
      setQuery(text);
      setMatchIndex(0);
      if (!text.trim()) return;
      const list = matchesFor(text);
      if (list.length === 0) announce(labels.noMatches);
      else goToMatch(0, list);
    };

    // Pointer --------------------------------------------------------------

    const gesture = useRef<Gesture | null>(null);
    const pointers = useRef(new Map<number, Point>());
    // A press that turned into a pan doesn't click what it started on.
    const panned = useRef(false);

    const local = (event: { clientX: number; clientY: number }): Point => {
      const box = frameRef.current?.getBoundingClientRect();
      return box
        ? { x: event.clientX - box.left, y: event.clientY - box.top }
        : { x: event.clientX, y: event.clientY };
    };

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (!measured) return;
      const point = local(event);
      pointers.current.set(event.pointerId, point);
      panned.current = false;
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()] as [Point, Point];
        gesture.current = {
          kind: "pinch",
          distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          middle: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          viewport: view.current,
        };
        return;
      }
      if (pointers.current.size > 2) return;
      gesture.current = {
        kind: "press",
        id: event.pointerId,
        start: point,
        viewport: view.current,
      };
    };

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!pointers.current.has(event.pointerId)) return;
      const point = local(event);
      pointers.current.set(event.pointerId, point);
      const g = gesture.current;
      if (!g) return;

      if (g.kind === "pinch") {
        const values = [...pointers.current.values()];
        if (values.length < 2) return;
        const [a, b] = values as [Point, Point];
        const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const { minZoom: min, maxZoom: max } = latest.current;
        const zoom = clamp((g.viewport.zoom * distance) / g.distance, min, max);
        const at = {
          x: (g.middle.x - g.viewport.x) / g.viewport.zoom,
          y: (g.middle.y - g.viewport.y) / g.viewport.zoom,
        };
        panned.current = true;
        setView({ zoom, x: middle.x - at.x * zoom, y: middle.y - at.y * zoom });
        return;
      }

      if (g.id !== event.pointerId) return;
      if (g.kind === "press") {
        if (
          Math.hypot(point.x - g.start.x, point.y - g.start.y) < panThreshold
        ) {
          return;
        }
        gesture.current = { ...g, kind: "pan" };
        panned.current = true;
        try {
          frameRef.current?.setPointerCapture(event.pointerId);
        } catch {
          // A pointer the browser doesn't count as active can't be
          // captured. The pan still works while it stays over the chart.
        }
      }
      setView({
        ...g.viewport,
        x: g.viewport.x + point.x - g.start.x,
        y: g.viewport.y + point.y - g.start.y,
      });
    };

    const endGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
      pointers.current.delete(event.pointerId);
      const g = gesture.current;
      if (!g) return;
      if (g.kind === "pinch") {
        if (pointers.current.size < 2) gesture.current = null;
        return;
      }
      if (g.id === event.pointerId) gesture.current = null;
    };

    const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!panned.current) return;
      panned.current = false;
      event.preventDefault();
      event.stopPropagation();
    };

    // The wheel zooms while the chart has focus, or with Ctrl held, which is
    // also what a pinch on a trackpad sends. Otherwise the page scrolls.
    useEffect(() => {
      const frame = frameRef.current;
      if (!frame) return;
      const onWheel = (event: WheelEvent) => {
        if (!size.current) return;
        const focused = frame.contains(document.activeElement);
        if (!focused && !event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        const scale =
          event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
        const box = frame.getBoundingClientRect();
        zoomBy(Math.exp(-event.deltaY * scale * 0.0015), {
          x: event.clientX - box.left,
          y: event.clientY - box.top,
        });
      };
      frame.addEventListener("wheel", onWheel, { passive: false });
      return () => frame.removeEventListener("wheel", onWheel);
    }, [zoomBy]);

    const cardIdOf = (target: EventTarget) =>
      (target as Element).closest<HTMLElement>(".nuv-org-chart__card")?.dataset
        .id ?? null;

    const onTreeClick = (event: ReactMouseEvent<HTMLDivElement>) => {
      const id = cardIdOf(event.target);
      if (id === null) return;
      setActive(id);
      choose(id);
    };

    const onTreeDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
      const id = cardIdOf(event.target);
      if (id !== null) latest.current.onPersonOpen?.(id);
    };

    // Tab, or a click, can land on a card that's out of view.
    const onTreeFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
      const id = cardIdOf(event.target);
      if (id === null) return;
      if (id !== active) setActive(id);
      const rect = layout.cards.get(id);
      if (rect && measured && !pending.current) bringIntoView(rect);
    };

    // Keyboard -------------------------------------------------------------

    const typed = useRef({ text: "", at: 0 });

    const onTreeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const id = cardIdOf(event.target);
      if (id === null) return;
      const { hierarchy: h, layout: l, open: now } = latest.current;
      const manager = h.manager.get(id) ?? null;
      const colleagues = manager === null ? h.roots : reportsOf(h, manager);
      const reports = reportsOf(h, id);
      const command = event.ctrlKey || event.metaKey || event.altKey;

      // Toward the manager and toward the reports, and to the colleagues
      // before and after, as the chart is drawn.
      const up = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
      const down = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
      const back = vertical ? (rtl ? "ArrowRight" : "ArrowLeft") : "ArrowUp";
      const on = vertical ? (rtl ? "ArrowLeft" : "ArrowRight") : "ArrowDown";

      const go = (to: string | null | undefined) => {
        if (to != null) show(to, "nearest", true);
      };

      if (!command) {
        switch (event.key) {
          case up:
            event.preventDefault();
            go(manager);
            return;
          case down:
            event.preventDefault();
            if (reports.length === 0) return;
            if (now.has(id)) go(reports[0]);
            else setOpen(id, true);
            return;
          case back:
          case on: {
            event.preventDefault();
            const index = colleagues.indexOf(id);
            go(colleagues[index + (event.key === back ? -1 : 1)]);
            return;
          }
          case "Home":
            event.preventDefault();
            go(l.order[0]);
            return;
          case "End":
            event.preventDefault();
            go(l.order.at(-1));
            return;
          case " ":
            event.preventDefault();
            if (reports.length > 0) setOpen(id, !now.has(id));
            return;
          case "Enter":
            event.preventDefault();
            choose(id);
            latest.current.onPersonOpen?.(id);
            return;
          case "Escape":
            if (latest.current.selected !== null) {
              event.preventDefault();
              choose(null);
            }
            return;
          case "*": {
            // Opens the teams of everyone beside this person.
            event.preventDefault();
            const next = new Set(now);
            for (const colleague of colleagues) {
              if (reportsOf(h, colleague).length > 0) next.add(colleague);
            }
            if (next.size !== now.size) {
              const rect = l.cards.get(id);
              if (rect) anchor.current = { id, rect };
              changeExpanded(next);
            }
            return;
          }
          case "+":
          case "=":
            event.preventDefault();
            zoomBy(1.25);
            return;
          case "-":
          case "_":
            event.preventDefault();
            zoomBy(0.8);
            return;
          case "0":
            event.preventDefault();
            fit();
            return;
        }
      }

      // Letters go to the next person shown whose name starts with them. A
      // run of one letter steps through the names that start with it.
      if (event.key.length === 1 && !command && /\S/.test(event.key)) {
        const at = performance.now();
        const text =
          at - typed.current.at < 600
            ? typed.current.text + event.key
            : event.key;
        typed.current = { text, at };
        const wanted = [...text].every((c) => c === text[0])
          ? fold(text[0] as string)
          : fold(text);
        const from = l.order.indexOf(id);
        const order = [
          ...l.order.slice(from + 1),
          ...l.order.slice(0, from + 1),
        ];
        const found = order.find((other) =>
          fold(h.people.get(other)?.name ?? "").startsWith(wanted),
        );
        if (found) {
          event.preventDefault();
          go(found);
        }
      }
    };

    // Drawing --------------------------------------------------------------

    const instructionsId = `${uid}-instructions`;
    const places = useMemo(() => {
      const out = new Map<string, { position: number; size: number }>();
      const set = (list: readonly string[]) => {
        list.forEach((id, i) => {
          out.set(id, { position: i + 1, size: list.length });
        });
      };
      set(hierarchy.roots);
      for (const list of hierarchy.reports.values()) set(list);
      return out;
    }, [hierarchy]);

    // The layer is placed by the page's left and top, as the view's numbers
    // are, whichever way the page reads. Before the frame is measured, as
    // on a server, its top person is at the top in the middle, or at the
    // start of the line, at the chart's own size.
    const top = layout.cards.get(hierarchy.roots[0] ?? "");
    let place: CSSProperties = { left: 0, top: 0 };
    if (!measured && top) {
      place = vertical
        ? {
            left: "50%",
            top: 0,
            transform: `translate(${-(top.x + top.width / 2)}px, ${padding}px)`,
          }
        : {
            left: rtl ? "100%" : 0,
            top: "50%",
            transform: `translate(${rtl ? -(top.x + top.width + padding) : padding - top.x}px, ${-(top.y + top.height / 2)}px)`,
          };
    }

    return (
      <div
        ref={ref}
        className={cx("nuv-org-chart", className)}
        data-orientation={orientation}
        dir={dir}
        {...props}
      >
        {(search || controls) && (
          <div className="nuv-org-chart__bar">
            {search && (
              <search className="nuv-org-chart__find">
                <Input
                  type="search"
                  className="nuv-org-chart__find-input"
                  aria-label={labels.find}
                  placeholder={labels.findPlaceholder}
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      goToMatch(
                        matchIndex + (event.shiftKey ? -1 : 1),
                        matches,
                      );
                    }
                  }}
                />
                {query.trim() !== "" && (
                  <>
                    <span className="nuv-org-chart__matches" aria-hidden="true">
                      {matches.length === 0
                        ? labels.noMatches
                        : labels.matches(matchIndex + 1, matches.length)}
                    </span>
                    <Button
                      intent="ghost"
                      size="sm"
                      className="nuv-org-chart__control"
                      aria-label={labels.findPrevious}
                      title={labels.findPrevious}
                      disabled={matches.length < 2}
                      onClick={() => goToMatch(matchIndex - 1, matches)}
                    >
                      <Icon d="M6 15l6-6 6 6" />
                    </Button>
                    <Button
                      intent="ghost"
                      size="sm"
                      className="nuv-org-chart__control"
                      aria-label={labels.findNext}
                      title={labels.findNext}
                      disabled={matches.length < 2}
                      onClick={() => goToMatch(matchIndex + 1, matches)}
                    >
                      <Icon d="M6 9l6 6 6-6" />
                    </Button>
                  </>
                )}
              </search>
            )}
            {controls && (
              <div
                className="nuv-org-chart__controls"
                role="toolbar"
                aria-label={labels.controls}
              >
                <Button
                  intent="secondary"
                  size="sm"
                  className="nuv-org-chart__control"
                  aria-label={labels.zoomOut}
                  title={labels.zoomOut}
                  onClick={() => zoomBy(0.8)}
                >
                  <Icon d="M5 12h14" />
                </Button>
                <Button
                  intent="secondary"
                  size="sm"
                  className="nuv-org-chart__control"
                  aria-label={labels.zoomIn}
                  title={labels.zoomIn}
                  onClick={() => zoomBy(1.25)}
                >
                  <Icon d="M12 5v14M5 12h14" />
                </Button>
                <Button
                  intent="secondary"
                  size="sm"
                  className="nuv-org-chart__control"
                  aria-label={labels.fit}
                  title={labels.fit}
                  onClick={fit}
                >
                  <Icon d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
                </Button>
              </div>
            )}
          </div>
        )}
        <div
          ref={frameRef}
          className="nuv-org-chart__frame"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onClickCapture={onClickCapture}
        >
          <div
            ref={layerRef}
            className="nuv-org-chart__layer"
            style={{ width: layout.width, height: layout.height, ...place }}
          >
            <svg
              className="nuv-org-chart__lines"
              width={layout.width}
              height={layout.height}
              aria-hidden="true"
              focusable="false"
            >
              <path d={layout.lines} />
            </svg>
            <div
              role="tree"
              className="nuv-org-chart__tree"
              aria-label={ariaLabel}
              aria-roledescription={labels.roleDescription}
              aria-describedby={instructionsId}
              onClick={onTreeClick}
              onDoubleClick={onTreeDoubleClick}
              onKeyDown={onTreeKeyDown}
              onFocus={onTreeFocus}
            >
              {layout.order.map((id) => {
                const person = hierarchy.people.get(id) as OrgChartPerson;
                const spot = places.get(id);
                return (
                  <Card
                    key={id}
                    person={person}
                    rect={layout.cards.get(id) as Rect}
                    reports={reportsOf(hierarchy, id).length}
                    level={hierarchy.level.get(id) ?? 1}
                    expanded={open.has(id)}
                    position={spot?.position ?? 1}
                    setSize={spot?.size ?? 1}
                    selected={selected === id}
                    tabbable={current === id}
                    match={matchSet.has(id)}
                    currentMatch={currentMatch === id}
                    renderCard={renderCard}
                    labels={labels}
                  />
                );
              })}
            </div>
            {/* The buttons that show and hide a team. The keyboard does the same on the card, with Space and the arrows, so they aren't stops for Tab. A screen reader's cursor still finds them. */}
            <div className="nuv-org-chart__toggles">
              {layout.order.map((id) => {
                const count = reportsOf(hierarchy, id).length;
                if (count === 0) return null;
                const rect = layout.cards.get(id) as Rect;
                const isOpen = open.has(id);
                const name = cardName(
                  hierarchy.people.get(id) as OrgChartPerson,
                  labels,
                );
                const label = isOpen
                  ? labels.hideReports(name, count)
                  : labels.showReports(name, count);
                return (
                  <button
                    key={id}
                    type="button"
                    className="nuv-org-chart__toggle"
                    data-for={id}
                    tabIndex={-1}
                    aria-label={label}
                    title={label}
                    aria-expanded={isOpen}
                    style={
                      vertical
                        ? {
                            left: rect.x + rect.width / 2,
                            top: rect.y + rect.height,
                          }
                        : {
                            left: rtl ? rect.x : rect.x + rect.width,
                            top: rect.y + rect.height / 2,
                          }
                    }
                    onClick={() => {
                      setActive(id);
                      setOpen(id, !isOpen);
                    }}
                  >
                    <span className="nuv-org-chart__count">{count}</span>
                    <Icon
                      className="nuv-org-chart__chevron"
                      d={isOpen ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div id={instructionsId} className="nuv-org-chart__hidden">
          {labels.instructions(orientation)}
        </div>
        <div className="nuv-org-chart__hidden" role="status" aria-live="polite">
          {message}
        </div>
      </div>
    );
  },
);

/** The id of the card that has focus, if it is one of this chart's. */
function focusedCardIn(layer: HTMLElement | null): string | null {
  const focused = document.activeElement;
  return focused instanceof HTMLElement &&
    focused.classList.contains("nuv-org-chart__card") &&
    layer?.contains(focused)
    ? (focused.dataset.id ?? null)
    : null;
}

/** Everyone in the chart, each manager before their reports. */
function treeOrder(hierarchy: Hierarchy): string[] {
  const out: string[] = [];
  const pending = [...hierarchy.roots].reverse();
  while (pending.length > 0) {
    const id = pending.pop() as string;
    out.push(id);
    const under = reportsOf(hierarchy, id);
    for (let i = under.length - 1; i >= 0; i--) {
      pending.push(under[i] as string);
    }
  }
  return out;
}

/** What a card is called: the person's name, or what an open position is. */
function cardName(person: OrgChartPerson, labels: Required<OrgChartLabels>) {
  return person.name || (person.vacant ? labels.vacant : (person.title ?? ""));
}

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      className={cx("nuv-org-chart__icon", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

interface CardProps {
  person: OrgChartPerson;
  rect: Rect;
  reports: number;
  level: number;
  expanded: boolean;
  position: number;
  setSize: number;
  selected: boolean;
  tabbable: boolean;
  match: boolean;
  currentMatch: boolean;
  renderCard: OrgChartOwnProps["renderCard"];
  labels: Required<OrgChartLabels>;
}

const Card = memo(function Card({
  person,
  rect,
  reports,
  level,
  expanded,
  position,
  setSize,
  selected,
  tabbable,
  match,
  currentMatch,
  renderCard,
  labels,
}: CardProps) {
  const name = cardName(person, labels);
  // A card of the app's own is named by what's in it. This one is named in
  // a sentence, so its parts aren't read run together.
  const label = renderCard
    ? undefined
    : [
        name,
        person.title,
        person.department,
        person.badge,
        reports > 0 ? labels.reports(reports) : undefined,
      ]
        .filter(Boolean)
        .join(", ");
  return (
    <div
      role="treeitem"
      className="nuv-org-chart__card"
      data-id={person.id}
      data-vacant={person.vacant ? "" : undefined}
      data-selected={selected ? "" : undefined}
      data-match={match ? "" : undefined}
      data-current-match={currentMatch ? "" : undefined}
      aria-label={label}
      aria-level={level}
      aria-posinset={position}
      aria-setsize={setSize}
      aria-expanded={reports > 0 ? expanded : undefined}
      aria-selected={selected}
      tabIndex={tabbable ? 0 : -1}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
    >
      {renderCard ? (
        <>
          {renderCard(person, { reports, level, expanded })}
          {reports > 0 && (
            <span className="nuv-org-chart__hidden">
              , {labels.reports(reports)}
            </span>
          )}
        </>
      ) : (
        <>
          {person.vacant ? (
            <span className="nuv-org-chart__seat" aria-hidden="true" />
          ) : (
            <Avatar className="nuv-org-chart__avatar" aria-hidden="true">
              {person.avatar && <AvatarImage src={person.avatar} alt="" />}
              {/* The initials are drawn by the stylesheet, from the
                  attribute. As text they'd be words on the card that the
                  card's name doesn't have, which WCAG's label in name asks
                  against, and the name says who it is already. */}
              <AvatarFallback data-initials={initials(person.name)} />
            </Avatar>
          )}
          <span className="nuv-org-chart__text">
            <span className="nuv-org-chart__name">{name}</span>
            {person.title && (
              <span className="nuv-org-chart__title">{person.title}</span>
            )}
            {(person.department || person.badge) && (
              <span className="nuv-org-chart__meta">
                {person.department && (
                  <span className="nuv-org-chart__department">
                    {person.department}
                  </span>
                )}
                {person.badge && (
                  <Badge className="nuv-org-chart__badge">{person.badge}</Badge>
                )}
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
});

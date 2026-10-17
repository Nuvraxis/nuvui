"use client";

import {
  forwardRef,
  type HTMLAttributes,
  memo,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
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
  useSyncExternalStore,
} from "react";
import { cx } from "../../utils/cx";
import {
  boundsOf,
  clamp,
  type FlowPath,
  type FlowViewport,
  fitViewport,
  labelBox,
  outlinePath,
  type Point,
  type Rect,
  type Size,
} from "./geometry";
import { englishLabels, type FlowLabels } from "./labels";
import { type Detail, FlowStore, type Hit, handlePoints } from "./store";
import type {
  FlowEdge,
  FlowEdgesChange,
  FlowIntent,
  FlowNode,
  FlowNodesChange,
  FlowSelection,
} from "./types";

const intents: FlowIntent[] = [
  "neutral",
  "primary",
  "success",
  "warning",
  "danger",
];

const noSelection: FlowSelection = { nodes: [], edges: [] };

// The frame a server assumes it draws into, since it can't measure one. A
// diagram smaller than this is shown at its own size or less, so a small
// one doesn't jump when the browser measures the real frame.
const assumed: Size = { width: 640, height: 384 };
const fitPadding = 24;
// The height of a line of a label, in the diagram's units, which is what
// the stylesheet sets. It's how many lines fit in a shape.
const lineHeight = 20;
// How far a pointer goes before a press is a drag.
const dragThreshold = 4;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function useTopic<T>(store: FlowStore, topic: string, read: () => T): T {
  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(topic, listener),
    [store, topic],
  );
  return useSyncExternalStore(subscribe, read, read);
}

/** What the diagram does when its buttons or an app ask. */
export interface FlowHandle {
  /** Shows the whole diagram. */
  fit(): void;
  zoomIn(): void;
  zoomOut(): void;
  /** Moves the view so a node is in the middle of it. */
  center(id: string): void;
  /** Where the view is now. */
  getViewport(): FlowViewport;
}

export interface FlowOwnProps {
  /** The diagram's name, for a screen reader. Required. */
  "aria-label": string;
  /** The nodes, when the app keeps them. */
  nodes?: FlowNode[];
  /** The nodes to start with, when the diagram keeps them itself. */
  defaultNodes?: FlowNode[];
  /**
   * Called with the nodes after a change made in the diagram, and what the
   * change was. A drag is reported once, when it ends.
   */
  onNodesChange?: (nodes: FlowNode[], change: FlowNodesChange) => void;
  edges?: FlowEdge[];
  defaultEdges?: FlowEdge[];
  onEdgesChange?: (edges: FlowEdge[], change: FlowEdgesChange) => void;
  selection?: FlowSelection;
  defaultSelection?: FlowSelection;
  onSelectionChange?: (selection: FlowSelection) => void;
  /**
   * Nodes can be dragged, joined and removed, with a pointer or the
   * keyboard. @default false
   */
  editable?: boolean;
  /** How an edge's line goes when the edge doesn't say. @default "curved" */
  edgePath?: FlowPath;
  /** @default "dots" */
  background?: "dots" | "lines" | "none";
  /**
   * The step of a grid that moved nodes land on, in the diagram's units.
   * 0 for none. The arrow keys move a node by this much, or by 10.
   * @default 0
   */
  snap?: number;
  /** @default 0.05 */
  minZoom?: number;
  /** @default 2.5 */
  maxZoom?: number;
  /** Where the view starts. The whole diagram, fitted, when not given. */
  defaultViewport?: FlowViewport;
  /** Called when the view stops moving. */
  onViewportChange?: (viewport: FlowViewport) => void;
  /** Called on a double click of a node, or Enter on one. */
  onNodeOpen?: (id: string) => void;
  /** Called on every frame of a drag, with where the dragged nodes are. */
  onNodeDrag?: (positions: { id: string; position: Point }[]) => void;
  /**
   * Whether a link may be made from one node to another. By default any
   * two different nodes that aren't joined that way yet.
   */
  canConnect?: (from: string, to: string) => boolean;
  /** The edge a new link makes. */
  createEdge?: (from: string, to: string) => FlowEdge;
  /** Zoom and fit buttons, and the list's button. @default true */
  controls?: boolean;
  /**
   * How many nodes a server draws. A larger diagram is drawn by the
   * browser, once it knows the frame's size. @default 300
   */
  serverLimit?: number;
  /** The diagram's own words, for translating. */
  labels?: FlowLabels;
  /** The diagram's methods: fit, zoom and center. */
  handleRef?: Ref<FlowHandle>;
}

export interface FlowProps
  extends FlowOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof FlowOwnProps | "children"> {}

type Gesture =
  | {
      kind: "press";
      hit: Hit | null;
      start: Point;
      client: Point;
      shift: boolean;
    }
  | { kind: "pan"; client: Point; viewport: FlowViewport }
  | {
      kind: "drag";
      ids: string[];
      start: Point;
      origins: Map<string, Point>;
      offset: Point;
    }
  | { kind: "box"; start: Point; current: Point; shift: boolean }
  | { kind: "link"; from: string; start: Point; current: Point }
  | { kind: "pinch"; distance: number; middle: Point; viewport: FlowViewport };

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");

export const Flow = forwardRef<HTMLDivElement, FlowProps>(function Flow(
  {
    "aria-label": ariaLabel,
    nodes: nodesProp,
    defaultNodes,
    onNodesChange,
    edges: edgesProp,
    defaultEdges,
    onEdgesChange,
    selection: selectionProp,
    defaultSelection,
    onSelectionChange,
    editable = false,
    edgePath = "curved",
    background = "dots",
    snap = 0,
    minZoom = 0.05,
    maxZoom = 2.5,
    defaultViewport,
    onViewportChange,
    onNodeOpen,
    onNodeDrag,
    canConnect,
    createEdge,
    controls = true,
    serverLimit = 300,
    labels: labelsProp,
    handleRef,
    className,
    ...props
  },
  ref,
) {
  const labels = useMemo(
    () => ({
      ...englishLabels,
      ...labelsProp,
      shapes: { ...englishLabels.shapes, ...labelsProp?.shapes },
    }),
    [labelsProp],
  );
  const uid = `nuv-flow-${safeId(useId())}`;

  const [ownNodes, setOwnNodes] = useState(defaultNodes ?? []);
  const [ownEdges, setOwnEdges] = useState(defaultEdges ?? []);
  const [ownSelection, setOwnSelection] = useState(
    defaultSelection ?? noSelection,
  );
  const nodes = nodesProp ?? ownNodes;
  const edges = edgesProp ?? ownEdges;
  const selection = selectionProp ?? ownSelection;

  const [store] = useState(() => {
    const created = new FlowStore();
    created.defaultPath = edgePath;
    created.serverLimit = serverLimit;
    created.setSelection(selection);
    created.setNodes(nodes);
    created.setEdges(edges);
    // The detail a server draws at: the zoom it would fit the assumed
    // frame at.
    const bounds = boundsOf(created.rects());
    if (bounds) {
      created.setViewport(
        fitViewport(bounds, assumed, fitPadding, minZoom, Math.min(1, maxZoom)),
      );
    }
    created.refresh();
    return created;
  });

  store.defaultPath = edgePath;
  useIsomorphicLayoutEffect(() => {
    store.setNodes(nodes);
  }, [store, nodes]);
  useIsomorphicLayoutEffect(() => {
    store.setEdges(edges);
  }, [store, edges]);
  useIsomorphicLayoutEffect(() => {
    store.setSelection(selection);
    // One node selected in an editable diagram shows its handles, so a
    // finger, which can't hover, can start a link from it.
    if (editable && selection.nodes.length === 1) {
      store.setHandlesOn(selection.nodes[0] ?? null);
    }
  }, [store, selection, editable]);

  // What's needed in handlers, read where they run so they never go stale.
  const latest = useRef({
    editable,
    snap,
    minZoom,
    maxZoom,
    canConnect,
    createEdge,
    onNodesChange,
    onEdgesChange,
    onSelectionChange,
    onViewportChange,
    onNodeOpen,
    onNodeDrag,
    labels,
    nodesControlled: nodesProp !== undefined,
    edgesControlled: edgesProp !== undefined,
    selectionControlled: selectionProp !== undefined,
  });
  latest.current = {
    editable,
    snap,
    minZoom,
    maxZoom,
    canConnect,
    createEdge,
    onNodesChange,
    onEdgesChange,
    onSelectionChange,
    onViewportChange,
    onNodeOpen,
    onNodeDrag,
    labels,
    nodesControlled: nodesProp !== undefined,
    edgesControlled: edgesProp !== undefined,
    selectionControlled: selectionProp !== undefined,
  };

  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<SVGGElement>(null);
  const patternRef = useRef<SVGPatternElement>(null);
  const boxRef = useRef<SVGRectElement>(null);
  const linkRef = useRef<SVGPathElement>(null);
  const [measured, setMeasured] = useState(false);
  const [message, setMessage] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const detail = useTopic(store, "detail", () => store.getDetail());
  const active = useTopic(store, "active", () => store.active);

  // The view -------------------------------------------------------------

  const frame = useRef({ queued: false, lastRefresh: 0, markerZoom: 0 });
  const restTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Whether the view is still the fitted one. While it is, it's fitted
  // again when the frame changes size, since a page often lays out a
  // little after the first measure. A pan or a zoom ends it.
  const fitted = useRef(false);

  // Writes the view's transform straight onto the group, once a frame. A
  // pan or a zoom never re-renders React. What's in view is worked out
  // again every 120 ms while it moves and once it rests.
  const applyView = useCallback(() => {
    frame.current.queued = false;
    const { x, y, zoom } = store.viewport;
    const transform = `translate(${x} ${y}) scale(${zoom})`;
    viewRef.current?.setAttribute("transform", transform);
    patternRef.current?.setAttribute("patternTransform", transform);
    // Arrowheads are the same size on the screen at every zoom, as the
    // lines they end are.
    if (zoom !== frame.current.markerZoom) {
      frame.current.markerZoom = zoom;
      const size = String(10 / zoom);
      for (const marker of canvasRef.current?.querySelectorAll("marker") ??
        []) {
        marker.setAttribute("markerWidth", size);
        marker.setAttribute("markerHeight", size);
      }
    }
    const now = performance.now();
    if (now - frame.current.lastRefresh > 120) {
      frame.current.lastRefresh = now;
      store.refresh();
    }
  }, [store]);

  const setView = useCallback(
    (next: FlowViewport, fit = false) => {
      fitted.current = fit;
      const { minZoom: min, maxZoom: max } = latest.current;
      store.setViewport({ ...next, zoom: clamp(next.zoom, min, max) });
      if (!frame.current.queued) {
        frame.current.queued = true;
        requestAnimationFrame(applyView);
      }
      clearTimeout(restTimer.current);
      restTimer.current = setTimeout(() => {
        store.refresh();
        latest.current.onViewportChange?.(store.viewport);
      }, 150);
    },
    [store, applyView],
  );

  const fit = useCallback(() => {
    const bounds = boundsOf(store.rects());
    if (!bounds || !store.size) return;
    const { minZoom: min, maxZoom: max } = latest.current;
    setView(
      fitViewport(bounds, store.size, fitPadding, min, Math.min(1, max)),
      true,
    );
  }, [store, setView]);

  const zoomBy = useCallback(
    (factor: number, around?: Point) => {
      if (!store.size) return;
      const v = store.viewport;
      const at = around ?? {
        x: store.size.width / 2,
        y: store.size.height / 2,
      };
      const { minZoom: min, maxZoom: max } = latest.current;
      const zoom = clamp(v.zoom * factor, min, max);
      setView({
        zoom,
        x: at.x - ((at.x - v.x) / v.zoom) * zoom,
        y: at.y - ((at.y - v.y) / v.zoom) * zoom,
      });
    },
    [store, setView],
  );

  const center = useCallback(
    (id: string) => {
      const state = store.node(id);
      if (!state || !store.size) return;
      const v = store.viewport;
      setView({
        zoom: v.zoom,
        x:
          store.size.width / 2 - (state.rect.x + state.rect.width / 2) * v.zoom,
        y:
          store.size.height / 2 -
          (state.rect.y + state.rect.height / 2) * v.zoom,
      });
    },
    [store, setView],
  );

  // Pans just enough to bring a node into view, as the arrow keys move.
  const reveal = useCallback(
    (id: string) => {
      const state = store.node(id);
      if (!state || !store.size) return;
      const v = store.viewport;
      const margin = 24;
      const left = state.rect.x * v.zoom + v.x;
      const top = state.rect.y * v.zoom + v.y;
      const right = left + state.rect.width * v.zoom;
      const bottom = top + state.rect.height * v.zoom;
      let dx = 0;
      let dy = 0;
      if (left < margin) dx = margin - left;
      else if (right > store.size.width - margin) {
        dx = store.size.width - margin - right;
      }
      if (top < margin) dy = margin - top;
      else if (bottom > store.size.height - margin) {
        dy = store.size.height - margin - bottom;
      }
      if (dx || dy) setView({ ...v, x: v.x + dx, y: v.y + dy });
    },
    [store, setView],
  );

  useImperativeHandle(
    handleRef,
    () => ({
      fit,
      zoomIn: () => zoomBy(1.25),
      zoomOut: () => zoomBy(0.8),
      center,
      getViewport: () => store.viewport,
    }),
    [fit, zoomBy, center, store],
  );

  // Measured once in the browser, then whenever the frame changes size.
  // Until then the diagram is drawn the way a server draws it: fitted by
  // the SVG's viewBox, which needs no size.
  useIsomorphicLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const read = (): Size => ({
      width: element.clientWidth,
      height: element.clientHeight,
    });
    store.setSize(read());
    const bounds = boundsOf(store.rects());
    if (defaultViewport) {
      store.setViewport(defaultViewport);
    } else if (bounds && store.size) {
      store.setViewport(
        fitViewport(
          bounds,
          store.size,
          fitPadding,
          minZoom,
          Math.min(1, maxZoom),
        ),
      );
      fitted.current = true;
    }
    setMeasured(true);
    const observer = new ResizeObserver(() => {
      const before = store.size;
      const size = read();
      store.setSize(size);
      if (
        fitted.current &&
        (size.width !== before?.width || size.height !== before?.height)
      ) {
        fit();
      } else {
        store.refresh();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [store]);

  useIsomorphicLayoutEffect(() => {
    if (!measured) return;
    applyView();
    store.refresh();
  }, [measured, applyView, store]);

  useEffect(
    () => () => {
      clearTimeout(restTimer.current);
    },
    [],
  );

  // Changes made here -----------------------------------------------------

  const announce = useCallback((text: string) => {
    // The same words twice in a row still have to be heard twice.
    setMessage((previous) => (previous === text ? `${text} ` : text));
  }, []);

  const changeSelection = useCallback(
    (wanted: FlowSelection) => {
      // In the app's order, whatever order they were picked in.
      const nodeSet = new Set(wanted.nodes);
      const edgeSet = new Set(wanted.edges);
      const next: FlowSelection = {
        nodes: store.nodeIds().filter((id) => nodeSet.has(id)),
        edges: store.edgeIds().filter((id) => edgeSet.has(id)),
      };
      const current = store.getSelection();
      if (
        next.nodes.length === current.nodes.length &&
        next.edges.length === current.edges.length &&
        next.nodes.every((id, i) => id === current.nodes[i]) &&
        next.edges.every((id, i) => id === current.edges[i])
      ) {
        return;
      }
      if (!latest.current.selectionControlled) {
        setOwnSelection(next);
        store.setSelection(next);
      }
      latest.current.onSelectionChange?.(next);
    },
    [store],
  );

  const commitNodes = useCallback(
    (next: FlowNode[], change: FlowNodesChange) => {
      if (!latest.current.nodesControlled) setOwnNodes(next);
      latest.current.onNodesChange?.(next, change);
    },
    [],
  );

  const commitEdges = useCallback(
    (next: FlowEdge[], change: FlowEdgesChange) => {
      if (!latest.current.edgesControlled) setOwnEdges(next);
      latest.current.onEdgesChange?.(next, change);
    },
    [],
  );

  // After a move the app was told of, the nodes are read again from what
  // the app passes back, so one that didn't take the move puts them back.
  const [resyncAfter, setResyncAfter] = useState<{ ids: string[] } | null>(
    null,
  );
  useIsomorphicLayoutEffect(() => {
    if (resyncAfter) store.resync(resyncAfter.ids);
  }, [resyncAfter, store]);

  const finishMove = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const next = store.nodesWithPositions(new Set(ids));
      commitNodes(next, { type: "move", ids });
      setResyncAfter({ ids });
    },
    [store, commitNodes],
  );

  const labelOf = useCallback(
    (id: string) => store.node(id)?.node.label ?? id,
    [store],
  );

  const connect = useCallback(
    (from: string, to: string) => {
      const {
        canConnect: allowed,
        createEdge: make,
        labels: l,
      } = latest.current;
      const current = store.currentEdges();
      const ok = allowed
        ? allowed(from, to)
        : from !== to &&
          !current.some((edge) => edge.from === from && edge.to === to);
      if (!ok) return false;
      let edge: FlowEdge;
      if (make) {
        edge = make(from, to);
      } else {
        const base = `${from}->${to}`;
        let id = base;
        for (let n = 2; store.edge(id); n++) id = `${base}-${n}`;
        edge = { id, from, to };
      }
      commitEdges([...current, edge], { type: "add", ids: [edge.id] });
      announce(l.linked(labelOf(from), labelOf(to)));
      return true;
    },
    [store, commitEdges, announce, labelOf],
  );

  const removeEdges = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const gone = new Set(ids);
      commitEdges(
        store.currentEdges().filter((edge) => !gone.has(edge.id)),
        { type: "remove", ids },
      );
      const selected = store.getSelection();
      changeSelection({
        nodes: selected.nodes,
        edges: selected.edges.filter((id) => !gone.has(id)),
      });
      announce(latest.current.labels.removed(0, ids.length));
    },
    [store, commitEdges, changeSelection, announce],
  );

  const removeSelected = useCallback(() => {
    const selected = store.getSelection();
    let nodeIds = selected.nodes;
    if (nodeIds.length === 0 && selected.edges.length === 0 && store.active) {
      nodeIds = [store.active];
    }
    nodeIds = nodeIds.filter((id) => !store.node(id)?.node.locked);
    const goneNodes = new Set(nodeIds);
    const goneEdges = new Set(selected.edges);
    for (const edge of store.currentEdges()) {
      if (goneNodes.has(edge.from) || goneNodes.has(edge.to)) {
        goneEdges.add(edge.id);
      }
    }
    if (goneNodes.size === 0 && goneEdges.size === 0) return;
    if (goneNodes.size > 0) {
      commitNodes(
        store.currentNodes().filter((node) => !goneNodes.has(node.id)),
        { type: "remove", ids: nodeIds },
      );
    }
    if (goneEdges.size > 0) {
      commitEdges(
        store.currentEdges().filter((edge) => !goneEdges.has(edge.id)),
        { type: "remove", ids: [...goneEdges] },
      );
    }
    changeSelection(noSelection);
    if (store.active && goneNodes.has(store.active)) store.setActive(null);
    announce(latest.current.labels.removed(goneNodes.size, goneEdges.size));
  }, [store, commitNodes, commitEdges, changeSelection, announce]);

  // Pointer -------------------------------------------------------------

  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const svgBox = useRef<DOMRect | null>(null);
  const dragFrame = useRef(false);

  const local = (clientX: number, clientY: number): Point => {
    const box = svgBox.current ?? canvasRef.current?.getBoundingClientRect();
    return box
      ? { x: clientX - box.left, y: clientY - box.top }
      : { x: clientX, y: clientY };
  };

  const toDiagram = (point: Point): Point => {
    const v = store.viewport;
    return { x: (point.x - v.x) / v.zoom, y: (point.y - v.y) / v.zoom };
  };

  const showBox = (a: Point | null, b?: Point) => {
    const element = boxRef.current;
    if (!element) return;
    if (!a || !b) {
      element.setAttribute("visibility", "hidden");
      return;
    }
    element.setAttribute("x", String(Math.min(a.x, b.x)));
    element.setAttribute("y", String(Math.min(a.y, b.y)));
    element.setAttribute("width", String(Math.abs(a.x - b.x)));
    element.setAttribute("height", String(Math.abs(a.y - b.y)));
    element.setAttribute("visibility", "visible");
  };

  const showLink = (from: Point | null, to?: Point) => {
    const element = linkRef.current;
    if (!element) return;
    if (!from || !to) {
      element.setAttribute("visibility", "hidden");
      return;
    }
    element.setAttribute("d", `M${from.x} ${from.y}L${to.x} ${to.y}`);
    element.setAttribute("visibility", "visible");
  };

  const selectFromHit = (hit: Hit | null, shift: boolean) => {
    const current = store.getSelection();
    if (!hit || hit.kind === "handle") {
      if (!shift) changeSelection(noSelection);
      return;
    }
    if (hit.kind === "node") {
      store.setActive(hit.id);
      const has = current.nodes.includes(hit.id);
      changeSelection(
        shift
          ? {
              nodes: has
                ? current.nodes.filter((id) => id !== hit.id)
                : [...current.nodes, hit.id],
              edges: current.edges,
            }
          : { nodes: [hit.id], edges: [] },
      );
    } else {
      const has = current.edges.includes(hit.id);
      changeSelection(
        shift
          ? {
              nodes: current.nodes,
              edges: has
                ? current.edges.filter((id) => id !== hit.id)
                : [...current.edges, hit.id],
            }
          : { nodes: [], edges: [hit.id] },
      );
    }
  };

  const startDrag = (
    hit: Hit & { kind: "node" },
    start: Point,
    shift: boolean,
  ): Gesture | null => {
    const current = store.getSelection();
    let ids = current.nodes.includes(hit.id) ? current.nodes : [hit.id];
    if (!current.nodes.includes(hit.id)) {
      changeSelection(
        shift
          ? { nodes: [...current.nodes, hit.id], edges: current.edges }
          : { nodes: [hit.id], edges: [] },
      );
      if (shift) ids = [...current.nodes, hit.id];
    }
    ids = ids.filter((id) => !store.node(id)?.node.locked);
    if (ids.length === 0) return null;
    const origins = new Map<string, Point>();
    for (const id of ids) {
      const rect = store.node(id)?.rect;
      if (rect) origins.set(id, { x: rect.x, y: rect.y });
    }
    store.pin(ids);
    store.setActive(hit.id);
    const drag: Gesture = {
      kind: "drag",
      ids,
      start,
      origins,
      offset: { x: 0, y: 0 },
    };
    return drag;
  };

  // Given the gesture, since when the pointer comes up the gesture is
  // already over, and a frame may not have run since the last move.
  const placeDragged = (g: Gesture | null) => {
    dragFrame.current = false;
    if (g?.kind !== "drag") return;
    const step = latest.current.snap;
    const positions = new Map<string, Point>();
    for (const [id, origin] of g.origins) {
      let x = origin.x + g.offset.x;
      let y = origin.y + g.offset.y;
      if (step > 0) {
        x = Math.round(x / step) * step;
        y = Math.round(y / step) * step;
      }
      positions.set(id, { x, y });
    }
    store.placeNodes(positions);
    latest.current.onNodeDrag?.(
      [...positions].map(([id, position]) => ({ id, position })),
    );
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const svg = canvasRef.current;
    if (!svg || !measured) return;
    svgBox.current = svg.getBoundingClientRect();
    try {
      svg.setPointerCapture(event.pointerId);
    } catch {
      // A pointer the browser doesn't count as active can't be captured.
      // The gesture still works while the pointer stays over the diagram.
    }
    const point = local(event.clientX, event.clientY);
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [Point, Point];
      gesture.current = {
        kind: "pinch",
        distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        middle: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        viewport: store.viewport,
      };
      showBox(null);
      showLink(null);
      return;
    }
    if (pointers.current.size > 2) return;

    const at = toDiagram(point);
    const hit = store.hitTest(at, store.viewport.zoom, latest.current.editable);
    if (hit?.kind === "handle") {
      gesture.current = {
        kind: "link",
        from: hit.id,
        start: hit.point,
        current: at,
      };
      return;
    }
    if (!hit && event.shiftKey) {
      gesture.current = { kind: "box", start: at, current: at, shift: true };
      return;
    }
    gesture.current = {
      kind: "press",
      hit,
      start: at,
      client: point,
      shift: event.shiftKey,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = local(event.clientX, event.clientY);
    if (pointers.current.has(event.pointerId)) {
      pointers.current.set(event.pointerId, point);
    }
    let g = gesture.current;

    if (!g) {
      // Hovering: which node shows its handles, and the pointer's shape.
      if (event.pointerType !== "mouse" || !measured) return;
      const hit = store.hitTest(
        toDiagram(point),
        store.viewport.zoom,
        latest.current.editable,
      );
      const svg = canvasRef.current;
      if (svg) svg.dataset.hover = hit ? hit.kind : "";
      if (latest.current.editable) {
        if (hit?.kind === "node") store.setHandlesOn(hit.id);
        else if (!hit) {
          const selected = store.getSelection().nodes;
          store.setHandlesOn(
            selected.length === 1 ? (selected[0] ?? null) : null,
          );
        }
      }
      return;
    }

    if (g.kind === "pinch") {
      const values = [...pointers.current.values()];
      if (values.length < 2) return;
      const [a, b] = values as [Point, Point];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const { minZoom: min, maxZoom: max } = latest.current;
      const zoom = clamp((g.viewport.zoom * distance) / g.distance, min, max);
      const anchor = {
        x: (g.middle.x - g.viewport.x) / g.viewport.zoom,
        y: (g.middle.y - g.viewport.y) / g.viewport.zoom,
      };
      setView({
        zoom,
        x: middle.x - anchor.x * zoom,
        y: middle.y - anchor.y * zoom,
      });
      return;
    }

    const at = toDiagram(point);
    if (g.kind === "press") {
      if (
        Math.hypot(point.x - g.client.x, point.y - g.client.y) < dragThreshold
      ) {
        return;
      }
      const hit = g.hit;
      if (hit?.kind === "node" && latest.current.editable) {
        const drag = startDrag(hit, g.start, g.shift);
        g = drag ?? { kind: "pan", client: g.client, viewport: store.viewport };
      } else {
        g = { kind: "pan", client: g.client, viewport: store.viewport };
      }
      gesture.current = g;
    }

    switch (g.kind) {
      case "pan":
        setView({
          ...g.viewport,
          x: g.viewport.x + point.x - g.client.x,
          y: g.viewport.y + point.y - g.client.y,
        });
        break;
      case "drag":
        g.offset = { x: at.x - g.start.x, y: at.y - g.start.y };
        if (!dragFrame.current) {
          dragFrame.current = true;
          requestAnimationFrame(() => placeDragged(gesture.current));
        }
        break;
      case "box":
        g.current = at;
        showBox(g.start, at);
        break;
      case "link": {
        g.current = at;
        showLink(store.linkStart(g.from, at), at);
        break;
      }
    }
  };

  const endGesture = (
    event: ReactPointerEvent<HTMLDivElement>,
    cancel: boolean,
  ) => {
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pinch") {
      if (pointers.current.size < 2) gesture.current = null;
      return;
    }
    gesture.current = null;
    svgBox.current = null;
    showBox(null);
    showLink(null);
    if (cancel) {
      if (g.kind === "drag") {
        store.placeNodes(g.origins);
        store.unpin(g.ids);
      }
      return;
    }
    switch (g.kind) {
      case "press":
        selectFromHit(g.hit, g.shift);
        break;
      case "pan":
        // Where the view ended, whether or not a frame ran for the last move.
        applyView();
        break;
      case "drag":
        placeDragged(g);
        store.unpin(g.ids);
        finishMove(g.ids);
        announce(latest.current.labels.moved(g.ids.map(labelOf)));
        break;
      case "box": {
        const rect: Rect = {
          x: Math.min(g.start.x, g.current.x),
          y: Math.min(g.start.y, g.current.y),
          width: Math.abs(g.current.x - g.start.x),
          height: Math.abs(g.current.y - g.start.y),
        };
        const found = store.nodesIn(rect);
        const current = store.getSelection();
        const nodes = g.shift
          ? [...new Set([...current.nodes, ...found])]
          : found;
        changeSelection({ nodes, edges: g.shift ? current.edges : [] });
        break;
      }
      case "link": {
        const hit = store.hitTest(g.current, store.viewport.zoom, false);
        if (hit?.kind === "node" && !store.node(hit.id)?.node.locked) {
          connect(g.from, hit.id);
        }
        break;
      }
    }
  };

  const onDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!measured) return;
    svgBox.current = null;
    const hit = store.hitTest(
      toDiagram(local(event.clientX, event.clientY)),
      store.viewport.zoom,
      false,
    );
    if (hit?.kind === "node") latest.current.onNodeOpen?.(hit.id);
  };

  // The wheel zooms while the diagram has focus, or with Ctrl held, which
  // is also what a pinch on a trackpad sends. Otherwise the page scrolls.
  useEffect(() => {
    const svg = canvasRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      if (!store.size) return;
      const focused = document.activeElement === svg;
      if (!focused && !event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const scale =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
      const box = svg.getBoundingClientRect();
      zoomBy(Math.exp(-event.deltaY * scale * 0.0015), {
        x: event.clientX - box.left,
        y: event.clientY - box.top,
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [store, zoomBy]);

  // Keyboard ------------------------------------------------------------

  const keyMoveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const keyMoved = useRef(new Set<string>());

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const l = latest.current;
    const ids = store.nodeIds();
    if (ids.length === 0) return;
    const current = store.active ?? null;
    const arrows: Record<string, Point> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };
    const arrow = arrows[event.key];

    if (arrow && event.shiftKey && l.editable) {
      event.preventDefault();
      const selected = store.getSelection().nodes;
      const moving = (
        selected.length ? selected : current ? [current] : []
      ).filter((id) => !store.node(id)?.node.locked);
      if (moving.length === 0) return;
      const step = l.snap > 0 ? l.snap : 10;
      store.moveNodes(moving, arrow.x * step, arrow.y * step);
      if (current) reveal(current);
      for (const id of moving) keyMoved.current.add(id);
      // Told to the app as one move once the keys rest, as a drag is.
      clearTimeout(keyMoveTimer.current);
      keyMoveTimer.current = setTimeout(() => {
        const moved = [...keyMoved.current];
        keyMoved.current.clear();
        finishMove(moved);
        announce(l.labels.moved(moved.map(labelOf)));
      }, 400);
      return;
    }

    if (arrow) {
      event.preventDefault();
      const next = current
        ? store.nearest(current, arrow.x, arrow.y)
        : (ids[0] ?? null);
      if (next) {
        store.setActive(next);
        reveal(next);
      }
      return;
    }

    switch (event.key) {
      case " ": {
        event.preventDefault();
        const id = current ?? ids[0];
        if (!id) return;
        store.setActive(id);
        const selected = store.getSelection();
        const has = selected.nodes.includes(id);
        changeSelection({
          nodes: has
            ? selected.nodes.filter((other) => other !== id)
            : [...selected.nodes, id],
          edges: selected.edges,
        });
        return;
      }
      case "Enter": {
        if (!current) return;
        event.preventDefault();
        if (l.onNodeOpen) l.onNodeOpen(current);
        else changeSelection({ nodes: [current], edges: [] });
        return;
      }
      case "l":
      case "L": {
        if (!l.editable || !current || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        const from = store.getLinkFrom();
        if (!from) {
          if (store.node(current)?.node.locked) return;
          store.setLinkFrom(current);
          announce(l.labels.linking(labelOf(current)));
        } else {
          store.setLinkFrom(null);
          if (
            from === current ||
            store.node(current)?.node.locked ||
            !connect(from, current)
          ) {
            announce(l.labels.linkCancelled);
          }
        }
        return;
      }
      case "Escape": {
        if (store.getLinkFrom()) {
          event.preventDefault();
          store.setLinkFrom(null);
          announce(l.labels.linkCancelled);
          return;
        }
        const selected = store.getSelection();
        if (selected.nodes.length || selected.edges.length) {
          event.preventDefault();
          changeSelection(noSelection);
        }
        return;
      }
      case "Delete":
      case "Backspace": {
        if (!l.editable) return;
        event.preventDefault();
        removeSelected();
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
      case "a":
      case "A":
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          changeSelection({ nodes: [...ids], edges: [] });
        }
        return;
    }
  };

  const onFocus = () => {
    if (store.active) return;
    const first = store.nodeIds()[0];
    if (first) {
      store.setActive(first);
      reveal(first);
    }
  };

  useEffect(() => () => clearTimeout(keyMoveTimer.current), []);

  // Drawing -------------------------------------------------------------

  // The server's frame: the whole diagram in the viewBox, at least the size
  // of the frame it assumes, centered.
  const serverBox = useMemo(() => {
    const bounds = boundsOf(store.rects());
    if (!bounds) return `0 0 ${assumed.width} ${assumed.height}`;
    const width = Math.max(bounds.width + fitPadding * 2, assumed.width);
    const height = Math.max(bounds.height + fitPadding * 2, assumed.height);
    const x = bounds.x + bounds.width / 2 - width / 2;
    const y = bounds.y + bounds.height / 2 - height / 2;
    return `${x} ${y} ${width} ${height}`;
  }, [store]);

  const activeIndex = active ? store.node(active)?.index : undefined;
  const instructionsId = `${uid}-instructions`;
  const listId = `${uid}-list`;
  const gap = 20;

  return (
    <div
      ref={ref}
      className={cx("nuv-flow", className)}
      data-editable={editable ? "" : undefined}
      {...props}
    >
      <div ref={frameRef} className="nuv-flow__frame">
        <div
          ref={canvasRef}
          className="nuv-flow__canvas"
          role="listbox"
          aria-label={ariaLabel}
          aria-roledescription={labels.roleDescription}
          aria-multiselectable
          aria-describedby={instructionsId}
          aria-activedescendant={
            activeIndex === undefined ? undefined : `${uid}-n${activeIndex}`
          }
          tabIndex={0}
          data-detail={detail}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => endGesture(event, false)}
          onPointerCancel={(event) => endGesture(event, true)}
          onLostPointerCapture={(event) => {
            if (gesture.current && gesture.current.kind !== "pinch") {
              endGesture(event, false);
            }
          }}
          onDoubleClick={onDoubleClick}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={() => store.getLinkFrom() && store.setLinkFrom(null)}
        >
          <svg
            className="nuv-flow__svg"
            role="none"
            viewBox={measured ? undefined : serverBox}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {background !== "none" && (
                <pattern
                  ref={patternRef}
                  id={`${uid}-grid`}
                  width={gap}
                  height={gap}
                  patternUnits="userSpaceOnUse"
                >
                  {background === "dots" ? (
                    <circle className="nuv-flow__dot" cx={1} cy={1} r={1} />
                  ) : (
                    <path
                      className="nuv-flow__grid-line"
                      d={`M${gap} 0H0V${gap}`}
                      fill="none"
                    />
                  )}
                </pattern>
              )}
              {[...intents, "selected" as const].map((kind) => (
                <marker
                  key={kind}
                  id={`${uid}-arrow-${kind}`}
                  viewBox="0 0 10 10"
                  refX={10}
                  refY={5}
                  markerWidth={10}
                  markerHeight={10}
                  markerUnits="userSpaceOnUse"
                  orient="auto-start-reverse"
                >
                  <path
                    className={`nuv-flow__arrow nuv-flow__arrow--${kind}`}
                    d="M0 0L10 5L0 10Z"
                  />
                </marker>
              ))}
            </defs>
            {background !== "none" && (
              <rect
                className="nuv-flow__background"
                fill={`url(#${uid}-grid)`}
                {...(measured
                  ? { width: "100%", height: "100%" }
                  : serverBackground(serverBox))}
              />
            )}
            <g ref={viewRef}>
              {detail === 2 && <OverviewPaths store={store} />}
              <Edges store={store} uid={uid} detail={detail} />
              <Nodes store={store} uid={uid} detail={detail} labels={labels} />
              <ActiveRing store={store} />
              <LinkPreview store={store} />
              {editable && detail === 0 && <Handles store={store} />}
              <path
                ref={linkRef}
                className="nuv-flow__new-link"
                visibility="hidden"
              />
              <rect
                ref={boxRef}
                className="nuv-flow__selection-box"
                visibility="hidden"
              />
            </g>
          </svg>
        </div>
        {controls && (
          <div
            className="nuv-flow__controls"
            role="toolbar"
            aria-label={labels.controls}
          >
            <button
              type="button"
              className="nuv-flow__control"
              aria-label={labels.zoomOut}
              title={labels.zoomOut}
              onClick={() => zoomBy(0.8)}
            >
              <Icon d="M5 12h14" />
            </button>
            <button
              type="button"
              className="nuv-flow__control"
              aria-label={labels.zoomIn}
              title={labels.zoomIn}
              onClick={() => zoomBy(1.25)}
            >
              <Icon d="M12 5v14M5 12h14" />
            </button>
            <button
              type="button"
              className="nuv-flow__control"
              aria-label={labels.fit}
              title={labels.fit}
              onClick={fit}
            >
              <Icon d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
            </button>
            <button
              type="button"
              className="nuv-flow__control"
              aria-label={listOpen ? labels.hideList : labels.showList}
              title={listOpen ? labels.hideList : labels.showList}
              aria-expanded={listOpen}
              aria-controls={listId}
              onClick={() => setListOpen((open) => !open)}
            >
              <Icon d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
            </button>
          </div>
        )}
      </div>
      <div id={instructionsId} className="nuv-flow__hidden">
        {labels.instructions}
        {editable ? ` ${labels.editInstructions}` : ""}
      </div>
      <div className="nuv-flow__hidden" role="status" aria-live="polite">
        {message}
      </div>
      <div id={listId} className="nuv-flow__list" hidden={!listOpen}>
        {listOpen && (
          <FlowList
            store={store}
            labels={labels}
            editable={editable}
            onFind={(id) => {
              store.setActive(id);
              center(id);
              canvasRef.current?.focus();
            }}
            onRemoveLink={(id) => removeEdges([id])}
          />
        )}
      </div>
    </div>
  );
});

// Before the frame is measured the background covers the viewBox.
function serverBackground(box: string) {
  const [x, y, width, height] = box.split(" ");
  return { x, y, width, height };
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      className="nuv-flow__icon"
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

// The nodes in view, each one its own component that reads its own entry
// in the store.
function Nodes({
  store,
  uid,
  detail,
  labels,
}: {
  store: FlowStore;
  uid: string;
  detail: Detail;
  labels: Required<FlowLabels>;
}) {
  const visible = useTopic(store, "visible", () => store.getVisible());
  const total = store.nodeCount;
  return (
    <g className="nuv-flow__nodes">
      {visible.nodes.map((id) => (
        <NodeShape
          key={id}
          store={store}
          id={id}
          uid={uid}
          detail={detail}
          labels={labels}
          total={total}
        />
      ))}
    </g>
  );
}

const NodeShape = memo(function NodeShape({
  store,
  id,
  uid,
  detail,
  labels,
  total,
}: {
  store: FlowStore;
  id: string;
  uid: string;
  detail: Detail;
  labels: Required<FlowLabels>;
  total: number;
}) {
  const state = useTopic(store, `node:${id}`, () => store.node(id));
  const outline = useMemo(
    () =>
      state
        ? outlinePath(state.shape, state.rect.width, state.rect.height)
        : "",
    [state],
  );
  if (!state) return null;
  const { node, rect, shape } = state;
  const box = labelBox(shape, rect.width, rect.height);
  const lines = clamp(Math.floor(box.height / lineHeight), 1, 6);
  const targets = store.outgoing(id).flatMap((edge) => {
    const to = store.node(edge.edge.to);
    return to ? [{ label: to.node.label, edgeLabel: edge.edge.label }] : [];
  });
  const name = [
    node.label,
    labels.shapes[shape],
    node.description,
    targets.length ? labels.leadsTo(targets) : undefined,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <g
      id={`${uid}-n${state.index}`}
      role="option"
      aria-selected={state.selected}
      aria-label={name}
      aria-posinset={state.index + 1}
      aria-setsize={total}
      className={cx(
        "nuv-flow__node",
        `nuv-flow__node--${node.intent ?? "neutral"}`,
      )}
      data-id={node.id}
      data-shape={shape}
      data-selected={state.selected ? "" : undefined}
      data-linking={state.linking ? "" : undefined}
      data-locked={node.locked ? "" : undefined}
      transform={`translate(${rect.x} ${rect.y})`}
    >
      <path className="nuv-flow__shape" d={outline} />
      {detail === 0 && (
        // biome-ignore lint/a11y/noAriaHiddenOnFocusable: nothing in it takes focus. The option's name is its label, so the words aren't read twice.
        <foreignObject
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          aria-hidden="true"
        >
          <div className="nuv-flow__label">
            <div className="nuv-flow__label-text" data-lines={lines}>
              {node.label}
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
});

function Edges({
  store,
  uid,
  detail,
}: {
  store: FlowStore;
  uid: string;
  detail: Detail;
}) {
  const visible = useTopic(store, "visible", () => store.getVisible());
  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: nothing in it takes focus. Its labels would be read outside any option, and each node's name already says where it leads.
    <g className="nuv-flow__edges" aria-hidden="true">
      {visible.edges.map((id) => (
        <EdgeLine key={id} store={store} id={id} uid={uid} detail={detail} />
      ))}
    </g>
  );
}

const EdgeLine = memo(function EdgeLine({
  store,
  id,
  uid,
  detail,
}: {
  store: FlowStore;
  id: string;
  uid: string;
  detail: Detail;
}) {
  const state = useTopic(store, `edge:${id}`, () => store.edge(id));
  if (!state?.geometry) return null;
  const { edge, geometry, selected } = state;
  const intent = edge.intent ?? "neutral";
  const arrow = edge.arrow ?? "end";
  const marker =
    detail === 0
      ? `url(#${uid}-arrow-${selected ? "selected" : intent})`
      : undefined;
  return (
    <g
      className={cx("nuv-flow__edge", `nuv-flow__edge--${intent}`)}
      data-id={edge.id}
      data-selected={selected ? "" : undefined}
      data-dashed={edge.dashed ? "" : undefined}
      data-animated={edge.animated ? "" : undefined}
    >
      <path
        className="nuv-flow__line"
        d={geometry.d}
        markerEnd={arrow === "end" || arrow === "both" ? marker : undefined}
        markerStart={arrow === "start" || arrow === "both" ? marker : undefined}
      />
      {edge.label && detail === 0 && (
        <foreignObject
          x={geometry.middle.x - 80}
          y={geometry.middle.y - 12}
          width={160}
          height={24}
        >
          <div className="nuv-flow__edge-label">
            <span className="nuv-flow__edge-label-text">{edge.label}</span>
          </div>
        </foreignObject>
      )}
    </g>
  );
});

function OverviewPaths({ store }: { store: FlowStore }) {
  const overview = useTopic(store, "overview", () => store.getOverview());
  return (
    <g>
      <path className="nuv-flow__overview-edges" d={overview.edges} />
      {intents.map((intent) =>
        overview.nodes[intent] ? (
          <path
            key={intent}
            className={`nuv-flow__overview nuv-flow__overview--${intent}`}
            d={overview.nodes[intent]}
          />
        ) : null,
      )}
    </g>
  );
}

// The keyboard's place: a ring around the active node, shown while the
// diagram has focus from the keyboard.
function ActiveRing({ store }: { store: FlowStore }) {
  const active = useTopic(store, "active", () => store.active);
  const state = useTopic(store, active ? `node:${active}` : "none", () =>
    active ? store.node(active) : undefined,
  );
  const zoom = useTopic(store, "zoom", () => store.viewport.zoom);
  if (!state) return null;
  // The same gap on the screen at every zoom.
  const pad = 5 / zoom;
  return (
    <path
      className="nuv-flow__focus"
      transform={`translate(${state.rect.x - pad} ${state.rect.y - pad})`}
      d={outlinePath(
        state.shape,
        state.rect.width + pad * 2,
        state.rect.height + pad * 2,
      )}
    />
  );
}

// While a link is made with the keyboard: a dashed line from where it
// starts to the node the keys are on.
function LinkPreview({ store }: { store: FlowStore }) {
  const from = useTopic(store, "linking", () => store.getLinkFrom());
  const active = useTopic(store, "active", () => store.active);
  const fromState = useTopic(store, from ? `node:${from}` : "none", () =>
    from ? store.node(from) : undefined,
  );
  const toState = useTopic(store, active ? `node:${active}` : "none", () =>
    active ? store.node(active) : undefined,
  );
  if (!fromState || !toState || from === active) return null;
  const to = {
    x: toState.rect.x + toState.rect.width / 2,
    y: toState.rect.y + toState.rect.height / 2,
  };
  const start = store.linkStart(fromState.node.id, to);
  return (
    <path
      className="nuv-flow__new-link"
      d={`M${start.x} ${start.y}L${to.x} ${to.y}`}
    />
  );
}

function Handles({ store }: { store: FlowStore }) {
  const on = useTopic(store, "handles", () => store.handlesOn);
  const state = useTopic(store, on ? `node:${on}` : "none", () =>
    on ? store.node(on) : undefined,
  );
  const zoom = useTopic(store, "zoom", () => store.viewport.zoom);
  if (!state || state.node.locked) return null;
  return (
    <g className="nuv-flow__handles">
      {handlePoints(state.rect).map((point) => (
        <circle
          key={`${point.x},${point.y}`}
          className="nuv-flow__handle"
          cx={point.x}
          cy={point.y}
          r={5 / zoom}
        />
      ))}
    </g>
  );
}

// The diagram as a list of steps, for a screen reader, the keyboard and
// print. Built when it's opened, two hundred steps at a time.
function FlowList({
  store,
  labels,
  editable,
  onFind,
  onRemoveLink,
}: {
  store: FlowStore;
  labels: Required<FlowLabels>;
  editable: boolean;
  onFind: (id: string) => void;
  onRemoveLink: (id: string) => void;
}) {
  useTopic(store, "structure", () => store.getVersion());
  const [shown, setShown] = useState(200);
  const ids = store.nodeIds();
  const more = Math.min(200, ids.length - shown);
  return (
    <>
      <ol className="nuv-flow__steps" aria-label={labels.list}>
        {ids.slice(0, shown).map((id) => {
          const state = store.node(id);
          if (!state) return null;
          const { node, shape } = state;
          const out = store.outgoing(id);
          const targets = out.flatMap((edge) => {
            const to = store.node(edge.edge.to);
            return to
              ? [{ edge, label: to.node.label, edgeLabel: edge.edge.label }]
              : [];
          });
          return (
            <li key={id} className="nuv-flow__step">
              <button
                type="button"
                className="nuv-flow__step-name"
                aria-label={labels.find(node.label)}
                onClick={() => onFind(id)}
              >
                {node.label}
              </button>{" "}
              <span className="nuv-flow__step-kind">
                ({labels.shapes[shape]})
              </span>
              {node.description && (
                <span className="nuv-flow__step-description">
                  {" "}
                  {node.description}
                </span>
              )}
              {targets.length > 0 && (
                <div className="nuv-flow__step-links">
                  {labels.leadsTo(targets)}
                  {editable &&
                    targets.map((target) => (
                      <button
                        key={target.edge.edge.id}
                        type="button"
                        className="nuv-flow__step-remove"
                        aria-label={labels.removeLink(node.label, target.label)}
                        title={labels.removeLink(node.label, target.label)}
                        onClick={() => onRemoveLink(target.edge.edge.id)}
                      >
                        <Icon d="M6 6l12 12M18 6L6 18" />
                      </button>
                    ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {more > 0 && (
        <button
          type="button"
          className="nuv-flow__more"
          onClick={() => setShown((count) => count + 200)}
        >
          {labels.showMore(more)}
        </button>
      )}
    </>
  );
}

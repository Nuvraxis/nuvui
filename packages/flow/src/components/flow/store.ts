import {
  boundaryPoint,
  contains,
  distanceToLine,
  type EdgeGeometry,
  edgeGeometry,
  type FlowPath,
  type FlowShape,
  type FlowViewport,
  grow,
  intersects,
  type Point,
  type Rect,
  type Size,
  shapeSizes,
  visibleRect,
} from "./geometry";
import { Grid } from "./grid";
import type { FlowEdge, FlowIntent, FlowNode, FlowSelection } from "./types";

/** A node as it's drawn now. Replaced, never changed, so React can compare. */
export interface NodeState {
  node: FlowNode;
  rect: Rect;
  shape: FlowShape;
  index: number;
  selected: boolean;
  /** A link is being made from it with the keyboard. */
  linking: boolean;
  /** Counts changes to its links, which change its name. */
  links: number;
}

/** An edge as it's drawn now. `geometry` is null while an end is missing. */
export interface EdgeState {
  edge: FlowEdge;
  geometry: EdgeGeometry | null;
  selected: boolean;
}

/** What's drawn one by one: what's in view, and what has to be. */
export interface Visible {
  nodes: string[];
  edges: string[];
}

/**
 * How much of each thing is drawn, by the zoom. 0: everything. 1: no
 * words or arrowheads, which can't be read that small. 2: the diagram as a
 * few paths, one for each color.
 */
export type Detail = 0 | 1 | 2;

export const detailAt = (zoom: number): Detail =>
  zoom >= 0.5 ? 0 : zoom >= 0.2 ? 1 : 2;

/** The diagram from far out: a path of boxes for each color, and one of lines. */
export interface Overview {
  nodes: Partial<Record<FlowIntent, string>>;
  edges: string;
}

/** What's under a point. */
export type Hit =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | { kind: "handle"; id: string; point: Point };

const sameRect = (a: Rect, b: Rect) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);

// Room around an edge's line for its label and for the pointer to find it.
const edgeMargin = 40;

// More nodes than this in view and the diagram is drawn as the overview,
// whatever the zoom: mounting each of them would hold up the frame. It's
// left again only well under the limit, so a pan along it doesn't flicker.
const crowdEnter = 250;
const crowdLeave = 180;

/** Where the handles of a node are: the middles of its sides. */
export function handlePoints(rect: Rect): Point[] {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  return [
    { x: cx, y: rect.y },
    { x: rect.x + rect.width, y: cy },
    { x: cx, y: rect.y + rect.height },
    { x: rect.x, y: cy },
  ];
}

/**
 * The diagram as the component draws it. Each node and edge has a topic of
 * its own, so a change re-renders what it touches and nothing else. The
 * nodes and edges an app passes in are read, never changed.
 */
export class FlowStore {
  private readonly nodes = new Map<string, NodeState>();
  private readonly edges = new Map<string, EdgeState>();
  private order: string[] = [];
  private edgeOrder: string[] = [];
  private readonly edgeIndex = new Map<string, number>();
  private readonly byNode = new Map<string, Set<string>>();
  private readonly nodeGrid = new Grid();
  private readonly edgeGrid = new Grid();
  private readonly selectedNodes = new Set<string>();
  private readonly selectedEdges = new Set<string>();
  private readonly topics = new Map<string, Set<() => void>>();
  private visible: Visible = { nodes: [], edges: [] };
  private detail: Detail = 0;
  private overview: Overview = { nodes: {}, edges: "" };
  private overviewStale = true;
  private selection: FlowSelection = { nodes: [], edges: [] };
  private linkFrom: string | null = null;
  /** Drawn whether in view or not: the active node, and what's dragged. */
  private readonly pinned = new Set<string>();
  private nodeList: FlowNode[] = [];
  private edgeList: FlowEdge[] = [];
  private version = 0;

  defaultPath: FlowPath = "curved";
  viewport: FlowViewport = { x: 0, y: 0, zoom: 1 };
  /** The frame's size, or null until it's been measured in a browser. */
  size: Size | null = null;
  /** How many nodes are drawn before the frame has been measured. */
  serverLimit = 300;
  active: string | null = null;
  handlesOn: string | null = null;

  // Topics -------------------------------------------------------------

  subscribe(topic: string, listener: () => void) {
    let set = this.topics.get(topic);
    if (!set) {
      set = new Set();
      this.topics.set(topic, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.topics.delete(topic);
    };
  }

  private emit(topic: string) {
    const set = this.topics.get(topic);
    if (!set) return;
    for (const listener of [...set]) listener();
  }

  // Reading ------------------------------------------------------------

  node(id: string) {
    return this.nodes.get(id);
  }

  edge(id: string) {
    return this.edges.get(id);
  }

  getVisible() {
    return this.visible;
  }

  getDetail() {
    return this.detail;
  }

  getOverview() {
    return this.overview;
  }

  getSelection() {
    return this.selection;
  }

  getVersion() {
    return this.version;
  }

  getLinkFrom() {
    return this.linkFrom;
  }

  get nodeCount() {
    return this.order.length;
  }

  /** The node ids in the order the app gave them. */
  nodeIds() {
    return this.order;
  }

  edgeIds() {
    return this.edgeOrder;
  }

  /** The nodes the app last gave. */
  currentNodes() {
    return this.nodeList;
  }

  /** The edges the app last gave. */
  currentEdges() {
    return this.edgeList;
  }

  /** The edges that start at a node, in the order the app gave them. */
  outgoing(id: string) {
    const ids = this.byNode.get(id);
    if (!ids) return [];
    const out: EdgeState[] = [];
    for (const edgeId of this.edgeOrder) {
      if (!ids.has(edgeId)) continue;
      const state = this.edges.get(edgeId);
      if (state && state.edge.from === id) out.push(state);
    }
    return out;
  }

  /** Every node's box, for fitting the view. */
  rects() {
    const rects: Rect[] = [];
    for (const state of this.nodes.values()) rects.push(state.rect);
    return rects;
  }

  // The data ------------------------------------------------------------

  private stateOf(node: FlowNode, index: number): NodeState {
    const shape = node.shape ?? "rounded";
    const size = node.size ?? shapeSizes[shape];
    return {
      node,
      rect: {
        x: node.position.x,
        y: node.position.y,
        width: size.width,
        height: size.height,
      },
      shape,
      index,
      selected: this.selectedNodes.has(node.id),
      linking: this.linkFrom === node.id,
      links: 0,
    };
  }

  /** Takes in the app's nodes. Only the ones that are new objects are read. */
  setNodes(list: FlowNode[]) {
    const moved = new Set<string>();
    const renamed = new Set<string>();
    const seen = new Set<string>();
    list.forEach((node, index) => {
      seen.add(node.id);
      const previous = this.nodes.get(node.id);
      if (previous && previous.node === node && previous.index === index) {
        return;
      }
      const state = this.stateOf(node, index);
      this.nodes.set(node.id, state);
      if (
        !previous ||
        !sameRect(previous.rect, state.rect) ||
        previous.shape !== state.shape
      ) {
        this.nodeGrid.set(node.id, state.rect);
        moved.add(node.id);
      }
      if (previous && previous.node.label !== node.label) renamed.add(node.id);
      this.emit(`node:${node.id}`);
    });
    for (const id of [...this.nodes.keys()]) {
      if (seen.has(id)) continue;
      this.nodes.delete(id);
      this.nodeGrid.delete(id);
      this.selectedNodes.delete(id);
      this.pinned.delete(id);
      if (this.active === id) this.active = null;
      moved.add(id);
      this.emit(`node:${id}`);
    }
    this.order = list.map((node) => node.id);
    this.nodeList = list;
    this.updateEdgesOf(moved);
    // A node's name says where it leads, so renaming one renames the
    // names of the nodes that lead to it.
    for (const id of renamed) {
      for (const edgeId of this.byNode.get(id) ?? []) {
        const edge = this.edges.get(edgeId)?.edge;
        if (edge && edge.to === id) this.touch(edge.from);
      }
    }
    this.syncSelection();
    this.version++;
    this.overviewStale = true;
    this.emit("structure");
    this.refresh();
  }

  private link(edge: FlowEdge, add: boolean) {
    for (const end of [edge.from, edge.to]) {
      let set = this.byNode.get(end);
      if (add) {
        if (!set) {
          set = new Set();
          this.byNode.set(end, set);
        }
        set.add(edge.id);
      } else if (set) {
        set.delete(edge.id);
        if (set.size === 0) this.byNode.delete(end);
      }
    }
  }

  private geometryOf(edge: FlowEdge) {
    const from = this.nodes.get(edge.from);
    const to = this.nodes.get(edge.to);
    if (!from || !to) return null;
    return edgeGeometry(
      edge.path ?? this.defaultPath,
      from.shape,
      from.rect,
      to.shape,
      to.rect,
      edge.from === edge.to,
    );
  }

  private placeEdge(id: string, geometry: EdgeGeometry | null) {
    if (geometry) {
      this.edgeGrid.set(id, {
        x: geometry.bounds.x - edgeMargin,
        y: geometry.bounds.y - edgeMargin,
        width: geometry.bounds.width + edgeMargin * 2,
        height: geometry.bounds.height + edgeMargin * 2,
      });
    } else {
      this.edgeGrid.delete(id);
    }
  }

  /** Takes in the app's edges. Only the ones that are new objects are read. */
  setEdges(list: FlowEdge[]) {
    const seen = new Set<string>();
    for (const edge of list) {
      seen.add(edge.id);
      const previous = this.edges.get(edge.id);
      if (previous && previous.edge === edge) continue;
      if (previous) {
        this.link(previous.edge, false);
        this.touch(previous.edge.from);
        this.touch(previous.edge.to);
      }
      this.link(edge, true);
      const geometry = this.geometryOf(edge);
      this.edges.set(edge.id, {
        edge,
        geometry,
        selected: this.selectedEdges.has(edge.id),
      });
      this.placeEdge(edge.id, geometry);
      this.emit(`edge:${edge.id}`);
      this.touch(edge.from);
      this.touch(edge.to);
    }
    for (const [id, state] of [...this.edges]) {
      if (seen.has(id)) continue;
      this.edges.delete(id);
      this.edgeGrid.delete(id);
      this.selectedEdges.delete(id);
      this.link(state.edge, false);
      this.emit(`edge:${id}`);
      this.touch(state.edge.from);
      this.touch(state.edge.to);
    }
    this.edgeOrder = list.map((edge) => edge.id);
    this.edgeIndex.clear();
    for (const [index, id] of this.edgeOrder.entries()) {
      this.edgeIndex.set(id, index);
    }
    this.edgeList = list;
    this.syncSelection();
    this.version++;
    this.overviewStale = true;
    this.emit("structure");
    this.refresh();
  }

  /** Works out again the edges joined to `ids`, after those nodes moved. */
  private updateEdgesOf(ids: Iterable<string>) {
    const done = new Set<string>();
    for (const id of ids) {
      for (const edgeId of this.byNode.get(id) ?? []) {
        if (done.has(edgeId)) continue;
        done.add(edgeId);
        const state = this.edges.get(edgeId);
        if (!state) continue;
        const geometry = this.geometryOf(state.edge);
        this.edges.set(edgeId, { ...state, geometry });
        this.placeEdge(edgeId, geometry);
        this.emit(`edge:${edgeId}`);
      }
    }
  }

  /**
   * Moves nodes by an amount, for a drag or a key, without the app. The
   * app hears of it when the move is over.
   */
  moveNodes(ids: Iterable<string>, dx: number, dy: number) {
    const positions = new Map<string, Point>();
    for (const id of ids) {
      const rect = this.nodes.get(id)?.rect;
      if (rect) positions.set(id, { x: rect.x + dx, y: rect.y + dy });
    }
    this.placeNodes(positions);
  }

  /**
   * Puts nodes at positions, such as on the grid during a drag. The edges
   * they share are worked out once.
   */
  placeNodes(positions: Map<string, Point>) {
    const moved: string[] = [];
    for (const [id, point] of positions) {
      const state = this.nodes.get(id);
      if (!state || (state.rect.x === point.x && state.rect.y === point.y)) {
        continue;
      }
      const rect = { ...state.rect, x: point.x, y: point.y };
      this.nodes.set(id, { ...state, rect });
      this.nodeGrid.set(id, rect);
      moved.push(id);
      this.emit(`node:${id}`);
    }
    this.updateEdgesOf(moved);
    if (moved.length) {
      this.overviewStale = true;
      if (this.detail === 2) this.refresh();
    }
  }

  /** The app's nodes with the positions of `ids` as drawn now. */
  nodesWithPositions(ids: Set<string>) {
    return this.nodeList.map((node) => {
      if (!ids.has(node.id)) return node;
      const rect = this.nodes.get(node.id)?.rect;
      if (!rect || (rect.x === node.position.x && rect.y === node.position.y)) {
        return node;
      }
      return { ...node, position: { x: rect.x, y: rect.y } };
    });
  }

  /**
   * Puts nodes back where the app last said they were. After a move the
   * app was told of, its nodes come back with the new positions, or with
   * the old ones if it didn't take the move.
   */
  resync(ids: Iterable<string>) {
    for (const id of ids) {
      const state = this.nodes.get(id);
      // A copy, so setNodes sees a node it hasn't read and reads it.
      if (state) this.nodes.set(id, { ...state, node: { ...state.node } });
    }
    this.setNodes(this.nodeList);
  }

  /** A new snapshot of a node whose name changes, as when its links do. */
  private touch(id: string) {
    const state = this.nodes.get(id);
    if (!state) return;
    this.nodes.set(id, { ...state, links: state.links + 1 });
    this.emit(`node:${id}`);
  }

  // Selection and focus ---------------------------------------------------

  private syncSelection() {
    const nodes = this.order.filter((id) => this.selectedNodes.has(id));
    const edges = this.edgeOrder.filter((id) => this.selectedEdges.has(id));
    if (
      !sameList(nodes, this.selection.nodes) ||
      !sameList(edges, this.selection.edges)
    ) {
      this.selection = { nodes, edges };
      this.emit("selection");
    }
  }

  setSelection(selection: FlowSelection) {
    const nodes = new Set(selection.nodes);
    const edges = new Set(selection.edges);
    for (const id of new Set([...this.selectedNodes, ...nodes])) {
      const on = nodes.has(id);
      if (on === this.selectedNodes.has(id)) continue;
      if (on) this.selectedNodes.add(id);
      else this.selectedNodes.delete(id);
      const state = this.nodes.get(id);
      if (state) {
        this.nodes.set(id, { ...state, selected: on });
        this.emit(`node:${id}`);
      }
    }
    for (const id of new Set([...this.selectedEdges, ...edges])) {
      const on = edges.has(id);
      if (on === this.selectedEdges.has(id)) continue;
      if (on) this.selectedEdges.add(id);
      else this.selectedEdges.delete(id);
      const state = this.edges.get(id);
      if (state) {
        this.edges.set(id, { ...state, selected: on });
        this.emit(`edge:${id}`);
      }
    }
    this.syncSelection();
  }

  setLinkFrom(id: string | null) {
    const previous = this.linkFrom;
    if (previous === id) return;
    this.linkFrom = id;
    for (const which of [previous, id]) {
      if (!which) continue;
      const state = this.nodes.get(which);
      if (!state) continue;
      this.nodes.set(which, { ...state, linking: which === id });
      this.emit(`node:${which}`);
    }
    this.emit("linking");
  }

  setActive(id: string | null) {
    if (this.active === id) return;
    const previous = this.active;
    this.active = id;
    if (previous) this.pinned.delete(previous);
    if (id) this.pinned.add(id);
    this.emit("active");
    this.refresh();
  }

  pin(ids: Iterable<string>) {
    for (const id of ids) this.pinned.add(id);
    this.refresh();
  }

  unpin(ids: Iterable<string>) {
    for (const id of ids) if (id !== this.active) this.pinned.delete(id);
    this.refresh();
  }

  setHandlesOn(id: string | null) {
    if (this.handlesOn === id) return;
    this.handlesOn = id;
    this.emit("handles");
  }

  // The view ------------------------------------------------------------

  setViewport(viewport: FlowViewport) {
    const zoomed = viewport.zoom !== this.viewport.zoom;
    this.viewport = viewport;
    if (zoomed) this.emit("zoom");
    this.emit("viewport");
  }

  private setDetail(detail: Detail) {
    if (detail === this.detail) return;
    this.detail = detail;
    this.emit("detail");
  }

  setSize(size: Size | null) {
    this.size = size;
  }

  /** Works out again what's drawn one by one, and the overview. */
  refresh() {
    let nodes: string[];
    let edges: string[];
    const byZoom = detailAt(this.viewport.zoom);
    if (!this.size) {
      this.setDetail(byZoom);
      const all = this.order.length <= this.serverLimit;
      nodes = all ? this.order : [];
      edges = all
        ? this.edgeOrder.filter((id) => this.edges.get(id)?.geometry)
        : [];
    } else {
      const view = grow(visibleRect(this.viewport, this.size), 0.25);
      let found = byZoom === 2 ? new Set<string>() : this.nodeGrid.query(view);
      const crowded =
        found.size > (this.detail === 2 ? crowdLeave : crowdEnter);
      const detail = crowded ? 2 : byZoom;
      this.setDetail(detail);
      if (detail === 2) found = new Set<string>();
      for (const id of this.pinned) if (this.nodes.has(id)) found.add(id);
      nodes = [...found].sort(
        (a, b) =>
          (this.nodes.get(a)?.index ?? 0) - (this.nodes.get(b)?.index ?? 0),
      );
      const foundEdges =
        detail === 2 ? new Set<string>() : this.edgeGrid.query(view);
      // In the app's order, so a small pan doesn't move elements around in
      // the page.
      edges = [...foundEdges].sort(
        (a, b) => (this.edgeIndex.get(a) ?? 0) - (this.edgeIndex.get(b) ?? 0),
      );
      if (detail === 2 && this.overviewStale) this.buildOverview();
    }
    if (
      !sameList(nodes, this.visible.nodes) ||
      !sameList(edges, this.visible.edges)
    ) {
      this.visible = { nodes, edges };
      this.emit("visible");
    }
  }

  // The whole diagram, not what's in view, so it's built when the data
  // changes and never for a pan. The browser leaves out what's off screen.
  private buildOverview() {
    this.overviewStale = false;
    const parts: Partial<Record<FlowIntent, string[]>> = {};
    for (const state of this.nodes.values()) {
      const intent = state.node.intent ?? "neutral";
      const { x, y, width, height } = state.rect;
      const part = `M${Math.round(x)} ${Math.round(y)}h${Math.round(width)}v${Math.round(height)}h${-Math.round(width)}z`;
      const list = parts[intent];
      if (list) list.push(part);
      else parts[intent] = [part];
    }
    const lines: string[] = [];
    for (const edge of this.edges.values()) {
      const points = edge.geometry?.points;
      if (!points || points.length < 2) continue;
      const a = points[0] as Point;
      const b = points[points.length - 1] as Point;
      lines.push(
        `M${Math.round(a.x)} ${Math.round(a.y)}L${Math.round(b.x)} ${Math.round(b.y)}`,
      );
    }
    const nodes: Overview["nodes"] = {};
    for (const [intent, list] of Object.entries(parts)) {
      nodes[intent as FlowIntent] = list.join("");
    }
    this.overview = { nodes, edges: lines.join("") };
    this.emit("overview");
  }

  // Finding things --------------------------------------------------------

  /**
   * What's at a point in the diagram. The handles of the node that shows
   * them come first, then nodes, the last drawn on top, then edges.
   */
  hitTest(point: Point, zoom: number, handles: boolean): Hit | null {
    const reach = 10 / zoom;
    if (handles && this.handlesOn) {
      const state = this.nodes.get(this.handlesOn);
      if (state && !state.node.locked) {
        for (const handle of handlePoints(state.rect)) {
          if (
            Math.hypot(handle.x - point.x, handle.y - point.y) <=
            reach * 1.4
          ) {
            return { kind: "handle", id: this.handlesOn, point: handle };
          }
        }
      }
    }
    const near = { x: point.x - 1, y: point.y - 1, width: 2, height: 2 };
    let best: NodeState | undefined;
    for (const id of this.nodeGrid.query(near)) {
      const state = this.nodes.get(id);
      if (!state || !contains(state.shape, state.rect, point)) continue;
      if (!best || state.index > best.index) best = state;
    }
    if (best) return { kind: "node", id: best.node.id };

    const around = {
      x: point.x - reach,
      y: point.y - reach,
      width: reach * 2,
      height: reach * 2,
    };
    let closest: string | null = null;
    let distance = reach;
    for (const id of this.edgeGrid.query(around)) {
      const points = this.edges.get(id)?.geometry?.points;
      if (!points) continue;
      const d = distanceToLine(points, point);
      if (d <= distance) {
        distance = d;
        closest = id;
      }
    }
    return closest ? { kind: "edge", id: closest } : null;
  }

  /** The nodes that overlap a box in the diagram. */
  nodesIn(rect: Rect) {
    const ids: string[] = [];
    for (const id of this.nodeGrid.query(rect)) {
      const state = this.nodes.get(id);
      if (state && intersects(state.rect, rect)) ids.push(id);
    }
    return ids;
  }

  /**
   * The nearest node from `id` in a direction, for the arrow keys. Looks
   * in a widening cone that way, and takes the one closest, counting
   * sideways distance double so the arrow goes where it points.
   */
  nearest(id: string, dx: number, dy: number) {
    const from = this.nodes.get(id);
    if (!from) return null;
    const c = {
      x: from.rect.x + from.rect.width / 2,
      y: from.rect.y + from.rect.height / 2,
    };
    let best: string | null = null;
    let score = Infinity;
    for (const [otherId, state] of this.nodes) {
      if (otherId === id) continue;
      const ox = state.rect.x + state.rect.width / 2 - c.x;
      const oy = state.rect.y + state.rect.height / 2 - c.y;
      const along = ox * dx + oy * dy;
      if (along <= 0) continue;
      const across = Math.abs(ox * dy - oy * dx);
      if (across > along * 2) continue;
      const s = along + across * 2;
      if (s < score) {
        score = s;
        best = otherId;
      }
    }
    return best;
  }

  /** Where a new link's line starts, from a node toward a point. */
  linkStart(id: string, toward: Point) {
    const state = this.nodes.get(id);
    return state ? boundaryPoint(state.shape, state.rect, toward) : toward;
  }
}

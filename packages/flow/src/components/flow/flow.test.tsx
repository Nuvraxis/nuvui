import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport, wheel } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Flow, type FlowEdge, type FlowHandle, type FlowNode } from ".";

// A decision with two ways out. The diamond's middle is level with the
// box beside it, and the box under it is in line with it.
const nodes: FlowNode[] = [
  {
    id: "start",
    label: "Order placed",
    shape: "pill",
    position: { x: 0, y: 0 },
  },
  {
    id: "check",
    label: "In stock?",
    shape: "diamond",
    position: { x: 8, y: 120 },
  },
  { id: "ship", label: "Pack and ship", position: { x: 260, y: 136 } },
  { id: "reorder", label: "Reorder", shape: "box", position: { x: 0, y: 300 } },
];
const edges: FlowEdge[] = [
  { id: "a", from: "start", to: "check" },
  { id: "b", from: "check", to: "ship", label: "yes" },
  { id: "c", from: "check", to: "reorder", label: "no" },
];

const one = (selector: string) =>
  document.querySelector(selector) as HTMLElement;
const canvas = () => one(".nuv-flow__canvas");
const view = () => one(".nuv-flow__svg > g");
const shape = (id: string) =>
  document.querySelector(`.nuv-flow__node[data-id="${id}"]`) as SVGGElement;
const said = () =>
  one('.nuv-flow [role="status"]').textContent?.replace(/ /g, "") ?? "";
const activeId = () => {
  const id = canvas().getAttribute("aria-activedescendant");
  return id ? document.getElementById(id)?.dataset.id : undefined;
};

function viewport() {
  const match = /translate\(([^ ]+) ([^)]+)\) scale\(([^)]+)\)/.exec(
    view().getAttribute("transform") ?? "",
  );
  return match
    ? { x: Number(match[1]), y: Number(match[2]), zoom: Number(match[3]) }
    : { x: 0, y: 0, zoom: 1 };
}

// Where a point in the diagram is on the screen.
function toScreen(point: { x: number; y: number }) {
  const box = canvas().getBoundingClientRect();
  const v = viewport();
  return {
    x: box.left + v.x + point.x * v.zoom,
    y: box.top + v.y + point.y * v.zoom,
  };
}

function middleOf(element: Element) {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

// Pointer events sent to the diagram itself, at points on the screen. A
// drag is a press, moves in steps and a release, as a hand makes it.
function pointer(
  type: string,
  at: { x: number; y: number },
  { shift = false, buttons = 1 } = {},
) {
  canvas().dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: at.x,
      clientY: at.y,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons,
      shiftKey: shift,
    }),
  );
}

async function drag(
  from: { x: number; y: number },
  to: { x: number; y: number },
  { shift = false, steps = 8, release = true } = {},
) {
  pointer("pointerdown", from, { shift });
  for (let i = 1; i <= steps; i++) {
    pointer("pointermove", {
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
    });
    await nextFrame();
  }
  if (release) pointer("pointerup", to, { shift, buttons: 0 });
  await nextFrame();
}

async function click(at: { x: number; y: number }, shift = false) {
  pointer("pointerdown", at, { shift });
  pointer("pointerup", at, { shift, buttons: 0 });
  await nextFrame();
}

async function key(keys: string) {
  await userEvent.keyboard(keys);
  await nextFrame();
}

function focusDiagram() {
  canvas().focus();
}

type Props = Partial<ComponentProps<typeof Flow>>;

function Diagram(props: Props) {
  return (
    <Flow
      aria-label="Orders"
      defaultNodes={nodes}
      defaultEdges={edges}
      {...props}
    />
  );
}

// Keeps the nodes and edges in state, as an app would, and tells the
// test what it was told.
function Kept({
  nodes: initial = nodes,
  onNodesChange,
  onEdgesChange,
  ...props
}: Props) {
  const [shown, setShown] = useState(initial);
  const [lines, setLines] = useState(edges);
  return (
    <Flow
      aria-label="Orders"
      {...props}
      nodes={shown}
      edges={lines}
      onNodesChange={(next, change) => {
        setShown(next);
        onNodesChange?.(next, change);
      }}
      onEdgesChange={(next, change) => {
        setLines(next);
        onEdgesChange?.(next, change);
      }}
    />
  );
}

// Where a node is drawn, from its transform.
function placeOf(id: string) {
  const match = /translate\(([^ ]+) ([^)]+)\)/.exec(
    shape(id)?.getAttribute("transform") ?? "",
  );
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
}

// What the browser is using for one of its system colors.
function system(name: string) {
  const probe = document.createElement("span");
  probe.style.color = name;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
}

beforeEach(async () => {
  await setViewport("desktop");
});

describe("rendering", () => {
  test("it's a named listbox with an option for each node, named for what it is and where it leads", async () => {
    await render(<Diagram />);

    const list = page.getByRole("listbox", { name: "Orders" });
    await expect.element(list).toBeVisible();
    expect(page.getByRole("option").elements()).toHaveLength(4);
    await expect
      .element(
        page.getByRole("option", {
          name: "Order placed, start or end, leads to In stock?",
        }),
      )
      .toBeInTheDocument();
    await expect
      .element(
        page.getByRole("option", {
          name: "In stock?, decision, leads to Pack and ship (yes) and Reorder (no)",
        }),
      )
      .toBeInTheDocument();
    expect(canvas().getAttribute("aria-roledescription")).toBe("flow diagram");
    expect(shape("check").getAttribute("aria-setsize")).toBe("4");
    expect(shape("check").getAttribute("aria-posinset")).toBe("2");
  });

  test("a node's description is read after its kind", async () => {
    await render(
      <Flow
        aria-label="One"
        defaultNodes={[
          {
            id: "x",
            label: "Approve",
            shape: "box",
            description: "by a manager",
            position: { x: 0, y: 0 },
          },
        ]}
      />,
    );
    await expect
      .element(
        page.getByRole("option", { name: "Approve, step, by a manager" }),
      )
      .toBeInTheDocument();
  });

  test("the keyboard's instructions describe it, with the editing ones when it's editable", async () => {
    const { rerender } = await render(<Diagram />);
    const describedBy = () =>
      document.getElementById(canvas().getAttribute("aria-describedby") ?? "")
        ?.textContent ?? "";
    expect(describedBy()).toContain("Use the arrow keys");
    expect(describedBy()).not.toContain("press L");
    await rerender(<Diagram editable />);
    expect(describedBy()).toContain("press L");
  });

  test("a server draws the whole diagram fitted by its viewBox, with no style attribute anywhere", () => {
    const html = renderToString(<Diagram />);
    expect(html).toContain("viewBox=");
    expect(html.match(/role="option"/g)).toHaveLength(4);
    expect(html.match(/class="nuv-flow__line"/g)).toHaveLength(3);
    expect(html).toContain("Pack and ship");
    // A strict Content Security Policy drops style attributes. There's
    // nothing here for it to drop.
    expect(html).not.toContain("style=");
  });

  test("over its limit a server draws the frame and the controls, and leaves the nodes to the browser", () => {
    const html = renderToString(<Diagram serverLimit={2} />);
    expect(html).toContain('role="listbox"');
    expect(html).not.toContain('role="option"');
    expect(html).toContain("Zoom in");
  });

  test("in the browser it's fitted to the frame, and placed by a transform instead of the viewBox", async () => {
    await render(<Diagram />);
    expect(one(".nuv-flow__svg").hasAttribute("viewBox")).toBe(false);
    const v = viewport();
    expect(v.zoom).toBeGreaterThan(0.5);
    expect(v.zoom).toBeLessThanOrEqual(1);
    // Every node is inside the frame.
    const frame = canvas().getBoundingClientRect();
    for (const node of nodes) {
      const box = shape(node.id).getBoundingClientRect();
      expect(box.left).toBeGreaterThanOrEqual(frame.left);
      expect(box.right).toBeLessThanOrEqual(frame.right);
      expect(box.top).toBeGreaterThanOrEqual(frame.top);
      expect(box.bottom).toBeLessThanOrEqual(frame.bottom);
    }
  });

  test("a label has as many lines as its shape has room for, and an edge's words are on it", async () => {
    await render(<Diagram />);
    const lines = (id: string) =>
      shape(id)
        .querySelector(".nuv-flow__label-text")
        ?.getAttribute("data-lines");
    expect(lines("ship")).toBe("2");
    expect(lines("start")).toBe("2");
    expect(lines("check")).toBe("2");
    const labels = [
      ...document.querySelectorAll(".nuv-flow__edge-label-text"),
    ].map((element) => element.textContent);
    expect(labels.sort()).toEqual(["no", "yes"]);
  });

  test("arrowheads go on the ends an edge asks for, and on none for none", async () => {
    await render(
      <Flow
        aria-label="Arrows"
        defaultNodes={nodes}
        defaultEdges={[
          { id: "end", from: "start", to: "check" },
          { id: "both", from: "check", to: "ship", arrow: "both" },
          { id: "none", from: "check", to: "reorder", arrow: "none" },
        ]}
      />,
    );
    const line = (id: string) =>
      one(`.nuv-flow__edge[data-id="${id}"] .nuv-flow__line`);
    expect(line("end").getAttribute("marker-end")).toMatch(/arrow-neutral/);
    expect(line("end").hasAttribute("marker-start")).toBe(false);
    expect(line("both").getAttribute("marker-start")).toMatch(/arrow-neutral/);
    expect(line("none").hasAttribute("marker-end")).toBe(false);
  });

  test("it takes a class and other attributes, and its handle fits and zooms", async () => {
    const handle = createRef<FlowHandle>();
    await render(
      <Diagram className="mine" data-test="yes" handleRef={handle} />,
    );
    expect(one(".nuv-flow").classList.contains("mine")).toBe(true);
    expect(one(".nuv-flow").dataset.test).toBe("yes");
    const before = handle.current?.getViewport().zoom ?? 0;
    handle.current?.zoomOut();
    await expect.poll(() => viewport().zoom).toBeCloseTo(before * 0.8, 3);
    handle.current?.fit();
    await expect.poll(() => viewport().zoom).toBeCloseTo(before, 3);
  });
});

describe("selecting with a pointer", () => {
  test("a click selects a node, Shift and a click adds one, and a click on nothing clears them", async () => {
    const onSelectionChange = vi.fn();
    await render(<Diagram onSelectionChange={onSelectionChange} />);

    await click(middleOf(shape("ship")));
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      nodes: ["ship"],
      edges: [],
    });
    expect(shape("ship").getAttribute("aria-selected")).toBe("true");

    await click(middleOf(shape("start")), true);
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      nodes: ["start", "ship"],
      edges: [],
    });

    await click(toScreen({ x: 300, y: 20 }));
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      nodes: [],
      edges: [],
    });
    expect(shape("ship").getAttribute("aria-selected")).toBe("false");
  });

  test("a click on an edge selects it", async () => {
    const onSelectionChange = vi.fn();
    await render(<Diagram onSelectionChange={onSelectionChange} />);

    // Between the diamond and the box beside it.
    await click(toScreen({ x: 206, y: 164 }));

    expect(onSelectionChange).toHaveBeenLastCalledWith({
      nodes: [],
      edges: ["b"],
    });
    expect(
      one('.nuv-flow__edge[data-id="b"]').hasAttribute("data-selected"),
    ).toBe(true);
  });

  test("Shift and a drag on nothing selects what the box touches", async () => {
    const onSelectionChange = vi.fn();
    await render(<Diagram onSelectionChange={onSelectionChange} />);

    await drag(toScreen({ x: 300, y: 20 }), toScreen({ x: 450, y: 200 }), {
      shift: true,
    });

    expect(onSelectionChange).toHaveBeenLastCalledWith({
      nodes: ["ship"],
      edges: [],
    });
  });

  test("a selection kept by the app is the one drawn", async () => {
    const { rerender } = await render(
      <Diagram selection={{ nodes: ["check"], edges: [] }} />,
    );
    expect(shape("check").getAttribute("aria-selected")).toBe("true");
    await click(middleOf(shape("ship")));
    // Not taken, so nothing changes.
    expect(shape("ship").getAttribute("aria-selected")).toBe("false");
    await rerender(<Diagram selection={{ nodes: ["ship"], edges: [] }} />);
    expect(shape("ship").getAttribute("aria-selected")).toBe("true");
    expect(shape("check").getAttribute("aria-selected")).toBe("false");
  });
});

describe("moving with a pointer", () => {
  test("in a diagram that isn't editable, a drag on a node pans and moves nothing", async () => {
    const onNodesChange = vi.fn();
    await render(<Diagram onNodesChange={onNodesChange} />);
    const before = viewport();

    await drag(middleOf(shape("ship")), {
      x: middleOf(shape("ship")).x + 100,
      y: middleOf(shape("ship")).y,
    });

    await expect.poll(() => viewport().x).toBeCloseTo(before.x + 100, 0);
    expect(onNodesChange).not.toHaveBeenCalled();
  });

  test("in an editable one, a node is dragged, and the app hears of it once, when it's let go", async () => {
    const onNodesChange = vi.fn();
    const onNodeDrag = vi.fn();
    await render(
      <Kept editable onNodesChange={onNodesChange} onNodeDrag={onNodeDrag} />,
    );
    const { zoom } = viewport();
    const from = middleOf(shape("ship"));

    await drag(from, { x: from.x + 100, y: from.y + 50 }, { release: false });
    expect(onNodesChange).not.toHaveBeenCalled();
    expect(onNodeDrag).toHaveBeenCalled();
    pointer("pointerup", { x: from.x + 100, y: from.y + 50 }, { buttons: 0 });

    await expect.poll(() => onNodesChange.mock.calls.length).toBe(1);
    const [next, change] = onNodesChange.mock.calls[0] as [FlowNode[], unknown];
    expect(change).toEqual({ type: "move", ids: ["ship"] });
    const moved = next.find((node) => node.id === "ship");
    expect(moved?.position.x).toBeCloseTo(260 + 100 / zoom, 0);
    expect(moved?.position.y).toBeCloseTo(136 + 50 / zoom, 0);
    // The others are the same objects as before.
    expect(next.find((node) => node.id === "start")).toBe(nodes[0]);
    await expect.poll(() => said()).toBe("Moved Pack and ship.");
  });

  test("with a grid to snap to, a node lands on it", async () => {
    const onNodesChange = vi.fn();
    await render(<Kept editable snap={25} onNodesChange={onNodesChange} />);
    const from = middleOf(shape("ship"));

    await drag(from, { x: from.x + 37, y: from.y + 11 });

    await expect.poll(() => onNodesChange.mock.calls.length).toBe(1);
    const moved = (
      onNodesChange.mock.calls[0]?.[0] as FlowNode[] | undefined
    )?.find((node) => node.id === "ship");
    expect((moved?.position.x ?? 1) % 25).toBe(0);
    expect((moved?.position.y ?? 1) % 25).toBe(0);
  });

  test("an app that keeps the nodes and doesn't take the move puts the node back", async () => {
    const onNodesChange = vi.fn();
    await render(
      <Flow
        aria-label="Orders"
        nodes={nodes}
        edges={edges}
        editable
        onNodesChange={onNodesChange}
      />,
    );
    const from = middleOf(shape("ship"));

    await drag(from, { x: from.x + 100, y: from.y });

    expect(onNodesChange).toHaveBeenCalledTimes(1);
    await expect
      .poll(() => shape("ship").getAttribute("transform"))
      .toBe("translate(260 136)");
  });

  test("a diagram that keeps its own nodes keeps the move", async () => {
    await render(<Diagram editable />);
    const from = middleOf(shape("ship"));
    const { zoom } = viewport();

    await drag(from, { x: from.x + 100, y: from.y });

    await expect
      .poll(() => placeOf("ship")?.x)
      .toBeCloseTo(260 + 100 / zoom, 3);
    expect(placeOf("ship")?.y).toBe(136);
  });

  test("a locked node isn't moved by a drag, which pans instead", async () => {
    const onNodesChange = vi.fn();
    await render(
      <Kept
        editable
        onNodesChange={onNodesChange}
        nodes={nodes.map((node) =>
          node.id === "ship" ? { ...node, locked: true } : node,
        )}
      />,
    );
    const before = viewport();
    const from = middleOf(shape("ship"));

    await drag(from, { x: from.x + 100, y: from.y });

    expect(onNodesChange).not.toHaveBeenCalled();
    await expect.poll(() => viewport().x).toBeCloseTo(before.x + 100, 0);
  });

  test("a drag from a node's handle to another node joins them", async () => {
    const onEdgesChange = vi.fn();
    await render(<Kept editable onEdgesChange={onEdgesChange} />);
    // Selecting one node shows its handles.
    await click(middleOf(shape("check")));
    await expect
      .poll(() => document.querySelectorAll(".nuv-flow__handle").length)
      .toBe(4);

    // From its right handle to the node above.
    await drag(toScreen({ x: 152, y: 164 }), middleOf(shape("start")));

    await expect.poll(() => onEdgesChange.mock.calls.length).toBe(1);
    const [next, change] = onEdgesChange.mock.calls[0] as [FlowEdge[], unknown];
    expect(change).toEqual({ type: "add", ids: ["check->start"] });
    expect(next.at(-1)).toEqual({
      id: "check->start",
      from: "check",
      to: "start",
    });
    await expect.poll(() => said()).toBe("Linked In stock? to Order placed.");
  });

  test("two nodes already joined that way aren't joined again, and an app can say which may be", async () => {
    const onEdgesChange = vi.fn();
    const canConnect = vi.fn(() => false);
    const { rerender } = await render(
      <Kept editable onEdgesChange={onEdgesChange} />,
    );
    await click(middleOf(shape("check")));
    await drag(toScreen({ x: 152, y: 164 }), middleOf(shape("ship")));
    expect(onEdgesChange).not.toHaveBeenCalled();

    await rerender(
      <Kept editable onEdgesChange={onEdgesChange} canConnect={canConnect} />,
    );
    await click(middleOf(shape("check")));
    await drag(toScreen({ x: 152, y: 164 }), middleOf(shape("start")));
    expect(canConnect).toHaveBeenCalledWith("check", "start");
    expect(onEdgesChange).not.toHaveBeenCalled();
  });

  test("a double click opens a node", async () => {
    const onNodeOpen = vi.fn();
    await render(<Diagram onNodeOpen={onNodeOpen} />);
    const at = middleOf(shape("ship"));
    canvas().dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        clientX: at.x,
        clientY: at.y,
      }),
    );
    expect(onNodeOpen).toHaveBeenCalledWith("ship");
  });
});

describe("with the keyboard", () => {
  test("focus puts the keyboard on the first node, and the arrows go to the nearest node that way", async () => {
    await render(<Diagram />);
    focusDiagram();
    await expect.poll(activeId).toBe("start");

    await key("{ArrowDown}");
    expect(activeId()).toBe("check");
    await key("{ArrowRight}");
    expect(activeId()).toBe("ship");
    await key("{ArrowLeft}");
    expect(activeId()).toBe("check");
    await key("{ArrowDown}");
    expect(activeId()).toBe("reorder");
    // Nothing further down: it stays.
    await key("{ArrowDown}");
    expect(activeId()).toBe("reorder");
  });

  test("Space selects the node, and again unselects it", async () => {
    const onSelectionChange = vi.fn();
    await render(<Diagram onSelectionChange={onSelectionChange} />);
    focusDiagram();
    await key("{ArrowDown}");
    await key(" ");
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      nodes: ["check"],
      edges: [],
    });
    await key(" ");
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      nodes: [],
      edges: [],
    });
  });

  test("Enter opens a node, and Ctrl+A selects them all", async () => {
    const onNodeOpen = vi.fn();
    const onSelectionChange = vi.fn();
    await render(
      <Diagram onNodeOpen={onNodeOpen} onSelectionChange={onSelectionChange} />,
    );
    focusDiagram();
    await key("{Enter}");
    expect(onNodeOpen).toHaveBeenCalledWith("start");
    await key("{Control>}a{/Control}");
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      nodes: ["start", "check", "ship", "reorder"],
      edges: [],
    });
  });

  test("Shift and an arrow move the node in an editable diagram, told to the app once the keys rest", async () => {
    const onNodesChange = vi.fn();
    await render(<Kept editable onNodesChange={onNodesChange} />);
    focusDiagram();

    await key("{Shift>}{ArrowRight}{ArrowRight}{ArrowDown}{/Shift}");
    expect(onNodesChange).not.toHaveBeenCalled();

    await expect.poll(() => onNodesChange.mock.calls.length).toBe(1);
    const [next, change] = onNodesChange.mock.calls[0] as [FlowNode[], unknown];
    expect(change).toEqual({ type: "move", ids: ["start"] });
    expect(next[0]?.position).toEqual({ x: 20, y: 10 });
    await expect.poll(() => said()).toBe("Moved Order placed.");
  });

  test("L, an arrow and L again join two nodes", async () => {
    const onEdgesChange = vi.fn();
    await render(<Kept editable onEdgesChange={onEdgesChange} />);
    focusDiagram();

    await key("l");
    expect(said()).toContain("Linking from Order placed.");
    expect(shape("start").hasAttribute("data-linking")).toBe(true);
    await key("{ArrowRight}");
    await key("l");

    expect(onEdgesChange).toHaveBeenCalledTimes(1);
    expect(onEdgesChange.mock.calls[0]?.[1]).toEqual({
      type: "add",
      ids: ["start->ship"],
    });
    expect(said()).toBe("Linked Order placed to Pack and ship.");
    expect(shape("start").hasAttribute("data-linking")).toBe(false);
  });

  test("Escape lets go of a link that was started, and then clears the selection", async () => {
    const onEdgesChange = vi.fn();
    const onSelectionChange = vi.fn();
    await render(
      <Kept
        editable
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
      />,
    );
    focusDiagram();
    await key(" ");
    await key("l");
    await key("{Escape}");
    expect(said()).toBe("Link cancelled.");
    expect(onEdgesChange).not.toHaveBeenCalled();
    await key("{Escape}");
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      nodes: [],
      edges: [],
    });
  });

  test("Delete removes the selected nodes and every edge to or from them", async () => {
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    await render(
      <Kept
        editable
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      />,
    );
    focusDiagram();
    await key("{ArrowDown}");
    await key(" ");
    await key("{Delete}");

    expect(onNodesChange.mock.calls[0]?.[1]).toEqual({
      type: "remove",
      ids: ["check"],
    });
    expect(
      (onNodesChange.mock.calls[0]?.[0] as FlowNode[] | undefined)?.map(
        (n) => n.id,
      ),
    ).toEqual(["start", "ship", "reorder"]);
    expect(onEdgesChange.mock.calls[0]?.[1]).toEqual({
      type: "remove",
      ids: ["a", "b", "c"],
    });
    expect(said()).toBe("Removed 1 step and 3 links.");
    await expect.poll(() => shape("check")).toBeNull();
  });

  test("a locked node isn't moved, linked from or removed", async () => {
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    await render(
      <Flow
        aria-label="Orders"
        editable
        defaultEdges={edges}
        defaultNodes={nodes.map((node) => ({ ...node, locked: true }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      />,
    );
    focusDiagram();
    await key("{Shift>}{ArrowRight}{/Shift}");
    await key("l");
    await key("{Delete}");
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(onNodesChange).not.toHaveBeenCalled();
    expect(onEdgesChange).not.toHaveBeenCalled();
  });

  test("in a diagram that isn't editable, the editing keys do nothing", async () => {
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    await render(
      <Diagram onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />,
    );
    focusDiagram();
    await key(" ");
    await key("{Shift>}{ArrowRight}{/Shift}");
    await key("l");
    await key("{Delete}");
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(onNodesChange).not.toHaveBeenCalled();
    expect(onEdgesChange).not.toHaveBeenCalled();
  });

  test("plus and minus zoom, and 0 fits the diagram again", async () => {
    await render(<Diagram />);
    const fitted = viewport().zoom;
    focusDiagram();
    await key("-");
    await expect.poll(() => viewport().zoom).toBeCloseTo(fitted * 0.8, 3);
    await key("+");
    await key("+");
    await expect.poll(() => viewport().zoom).toBeCloseTo(fitted * 1.25, 3);
    await key("0");
    await expect.poll(() => viewport().zoom).toBeCloseTo(fitted, 3);
  });
});

describe("the view", () => {
  test("the buttons zoom out, zoom in and fit", async () => {
    await render(<Diagram />);
    const fitted = viewport().zoom;
    await page.getByRole("button", { name: "Zoom out" }).click();
    await expect.poll(() => viewport().zoom).toBeCloseTo(fitted * 0.8, 3);
    await page.getByRole("button", { name: "Fit the diagram" }).click();
    await expect.poll(() => viewport().zoom).toBeCloseTo(fitted, 3);
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect.poll(() => viewport().zoom).toBeCloseTo(fitted * 1.25, 3);
    await expect
      .element(page.getByRole("toolbar", { name: "Diagram controls" }))
      .toBeInTheDocument();
  });

  test("a fitted view is fitted again when the frame changes size, until it's zoomed", async () => {
    function Resized() {
      const [width, setWidth] = useState(800);
      return (
        <div style={{ width }}>
          <button type="button" onClick={() => setWidth(320)}>
            Narrow
          </button>
          <button type="button" onClick={() => setWidth(600)}>
            Wider
          </button>
          <Diagram />
        </div>
      );
    }
    await render(<Resized />);
    const wide = viewport().zoom;
    await page.getByRole("button", { name: "Narrow" }).click();
    await expect.poll(() => viewport().zoom).toBeLessThan(wide);
    const narrow = viewport();
    // Fitted means all of it is in the frame, the same both times.
    const frameWidth = one(".nuv-flow__frame").clientWidth;
    expect(narrow.x).toBeGreaterThanOrEqual(0);
    expect(narrow.x).toBeLessThan(frameWidth / 2);

    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect.poll(() => viewport().zoom).toBeCloseTo(narrow.zoom * 1.25, 3);
    await page.getByRole("button", { name: "Wider" }).click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(viewport().zoom).toBeCloseTo(narrow.zoom * 1.25, 3);
  });

  test("the wheel zooms only while the diagram has focus, so the page scrolls past it", async () => {
    await render(<Diagram />);
    const fitted = viewport().zoom;
    await wheel(".nuv-flow__canvas", -300);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(viewport().zoom).toBe(fitted);

    focusDiagram();
    await wheel(".nuv-flow__canvas", -300);
    await expect.poll(() => viewport().zoom).toBeGreaterThan(fitted);
  });

  test("a view to start from is where it starts, and the app hears where it stops", async () => {
    const onViewportChange = vi.fn();
    await render(
      <Diagram
        defaultViewport={{ x: 10, y: 20, zoom: 2 }}
        onViewportChange={onViewportChange}
      />,
    );
    expect(viewport()).toEqual({ x: 10, y: 20, zoom: 2 });
    await drag(toScreen({ x: 600, y: 20 }), toScreen({ x: 650, y: 20 }));
    await expect
      .poll(() => onViewportChange.mock.calls.length)
      .toBeGreaterThan(0);
    expect(onViewportChange.mock.lastCall?.[0]).toMatchObject({ zoom: 2 });
  });

  test("no zoom past the limits", async () => {
    const handle = createRef<FlowHandle>();
    await render(<Diagram handleRef={handle} minZoom={0.5} maxZoom={1.5} />);
    for (let i = 0; i < 10; i++) handle.current?.zoomIn();
    await expect.poll(() => viewport().zoom).toBe(1.5);
    for (let i = 0; i < 20; i++) handle.current?.zoomOut();
    await expect.poll(() => viewport().zoom).toBe(0.5);
  });
});

describe("a large diagram", () => {
  // A grid of nodes, each joined to the one after it.
  function grid(count: number) {
    const columns = Math.ceil(Math.sqrt(count));
    const many: FlowNode[] = [];
    const lines: FlowEdge[] = [];
    for (let i = 0; i < count; i++) {
      many.push({
        id: `n${i}`,
        label: `Step ${i}`,
        position: { x: (i % columns) * 220, y: Math.floor(i / columns) * 120 },
      });
      if (i % columns)
        lines.push({ id: `e${i}`, from: `n${i - 1}`, to: `n${i}` });
    }
    return { many, lines };
  }

  test("ten thousand nodes are a few paths from far out, and only what's in view up close", async () => {
    const { many, lines } = grid(10_000);
    const handle = createRef<FlowHandle>();
    await render(
      <Flow
        aria-label="Big"
        defaultNodes={many}
        defaultEdges={lines}
        handleRef={handle}
      />,
    );

    // Fitted, the diagram is far out: no node is drawn one by one.
    await expect
      .poll(() => document.querySelectorAll(".nuv-flow__overview").length)
      .toBeGreaterThan(0);
    expect(document.querySelectorAll(".nuv-flow__node").length).toBe(0);
    expect(document.querySelectorAll(".nuv-flow__svg *").length).toBeLessThan(
      40,
    );

    handle.current?.center("n5050");
    for (let i = 0; i < 12; i++) handle.current?.zoomIn();
    await expect
      .poll(() => document.querySelectorAll(".nuv-flow__node").length)
      .toBeGreaterThan(0);
    const drawn = document.querySelectorAll(".nuv-flow__node").length;
    expect(drawn).toBeLessThan(200);
    expect(document.querySelectorAll(".nuv-flow__edge").length).toBeLessThan(
      400,
    );
    expect(
      shape(
        document.querySelector(".nuv-flow__node")?.getAttribute("data-id") ??
          "",
      ).getAttribute("aria-setsize"),
    ).toBe("10000");
  });

  test("the keyboard's node is drawn wherever the view is, and the arrows bring the next one into view", async () => {
    const { many, lines } = grid(2500);
    await render(
      <Flow aria-label="Big" defaultNodes={many} defaultEdges={lines} />,
    );
    focusDiagram();
    await expect.poll(activeId).toBe("n0");
    await key("+");
    await key("+");
    for (let i = 0; i < 30; i++) await key("{ArrowRight}");
    await expect.poll(activeId).toBe("n30");
    await expect.poll(() => shape("n30")).not.toBeNull();
    const frame = canvas().getBoundingClientRect();
    const box = shape("n30").getBoundingClientRect();
    expect(box.right).toBeLessThanOrEqual(frame.right);
    expect(box.left).toBeGreaterThanOrEqual(frame.left);
  });
});

describe("the list", () => {
  test("the button shows the diagram as a list of steps, each with where it leads", async () => {
    await render(<Diagram />);
    const button = page.getByRole("button", { name: "Show as a list" });
    await expect.element(button).toHaveAttribute("aria-expanded", "false");
    await button.click();

    const list = page.getByRole("list", { name: "Steps" });
    await expect.element(list).toBeVisible();
    expect(list.getByRole("listitem").elements()).toHaveLength(4);
    await expect
      .element(list.getByRole("listitem").nth(1))
      .toHaveTextContent(
        "In stock? (decision)leads to Pack and ship (yes) and Reorder (no)",
      );
    await expect
      .element(page.getByRole("button", { name: "Hide the list" }))
      .toHaveAttribute("aria-expanded", "true");
  });

  test("a step's button finds it in the diagram, with the keyboard on it", async () => {
    await render(<Diagram />);
    await page.getByRole("button", { name: "Show as a list" }).click();
    await page
      .getByRole("button", { name: "Find Reorder in the diagram" })
      .click();
    expect(document.activeElement).toBe(canvas());
    expect(activeId()).toBe("reorder");
  });

  test("in an editable diagram a link can be removed from the list", async () => {
    const onEdgesChange = vi.fn();
    await render(<Kept editable onEdgesChange={onEdgesChange} />);
    await page.getByRole("button", { name: "Show as a list" }).click();
    await page
      .getByRole("button", {
        name: "Remove the link from In stock? to Reorder",
      })
      .click();
    expect(onEdgesChange).toHaveBeenCalledWith(
      edges.filter((edge) => edge.id !== "c"),
      { type: "remove", ids: ["c"] },
    );
    await expect
      .element(
        page.getByRole("button", {
          name: "Remove the link from In stock? to Reorder",
        }),
      )
      .not.toBeInTheDocument();
  });

  test("a long list comes two hundred steps at a time", async () => {
    const many = Array.from({ length: 250 }, (_, i) => ({
      id: `n${i}`,
      label: `Step ${i}`,
      position: { x: i * 200, y: 0 },
    }));
    await render(<Flow aria-label="Long" defaultNodes={many} />);
    await page.getByRole("button", { name: "Show as a list" }).click();
    expect(page.getByRole("listitem").elements()).toHaveLength(200);
    await page.getByRole("button", { name: "Show 50 more" }).click();
    expect(page.getByRole("listitem").elements()).toHaveLength(250);
  });
});

describe("words", () => {
  test("what it says can be given in another language, and what isn't keeps its English", async () => {
    await render(
      <Diagram
        labels={{
          zoomIn: "Inzoomen",
          shapes: { diamond: "keuze" },
          leadsTo: (targets) =>
            `gaat naar ${targets.map((target) => target.label).join(" en ")}`,
        }}
      />,
    );
    await expect
      .element(page.getByRole("button", { name: "Inzoomen" }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "Zoom out" }))
      .toBeInTheDocument();
    await expect
      .element(
        page.getByRole("option", {
          name: "In stock?, keuze, gaat naar Pack and ship en Reorder",
        }),
      )
      .toBeInTheDocument();
    await expect
      .element(page.getByRole("option", { name: /^Pack and ship, step$/ }))
      .toBeInTheDocument();
  });
});

describe("how it's drawn", () => {
  test("the frame is 24rem tall unless its variable says otherwise", async () => {
    const { rerender } = await render(<Diagram />);
    expect(one(".nuv-flow__frame").getBoundingClientRect().height).toBe(384);
    await rerender(
      <Diagram style={{ ["--nuv-flow-height" as string]: "200px" }} />,
    );
    expect(one(".nuv-flow__frame").getBoundingClientRect().height).toBe(200);
  });

  test("with a mouse a button is 32px, and the buttons are at the end of the line, which is the left where the page reads right to left", async () => {
    await render(
      <div dir="rtl">
        <Diagram />
      </div>,
    );
    const button = page.getByRole("button", { name: "Zoom in" }).element();
    expect(button.getBoundingClientRect().width).toBe(32);
    const frame = one(".nuv-flow__frame").getBoundingClientRect();
    const controls = one(".nuv-flow__controls").getBoundingClientRect();
    expect(controls.left - frame.left).toBeLessThan(16);
  });

  test("a moving edge stands still when less motion is asked for", async () => {
    const moving: FlowEdge[] = [
      { id: "m", from: "start", to: "check", animated: true },
    ];
    await render(<Diagram defaultEdges={moving} />);
    const line = one(".nuv-flow__edge .nuv-flow__line");
    // Said outright: WebKit on Linux asks for less motion by default.
    await emulateMedia({ reducedMotion: "no-preference" });
    try {
      expect(getComputedStyle(line).animationName).toBe("nuv-flow-dash");
      await emulateMedia({ reducedMotion: "reduce" });
      expect(getComputedStyle(line).animationName).toBe("none");
    } finally {
      await emulateMedia({ reducedMotion: null });
    }
  });

  test("where the browser forces its colors, a selected node is in the highlight color and the others in the text color", async ({
    skip,
  }) => {
    await render(<Diagram defaultSelection={{ nodes: ["ship"], edges: [] }} />);
    await emulateMedia({ forcedColors: "active" });
    try {
      // WebKit answers the media query and goes on painting the page's own
      // colors, as the core's forced-colors tests say.
      if (system("rgb(1, 2, 3)") === "rgb(1, 2, 3)") {
        skip("this browser doesn't force colors");
      }
      const stroke = (id: string) =>
        getComputedStyle(shape(id).querySelector(".nuv-flow__shape") as Element)
          .stroke;
      expect(stroke("ship")).toBe(system("Highlight"));
      expect(stroke("check")).toBe(system("CanvasText"));
    } finally {
      await emulateMedia({ forcedColors: null });
    }
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe at rest", async () => {
    const { container } = await renderThemed(theme, <Diagram />);
    expect(await axe(container)).toHaveNoViolations();
  });

  test("passes axe editable, with a node selected and the list open", async () => {
    const { container } = await renderThemed(
      theme,
      <Diagram editable defaultSelection={{ nodes: ["check"], edges: [] }} />,
    );
    await page.getByRole("button", { name: "Show as a list" }).click();
    expect(await axe(container)).toHaveNoViolations();
  });
});

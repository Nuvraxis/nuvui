import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { Button } from "@nuvui/react/button";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  type KanbanColumnData,
  KanbanColumnHeader,
  type KanbanMove,
} from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const one = (selector: string) =>
  document.querySelector(selector) as HTMLElement;

const names: Record<string, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
};
const titles: Record<string, string> = {
  brief: "Write the brief",
  quote: "Send the quote",
  call: "Call Contoso",
  invoice: "Raise the invoice",
};
const start: KanbanColumnData[] = [
  { id: "todo", cards: ["brief", "quote", "call"] },
  { id: "doing", cards: ["invoice"] },
  { id: "done", cards: [] },
];

const board = () => page.getByRole("group", { name: "Work" });
const column = (id: string) => one(`[data-column="${id}"]`);
const card = (id: string) => one(`li[data-card="${id}"]`);
const handle = (id: string) =>
  page.getByRole("button", { name: `Move ${titles[id]}` });
// What's on the page, column by column, read from the page and not from
// what the component was given.
const drawn = () =>
  Object.fromEntries(
    [...document.querySelectorAll<HTMLElement>("[data-column]")].map(
      (element) => [
        element.dataset.column,
        [...element.querySelectorAll<HTMLElement>("li[data-card]")].map(
          (item) => item.dataset.card,
        ),
      ],
    ),
  );
const said = () => one('[role="status"]').textContent ?? "";

type BoardProps = Partial<ComponentProps<typeof Kanban>> & {
  locked?: string;
  onOpen?: (card: string) => void;
};

function Board({ locked, onOpen, ...props }: BoardProps) {
  return (
    <Kanban aria-label="Work" defaultValue={start} {...props}>
      {(columns) =>
        columns.map((item) => (
          <KanbanColumn
            key={item.id}
            value={item.id}
            label={names[item.id] ?? item.id}
          >
            <KanbanColumnHeader count={item.cards.length}>
              {names[item.id]}
            </KanbanColumnHeader>
            <KanbanCards empty="Nothing here yet">
              {item.cards.map((id) => (
                <KanbanCard
                  key={id}
                  value={id}
                  label={titles[id] ?? id}
                  disabled={locked === id}
                >
                  {titles[id]}
                  {onOpen ? (
                    <Button
                      intent="secondary"
                      size="sm"
                      onClick={() => onOpen(id)}
                    >
                      {`Open ${id}`}
                    </Button>
                  ) : null}
                </KanbanCard>
              ))}
            </KanbanCards>
          </KanbanColumn>
        ))
      }
    </Kanban>
  );
}

// A key, and then a moment. The library that carries the card starts to
// listen for the next key a tick after the one that picked it up, and
// measures the columns again after each move.
async function key(keys: string) {
  await userEvent.keyboard(keys);
  await new Promise((resolve) => setTimeout(resolve, 120));
}

async function pickUp(id: string) {
  (handle(id).element() as HTMLElement).focus();
  await key(" ");
  await expect.poll(said).toContain(`Picked up ${titles[id]}`);
}

beforeEach(async () => {
  await setViewport("desktop");
});

describe("rendering", () => {
  test("it's a named group of named columns, each a list with an item and a handle for every card", async () => {
    await render(<Board />);

    expect(board().element().className).toBe("nuv-kanban");
    expect(page.getByRole("group", { name: "To do" }).element().className).toBe(
      "nuv-kanban__column",
    );
    expect(drawn()).toEqual({
      todo: ["brief", "quote", "call"],
      doing: ["invoice"],
      done: [],
    });
    expect(column("todo").querySelectorAll("ul > li")).toHaveLength(3);
    expect(card("brief").className).toBe("nuv-kanban__card");
    const button = handle("brief").element();
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-roledescription")).toBe("sortable");
    expect(button.getAttribute("aria-pressed")).not.toBe("true");
  });

  test("the handle is described by how to move a card with the keyboard", async () => {
    await render(<Board />);
    const described = handle("brief")
      .element()
      .getAttribute("aria-describedby") as string;

    expect(document.getElementById(described)?.textContent).toContain(
      "use the arrow keys to move it",
    );
  });

  test("a header draws its title, a count and buttons, and a column with no cards says so", async () => {
    await render(
      <Kanban aria-label="Work" defaultValue={[{ id: "done", cards: [] }]}>
        {() => (
          <KanbanColumn value="done" label="Done">
            <KanbanColumnHeader count={0} actions={<Button>Add a card</Button>}>
              Done
            </KanbanColumnHeader>
            <KanbanCards empty="Nothing here yet" />
          </KanbanColumn>
        )}
      </Kanban>,
    );

    expect(one(".nuv-kanban__title").textContent).toBe("Done");
    expect(one(".nuv-kanban__count").textContent).toBe("0");
    expect(
      one(".nuv-kanban__actions").contains(
        page.getByRole("button", { name: "Add a card" }).element(),
      ),
    ).toBe(true);
    expect(one(".nuv-kanban__empty").textContent).toBe("Nothing here yet");
    expect(one(".nuv-kanban__cards").hasAttribute("data-empty")).toBe(true);
  });

  test("a column with cards doesn't draw what's for an empty one", async () => {
    await render(<Board />);

    expect(column("todo").querySelector(".nuv-kanban__empty")).toBeNull();
    expect(column("done").querySelector(".nuv-kanban__empty")).not.toBeNull();
  });

  test("each part takes a ref, a class and other attributes", async () => {
    const refs = {
      board: createRef<HTMLDivElement>(),
      column: createRef<HTMLDivElement>(),
      header: createRef<HTMLDivElement>(),
      cards: createRef<HTMLDivElement>(),
      card: createRef<HTMLLIElement>(),
      handle: createRef<HTMLButtonElement>(),
    };
    await render(
      <Kanban
        ref={refs.board}
        aria-label="Work"
        className="mine"
        data-testid="board"
        defaultValue={[{ id: "todo", cards: ["brief"] }]}
      >
        {() => (
          <KanbanColumn
            ref={refs.column}
            value="todo"
            label="To do"
            className="mine"
          >
            <KanbanColumnHeader ref={refs.header} className="mine">
              To do
            </KanbanColumnHeader>
            <KanbanCards ref={refs.cards} className="mine">
              <KanbanCard
                ref={refs.card}
                handleRef={refs.handle}
                value="brief"
                label="Write the brief"
                className="mine"
                id="card-brief"
              >
                Write the brief
              </KanbanCard>
            </KanbanCards>
          </KanbanColumn>
        )}
      </Kanban>,
    );

    expect(refs.board.current?.className).toBe("nuv-kanban mine");
    expect(refs.board.current?.dataset.testid).toBe("board");
    expect(refs.column.current?.className).toBe("nuv-kanban__column mine");
    expect(refs.header.current?.className).toBe("nuv-kanban__header mine");
    expect(refs.cards.current?.className).toBe("nuv-kanban__cards mine");
    expect(refs.card.current?.className).toBe("nuv-kanban__card mine");
    expect(refs.card.current?.id).toBe("card-brief");
    expect(refs.handle.current).toBe(handle("brief").element());
  });

  test("a part outside a board says what it needs", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      render(<KanbanColumn value="todo" label="To do" />),
    ).rejects.toThrow("KanbanColumn has to be inside a Kanban.");

    quiet.mockRestore();
  });
});

describe("with the keyboard", () => {
  test("Space on a handle picks the card up, says where it is, and draws it again to be carried", async () => {
    await render(<Board />);

    await pickUp("brief");

    expect(said()).toBe(
      "Picked up Write the brief. It is at position 1 of 3 in To do.",
    );
    expect(card("brief").hasAttribute("data-dragging")).toBe(true);
    expect(board().element().hasAttribute("data-dragging")).toBe(true);
    const carried = one(".nuv-kanban__card[data-overlay]");
    expect(carried.textContent).toBe("Write the brief");
    expect(carried.getAttribute("aria-hidden")).toBe("true");
    expect(carried.querySelector("button")).toBeNull();
  });

  test("the down arrow and Space move a card one place down its column, and say so", async () => {
    const onValueChange = vi.fn();
    await render(<Board onValueChange={onValueChange} />);
    await pickUp("brief");

    await key("{ArrowDown}");
    await expect
      .poll(said)
      .toBe("Write the brief is at position 2 of 3 in To do.");
    expect(onValueChange).not.toHaveBeenCalled();
    await key(" ");

    await expect
      .poll(said)
      .toBe("Write the brief was dropped at position 2 of 3 in To do.");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    const [value, move] = onValueChange.mock.calls[0] as [
      KanbanColumnData[],
      KanbanMove,
    ];
    expect(value).toEqual([
      { id: "todo", cards: ["quote", "brief", "call"] },
      { id: "doing", cards: ["invoice"] },
      { id: "done", cards: [] },
    ]);
    expect(move).toEqual({
      card: "brief",
      from: { column: "todo", index: 0 },
      to: { column: "todo", index: 1 },
    });
    await expect.poll(drawn).toEqual({
      todo: ["quote", "brief", "call"],
      doing: ["invoice"],
      done: [],
    });
    expect(document.querySelector("[data-overlay]")).toBeNull();
    expect(document.querySelector("[data-dragging]")).toBeNull();
  });

  test("when it's dropped, focus is on its handle again", async () => {
    await render(<Board />);
    await pickUp("brief");

    await key("{ArrowDown}");
    await key(" ");

    await expect
      .poll(() => document.activeElement)
      .toBe(handle("brief").element());
  });

  test("the up arrow goes back the other way, and Enter drops as Space does", async () => {
    const onValueChange = vi.fn();
    await render(<Board onValueChange={onValueChange} />);
    await pickUp("call");

    await key("{ArrowUp}");
    await key("{ArrowUp}");
    await key("{Enter}");

    await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
    expect(onValueChange.mock.calls[0]?.[1]).toEqual({
      card: "call",
      from: { column: "todo", index: 2 },
      to: { column: "todo", index: 0 },
    });
  });

  test("a card taken down and back up to where it was is no move", async () => {
    const onValueChange = vi.fn();
    await render(<Board onValueChange={onValueChange} />);
    await pickUp("brief");

    await key("{ArrowDown}");
    await key("{ArrowUp}");
    await key(" ");

    await expect.poll(said).toContain("was dropped");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(drawn().todo).toEqual(["brief", "quote", "call"]);
  });

  test("the right arrow takes a card into the next column, among its cards", async () => {
    const onValueChange = vi.fn();
    await render(<Board onValueChange={onValueChange} />);
    await pickUp("brief");

    await key("{ArrowRight}");
    await expect.poll(() => drawn().doing).toContain("brief");
    await expect.poll(said).toMatch(/position [12] of 2 in Doing\.$/);
    // It's in the next column on the page already, and nobody has been
    // told: it isn't dropped.
    expect(onValueChange).not.toHaveBeenCalled();
    await key(" ");

    await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
    const [value, move] = onValueChange.mock.calls[0] as [
      KanbanColumnData[],
      KanbanMove,
    ];
    expect(move.card).toBe("brief");
    expect(move.from).toEqual({ column: "todo", index: 0 });
    expect(move.to.column).toBe("doing");
    expect(value[0]).toEqual({ id: "todo", cards: ["quote", "call"] });
    expect(value[1]?.cards).toHaveLength(2);
    expect(value[1]?.cards[move.to.index]).toBe("brief");
    await expect.poll(() => drawn().doing).toEqual(value[1]?.cards);
    await expect
      .poll(() => document.activeElement)
      .toBe(handle("brief").element());
  });

  test("it takes a card into a column that has none", async () => {
    const onValueChange = vi.fn();
    await render(<Board onValueChange={onValueChange} />);
    await pickUp("invoice");

    await key("{ArrowRight}");
    await expect
      .poll(said)
      .toBe("Raise the invoice is at position 1 of 1 in Done.");
    await key(" ");

    await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
    expect(onValueChange.mock.calls[0]?.[0]).toEqual([
      { id: "todo", cards: ["brief", "quote", "call"] },
      { id: "doing", cards: [] },
      { id: "done", cards: ["invoice"] },
    ]);
    expect(onValueChange.mock.calls[0]?.[1]).toEqual({
      card: "invoice",
      from: { column: "doing", index: 0 },
      to: { column: "done", index: 0 },
    });
    await expect.poll(said).toContain("was dropped at position 1 of 1 in Done");
    // The column it left says it's empty, and the one it's in doesn't.
    await expect
      .poll(() => column("doing").querySelector(".nuv-kanban__empty"))
      .not.toBeNull();
    expect(column("done").querySelector(".nuv-kanban__empty")).toBeNull();
  });

  test("the right arrow goes one column at a time, and never over one", async () => {
    await render(<Board />);
    await pickUp("call");

    await key("{ArrowRight}");

    // The last card of three is far below the one card of the next
    // column, and the empty column after that is nearer the top. It
    // still goes to the next one.
    await expect.poll(() => drawn().doing).toContain("call");
    expect(drawn().done).toEqual([]);
  });

  test("the left arrow comes back", async () => {
    const onValueChange = vi.fn();
    await render(<Board onValueChange={onValueChange} />);
    await pickUp("invoice");

    await key("{ArrowLeft}");
    await expect.poll(() => drawn().todo).toContain("invoice");
    await key(" ");

    await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
    expect(onValueChange.mock.calls[0]?.[1].to.column).toBe("todo");
  });

  test("Escape puts it back, says so, and tells nobody", async () => {
    const onValueChange = vi.fn();
    await render(<Board onValueChange={onValueChange} />);
    await pickUp("brief");

    await key("{ArrowRight}");
    await expect.poll(() => drawn().doing).toContain("brief");
    await key("{Escape}");

    await expect.poll(said).toBe("Moving Write the brief was cancelled.");
    expect(onValueChange).not.toHaveBeenCalled();
    await expect.poll(drawn).toEqual({
      todo: ["brief", "quote", "call"],
      doing: ["invoice"],
      done: [],
    });
    expect(document.querySelector("[data-overlay]")).toBeNull();
  });

  test("an arrow with nowhere to go leaves the card where it is: up from the first, down from the last, left from the first column", async () => {
    const onValueChange = vi.fn();
    await render(<Board onValueChange={onValueChange} />);

    await pickUp("brief");
    await key("{ArrowUp}");
    await key("{ArrowLeft}");
    await key(" ");
    await expect.poll(said).toContain("was dropped");

    await pickUp("call");
    await key("{ArrowDown}");
    await key(" ");
    await expect.poll(said).toContain("Call Contoso was dropped");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(drawn()).toEqual({
      todo: ["brief", "quote", "call"],
      doing: ["invoice"],
      done: [],
    });
  });

  test("the arrow keys don't scroll the page while a card is carried", async () => {
    await render(
      <div style={{ paddingBlockEnd: 3000 }}>
        <Board />
      </div>,
    );
    await pickUp("brief");

    await key("{ArrowDown}");

    expect(window.scrollY).toBe(0);
    await key("{Escape}");
  });

  test("Space on a button inside a card presses that button and picks nothing up", async () => {
    const onOpen = vi.fn();
    await render(<Board onOpen={onOpen} />);
    (
      page.getByRole("button", { name: "Open brief" }).element() as HTMLElement
    ).focus();

    await key(" ");

    expect(onOpen).toHaveBeenCalledWith("brief");
    expect(document.querySelector("[data-overlay]")).toBeNull();
  });
});

describe("whose the columns are", () => {
  test("kept here, a move stays on the page", async () => {
    await render(<Board />);
    await pickUp("brief");

    await key("{ArrowDown}");
    await key(" ");

    await expect.poll(() => drawn().todo).toEqual(["quote", "brief", "call"]);
  });

  test("kept by you, a move you take is drawn", async () => {
    function Kept() {
      const [value, setValue] = useState(start);
      return <Board value={value} onValueChange={setValue} />;
    }
    await render(<Kept />);
    await pickUp("brief");

    await key("{ArrowDown}");
    await key(" ");

    await expect.poll(() => drawn().todo).toEqual(["quote", "brief", "call"]);
  });

  test("kept by you, a move you don't take is undone", async () => {
    const onValueChange = vi.fn();
    await render(<Board value={start} onValueChange={onValueChange} />);
    await pickUp("brief");

    await key("{ArrowRight}");
    await expect.poll(() => drawn().doing).toContain("brief");
    await key(" ");

    await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
    await expect.poll(drawn).toEqual({
      todo: ["brief", "quote", "call"],
      doing: ["invoice"],
      done: [],
    });
  });

  test("a card and a column with the same id are still two things", async () => {
    const onValueChange = vi.fn();
    await render(
      <Kanban
        aria-label="Work"
        defaultValue={[
          { id: "a", cards: ["b"] },
          { id: "b", cards: [] },
        ]}
        onValueChange={onValueChange}
      >
        {(columns) =>
          columns.map((item) => (
            <KanbanColumn key={item.id} value={item.id} label={item.id}>
              <KanbanCards>
                {item.cards.map((id) => (
                  <KanbanCard key={id} value={id} label="The card">
                    The card
                  </KanbanCard>
                ))}
              </KanbanCards>
            </KanbanColumn>
          ))
        }
      </Kanban>,
    );
    (
      page
        .getByRole("button", { name: "Move The card" })
        .element() as HTMLElement
    ).focus();
    await key(" ");
    await expect.poll(said).toContain("Picked up The card");

    await key("{ArrowRight}");
    await key(" ");

    await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
    expect(onValueChange.mock.calls[0]?.[0]).toEqual([
      { id: "a", cards: [] },
      { id: "b", cards: ["b"] },
    ]);
  });
});

describe("with a mouse", () => {
  test("a card dragged onto another column's card is in that column when it's let go", async () => {
    const onValueChange = vi.fn();
    await render(<Board onValueChange={onValueChange} />);

    await userEvent.dragAndDrop(card("brief"), card("invoice"));

    await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
    const move = onValueChange.mock.calls[0]?.[1] as KanbanMove;
    expect(move.card).toBe("brief");
    expect(move.to.column).toBe("doing");
    await expect.poll(() => drawn().doing).toContain("brief");
    expect(drawn().todo).toEqual(["quote", "call"]);
  });

  test("a card dragged onto a column with none is its only card", async () => {
    const onValueChange = vi.fn();
    await render(<Board onValueChange={onValueChange} />);

    await userEvent.dragAndDrop(
      card("invoice"),
      column("done").querySelector(".nuv-kanban__cards") as HTMLElement,
    );

    await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
    expect(onValueChange.mock.calls[0]?.[1]).toEqual({
      card: "invoice",
      from: { column: "doing", index: 0 },
      to: { column: "done", index: 0 },
    });
  });

  test("a click on a button inside a card is a click, and moves nothing", async () => {
    const onOpen = vi.fn();
    const onValueChange = vi.fn();
    await render(<Board onOpen={onOpen} onValueChange={onValueChange} />);

    await page.getByRole("button", { name: "Open quote" }).click();

    expect(onOpen).toHaveBeenCalledWith("quote");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(document.querySelector("[data-overlay]")).toBeNull();
  });
});

describe("disabled", () => {
  test("with the board disabled no handle can be pressed and nothing is picked up", async () => {
    await render(<Board disabled />);

    expect(board().element().hasAttribute("data-disabled")).toBe(true);
    expect((handle("brief").element() as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(card("brief").hasAttribute("data-disabled")).toBe(true);
    await userEvent.dragAndDrop(card("brief"), card("invoice"));
    expect(drawn().todo).toEqual(["brief", "quote", "call"]);
  });

  test("one disabled card stays, and the others still move", async () => {
    const onValueChange = vi.fn();
    await render(<Board locked="brief" onValueChange={onValueChange} />);

    expect((handle("brief").element() as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((handle("quote").element() as HTMLButtonElement).disabled).toBe(
      false,
    );
    await pickUp("quote");
    await key("{ArrowDown}");
    await key(" ");

    await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
    expect(onValueChange.mock.calls[0]?.[1].card).toBe("quote");
  });
});

describe("words", () => {
  test("every sentence can be given in another language", async () => {
    await render(
      <Board
        labels={{
          move: (name) => `Verplaats ${name}`,
          roleDescription: "sorteerbaar",
          instructions: "Druk op spatie om een kaart op te pakken.",
          picked: (name, place) =>
            `${name} opgepakt, ${place?.position} van ${place?.total} in ${place?.column}.`,
          over: (name, place) =>
            `${name}: ${place.position} van ${place.total} in ${place.column}.`,
          dropped: (name) => `${name} neergezet.`,
          cancelled: (name) => `${name} teruggezet.`,
        }}
      />,
    );
    const button = page.getByRole("button", {
      name: "Verplaats Write the brief",
    });
    const element = button.element() as HTMLElement;

    expect(element.getAttribute("aria-roledescription")).toBe("sorteerbaar");
    expect(
      document.getElementById(
        element.getAttribute("aria-describedby") as string,
      )?.textContent,
    ).toBe("Druk op spatie om een kaart op te pakken.");

    element.focus();
    await key(" ");
    await expect.poll(said).toBe("Write the brief opgepakt, 1 van 3 in To do.");
    await key("{ArrowDown}");
    await expect.poll(said).toBe("Write the brief: 2 van 3 in To do.");
    await key("{Escape}");
    await expect.poll(said).toBe("Write the brief teruggezet.");
  });

  test("a sentence that isn't given keeps its English", async () => {
    await render(<Board labels={{ move: (name) => `Verplaats ${name}` }} />);
    (
      page
        .getByRole("button", { name: "Verplaats Write the brief" })
        .element() as HTMLElement
    ).focus();

    await key(" ");

    await expect.poll(said).toContain("Picked up Write the brief.");
    await key("{Escape}");
  });
});

describe("how it's drawn", () => {
  test("columns are 18rem wide side by side, and the board is as tall as its tallest", async () => {
    await render(<Board />);

    expect(rect(column("todo")).width).toBe(288);
    expect(rect(column("doing")).top).toBe(rect(column("todo")).top);
    expect(rect(column("doing")).left).toBeGreaterThan(
      rect(column("todo")).right,
    );
  });

  test("a column with no cards is still tall enough to drop on", async () => {
    await render(<Board />);

    expect(
      rect(column("done").querySelector(".nuv-kanban__cards") as Element)
        .height,
    ).toBeGreaterThanOrEqual(64);
  });

  test("on a narrow screen the board scrolls sideways and the page doesn't, with some of the next column in sight", async () => {
    await setViewport("phone");
    await render(<Board />);
    const element = board().element();

    expect(element.scrollWidth).toBeGreaterThan(element.clientWidth);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
    expect(rect(column("todo")).width).toBeLessThan(element.clientWidth);
    expect(rect(column("doing")).left).toBeLessThan(rect(element).right);
  });

  test("where the page reads right to left the first column is at the right", async () => {
    await render(
      <div dir="rtl">
        <Board />
      </div>,
    );

    expect(rect(column("todo")).left).toBeGreaterThan(
      rect(column("doing")).left,
    );
    expect(rect(handle("brief").element()).left).toBeGreaterThan(
      rect(one('li[data-card="brief"] .nuv-kanban__card-content')).left,
    );
  });

  test("with a mouse the handle is 24px, and it has a focus ring", async () => {
    await render(<Board />);
    const button = handle("brief").element() as HTMLElement;

    expect(rect(button).width).toBe(24);
    expect(rect(button).height).toBe(24);
    button.focus();
    await userEvent.keyboard("{Tab}{Shift>}{Tab}{/Shift}");
    expect(style(button).outlineStyle).toBe("solid");
  });

  test("the card that's carried is faded where it was, and a long title wraps inside its card", async () => {
    await render(
      <Kanban
        aria-label="Work"
        defaultValue={[{ id: "todo", cards: ["brief"] }]}
      >
        {() => (
          <KanbanColumn value="todo" label="To do">
            <KanbanCards>
              <KanbanCard value="brief" label="Write the brief">
                {"Averyveryverylongwordwithnoplacetobreak".repeat(4)}
              </KanbanCard>
            </KanbanCards>
          </KanbanColumn>
        )}
      </Kanban>,
    );

    expect(rect(card("brief")).right).toBeLessThanOrEqual(
      rect(column("todo")).right,
    );
    await pickUp("brief");
    expect(style(card("brief")).opacity).toBe("0.4");
    await key("{Escape}");
  });

  test("its variables change the width, the colors and the gaps", async () => {
    await render(
      <div
        style={
          {
            "--nuv-kanban-column-width": "200px",
            "--nuv-kanban-gap": "40px",
            "--nuv-kanban-column-bg": "rgb(1, 2, 3)",
            "--nuv-kanban-card-bg": "rgb(4, 5, 6)",
            "--nuv-kanban-card-gap": "20px",
            "--nuv-kanban-count-fg": "rgb(7, 8, 9)",
          } as never
        }
      >
        <Board />
      </div>,
    );

    expect(rect(column("todo")).width).toBe(200);
    expect(rect(column("doing")).left - rect(column("todo")).right).toBe(40);
    expect(style(column("todo")).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style(card("brief")).backgroundColor).toBe("rgb(4, 5, 6)");
    expect(rect(card("quote")).top - rect(card("brief")).bottom).toBe(20);
    expect(style(one(".nuv-kanban__count")).color).toBe("rgb(7, 8, 9)");
  });

  test("with reduced motion a dropped card is in its place at once", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    try {
      await render(<Board />);
      await pickUp("brief");
      await key("{ArrowDown}");

      expect(style(card("quote")).transitionDuration).toBe("0s");
      await key(" ");
      expect(document.querySelector("[data-overlay]")).toBeNull();
    } finally {
      await emulateMedia({ reducedMotion: null });
    }
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe at rest, with a column that has no cards", async () => {
    const { container } = await renderThemed(theme, <Board />);

    expect(await axe(container)).toHaveNoViolations();
  });

  test("passes axe while a card is carried", async () => {
    const { container } = await renderThemed(theme, <Board />);
    await pickUp("brief");

    expect(await axe(container)).toHaveNoViolations();
    await key("{Escape}");
  });
});

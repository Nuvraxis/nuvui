import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  KanbanColumnHeader,
} from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone. What a mouse and a keyboard do is
// checked next to the component.

const rect = (element: Element) => element.getBoundingClientRect();

function Board() {
  return (
    <Kanban
      aria-label="Work"
      defaultValue={[
        { id: "todo", cards: ["brief", "quote"] },
        { id: "doing", cards: [] },
      ]}
    >
      {(columns) =>
        columns.map((column) => (
          <KanbanColumn key={column.id} value={column.id} label={column.id}>
            <KanbanColumnHeader>{column.id}</KanbanColumnHeader>
            <KanbanCards empty="Nothing here yet">
              {column.cards.map((id) => (
                <KanbanCard key={id} value={id} label={id}>
                  {id}
                </KanbanCard>
              ))}
            </KanbanCards>
          </KanbanColumn>
        ))
      }
    </Kanban>
  );
}

test("a card's handle is 44px", async () => {
  await render(<Board />);
  const handle = rect(
    page.getByRole("button", { name: "Move brief" }).element(),
  );

  expect(handle.width).toBe(44);
  expect(handle.height).toBe(44);
});

test("a card lets the page scroll under a finger, and doesn't open the browser's menu for a long press", async () => {
  await render(<Board />);
  const card = document.querySelector('li[data-card="brief"]') as HTMLElement;
  const style = getComputedStyle(card);

  expect(style.touchAction).toBe("manipulation");
  expect(style.userSelect === "none" || style.webkitUserSelect === "none").toBe(
    true,
  );
});

test("a column is narrower than the screen, so the next one shows", async () => {
  await render(<Board />);
  const board = page.getByRole("group", { name: "Work" }).element();
  const first = document.querySelector('[data-column="todo"]') as HTMLElement;
  const second = document.querySelector('[data-column="doing"]') as HTMLElement;

  expect(rect(first).width).toBeLessThanOrEqual(board.clientWidth * 0.85 + 1);
  expect(rect(second).left).toBeLessThan(rect(board).right);
  expect(document.documentElement.scrollWidth).toBe(
    document.documentElement.clientWidth,
  );
});

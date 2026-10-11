import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { Button } from "@nuvui/react/button";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ThreadList, ThreadListGroup, ThreadListItem } from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const grid = () => page.getByRole("grid", { name: "Conversations" });
const rows = () => page.getByRole("row").elements() as HTMLElement[];
const row = (value: string) =>
  document.querySelector(`[role="row"][data-value="${value}"]`) as HTMLElement;
const selected = () =>
  rows()
    .filter((item) => item.getAttribute("aria-selected") === "true")
    .map((item) => item.dataset.value);

type ListProps = Partial<ComponentProps<typeof ThreadList>> & {
  onDelete?: (value: string) => void;
};

function List({ onDelete, ...props }: ListProps) {
  return (
    <div style={{ width: 280 }}>
      <ThreadList aria-label="Conversations" {...props}>
        <ThreadListGroup label="Today">
          <ThreadListItem
            value="overdue"
            detail="2m"
            actions={
              <Button
                intent="ghost"
                size="sm"
                onClick={() => onDelete?.("overdue")}
              >
                Delete overdue
              </Button>
            }
          >
            Overdue invoices
          </ThreadListItem>
          <ThreadListItem value="reminder">Draft a reminder</ThreadListItem>
        </ThreadListGroup>
        <ThreadListGroup label="Yesterday">
          <ThreadListItem value="terms">
            Payment terms, as they stand for every customer on every plan
          </ThreadListItem>
        </ThreadListGroup>
      </ThreadList>
      {/* The library's own button: the browser's is too faint in
          WebKit's dark themes to pass axe. */}
      <Button intent="secondary">After</Button>
    </div>
  );
}

describe("rendering", () => {
  test("it's the core's list with one column, a row for each conversation and a named group for each heading", async () => {
    await render(<List />);

    expect(grid().element().className).toBe("nuv-list-view nuv-thread-list");
    expect(grid().element().hasAttribute("aria-multiselectable")).toBe(false);
    expect(rows()).toHaveLength(3);
    expect(row("overdue").className).toBe(
      "nuv-list-view__item nuv-thread-list__item",
    );
    const groups = page.getByRole("rowgroup").elements();
    expect(groups).toHaveLength(2);
    expect(
      groups.map(
        (group) =>
          document.getElementById(group.getAttribute("aria-labelledby") ?? "")
            ?.textContent,
      ),
    ).toEqual(["Today", "Yesterday"]);
    expect(groups[0]?.querySelectorAll('[role="row"]')).toHaveLength(2);
    // The title, then the detail, then the buttons.
    expect(
      row("overdue").querySelector(".nuv-thread-list__title")?.textContent,
    ).toBe("Overdue invoices");
    expect(
      row("overdue").querySelector(".nuv-thread-list__detail")?.textContent,
    ).toBe("2m");
    expect(
      row("overdue")
        .querySelector(".nuv-thread-list__actions")
        ?.querySelector("button"),
    ).not.toBeNull();
    expect(
      row("reminder").querySelector(".nuv-thread-list__detail"),
    ).toBeNull();
    expect(
      row("reminder").querySelector(".nuv-thread-list__actions"),
    ).toBeNull();
  });

  test("it works without groups", async () => {
    await render(
      <ThreadList aria-label="Conversations" defaultValue="b">
        <ThreadListItem value="a">One</ThreadListItem>
        <ThreadListItem value="b">Two</ThreadListItem>
      </ThreadList>,
    );

    expect(rows()).toHaveLength(2);
    expect(selected()).toEqual(["b"]);
  });

  test("each part takes a ref, a class and other attributes", async () => {
    const refs = {
      list: createRef<HTMLDivElement>(),
      group: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
    };
    await render(
      <ThreadList
        ref={refs.list}
        aria-label="Conversations"
        className="a"
        data-kind="a"
      >
        <ThreadListGroup ref={refs.group} label="Today" className="b">
          <ThreadListItem
            ref={refs.item}
            value="one"
            className="c"
            data-kind="c"
            textValue="Zebra"
          >
            One
          </ThreadListItem>
        </ThreadListGroup>
      </ThreadList>,
    );

    expect(refs.list.current?.className).toBe(
      "nuv-list-view nuv-thread-list a",
    );
    expect(refs.list.current?.dataset.kind).toBe("a");
    expect(refs.group.current?.className).toBe("nuv-thread-list__group b");
    expect(refs.item.current?.className).toBe(
      "nuv-list-view__item nuv-thread-list__item c",
    );
    expect(refs.item.current?.dataset.kind).toBe("c");
    expect(refs.item.current?.dataset.text).toBe("Zebra");
  });
});

describe("which one is open", () => {
  test("none to begin with, and a press opens one and tells you", async () => {
    const onValueChange = vi.fn();
    await render(<List onValueChange={onValueChange} />);
    expect(selected()).toEqual([]);

    await userEvent.click(row("reminder"));

    expect(selected()).toEqual(["reminder"]);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("reminder");
  });

  test("defaultValue starts with one open, and a press on it leaves it open", async () => {
    const onValueChange = vi.fn();
    await render(<List defaultValue="overdue" onValueChange={onValueChange} />);
    expect(selected()).toEqual(["overdue"]);

    await userEvent.click(row("overdue"), { position: { x: 20, y: 10 } });

    expect(selected()).toEqual(["overdue"]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("when you keep it, it's what you say: one, another, or none", async () => {
    function Kept() {
      const [open, setOpen] = useState<string | null>("overdue");
      return (
        <>
          <List value={open} onValueChange={setOpen} />
          <button type="button" onClick={() => setOpen(null)}>
            Start a new one
          </button>
        </>
      );
    }
    await render(<Kept />);
    expect(selected()).toEqual(["overdue"]);

    await userEvent.click(row("terms"));
    expect(selected()).toEqual(["terms"]);

    await page.getByRole("button", { name: "Start a new one" }).click();
    expect(selected()).toEqual([]);
  });

  test("when you keep it and don't change it, it doesn't change", async () => {
    const onValueChange = vi.fn();
    await render(<List value="overdue" onValueChange={onValueChange} />);

    await userEvent.click(row("terms"));

    expect(onValueChange).toHaveBeenCalledWith("terms");
    expect(selected()).toEqual(["overdue"]);
  });

  test("a press on a row's button is the button's, and opens nothing", async () => {
    const onValueChange = vi.fn();
    const onDelete = vi.fn();
    await render(<List onValueChange={onValueChange} onDelete={onDelete} />);

    await page.getByRole("button", { name: "Delete overdue" }).click();

    expect(onDelete).toHaveBeenCalledWith("overdue");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(selected()).toEqual([]);
  });
});

describe("keyboard", () => {
  test("it's one Tab stop: the arrows move between conversations and open nothing", async () => {
    const onValueChange = vi.fn();
    await render(<List onValueChange={onValueChange} />);

    await userEvent.tab();
    expect(document.activeElement).toBe(row("overdue"));
    expect(style(row("overdue")).outlineStyle).toBe("solid");

    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(row("reminder"));
    // Across a heading, into the next group.
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(row("terms"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(row("overdue"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(row("terms"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("Enter opens the conversation, and so does Space", async () => {
    const onValueChange = vi.fn();
    await render(<List onValueChange={onValueChange} />);

    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(selected()).toEqual(["reminder"]);

    await userEvent.keyboard("{ArrowDown} ");
    expect(selected()).toEqual(["terms"]);
    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([
      "reminder",
      "terms",
    ]);
  });

  test("Tab goes from a row into its buttons and then out, past the other rows", async () => {
    await render(<List />);

    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(
      page.getByRole("button", { name: "Delete overdue" }).element(),
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(
      page.getByRole("button", { name: "After" }).element(),
    );
  });

  test("a letter goes to the next conversation that starts with it", async () => {
    await render(<List />);

    await userEvent.tab();
    await userEvent.keyboard("p");

    expect(document.activeElement).toBe(row("terms"));
  });
});

describe("styles", () => {
  test("a long title is cut short on one line, and the row stays in the list", async () => {
    await render(<List />);
    const title = row("terms").querySelector(
      ".nuv-thread-list__title",
    ) as HTMLElement;

    expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    expect(style(title).textOverflow).toBe("ellipsis");
    expect(style(title).whiteSpace).toBe("nowrap");
    expect(rect(row("terms")).right).toBeLessThanOrEqual(
      rect(grid().element()).right,
    );
    expect(rect(row("terms")).height).toBe(44);
  });

  test("rows are round with no line between them, and the open one is marked by more than a color", async () => {
    await render(<List defaultValue="reminder" />);

    expect(
      Number.parseFloat(style(row("overdue")).borderTopLeftRadius),
    ).toBeGreaterThan(0);
    expect(style(row("reminder")).borderTopColor).toBe("rgba(0, 0, 0, 0)");
    expect(style(row("reminder")).backgroundColor).not.toBe(
      style(row("overdue")).backgroundColor,
    );
    // The bar at its start.
    expect(
      Number.parseFloat(
        getComputedStyle(row("reminder"), "::before").borderInlineStartWidth,
      ),
    ).toBeGreaterThan(0);
    expect(getComputedStyle(row("overdue"), "::before").content).toBe("none");
  });

  test("the second group is set apart from the first", async () => {
    await render(<List />);
    const [first, second] = page.getByRole("rowgroup").elements();

    expect(rect(second as Element).top - rect(first as Element).bottom).toBe(
      16,
    );
  });

  test("component variables change the corners and the quiet colors", async () => {
    await render(
      <div
        style={
          {
            "--nuv-thread-list-radius": "3px",
            "--nuv-thread-list-heading-fg": "rgb(1, 2, 3)",
            "--nuv-thread-list-detail-fg": "rgb(4, 5, 6)",
          } as never
        }
      >
        <List />
      </div>,
    );

    expect(style(row("overdue")).borderTopLeftRadius).toBe("3px");
    expect(
      style(document.querySelector(".nuv-thread-list__heading") as Element)
        .color,
    ).toBe("rgb(1, 2, 3)");
    expect(
      style(document.querySelector(".nuv-thread-list__detail") as Element)
        .color,
    ).toBe("rgb(4, 5, 6)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with groups, buttons and one open", async () => {
    const { container } = await renderThemed(
      theme,
      <List defaultValue="overdue" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  test("a heading and a detail can be read, on the page and on the open row", async () => {
    const { container } = await renderThemed(
      theme,
      <List defaultValue="overdue" />,
    );
    const ground = style(
      container.querySelector("main") as Element,
    ).backgroundColor;

    expect(
      contrast(
        style(document.querySelector(".nuv-thread-list__heading") as Element)
          .color,
        ground,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(
        style(document.querySelector(".nuv-thread-list__detail") as Element)
          .color,
        style(row("overdue")).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

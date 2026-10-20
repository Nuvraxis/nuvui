import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  PinnedList,
  PinnedListItem,
  type PinnedListProps,
} from "./pinned-list";

beforeEach(async () => {
  await emulateMedia({ reducedMotion: "reduce" });
});

const names: Record<string, string> = {
  q3: "Q3 revenue",
  churn: "Churn by plan",
  pipeline: "Sales pipeline",
  hiring: "Hiring plan",
};
const items = Object.keys(names);

function Reports(
  props: Omit<PinnedListProps, "items" | "children"> & { items?: string[] },
) {
  return (
    <PinnedList items={items} {...props}>
      {(value) => (
        <PinnedListItem value={value} label={names[value] ?? value}>
          {names[value]}
        </PinnedListItem>
      )}
    </PinnedList>
  );
}

const root = () => document.querySelector(".nuv-pinned-list") as HTMLElement;
const pin = (name: string) => page.getByRole("button", { name: `Pin ${name}` });
// The items' names in a group, top to bottom.
const inGroup = (name: string) =>
  Array.from(
    page.getByRole("list", { name }).element().querySelectorAll("li"),
  ).map((item) => item.querySelector(".nuv-pinned-list__content")?.textContent);
const status = () => root().querySelector('[role="status"]') as HTMLElement;

describe("rendering", () => {
  test("pinned items in a named list at the top, and the rest in one under it", async () => {
    await render(<Reports defaultPinned={["pipeline"]} />);

    expect(inGroup("Pinned")).toEqual(["Sales pipeline"]);
    expect(inGroup("Everything else")).toEqual([
      "Q3 revenue",
      "Churn by plan",
      "Hiring plan",
    ]);
    const [first, second] = Array.from(
      document.querySelectorAll(".nuv-pinned-list__group"),
    ) as [Element, Element];
    expect(first.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      second.getBoundingClientRect().top,
    );
  });

  test("a group with nothing in it isn't drawn", async () => {
    await render(<Reports />);

    await expect
      .element(page.getByRole("list", { name: "Pinned" }))
      .not.toBeInTheDocument();
    expect(document.querySelectorAll(".nuv-pinned-list__group")).toHaveLength(
      1,
    );
    expect(document.querySelector(".nuv-pinned-list__label")?.textContent).toBe(
      "Everything else",
    );
  });

  test("each pin is a toggle button with one name, and says whether it's pressed", async () => {
    await render(<Reports defaultPinned={["q3"]} />);

    await expect
      .element(pin("Q3 revenue"))
      .toHaveAttribute("aria-pressed", "true");
    await expect
      .element(pin("Churn by plan"))
      .toHaveAttribute("aria-pressed", "false");
    expect(
      document.querySelectorAll(".nuv-pinned-list__pin svg[aria-hidden]"),
    ).toHaveLength(4);
  });

  test("a pinned pin is filled, so its state shows in its shape", async () => {
    await render(<Reports defaultPinned={["q3"]} />);
    const head = (name: string) =>
      pin(name).element().querySelector("path")?.getAttribute("fill");

    expect(head("Q3 revenue")).toBe("currentColor");
    expect(head("Churn by plan")).toBe("none");
  });

  test("forwards refs, class names and other props", async () => {
    const list = createRef<HTMLDivElement>();
    const item = createRef<HTMLLIElement>();
    await render(
      <PinnedList ref={list} items={["q3"]} className="mine" id="reports">
        {(value) => (
          <PinnedListItem ref={item} value={value} label="Q3" className="row">
            Q3
          </PinnedListItem>
        )}
      </PinnedList>,
    );

    expect(list.current).toBe(root());
    expect(root().className).toBe("nuv-pinned-list mine");
    expect(root().id).toBe("reports");
    expect(item.current?.className).toBe("nuv-pinned-list__item row");
  });

  test("an item can hold a link and buttons of its own", async () => {
    await render(
      <PinnedList items={["q3"]}>
        {(value) => (
          <PinnedListItem value={value} label="Q3 revenue">
            <a href="#q3">Q3 revenue</a>
          </PinnedListItem>
        )}
      </PinnedList>,
    );

    await expect
      .element(page.getByRole("link", { name: "Q3 revenue" }))
      .toBeInTheDocument();
  });

  test("the page from the server has both groups and their items", () => {
    const html = renderToString(<Reports defaultPinned={["churn"]} />);

    for (const name of [...Object.values(names), "Pinned", "Everything else"]) {
      expect(html).toContain(name);
    }
    expect(html).toContain('aria-pressed="true"');
  });

  test("an item outside a list says so", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      render(<PinnedListItem value="q3" label="Q3" />),
    ).rejects.toThrow("PinnedListItem has to be inside a PinnedList.");
    error.mockRestore();
  });
});

describe("pinning", () => {
  test("pressing a pin moves the item to the top, and back again", async () => {
    await render(<Reports />);

    await userEvent.click(pin("Hiring plan"));
    expect(inGroup("Pinned")).toEqual(["Hiring plan"]);
    expect(inGroup("Everything else")).not.toContain("Hiring plan");

    await userEvent.click(pin("Hiring plan"));
    await expect
      .element(page.getByRole("list", { name: "Pinned" }))
      .not.toBeInTheDocument();
  });

  test("both groups keep the order of items, so an item unpinned goes back where it was", async () => {
    await render(<Reports />);

    await userEvent.click(pin("Hiring plan"));
    await userEvent.click(pin("Churn by plan"));
    expect(inGroup("Pinned")).toEqual(["Churn by plan", "Hiring plan"]);

    await userEvent.click(pin("Churn by plan"));
    expect(inGroup("Everything else")).toEqual([
      "Q3 revenue",
      "Churn by plan",
      "Sales pipeline",
    ]);
  });

  test("onPinnedChange hears what's pinned now, and what changed", async () => {
    const onPinnedChange = vi.fn();
    await render(
      <Reports defaultPinned={["q3"]} onPinnedChange={onPinnedChange} />,
    );

    await userEvent.click(pin("Hiring plan"));
    expect(onPinnedChange).toHaveBeenLastCalledWith(["q3", "hiring"], {
      value: "hiring",
      pinned: true,
    });

    await userEvent.click(pin("Q3 revenue"));
    expect(onPinnedChange).toHaveBeenLastCalledWith(["hiring"], {
      value: "q3",
      pinned: false,
    });
  });

  test("controlled: it shows what it's given, and moves nothing by itself", async () => {
    const onPinnedChange = vi.fn();
    await render(<Reports pinned={["q3"]} onPinnedChange={onPinnedChange} />);

    await userEvent.click(pin("Hiring plan"));

    expect(onPinnedChange).toHaveBeenCalledTimes(1);
    expect(inGroup("Pinned")).toEqual(["Q3 revenue"]);
  });

  test("controlled: it follows what it's given", async () => {
    function Kept() {
      const [pinned, setPinned] = useState<string[]>([]);
      return <Reports pinned={pinned} onPinnedChange={setPinned} />;
    }
    await render(<Kept />);

    await userEvent.click(pin("Sales pipeline"));

    expect(inGroup("Pinned")).toEqual(["Sales pipeline"]);
  });

  test("ids pinned that aren't in items are kept, and not drawn", async () => {
    const onPinnedChange = vi.fn();
    await render(
      <Reports defaultPinned={["archived"]} onPinnedChange={onPinnedChange} />,
    );

    expect(document.querySelectorAll(".nuv-pinned-list__group")).toHaveLength(
      1,
    );
    await userEvent.click(pin("Q3 revenue"));
    expect(onPinnedChange).toHaveBeenLastCalledWith(["archived", "q3"], {
      value: "q3",
      pinned: true,
    });
  });

  test("disabled: the pins can't be pressed", async () => {
    const onPinnedChange = vi.fn();
    await render(<Reports disabled onPinnedChange={onPinnedChange} />);

    await expect.element(pin("Q3 revenue")).toBeDisabled();
    expect(onPinnedChange).not.toHaveBeenCalled();
  });
});

describe("the keyboard and a screen reader", () => {
  test("the focus stays on the pin when its item moves to the other group", async () => {
    await render(<Reports />);

    pin("Sales pipeline").element().focus();
    await userEvent.keyboard("{Enter}");

    expect(inGroup("Pinned")).toEqual(["Sales pipeline"]);
    expect(document.activeElement).toBe(pin("Sales pipeline").element());

    await userEvent.keyboard(" ");

    expect(inGroup("Everything else")).toContain("Sales pipeline");
    expect(document.activeElement).toBe(pin("Sales pipeline").element());
  });

  test("a pin pressed with the focus elsewhere doesn't take it", async () => {
    await render(
      <>
        <input aria-label="Search" />
        <Reports />
      </>,
    );
    const search = page.getByRole("textbox", { name: "Search" }).element();
    (search as HTMLInputElement).focus();

    pin("Q3 revenue")
      .element()
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    await expect.poll(() => inGroup("Pinned")).toEqual(["Q3 revenue"]);
    expect(document.activeElement).toBe(search);
  });

  test("a status region says what was pinned and unpinned", async () => {
    await render(<Reports />);

    // On the page, empty, before anything is said in it.
    expect(status().textContent).toBe("");
    expect(status().getBoundingClientRect().width).toBeLessThanOrEqual(1);

    await userEvent.click(pin("Churn by plan"));
    expect(status().textContent).toBe("Pinned Churn by plan");

    await userEvent.click(pin("Churn by plan"));
    expect(status().textContent).toBe("Unpinned Churn by plan");
  });

  test("every piece of text can be changed", async () => {
    await render(
      <Reports
        defaultPinned={["q3"]}
        pinnedLabel="Épinglés"
        restLabel="Autres"
        pinLabel={(label) => `Épingler ${label}`}
        pinnedMessage={(label) => `${label} épinglé`}
        unpinnedMessage={(label) => `${label} désépinglé`}
      />,
    );

    await expect
      .element(page.getByRole("list", { name: "Épinglés" }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole("list", { name: "Autres" }))
      .toBeInTheDocument();
    await userEvent.click(
      page.getByRole("button", { name: "Épingler Q3 revenue" }),
    );
    expect(status().textContent).toBe("Q3 revenue désépinglé");
    await userEvent.click(
      page.getByRole("button", { name: "Épingler Hiring plan" }),
    );
    expect(status().textContent).toBe("Hiring plan épinglé");
  });
});

describe("motion", () => {
  test("the item slides from where it was to where it is, over the others", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Reports />);
    const before = pin("Hiring plan")
      .element()
      .closest("li")
      ?.getBoundingClientRect() as DOMRect;

    await userEvent.click(pin("Hiring plan"));

    const item = pin("Hiring plan").element().closest("li") as HTMLElement;
    const [slide] = item.getAnimations();
    expect(slide).toBeDefined();
    expect(item.hasAttribute("data-moving")).toBe(true);
    expect(getComputedStyle(item).zIndex).toBe("1");
    // Drawn where it was, at the start of the slide.
    (slide as Animation).pause();
    (slide as Animation).currentTime = 0;
    expect(item.getBoundingClientRect().top).toBeCloseTo(before.top, 0);

    (slide as Animation).finish();
    await expect.poll(() => item.hasAttribute("data-moving")).toBe(false);
  });

  test("the others slide to make room, and a group's name that appears fades in", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Reports />);

    await userEvent.click(pin("Hiring plan"));

    const label = page.getByText("Pinned", { exact: true }).element();
    expect(label.getAnimations()).toHaveLength(1);
    const others = ["Q3 revenue", "Churn by plan", "Sales pipeline"].map(
      (name) => pin(name).element().closest("li") as HTMLElement,
    );
    for (const other of others) {
      expect(other.getAnimations()).toHaveLength(1);
    }
  });

  test("component variables set how long a slide takes", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div style={{ "--nuv-pinned-list-duration": "600ms" } as never}>
        <Reports />
      </div>,
    );

    await userEvent.click(pin("Hiring plan"));

    const item = pin("Hiring plan").element().closest("li") as HTMLElement;
    expect(item.getAnimations()[0]?.effect?.getTiming().duration).toBe(600);
  });

  test("nothing moves for less motion", async () => {
    await render(<Reports />);

    await userEvent.click(pin("Hiring plan"));

    expect(root().getAnimations({ subtree: true })).toHaveLength(0);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, with items in both groups", async () => {
    const screen = await renderThemed(
      theme,
      <Reports defaultPinned={["q3", "hiring"]} />,
    );

    await expectNoViolations(screen.container);
  });
});

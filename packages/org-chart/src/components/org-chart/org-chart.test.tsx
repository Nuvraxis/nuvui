import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport, wheel } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { OrgChart, type OrgChartHandle, type OrgChartPerson } from ".";

// A photo, so that nothing is fetched.
const photo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="teal"/></svg>',
)}`;

// A head, two managers with teams, one more report with none, and in the
// teams a person on leave and an open position.
const people: OrgChartPerson[] = [
  {
    id: "ada",
    name: "Ada Quill",
    title: "Chief Executive",
    department: "Operations",
    avatar: photo,
  },
  {
    id: "bo",
    managerId: "ada",
    name: "Bo Ferro",
    title: "Head of Sales",
    department: "Sales",
  },
  {
    id: "cy",
    managerId: "ada",
    name: "Cy Lund",
    title: "Head of Design",
    department: "Design",
  },
  { id: "di", managerId: "ada", name: "Di Osei", title: "Assistant" },
  {
    id: "ed",
    managerId: "bo",
    name: "Ed Marsh",
    title: "Account Manager",
    badge: "On leave",
  },
  { id: "fi", managerId: "bo", name: "Fi Nakamura", title: "Account Manager" },
  { id: "gus", managerId: "cy", vacant: true, title: "Senior Designer" },
  { id: "hal", managerId: "cy", name: "Hal José", title: "Designer" },
];

const one = (selector: string) =>
  document.querySelector(selector) as HTMLElement;
const card = (id: string) =>
  document.querySelector<HTMLElement>(`.nuv-org-chart__card[data-id="${id}"]`);
const toggle = (id: string) =>
  one(`.nuv-org-chart__toggle[data-for="${id}"]`) as HTMLButtonElement;
const shown = () =>
  [...document.querySelectorAll<HTMLElement>(".nuv-org-chart__card")].map(
    (element) => element.dataset.id,
  );
const focusedId = () => (document.activeElement as HTMLElement)?.dataset.id;
const said = () =>
  one('.nuv-org-chart [role="status"]').textContent?.trim() ?? "";
const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function viewport() {
  const match =
    /translate\(([-\d.e]+)px, ([-\d.e]+)px\) scale\(([-\d.e]+)\)/.exec(
      one(".nuv-org-chart__layer").style.transform,
    );
  return match
    ? { x: Number(match[1]), y: Number(match[2]), zoom: Number(match[3]) }
    : null;
}

// Where a card is on the screen.
function screenBox(id: string) {
  const element = card(id);
  if (!element) throw new Error(`${id} isn't drawn`);
  return element.getBoundingClientRect();
}

async function key(keys: string) {
  await userEvent.keyboard(keys);
  await nextFrame();
  await nextFrame();
}

// Pointer events sent to the frame, at points on the screen, as a hand
// drags.
function pointer(type: string, target: Element, at: { x: number; y: number }) {
  target.dispatchEvent(
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
      buttons: type === "pointerup" ? 0 : 1,
    }),
  );
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

type Props = Partial<ComponentProps<typeof OrgChart>>;

function Chart(props: Props) {
  return <OrgChart aria-label="Quill and Ferro" people={people} {...props} />;
}

beforeEach(async () => {
  await setViewport("desktop");
});

describe("rendering", () => {
  test("it's a named tree with an item for each person, each named in a sentence, at its level and place", async () => {
    await render(<Chart />);
    const tree = page.getByRole("tree", { name: "Quill and Ferro" });
    await expect
      .element(tree)
      .toHaveAttribute("aria-roledescription", "org chart");
    expect(shown()).toEqual([
      "ada",
      "bo",
      "ed",
      "fi",
      "cy",
      "gus",
      "hal",
      "di",
    ]);

    const ada = card("ada");
    expect(ada?.getAttribute("role")).toBe("treeitem");
    expect(ada?.getAttribute("aria-label")).toBe(
      "Ada Quill, Chief Executive, Operations, 3 direct reports",
    );
    expect(ada?.getAttribute("aria-level")).toBe("1");
    expect(ada?.getAttribute("aria-expanded")).toBe("true");
    expect(card("ed")?.getAttribute("aria-label")).toBe(
      "Ed Marsh, Account Manager, On leave",
    );
    expect(card("ed")?.getAttribute("aria-level")).toBe("3");
    expect(card("ed")?.hasAttribute("aria-expanded")).toBe(false);
    expect(card("cy")?.getAttribute("aria-posinset")).toBe("2");
    expect(card("cy")?.getAttribute("aria-setsize")).toBe("3");
    expect(card("cy")?.getAttribute("aria-selected")).toBe("false");
  });

  test("the keys are written out and describe the tree, the vertical way or the sideways one", async () => {
    const { rerender } = await render(<Chart />);
    const tree = page.getByRole("tree").element();
    const instructions = () =>
      document.getElementById(tree.getAttribute("aria-describedby") ?? "")
        ?.textContent ?? "";
    expect(instructions()).toMatch(/up arrow to go to someone's manager/);
    await rerender(<Chart orientation="horizontal" />);
    expect(instructions()).toMatch(
      /up and down arrows to move between colleagues/,
    );
  });

  test("a card has the photo, the name, the title, the department and the badge, and initials where there's no photo", async () => {
    await render(<Chart />);
    await expect
      .poll(() => card("ada")?.querySelector("img")?.getAttribute("src"))
      .toBe(photo);
    expect(card("ada")?.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(
      card("bo")?.querySelector(".nuv-avatar__fallback")?.textContent,
    ).toBe("BF");
    expect(
      card("ed")?.querySelector(".nuv-org-chart__badge")?.textContent,
    ).toBe("On leave");
    expect(
      card("cy")?.querySelector(".nuv-org-chart__department")?.textContent,
    ).toBe("Design");
    // The photo or the initials aren't read: the name is.
    expect(
      card("bo")?.querySelector(".nuv-avatar")?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  test("an open position says so where a name would be, with a dashed edge and no photo", async () => {
    await render(<Chart />);
    const seat = card("gus");
    expect(seat?.querySelector(".nuv-org-chart__name")?.textContent).toBe(
      "Open position",
    );
    expect(seat?.getAttribute("aria-label")).toBe(
      "Open position, Senior Designer",
    );
    expect(seat?.hasAttribute("data-vacant")).toBe(true);
    expect(seat?.querySelector(".nuv-avatar")).toBeNull();
    expect(getComputedStyle(seat as Element).borderStyle).toBe("dashed");
  });

  test("a server sends every card in place, with the top person in the middle, and no view yet", () => {
    const html = renderToString(<Chart />);
    expect(html.match(/role="treeitem"/g)).toHaveLength(people.length);
    expect(html).toContain('role="tree"');
    expect(html).toMatch(/class="nuv-org-chart__layer" style="[^"]*left:50%/);
    expect(html).not.toMatch(/scale\(/);
    expect(html).toContain("Hide Ada Quill&#x27;s 3 direct reports");
  });

  test("in the browser the chart is moved by a transform from the frame's corner, and fitted", async () => {
    await render(<Chart />);
    await expect.poll(viewport).not.toBeNull();
    const layer = one(".nuv-org-chart__layer");
    expect(layer.style.left).toBe("0px");
    const frame = one(".nuv-org-chart__frame").getBoundingClientRect();
    for (const id of shown()) {
      const box = screenBox(id as string);
      expect(box.left).toBeGreaterThanOrEqual(frame.left);
      expect(box.right).toBeLessThanOrEqual(frame.right);
      expect(box.bottom).toBeLessThanOrEqual(frame.bottom);
    }
  });

  test("a chart too large to fit at a size that can be read starts at its top person, at that size", async () => {
    const many: OrgChartPerson[] = [{ id: "top", name: "Top Person" }];
    for (let i = 0; i < 40; i++) {
      many.push({ id: `m${i}`, managerId: "top", name: `Manager ${i}` });
      many.push({ id: `r${i}`, managerId: `m${i}`, name: `Report ${i}` });
    }
    await render(<OrgChart aria-label="Large" people={many} />);
    await expect.poll(() => viewport()?.zoom).toBe(0.6);
    const element = one(".nuv-org-chart__frame");
    const frame = element.getBoundingClientRect();
    const top = screenBox("top");
    expect(top.left + top.width / 2).toBeCloseTo(
      frame.left + frame.width / 2,
      0,
    );
    // 24 pixels inside the frame's border.
    expect(top.top - frame.top - element.clientTop).toBeCloseTo(24, 0);
  });

  test("it takes a class and other attributes, and passes its ref to its root", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Chart ref={ref} className="people" data-testid="chart" />);
    expect(ref.current).toBe(one('[data-testid="chart"]'));
    expect(ref.current?.classList.contains("nuv-org-chart")).toBe(true);
    expect(ref.current?.classList.contains("people")).toBe(true);
    expect(ref.current?.dataset.orientation).toBe("vertical");
  });
});

describe("teams", () => {
  test("a manager's button hides their team, says so, and their card stays where it was on the screen", async () => {
    const onExpandedChange = vi.fn();
    await render(<Chart onExpandedChange={onExpandedChange} />);
    await expect.poll(viewport).not.toBeNull();
    const button = toggle("bo");
    expect(button.getAttribute("aria-label")).toBe(
      "Hide Bo Ferro's 2 direct reports",
    );
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.textContent).toBe("2");
    const before = screenBox("bo");

    await page.elementLocator(button).click();
    expect(shown()).not.toContain("ed");
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      expect.not.arrayContaining(["bo"]),
    );
    expect(toggle("bo").getAttribute("aria-label")).toBe(
      "Show Bo Ferro's 2 direct reports",
    );
    expect(card("bo")?.getAttribute("aria-expanded")).toBe("false");
    await expect.poll(() => screenBox("bo").left).toBeCloseTo(before.left, 0);
    expect(screenBox("bo").top).toBeCloseTo(before.top, 0);

    await page.elementLocator(toggle("bo")).click();
    expect(shown()).toContain("ed");
  });

  test("the buttons aren't stops for Tab, and the people with no team have none", async () => {
    await render(<Chart />);
    expect(toggle("ada").tabIndex).toBe(-1);
    expect(
      document.querySelector('.nuv-org-chart__toggle[data-for="di"]'),
    ).toBeNull();
  });

  test("the managers in defaultExpanded are the ones open at first", async () => {
    await render(<Chart defaultExpanded={["ada"]} />);
    expect(shown()).toEqual(["ada", "bo", "cy", "di"]);
  });

  test("a chart that keeps expanded draws what it's given, and a change it doesn't take doesn't happen", async () => {
    const onExpandedChange = vi.fn();
    await render(
      <Chart expanded={["ada"]} onExpandedChange={onExpandedChange} />,
    );
    await page.elementLocator(toggle("cy")).click();
    expect(onExpandedChange).toHaveBeenLastCalledWith(["ada", "cy"]);
    expect(shown()).toEqual(["ada", "bo", "cy", "di"]);
  });

  test("a team closing around the card with focus hands it to the nearest manager still shown, whatever closed it", async () => {
    const { rerender } = await render(<Chart expanded={["ada", "bo", "cy"]} />);
    card("hal")?.focus();
    await rerender(<Chart expanded={["ada", "bo"]} />);
    await expect.poll(focusedId).toBe("cy");
    expect(card("cy")?.tabIndex).toBe(0);
    await rerender(<Chart expanded={[]} />);
    await expect.poll(focusedId).toBe("ada");
  });

  test("new people with a team, given after one was closed by hand, come with theirs closed, and before that open", async () => {
    const { rerender } = await render(<Chart />);
    const more = [...people, { id: "ivy", managerId: "di", name: "Ivy Tran" }];
    await rerender(<Chart people={more} />);
    expect(shown()).toContain("ivy");
    await page.elementLocator(toggle("cy")).click();
    await rerender(
      <Chart
        people={[...more, { id: "jo", managerId: "fi", name: "Jo Park" }]}
      />,
    );
    expect(shown()).not.toContain("jo");
    expect(card("fi")?.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("with the keyboard", () => {
  test("Tab goes to the first card, and the arrows follow the lines", async () => {
    await render(
      <>
        <button type="button">Before</button>
        <Chart search={false} controls={false} />
      </>,
    );
    page.getByRole("button", { name: "Before" }).element().focus();
    await key("{Tab}");
    expect(focusedId()).toBe("ada");
    await key("{ArrowDown}");
    expect(focusedId()).toBe("bo");
    await key("{ArrowRight}");
    expect(focusedId()).toBe("cy");
    await key("{ArrowRight}");
    expect(focusedId()).toBe("di");
    // At the end of the colleagues the arrow stays.
    await key("{ArrowRight}");
    expect(focusedId()).toBe("di");
    await key("{ArrowLeft}{ArrowLeft}{ArrowDown}");
    expect(focusedId()).toBe("ed");
    await key("{ArrowUp}{ArrowUp}");
    expect(focusedId()).toBe("ada");
    // Only one card is a stop for Tab, the one the keys are on.
    expect(
      document.querySelectorAll('.nuv-org-chart__card[tabindex="0"]'),
    ).toHaveLength(1);
  });

  test("on a closed team the arrow toward the reports opens it, and again goes in, and Space opens and closes it", async () => {
    await render(<Chart defaultExpanded={["ada"]} />);
    card("bo")?.focus();
    await key("{ArrowDown}");
    expect(focusedId()).toBe("bo");
    expect(card("bo")?.getAttribute("aria-expanded")).toBe("true");
    await key("{ArrowDown}");
    expect(focusedId()).toBe("ed");
    await key("{ArrowUp} ");
    expect(card("bo")?.getAttribute("aria-expanded")).toBe("false");
    expect(shown()).not.toContain("ed");
    await key(" ");
    expect(shown()).toContain("ed");
  });

  test("sideways, the arrows along the line go between managers and reports, and up and down between colleagues", async () => {
    await render(<Chart orientation="horizontal" />);
    card("ada")?.focus();
    await key("{ArrowRight}");
    expect(focusedId()).toBe("bo");
    await key("{ArrowDown}");
    expect(focusedId()).toBe("cy");
    await key("{ArrowLeft}");
    expect(focusedId()).toBe("ada");
  });

  test("where the page reads right to left, the arrows across are mirrored with the chart", async () => {
    await render(
      <div dir="rtl">
        <Chart dir="rtl" />
      </div>,
    );
    expect(screenBox("cy").left).toBeLessThan(screenBox("bo").left);
    card("bo")?.focus();
    await key("{ArrowLeft}");
    expect(focusedId()).toBe("cy");
    await key("{ArrowRight}");
    expect(focusedId()).toBe("bo");
  });

  test("right to left and sideways, the reports are to the left", async () => {
    await render(<Chart dir="rtl" orientation="horizontal" />);
    expect(screenBox("bo").left).toBeLessThan(screenBox("ada").left);
    card("ada")?.focus();
    await key("{ArrowLeft}");
    expect(focusedId()).toBe("bo");
    await key("{ArrowRight}");
    expect(focusedId()).toBe("ada");
  });

  test("Home and End go to the first card and the last one shown", async () => {
    await render(<Chart />);
    card("fi")?.focus();
    await key("{End}");
    expect(focusedId()).toBe("di");
    await key("{Home}");
    expect(focusedId()).toBe("ada");
  });

  test("* opens the teams of everyone beside the person", async () => {
    await render(<Chart defaultExpanded={["ada"]} />);
    card("di")?.focus();
    await key("*");
    expect(card("bo")?.getAttribute("aria-expanded")).toBe("true");
    expect(card("cy")?.getAttribute("aria-expanded")).toBe("true");
    expect(focusedId()).toBe("di");
  });

  test("a letter goes to the next person shown whose name starts with it, and letters typed quickly spell more of it", async () => {
    await render(<Chart />);
    card("ada")?.focus();
    await key("f");
    expect(focusedId()).toBe("fi");
    await new Promise((resolve) => setTimeout(resolve, 700));
    await key("h");
    expect(focusedId()).toBe("hal");
    await new Promise((resolve) => setTimeout(resolve, 700));
    await key("bo");
    expect(focusedId()).toBe("bo");
  });

  test("Enter chooses the person and opens them, and Escape clears the choice", async () => {
    const onSelectedChange = vi.fn();
    const onPersonOpen = vi.fn();
    await render(
      <Chart onSelectedChange={onSelectedChange} onPersonOpen={onPersonOpen} />,
    );
    card("cy")?.focus();
    await key("{Enter}");
    expect(onSelectedChange).toHaveBeenLastCalledWith("cy");
    expect(onPersonOpen).toHaveBeenLastCalledWith("cy");
    expect(card("cy")?.getAttribute("aria-selected")).toBe("true");
    await key("{Escape}");
    expect(onSelectedChange).toHaveBeenLastCalledWith(null);
    expect(card("cy")?.getAttribute("aria-selected")).toBe("false");
  });

  test("plus and minus zoom, and 0 fits the chart again", async () => {
    await render(<Chart />);
    await expect.poll(viewport).not.toBeNull();
    const fitted = viewport()?.zoom ?? 0;
    card("ada")?.focus();
    await key("+");
    await expect.poll(() => viewport()?.zoom).toBeCloseTo(fitted * 1.25, 3);
    await key("-");
    await expect.poll(() => viewport()?.zoom).toBeCloseTo(fitted, 3);
    await key("-");
    await expect.poll(() => viewport()?.zoom).toBeCloseTo(fitted * 0.8, 3);
    await key("0");
    await expect.poll(() => viewport()?.zoom).toBeCloseTo(fitted, 3);
  });

  test("the arrows bring a card that's out of view into it", async () => {
    await render(<Chart defaultViewport={{ x: 0, y: 0, zoom: 2 }} />);
    card("ada")?.focus();
    await key("{ArrowDown}{ArrowRight}{ArrowRight}");
    expect(focusedId()).toBe("di");
    const frame = one(".nuv-org-chart__frame").getBoundingClientRect();
    await expect
      .poll(() => screenBox("di").right)
      .toBeLessThanOrEqual(frame.right);
    expect(screenBox("di").left).toBeGreaterThanOrEqual(frame.left);
  });
});

describe("choosing with a pointer", () => {
  test("a click chooses the person, and a double click opens them", async () => {
    const onSelectedChange = vi.fn();
    const onPersonOpen = vi.fn();
    await render(
      <Chart onSelectedChange={onSelectedChange} onPersonOpen={onPersonOpen} />,
    );
    await page.getByRole("treeitem", { name: /^Cy Lund/ }).click();
    expect(onSelectedChange).toHaveBeenLastCalledWith("cy");
    expect(card("cy")?.hasAttribute("data-selected")).toBe(true);
    await page.getByRole("treeitem", { name: /^Hal José/ }).dblClick();
    expect(onPersonOpen).toHaveBeenLastCalledWith("hal");
  });

  test("a chart that keeps its choice draws the one it's given", async () => {
    function Kept() {
      const [selected, setSelected] = useState<string | null>("bo");
      return (
        <>
          <p data-testid="chosen">{selected}</p>
          <Chart selected={selected} onSelectedChange={setSelected} />
        </>
      );
    }
    await render(<Kept />);
    expect(card("bo")?.getAttribute("aria-selected")).toBe("true");
    await page.getByRole("treeitem", { name: /^Di Osei/ }).click();
    await expect.element(page.getByTestId("chosen")).toHaveTextContent("di");
    expect(card("bo")?.getAttribute("aria-selected")).toBe("false");
  });

  test("a drag pans the chart, and doesn't choose the card it started on", async () => {
    const onSelectedChange = vi.fn();
    await render(<Chart onSelectedChange={onSelectedChange} />);
    await expect.poll(viewport).not.toBeNull();
    const start = viewport();
    const target = card("bo") as HTMLElement;
    const box = target.getBoundingClientRect();
    const from = { x: box.left + 20, y: box.top + 20 };
    pointer("pointerdown", target, from);
    for (let i = 1; i <= 5; i++) {
      pointer("pointermove", target, { x: from.x + i * 10, y: from.y + i * 6 });
      await nextFrame();
    }
    pointer("pointerup", target, { x: from.x + 50, y: from.y + 30 });
    target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextFrame();
    expect(viewport()?.x).toBeCloseTo((start?.x ?? 0) + 50, 3);
    expect(viewport()?.y).toBeCloseTo((start?.y ?? 0) + 30, 3);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });
});

describe("finding a person", () => {
  test("typing shows the first match: the teams on the way open, the view goes to it, and it's said", async () => {
    await render(<Chart defaultExpanded={["ada"]} />);
    const box = page.getByRole("searchbox", { name: "Find a person" });
    await box.fill("account");
    expect(shown()).toContain("ed");
    expect(card("ed")?.hasAttribute("data-current-match")).toBe(true);
    expect(card("fi")?.hasAttribute("data-match")).toBe(true);
    expect(card("ed")?.tabIndex).toBe(0);
    expect(one(".nuv-org-chart__matches").textContent).toBe("1 of 2");
    await expect.poll(said).toBe("Ed Marsh. 1 of 2.");
    const frame = one(".nuv-org-chart__frame").getBoundingClientRect();
    await expect
      .poll(() => {
        const found = screenBox("ed");
        return Math.abs(
          found.left + found.width / 2 - (frame.left + frame.width / 2),
        );
      })
      .toBeLessThan(1);
  });

  test("Enter goes to the next match and Shift and Enter to the one before, round the list, and so do the buttons", async () => {
    await render(<Chart />);
    const box = page.getByRole("searchbox", { name: "Find a person" });
    await box.fill("head");
    expect(card("bo")?.hasAttribute("data-current-match")).toBe(true);
    await key("{Enter}");
    expect(card("cy")?.hasAttribute("data-current-match")).toBe(true);
    await key("{Enter}");
    expect(card("bo")?.hasAttribute("data-current-match")).toBe(true);
    await key("{Shift>}{Enter}{/Shift}");
    expect(card("cy")?.hasAttribute("data-current-match")).toBe(true);
    await page.getByRole("button", { name: "Previous match" }).click();
    expect(card("bo")?.hasAttribute("data-current-match")).toBe(true);
    await page.getByRole("button", { name: "Next match" }).click();
    expect(card("cy")?.hasAttribute("data-current-match")).toBe(true);
  });

  test("the teams it opened on the way to one match are closed again for the next, and a team opened by hand stays open", async () => {
    await render(<Chart defaultExpanded={["ada"]} />);
    const box = page.getByRole("searchbox", { name: "Find a person" });
    // Ed is in Bo's team, and Hal in Cy's.
    await box.fill("ed");
    expect(card("bo")?.getAttribute("aria-expanded")).toBe("true");
    await box.fill("hal");
    expect(card("cy")?.getAttribute("aria-expanded")).toBe("true");
    expect(card("bo")?.getAttribute("aria-expanded")).toBe("false");

    await page.elementLocator(toggle("bo")).click();
    await box.fill("ed");
    await box.fill("senior");
    expect(card("bo")?.getAttribute("aria-expanded")).toBe("true");
  });

  test("it finds by name, title or department, without minding case or accents", async () => {
    await render(<Chart />);
    const box = page.getByRole("searchbox", { name: "Find a person" });
    await box.fill("JOSE");
    expect(card("hal")?.hasAttribute("data-current-match")).toBe(true);
    await box.fill("sales");
    expect(card("bo")?.hasAttribute("data-current-match")).toBe(true);
  });

  test("when no one is found it says so, and nothing is marked", async () => {
    await render(<Chart />);
    await page.getByRole("searchbox", { name: "Find a person" }).fill("zzz");
    expect(one(".nuv-org-chart__matches").textContent).toBe("No one found");
    await expect.poll(said).toBe("No one found");
    expect(document.querySelector("[data-match]")).toBeNull();
  });

  test("search and controls false leave the box and the buttons out", async () => {
    await render(<Chart search={false} controls={false} />);
    expect(document.querySelector(".nuv-org-chart__bar")).toBeNull();
    expect(document.querySelector('input[type="search"]')).toBeNull();
  });

  test("reveal from the handle opens the way to a person and puts them in the middle", async () => {
    const handle = createRef<OrgChartHandle>();
    await render(<Chart defaultExpanded={[]} handleRef={handle} />);
    expect(shown()).toEqual(["ada"]);
    handle.current?.reveal("gus");
    await expect.poll(shown).toContain("gus");
    expect(card("gus")?.tabIndex).toBe(0);
    const frame = one(".nuv-org-chart__frame").getBoundingClientRect();
    await expect
      .poll(() => {
        const found = screenBox("gus");
        return Math.abs(
          found.top + found.height / 2 - (frame.top + frame.height / 2),
        );
      })
      .toBeLessThan(1);
  });
});

describe("the view", () => {
  test("the buttons zoom out, zoom in and fit", async () => {
    await render(<Chart />);
    await expect.poll(viewport).not.toBeNull();
    const fitted = viewport()?.zoom ?? 0;
    await page.getByRole("button", { name: "Zoom out" }).click();
    await expect.poll(() => viewport()?.zoom).toBeCloseTo(fitted * 0.8, 3);
    await page.getByRole("button", { name: "Fit the chart" }).click();
    await expect.poll(() => viewport()?.zoom).toBeCloseTo(fitted, 3);
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect.poll(() => viewport()?.zoom).toBeCloseTo(fitted * 1.25, 3);
    await expect
      .element(page.getByRole("toolbar", { name: "Chart controls" }))
      .toBeInTheDocument();
  });

  test("the wheel zooms only while the chart has focus, so the page scrolls past it", async () => {
    await render(<Chart />);
    await expect.poll(viewport).not.toBeNull();
    const fitted = viewport()?.zoom;
    await wheel(".nuv-org-chart__frame", -300);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(viewport()?.zoom).toBe(fitted);
    card("ada")?.focus();
    await wheel(".nuv-org-chart__frame", -300);
    await expect.poll(() => viewport()?.zoom).toBeGreaterThan(fitted ?? 0);
  });

  test("a view to start from is where it starts, and the app hears where it stops", async () => {
    const onViewportChange = vi.fn();
    await render(
      <Chart
        defaultViewport={{ x: 10, y: 20, zoom: 1.5 }}
        onViewportChange={onViewportChange}
      />,
    );
    await expect.poll(viewport).toEqual({ x: 10, y: 20, zoom: 1.5 });
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect
      .poll(() => onViewportChange.mock.lastCall?.[0]?.zoom)
      .toBeCloseTo(1.875, 3);
  });

  test("no zoom past the limits", async () => {
    const handle = createRef<OrgChartHandle>();
    await render(<Chart handleRef={handle} minZoom={0.5} maxZoom={1.5} />);
    await expect.poll(viewport).not.toBeNull();
    for (let i = 0; i < 10; i++) handle.current?.zoomIn();
    await expect.poll(() => viewport()?.zoom).toBe(1.5);
    for (let i = 0; i < 20; i++) handle.current?.zoomOut();
    await expect.poll(() => viewport()?.zoom).toBe(0.5);
  });

  test("a card focused from outside the view, as Tab does, is brought into it", async () => {
    await render(<Chart defaultViewport={{ x: -2000, y: -2000, zoom: 1 }} />);
    card("ada")?.focus();
    const frame = one(".nuv-org-chart__frame");
    // A focused card never scrolls the frame: the view moves instead.
    await expect
      .poll(() => screenBox("ada").top)
      .toBeGreaterThanOrEqual(frame.getBoundingClientRect().top);
    expect(frame.scrollTop).toBe(0);
    expect(frame.scrollLeft).toBe(0);
  });
});

describe("cards of your own", () => {
  test("renderCard draws inside each card, which is named by what it draws and how many report to them", async () => {
    await render(
      <Chart
        cardSize={{ width: 150, height: 40 }}
        renderCard={(person, { reports, level }) => (
          <span data-level={level} data-reports={reports}>
            {person.name ?? "Open"}
          </span>
        )}
      />,
    );
    const bo = page.getByRole("treeitem", {
      name: /^Bo Ferro ?, 2 direct reports$/,
    });
    await expect.element(bo).toBeInTheDocument();
    expect(card("bo")?.querySelector("span")?.dataset.level).toBe("2");
    expect(card("bo")?.getBoundingClientRect().width).toBeCloseTo(
      150 * (viewport()?.zoom ?? 1),
      1,
    );
    expect(card("di")?.hasAttribute("aria-label")).toBe(false);
  });
});

describe("words", () => {
  test("what it says can be given in another language, and what isn't keeps its English", async () => {
    await render(
      <Chart
        labels={{
          roleDescription: "Organigramm",
          vacant: "Offene Stelle",
          reports: (count) => `${count} direkt unterstellt`,
          hideReports: (name) => `Team von ${name} ausblenden`,
          find: "Person suchen",
        }}
      />,
    );
    await expect
      .element(page.getByRole("tree"))
      .toHaveAttribute("aria-roledescription", "Organigramm");
    expect(card("ada")?.getAttribute("aria-label")).toContain(
      "3 direkt unterstellt",
    );
    expect(card("gus")?.textContent).toContain("Offene Stelle");
    expect(toggle("ada").getAttribute("aria-label")).toBe(
      "Team von Ada Quill ausblenden",
    );
    await expect
      .element(page.getByRole("searchbox", { name: "Person suchen" }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "Zoom in" }))
      .toBeInTheDocument();
  });
});

describe("how it's drawn", () => {
  test("the frame is 32rem tall unless its variable says otherwise", async () => {
    const { rerender } = await render(<Chart />);
    expect(one(".nuv-org-chart__frame").getBoundingClientRect().height).toBe(
      512,
    );
    await rerender(
      <Chart style={{ ["--nuv-org-chart-height" as string]: "300px" }} />,
    );
    expect(one(".nuv-org-chart__frame").getBoundingClientRect().height).toBe(
      300,
    );
  });

  test("the lines are drawn in a color that stands out from the frame", async () => {
    await render(<Chart />);
    const line = one(".nuv-org-chart__lines path");
    const frame = one(".nuv-org-chart__frame");
    expect(
      contrast(
        getComputedStyle(line).stroke,
        getComputedStyle(frame).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(1.5);
    expect(line.getAttribute("d")).toMatch(/^M/);
  });

  test("with a mouse the buttons are 32px, and a card with focus from the keyboard has a ring that stands out", async () => {
    await render(
      <>
        <button type="button">Before</button>
        <Chart search={false} />
      </>,
    );
    const zoomIn = page.getByRole("button", { name: "Zoom in" }).element();
    expect(zoomIn.getBoundingClientRect().width).toBe(32);
    expect(zoomIn.getBoundingClientRect().height).toBe(32);
    page.getByRole("button", { name: "Before" }).element().focus();
    await key("{Tab}{Tab}{Tab}{Tab}");
    expect(focusedId()).toBe("ada");
    const style = getComputedStyle(card("ada") as Element);
    expect(style.outlineStyle).toBe("solid");
    expect(
      contrast(
        style.outlineColor,
        getComputedStyle(document.body).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });

  test("a card's edge changes at once when less motion is asked for", async () => {
    await render(<Chart />);
    const ada = card("ada") as HTMLElement;
    // Said outright: WebKit on Linux asks for less motion by default.
    await emulateMedia({ reducedMotion: "no-preference" });
    try {
      expect(getComputedStyle(ada).transitionDuration).not.toBe("0s");
      await emulateMedia({ reducedMotion: "reduce" });
      expect(getComputedStyle(ada).transitionDuration).toBe("0s");
      for (const element of document.querySelectorAll(".nuv-org-chart *")) {
        expect(getComputedStyle(element).animationName).toBe("none");
      }
    } finally {
      await emulateMedia({ reducedMotion: null });
    }
  });

  test("where the browser forces its colors, the lines are in the text color and the chosen card in the highlight color", async ({
    skip,
  }) => {
    await render(<Chart defaultSelected="cy" />);
    await emulateMedia({ forcedColors: "active" });
    try {
      // WebKit answers the media query and goes on painting the page's own
      // colors, as the core's forced-colors tests say.
      if (system("rgb(1, 2, 3)") === "rgb(1, 2, 3)") {
        skip("this browser doesn't force colors");
      }
      expect(getComputedStyle(one(".nuv-org-chart__lines path")).stroke).toBe(
        system("CanvasText"),
      );
      expect(getComputedStyle(card("cy") as Element).outlineColor).toBe(
        system("Highlight"),
      );
    } finally {
      await emulateMedia({ forcedColors: null });
    }
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe at rest", async () => {
    const { container } = await renderThemed(theme, <Chart />);
    expect(await axe(container)).toHaveNoViolations();
  });

  test("passes axe with a person chosen, a match found and a team closed", async () => {
    const { container } = await renderThemed(
      theme,
      <Chart defaultSelected="bo" defaultExpanded={["ada", "bo"]} />,
    );
    await page.getByRole("searchbox", { name: "Find a person" }).fill("design");
    expect(await axe(container)).toHaveNoViolations();
  });
});

import "../../styles/index.scss";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import { Switch } from "../switch";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  type ItemProps,
  ItemTitle,
} from "./item";

function Example(props: ItemProps) {
  return (
    <Item data-testid="item" {...props}>
      <ItemMedia data-testid="media" variant="icon">
        <svg aria-hidden="true" width="16" height="16" />
      </ItemMedia>
      <ItemContent data-testid="content">
        <ItemTitle data-testid="title">Two-step sign-in</ItemTitle>
        <ItemDescription data-testid="description">
          Ask for a code from your phone as well as your password.
        </ItemDescription>
      </ItemContent>
      <ItemActions data-testid="actions">
        <Button intent="secondary">Set up</Button>
      </ItemActions>
    </Item>
  );
}

const part = (id: string) => page.getByTestId(id).element();
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("is a div with a class for each part, and nothing extra by default", async () => {
    await render(<Example />);

    expect(part("item").tagName).toBe("DIV");
    expect(part("item").className).toBe("nuv-item");
    expect(part("item").hasAttribute("role")).toBe(false);
    expect(part("media").className).toBe(
      "nuv-item__media nuv-item__media--icon",
    );
    expect(part("content").className).toBe("nuv-item__content");
    expect(part("title").className).toBe("nuv-item__title");
    expect(part("description").className).toBe("nuv-item__description");
    expect(part("description").tagName).toBe("P");
    expect(part("actions").className).toBe("nuv-item__actions");
  });

  test("variant and size each add a class", async () => {
    await render(
      <>
        <Item data-testid="outline" variant="outline" />
        <Item data-testid="muted" variant="muted" size="sm" />
        <ItemMedia data-testid="plain-media" />
      </>,
    );

    expect(part("outline").className).toBe("nuv-item nuv-item--outline");
    expect(part("muted").className).toBe(
      "nuv-item nuv-item--muted nuv-item--sm",
    );
    expect(part("plain-media").className).toBe("nuv-item__media");
  });

  test("asChild makes the row the element it's given", async () => {
    await render(
      <Item asChild data-testid="item">
        <a href="#billing">
          <ItemContent>
            <ItemTitle>Billing</ItemTitle>
          </ItemContent>
        </a>
      </Item>,
    );

    await expect
      .element(page.getByRole("link", { name: "Billing" }))
      .toHaveClass("nuv-item");
    expect(part("item").tagName).toBe("A");
    expect(part("item").getAttribute("href")).toBe("#billing");
  });

  test("every part forwards its ref, a className and other props", async () => {
    const refs = {
      group: createRef<HTMLUListElement>(),
      item: createRef<HTMLElement>(),
      media: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      title: createRef<HTMLDivElement>(),
      description: createRef<HTMLParagraphElement>(),
      actions: createRef<HTMLDivElement>(),
    };
    await render(
      <ItemGroup ref={refs.group} className="mine" id="group">
        <Item ref={refs.item} className="mine" id="item">
          <ItemMedia ref={refs.media} className="mine" id="media" />
          <ItemContent ref={refs.content} className="mine" id="content">
            <ItemTitle ref={refs.title} className="mine" id="title" />
            <ItemDescription
              ref={refs.description}
              className="mine"
              id="description"
            />
          </ItemContent>
          <ItemActions ref={refs.actions} className="mine" id="actions" />
        </Item>
      </ItemGroup>,
    );

    for (const [name, ref] of Object.entries(refs)) {
      expect(ref.current?.id, name).toBe(name);
      expect(ref.current?.classList.contains("mine"), name).toBe(true);
    }
    // The row's ref is the row, not the list item around it.
    expect(refs.item.current?.classList.contains("nuv-item")).toBe(true);
  });
});

describe("in a group", () => {
  test("the group is a named list and each item is a list item", async () => {
    await render(
      <ItemGroup aria-label="Security">
        <Example />
        <Item>
          <ItemContent>
            <ItemTitle>Passkeys</ItemTitle>
          </ItemContent>
        </Item>
      </ItemGroup>,
    );

    await expect
      .element(page.getByRole("list", { name: "Security" }))
      .toHaveClass("nuv-item-group");
    expect(page.getByRole("listitem").elements()).toHaveLength(2);
    // The list item is a box around the row.
    expect(part("item").parentElement?.tagName).toBe("LI");
    expect(part("item").parentElement?.className).toBe("nuv-item-group__row");
    expect(part("item").parentElement?.parentElement?.tagName).toBe("UL");
    expect(part("item").hasAttribute("role")).toBe(false);
  });

  test("a row that's a link is still a link, inside its list item", async () => {
    await render(
      <ItemGroup aria-label="Settings">
        <Item asChild>
          <a href="#billing">
            <ItemContent>
              <ItemTitle>Billing</ItemTitle>
            </ItemContent>
          </a>
        </Item>
      </ItemGroup>,
    );
    const link = page.getByRole("link", { name: "Billing" }).element();

    expect(link.parentElement?.tagName).toBe("LI");
    expect(link.hasAttribute("role")).toBe(false);
  });

  test("a wrapper around an item doesn't stop it being a list item", async () => {
    function Row({ name }: { name: string }) {
      return (
        <Item>
          <ItemContent>
            <ItemTitle>{name}</ItemTitle>
          </ItemContent>
        </Item>
      );
    }
    function Rows() {
      return (
        <>
          <Row name="Ada" />
          <Row name="Grace" />
        </>
      );
    }
    await render(
      <ItemGroup aria-label="People">
        <Rows />
      </ItemGroup>,
    );

    expect(page.getByRole("listitem").elements()).toHaveLength(2);
  });

  test("outline draws one box, with a line between rows and none above the first", async () => {
    await render(
      <ItemGroup data-testid="group" variant="outline" aria-label="Security">
        <Item data-testid="first" />
        <Item data-testid="second" />
        <Item data-testid="third" />
      </ItemGroup>,
    );
    const row = (id: string) => style(part(id).parentElement as Element);

    expect(part("group").className).toBe(
      "nuv-item-group nuv-item-group--outline",
    );
    expect(style(part("group")).borderTopWidth).toBe("1px");
    expect(style(part("group")).overflow).toBe("hidden");
    expect(row("first").borderTopWidth).toBe("0px");
    expect(row("second").borderTopWidth).toBe("1px");
    expect(row("third").borderTopWidth).toBe("1px");
    expect(rect(part("second").parentElement as Element).top).toBe(
      rect(part("first").parentElement as Element).bottom,
    );
    // The rows' own corners are square, so the box's are the only ones.
    expect(style(part("first")).borderTopLeftRadius).toBe("0px");
  });

  test("a plain group has a gap between rows and no box", async () => {
    await render(
      <ItemGroup data-testid="group" aria-label="Security">
        <Item data-testid="first" />
        <Item data-testid="second" />
      </ItemGroup>,
    );

    expect(style(part("group")).borderTopWidth).toBe("0px");
    expect(rect(part("second")).top - rect(part("first")).bottom).toBe(4);
  });
});

describe("layout", () => {
  test("the picture, the text and the action are a row, with the text taking what's left", async () => {
    await render(
      <div style={{ width: 600 }}>
        <Example />
      </div>,
    );
    const media = rect(part("media"));
    const content = rect(part("content"));
    const actions = rect(part("actions"));
    const item = rect(part("item"));

    expect(media.right).toBeLessThanOrEqual(content.left);
    expect(content.right).toBeLessThanOrEqual(actions.left);
    // 16 pixels of padding and a 1 pixel edge at each end.
    expect(media.left - item.left).toBeCloseTo(17, 1);
    expect(item.right - actions.right).toBeCloseTo(17, 1);
    expect(content.width).toBeGreaterThan(300);
  });

  test("the picture and the action are level with the middle of the text", async () => {
    await render(
      <div style={{ width: 320 }}>
        <Example />
      </div>,
    );
    const middle = (id: string) =>
      rect(part(id)).top + rect(part(id)).height / 2;

    expect(Math.abs(middle("media") - middle("content"))).toBeLessThanOrEqual(
      0.5,
    );
    expect(Math.abs(middle("actions") - middle("content"))).toBeLessThanOrEqual(
      0.5,
    );
  });

  test("in a narrow place the text wraps and nothing sticks out", async () => {
    await render(
      <div style={{ width: 280 }}>
        <Example />
      </div>,
    );

    expect(part("item").scrollWidth).toBeLessThanOrEqual(
      part("item").clientWidth,
    );
    expect(rect(part("description")).height).toBeGreaterThan(24);
    // The picture and the action keep their size.
    expect(rect(part("media")).width).toBe(36);
  });

  test("an icon's square is 36 pixels, and a plain picture has no box", async () => {
    await render(
      <>
        <Example />
        <Item>
          <ItemMedia data-testid="plain">
            <svg aria-hidden="true" width="20" height="20" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>A picture with no box</ItemTitle>
          </ItemContent>
        </Item>
      </>,
    );

    expect(rect(part("media")).width).toBe(36);
    expect(rect(part("media")).height).toBe(36);
    expect(style(part("plain")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(rect(part("plain")).width).toBe(20);
  });

  test("sm has less padding than md", async () => {
    await render(
      <>
        <Item data-testid="md">Row</Item>
        <Item data-testid="sm" size="sm">
          Row
        </Item>
      </>,
    );

    expect(style(part("md")).paddingTop).toBe("12px");
    expect(style(part("md")).paddingLeft).toBe("16px");
    expect(style(part("sm")).paddingTop).toBe("8px");
    expect(style(part("sm")).paddingLeft).toBe("12px");
  });

  test("a row with one line of text is at least 44 pixels high", async () => {
    await render(
      <Item data-testid="item">
        <ItemContent>
          <ItemTitle>Billing</ItemTitle>
        </ItemContent>
      </Item>,
    );

    expect(rect(part("item")).height).toBeGreaterThanOrEqual(44);
  });
});

describe("a row that's a link or a button", () => {
  const link = (
    <Item asChild data-testid="item">
      <a href="#billing">
        <ItemContent>
          <ItemTitle>Billing</ItemTitle>
          <ItemDescription>Cards, invoices and the plan.</ItemDescription>
        </ItemContent>
      </a>
    </Item>
  );

  test("a link has no underline, the page's text color and a pointer", async () => {
    await render(<div style={{ color: "rgb(1, 2, 3)" }}>{link}</div>);

    expect(style(part("item")).textDecorationLine).toBe("none");
    expect(style(part("item")).color).toBe("rgb(1, 2, 3)");
    expect(style(part("item")).cursor).toBe("pointer");
  });

  test("a button fills the row and is written like the rest of the page", async () => {
    await render(
      <div style={{ width: 400, fontFamily: "monospace" }}>
        <Item asChild data-testid="item">
          <button type="button">
            <ItemContent>
              <ItemTitle>Export</ItemTitle>
            </ItemContent>
          </button>
        </Item>
      </div>,
    );

    expect(rect(part("item")).width).toBe(400);
    expect(style(part("item")).fontFamily).toBe("monospace");
    expect(style(part("item")).textAlign).toBe("start");
    expect(style(part("item")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("with keyboard focus it has a ring, drawn inside the row", async () => {
    await render(link);

    // Focus that didn't come from the pointer, which is what gets a ring.
    // Not a press of Tab: Safari and Firefox on a Mac skip links with it
    // unless a system setting says otherwise.
    (part("item") as HTMLElement).focus();

    expect(document.activeElement).toBe(part("item"));
    expect(style(part("item")).outlineStyle).toBe("solid");
    expect(style(part("item")).outlineWidth).toBe("2px");
    expect(style(part("item")).outlineOffset).toBe("-2px");
  });

  test("the pointer fills it on hover, and a plain row stays as it is", async () => {
    await render(
      <>
        {link}
        <Item data-testid="plain">Not a link</Item>
      </>,
    );
    const before = style(part("item")).backgroundColor;

    await userEvent.hover(page.getByTestId("item"));
    expect(style(part("item")).backgroundColor).not.toBe(before);

    await userEvent.hover(page.getByTestId("plain"));
    expect(style(part("plain")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style(part("plain")).cursor).not.toBe("pointer");
  });
});

describe("styles", () => {
  test("outline has an edge and muted has a fill", async () => {
    await render(
      <>
        <Item data-testid="plain">Row</Item>
        <Item data-testid="outline" variant="outline">
          Row
        </Item>
        <Item data-testid="muted" variant="muted">
          Row
        </Item>
      </>,
    );

    // The same width in all three, so the text doesn't move between them.
    for (const id of ["plain", "outline", "muted"]) {
      expect(style(part(id)).borderTopWidth, id).toBe("1px");
    }
    expect(style(part("plain")).borderTopColor).toBe("rgba(0, 0, 0, 0)");
    expect(style(part("outline")).borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style(part("muted")).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("component variables change the look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-item-bg": "rgb(10, 20, 30)",
            "--nuv-item-fg": "rgb(200, 210, 220)",
            "--nuv-item-muted-fg": "rgb(150, 160, 170)",
            "--nuv-item-border": "rgb(40, 50, 60)",
            "--nuv-item-radius": "2px",
            "--nuv-item-gap": "9px",
            "--nuv-item-padding-block": "5px",
            "--nuv-item-padding-inline": "7px",
            "--nuv-item-media-size": "50px",
            "--nuv-item-media-bg": "rgb(70, 80, 90)",
            "--nuv-item-media-fg": "rgb(100, 110, 120)",
            "--nuv-item-group-gap": "13px",
          } as never
        }
      >
        <ItemGroup data-testid="group" aria-label="Security">
          <Example />
        </ItemGroup>
      </div>,
    );
    const item = style(part("item"));

    expect(item.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(item.color).toBe("rgb(200, 210, 220)");
    expect(item.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(item.borderTopLeftRadius).toBe("2px");
    expect(item.columnGap).toBe("9px");
    expect(item.paddingTop).toBe("5px");
    expect(item.paddingLeft).toBe("7px");
    expect(style(part("description")).color).toBe("rgb(150, 160, 170)");
    expect(rect(part("media")).width).toBe(50);
    expect(style(part("media")).backgroundColor).toBe("rgb(70, 80, 90)");
    expect(style(part("media")).color).toBe("rgb(100, 110, 120)");
    expect(style(part("group")).rowGap).toBe("13px");
  });

  test("an outlined group's variables change its box", async () => {
    await render(
      <ItemGroup
        data-testid="group"
        variant="outline"
        aria-label="Security"
        style={
          {
            "--nuv-item-group-border": "rgb(40, 50, 60)",
            "--nuv-item-group-radius": "3px",
            "--nuv-item-group-bg": "rgb(10, 20, 30)",
            "--nuv-item-group-fg": "rgb(200, 210, 220)",
          } as never
        }
      >
        <Item data-testid="first">One</Item>
        <Item data-testid="second">Two</Item>
      </ItemGroup>,
    );
    const group = style(part("group"));

    expect(group.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(group.borderTopLeftRadius).toBe("3px");
    expect(group.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(group.color).toBe("rgb(200, 210, 220)");
    expect(style(part("second").parentElement as Element).borderTopColor).toBe(
      "rgb(40, 50, 60)",
    );
  });

  test("a hover color of your own is used", async () => {
    await render(
      <Item
        asChild
        data-testid="item"
        style={{ "--nuv-item-hover-bg": "rgb(9, 8, 7)" } as never}
      >
        <a href="#billing">Billing</a>
      </Item>,
    );

    await userEvent.hover(page.getByTestId("item"));
    expect(style(part("item")).backgroundColor).toBe("rgb(9, 8, 7)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, in every variant, alone and in a group", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Example />
        <Example variant="outline" />
        <Example variant="muted" />
        <ItemGroup variant="outline" aria-label="Notifications">
          <Item>
            <ItemContent>
              <ItemTitle id="item-test-digest">Weekly digest</ItemTitle>
              <ItemDescription>A summary every Monday.</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Switch aria-labelledby="item-test-digest" />
            </ItemActions>
          </Item>
          <Item asChild>
            <a href="#more">
              <ItemContent>
                <ItemTitle>More settings</ItemTitle>
              </ItemContent>
            </a>
          </Item>
        </ItemGroup>
      </>,
    );

    await expectNoViolations(screen.container);
  });
});

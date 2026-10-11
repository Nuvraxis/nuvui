import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Source, Sources, SourcesContent, SourcesTrigger } from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element, pseudo?: string) =>
  getComputedStyle(element, pseudo);
const trigger = () => page.getByRole("button", { name: "2 sources" });
const links = () => page.getByRole("link").elements();

function List(props: ComponentProps<typeof Sources>) {
  return (
    <div style={{ width: 360 }}>
      <Sources {...props}>
        <SourcesTrigger>2 sources</SourcesTrigger>
        <SourcesContent>
          <Source href="https://www.example.com/terms" title="Payment terms" />
          <Source
            href="https://docs.example.org/reminders"
            title="When reminders are sent"
          />
        </SourcesContent>
      </Sources>
    </div>
  );
}

describe("opening", () => {
  test("it starts closed: a button, and no link in the page", async () => {
    await render(<List />);

    expect(trigger().element().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().element().getAttribute("type")).toBe("button");
    expect(links()).toHaveLength(0);
  });

  test("a press opens the list, and another closes it", async () => {
    const onOpenChange = vi.fn();
    await render(<List onOpenChange={onOpenChange} />);

    await trigger().click();
    expect(trigger().element().getAttribute("aria-expanded")).toBe("true");
    expect(links()).toHaveLength(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    // The button says which part it opens.
    const opened = document.getElementById(
      trigger().element().getAttribute("aria-controls") ?? "",
    );
    expect(opened?.contains(links()[0] as Element)).toBe(true);

    await trigger().click();
    await expect.poll(() => links().length).toBe(0);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test("Enter and Space open it, and Tab goes on to each source", async () => {
    await render(<List />);

    await userEvent.tab();
    expect(document.activeElement).toBe(trigger().element());
    await userEvent.keyboard("{Enter}");
    expect(links()).toHaveLength(2);

    await userEvent.tab();
    // Safari leaves links out of the Tab order until its owner turns that
    // on. Everywhere else, Tab goes from the line to each source in turn.
    if (document.activeElement?.tagName === "A") {
      expect(document.activeElement).toBe(links()[0]);
      expect(style(links()[0] as Element).outlineStyle).toBe("solid");
      await userEvent.tab();
      expect(document.activeElement).toBe(links()[1]);
    }
    // In every browser a source can take focus.
    (links()[1] as HTMLElement).focus();
    expect(document.activeElement).toBe(links()[1]);

    trigger().element().focus();
    await userEvent.keyboard(" ");
    await expect.poll(() => links().length).toBe(0);
  });

  test("defaultOpen starts it open, and open keeps it yours", async () => {
    const screen = await render(<List defaultOpen />);
    expect(links()).toHaveLength(2);

    await screen.rerender(<List key="kept" open={false} />);
    await trigger().click();
    expect(links()).toHaveLength(0);
  });

  test("left empty, the trigger says Sources", async () => {
    await render(
      <Sources>
        <SourcesTrigger />
        <SourcesContent />
      </Sources>,
    );

    await expect
      .element(page.getByRole("button", { name: "Sources" }))
      .toBeVisible();
  });
});

describe("a source", () => {
  test("is a link in a numbered list, with its title and the site it's on", async () => {
    await render(<List defaultOpen />);
    const list = page.getByRole("list").element();

    expect(list.tagName).toBe("OL");
    expect(list.className).toBe("nuv-sources__list");
    expect(page.getByRole("listitem").elements()).toHaveLength(2);
    expect(links()[0]?.getAttribute("href")).toBe(
      "https://www.example.com/terms",
    );
    expect(links()[0]?.querySelector(".nuv-source__title")?.textContent).toBe(
      "Payment terms",
    );
    // Without the "www." that says nothing.
    expect(links()[0]?.querySelector(".nuv-source__site")?.textContent).toBe(
      "example.com",
    );
    expect(links()[1]?.querySelector(".nuv-source__site")?.textContent).toBe(
      "docs.example.org",
    );
  });

  test("site says something else, or nothing, and an address with no site has none", async () => {
    await render(
      <Sources defaultOpen>
        <SourcesTrigger>3 sources</SourcesTrigger>
        <SourcesContent>
          <Source href="https://example.com/a" title="A" site="Your files" />
          <Source href="https://example.com/b" title="B" site={null} />
          <Source href="/files/c.pdf" title="C" />
        </SourcesContent>
      </Sources>,
    );
    const sites = links().map(
      (link) => link.querySelector(".nuv-source__site")?.textContent ?? null,
    );

    expect(sites).toEqual(["Your files", null, null]);
  });

  test("takes a link's attributes, a class and a ref", async () => {
    const ref = createRef<HTMLAnchorElement>();
    await render(
      <Sources defaultOpen>
        <SourcesTrigger>1 source</SourcesTrigger>
        <SourcesContent className="mine" data-kind="list">
          <Source
            ref={ref}
            href="https://example.com/a"
            title="A"
            target="_blank"
            rel="noreferrer"
            className="extra"
          />
        </SourcesContent>
      </Sources>,
    );

    expect(ref.current?.className).toBe("nuv-source extra");
    expect(ref.current?.target).toBe("_blank");
    expect(ref.current?.rel).toBe("noreferrer");
    expect(page.getByRole("list").element().className).toBe(
      "nuv-sources__list mine",
    );
    expect(page.getByRole("list").element().dataset.kind).toBe("list");
  });
});

describe("styles", () => {
  test("each source shows its number, counted up from 1, and an underlined title", async () => {
    await render(<List defaultOpen />);
    const widths = links().map((link) =>
      Number.parseFloat(style(link, "::before").width),
    );

    // What the browser reports for a counter differs: the counter in one,
    // the number it came to in another. Either way there is one.
    expect(style(links()[0] as Element, "::before").content).not.toBe("none");
    expect(widths[0]).toBeGreaterThan(0);
    expect(style(page.getByRole("list").element()).listStyleType).toBe("none");
    expect(
      style(links()[0]?.querySelector(".nuv-source__title") as Element)
        .textDecorationLine,
    ).toBe("underline");
  });

  test("a long title wraps inside the list, and the list is as wide as its box", async () => {
    await render(
      <div data-testid="box" style={{ width: 240 }}>
        <Sources defaultOpen>
          <SourcesTrigger>1 source</SourcesTrigger>
          <SourcesContent>
            <Source
              href={`https://example.com/${"a".repeat(120)}`}
              title={`https://example.com/${"a".repeat(120)}`}
            />
          </SourcesContent>
        </Sources>
      </div>,
    );
    const box = rect(page.getByTestId("box").element());

    expect(rect(links()[0] as Element).right).toBeLessThanOrEqual(box.right);
    expect(rect(page.getByRole("list").element()).width).toBe(240);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      window.innerWidth,
    );
  });

  test("with a mouse the line is 32px tall, and a source is still 44px", async () => {
    await setViewport("desktop");
    await render(<List defaultOpen />);

    expect(rect(trigger().element()).height).toBe(32);
    expect(rect(links()[0] as Element).height).toBeGreaterThanOrEqual(44);
  });

  test("component variables change the colors", async () => {
    await render(
      <div
        style={
          {
            "--nuv-source-trigger-fg": "rgb(1, 2, 3)",
            "--nuv-source-fg": "rgb(4, 5, 6)",
            "--nuv-source-site-fg": "rgb(7, 8, 9)",
            "--nuv-source-number-bg": "rgb(10, 11, 12)",
            "--nuv-source-number-fg": "rgb(13, 14, 15)",
          } as never
        }
      >
        <List defaultOpen />
      </div>,
    );
    const link = links()[0] as Element;

    expect(style(trigger().element()).color).toBe("rgb(1, 2, 3)");
    expect(style(link).color).toBe("rgb(4, 5, 6)");
    expect(
      style(link.querySelector(".nuv-source__site") as Element).color,
    ).toBe("rgb(7, 8, 9)");
    expect(style(link, "::before").backgroundColor).toBe("rgb(10, 11, 12)");
    expect(style(link, "::before").color).toBe("rgb(13, 14, 15)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe closed and open", async () => {
    const { container } = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 16 }}>
        <List />
        <List defaultOpen />
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  test("the line, the number and where a source is from can be read", async () => {
    const { container } = await renderThemed(theme, <List defaultOpen />);
    const ground = style(
      container.querySelector("main") as Element,
    ).backgroundColor;
    const link = links()[0] as Element;

    expect(
      contrast(style(trigger().element()).color, ground),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(
        style(link.querySelector(".nuv-source__site") as Element).color,
        ground,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(
        style(link, "::before").color,
        style(link, "::before").backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

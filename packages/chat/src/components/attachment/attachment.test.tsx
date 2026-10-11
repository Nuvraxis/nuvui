import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Attachment, Attachments } from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const one = (selector: string) =>
  document.querySelector(selector) as HTMLElement;

// A picture a pixel wide, so no request leaves the test.
const pixel =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

describe("rendering", () => {
  test("it's a list of files, each with its name, a word about it and its size", async () => {
    await render(
      <Attachments aria-label="Files with this message">
        <Attachment name="invoices.pdf" detail="PDF" size={2048} />
        <Attachment name="notes.txt" />
      </Attachments>,
    );
    const list = page.getByRole("list", { name: "Files with this message" });

    expect(list.element().tagName).toBe("UL");
    expect(list.element().className).toBe("nuv-attachments");
    expect(list.getByRole("listitem").elements()).toHaveLength(2);
    expect(one(".nuv-attachment__name").textContent).toBe("invoices.pdf");
    expect(one(".nuv-attachment__name").title).toBe("invoices.pdf");
    expect(one(".nuv-attachment__detail").children[0]?.textContent).toBe("PDF");
    // Two kilobytes, however the browser's language writes that.
    expect(one(".nuv-attachment__detail").children[1]?.textContent).toMatch(
      /^2\s?kB$/,
    );
    // A file with nothing to say about it has no second line.
    expect(document.querySelectorAll(".nuv-attachment__detail")).toHaveLength(
      1,
    );
    // No button, and no link, unless they're asked for.
    expect(document.querySelector("button, a")).toBeNull();
  });

  test("formatSize writes the size your way", async () => {
    await render(
      <Attachments aria-label="Files">
        <Attachment
          name="a.pdf"
          size={1500}
          formatSize={(bytes) => `${bytes} B`}
        />
      </Attachments>,
    );

    expect(one(".nuv-attachment__detail").textContent).toBe("1500 B");
  });

  test("the icon is hidden from screen readers, and src puts a picture in its place", async () => {
    const screen = await render(
      <Attachments aria-label="Files">
        <Attachment name="a.pdf" />
      </Attachments>,
    );
    const picture = () => one(".nuv-attachment__picture");

    expect(picture().getAttribute("aria-hidden")).toBe("true");
    expect(picture().querySelector("svg")).not.toBeNull();

    await screen.rerender(
      <Attachments aria-label="Files">
        <Attachment name="a.png" src={pixel} />
      </Attachments>,
    );
    const image = picture().querySelector("img") as HTMLImageElement;

    expect(image.getAttribute("src")).toBe(pixel);
    // Decoration: the name says what the file is.
    expect(image.alt).toBe("");
    expect(picture().querySelector("svg")).toBeNull();
    expect(rect(image).width).toBe(rect(picture()).width);
  });

  test("icon takes the place of the usual one", async () => {
    await render(
      <Attachments aria-label="Files">
        <Attachment name="a.csv" icon={<b data-testid="mine">C</b>} />
      </Attachments>,
    );

    expect(
      one(".nuv-attachment__picture").contains(
        page.getByTestId("mine").element(),
      ),
    ).toBe(true);
  });

  test("with href the name is a link, and linkProps gives it the rest", async () => {
    await render(
      <Attachments aria-label="Files">
        <Attachment
          name="a.pdf"
          href="#a"
          linkProps={{ download: "copy.pdf", rel: "noopener" }}
        />
      </Attachments>,
    );
    const link = page.getByRole("link", { name: "a.pdf" }).element();

    expect(link.getAttribute("href")).toBe("#a");
    expect(link.getAttribute("download")).toBe("copy.pdf");
    expect(link.getAttribute("rel")).toBe("noopener");
    expect(link.className).toBe("nuv-attachment__name");
    // Told from a plain name by more than its color.
    expect(style(link).textDecorationLine).toBe("underline");
  });

  test("both parts take a ref, a class and other attributes", async () => {
    const list = createRef<HTMLUListElement>();
    const item = createRef<HTMLLIElement>();
    await render(
      <Attachments ref={list} aria-label="Files" className="a" data-kind="a">
        <Attachment ref={item} name="a.pdf" className="b" data-kind="b" />
      </Attachments>,
    );

    expect(list.current?.className).toBe("nuv-attachments a");
    expect(list.current?.dataset.kind).toBe("a");
    expect(item.current?.tagName).toBe("LI");
    expect(item.current?.className).toBe("nuv-attachment b");
    expect(item.current?.dataset.kind).toBe("b");
  });
});

describe("taking a file out", () => {
  test("onRemove gives it a button named after the file, which calls it", async () => {
    const onRemove = vi.fn();
    await render(
      <Attachments aria-label="Files">
        <Attachment name="a.pdf" onRemove={onRemove} />
      </Attachments>,
    );
    const button = page.getByRole("button", { name: "Remove a.pdf" });

    expect(button.element().getAttribute("type")).toBe("button");
    await button.click();

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  test("the button's name is yours, and the keyboard presses it", async () => {
    const onRemove = vi.fn();
    await render(
      <Attachments aria-label="Files">
        <Attachment
          name="a.pdf"
          onRemove={onRemove}
          removeLabel={(name) => `${name} entfernen`}
        />
      </Attachments>,
    );

    await userEvent.tab();
    expect(document.activeElement).toBe(
      page.getByRole("button", { name: "a.pdf entfernen" }).element(),
    );
    expect(style(document.activeElement as Element).outlineStyle).toBe("solid");
    await userEvent.keyboard("{Enter}");

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe("uploading and failed", () => {
  test("a file that's uploading is busy, shows a spinner and says so", async () => {
    await render(
      <Attachments aria-label="Files">
        <Attachment name="a.zip" size={100} src={pixel} uploading />
      </Attachments>,
    );
    const file = one(".nuv-attachment");

    expect(file.getAttribute("aria-busy")).toBe("true");
    expect(file.hasAttribute("data-uploading")).toBe(true);
    expect(file.querySelector(".nuv-spinner")).not.toBeNull();
    // In place of the picture, and of the size.
    expect(file.querySelector("img")).toBeNull();
    expect(one(".nuv-attachment__detail").textContent).toBe("Uploading");
  });

  test("uploadingLabel changes the word", async () => {
    await render(
      <Attachments aria-label="Files">
        <Attachment name="a.zip" uploading uploadingLabel="Wird geladen" />
      </Attachments>,
    );

    expect(one(".nuv-attachment__detail").textContent).toBe("Wird geladen");
  });

  test("a file that failed says why, in place of its size, and has another edge", async () => {
    await render(
      <Attachments aria-label="Files">
        <Attachment name="ok.pdf" size={100} />
        <Attachment name="big.tiff" size={100} error="Too large." />
      </Attachments>,
    );
    const [fine, failed] = [
      ...document.querySelectorAll<HTMLElement>(".nuv-attachment"),
    ];

    expect(failed?.hasAttribute("data-error")).toBe(true);
    expect(failed?.hasAttribute("aria-busy")).toBe(false);
    expect(failed?.querySelector(".nuv-attachment__error")?.textContent).toBe(
      "Too large.",
    );
    expect(failed?.querySelector(".nuv-attachment__detail")).toBeNull();
    expect(style(failed as Element).borderTopColor).not.toBe(
      style(fine as Element).borderTopColor,
    );
    expect(fine?.hasAttribute("data-error")).toBe(false);
  });
});

describe("styles", () => {
  test("the files sit side by side and wrap, and none is wider than the list", async () => {
    await render(
      <div style={{ width: 300 }}>
        <Attachments aria-label="Files">
          <Attachment name="one.pdf" size={1} />
          <Attachment name="two.pdf" size={1} />
          <Attachment
            name={`${"a-very-long-name-".repeat(8)}.pdf`}
            size={1}
            onRemove={() => {}}
          />
        </Attachments>
      </div>,
    );
    const list = rect(one(".nuv-attachments"));
    const files = [...document.querySelectorAll(".nuv-attachment")].map(rect);

    expect(files[1]?.top).toBe(files[0]?.top);
    expect(files[1]?.left).toBeGreaterThan(files[0]?.right ?? 0);
    expect(files[2]?.top).toBeGreaterThan(files[0]?.top ?? 0);
    for (const file of files) {
      expect(file.right).toBeLessThanOrEqual(list.right);
    }
    // The long name is cut short, on one line.
    const name = document.querySelectorAll(".nuv-attachment__name")[2];
    expect(name?.scrollWidth).toBeGreaterThan(name?.clientWidth ?? 0);
    expect(style(name as Element).textOverflow).toBe("ellipsis");
    expect(style(one(".nuv-attachments")).listStyleType).toBe("none");
  });

  test("with a mouse the button that takes a file out is 28px", async () => {
    await setViewport("desktop");
    await render(
      <Attachments aria-label="Files">
        <Attachment name="a.pdf" onRemove={() => {}} />
      </Attachments>,
    );
    const button = rect(page.getByRole("button").element());

    expect(button.width).toBe(28);
    expect(button.height).toBe(28);
  });

  test("component variables change a file's look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-attachment-gap": "20px",
            "--nuv-attachment-bg": "rgb(1, 2, 3)",
            "--nuv-attachment-fg": "rgb(250, 250, 250)",
            "--nuv-attachment-border": "rgb(4, 5, 6)",
            "--nuv-attachment-radius": "3px",
            "--nuv-attachment-max-width": "120px",
            "--nuv-attachment-detail-fg": "rgb(200, 201, 202)",
            "--nuv-attachment-picture-bg": "rgb(7, 8, 9)",
            "--nuv-attachment-picture-size": "20px",
          } as never
        }
      >
        <Attachments aria-label="Files">
          <Attachment name="a-long-enough-name.pdf" size={1} />
          <Attachment name="b.pdf" />
        </Attachments>
      </div>,
    );
    const file = one(".nuv-attachment");

    expect(style(one(".nuv-attachments")).columnGap).toBe("20px");
    expect(style(file).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style(file).color).toBe("rgb(250, 250, 250)");
    expect(style(file).borderTopColor).toBe("rgb(4, 5, 6)");
    expect(style(file).borderTopLeftRadius).toBe("3px");
    expect(rect(file).width).toBe(120);
    expect(style(one(".nuv-attachment__detail")).color).toBe(
      "rgb(200, 201, 202)",
    );
    expect(style(one(".nuv-attachment__picture")).backgroundColor).toBe(
      "rgb(7, 8, 9)",
    );
    expect(rect(one(".nuv-attachment__picture")).width).toBe(20);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe plain, as a link, uploading and failed", async () => {
    const { container } = await renderThemed(
      theme,
      <Attachments aria-label="Files">
        <Attachment name="a.pdf" detail="PDF" size={2048} />
        <Attachment name="b.pdf" href="#b" onRemove={() => {}} />
        <Attachment name="c.zip" uploading onRemove={() => {}} />
        <Attachment name="d.tiff" error="Too large." onRemove={() => {}} />
      </Attachments>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  test("the size, what went wrong and the cross can be read", async () => {
    const { container } = await renderThemed(
      theme,
      <Attachments aria-label="Files">
        <Attachment name="a.pdf" size={2048} onRemove={() => {}} />
        <Attachment name="d.tiff" error="Too large." />
      </Attachments>,
    );
    const ground = style(one(".nuv-attachment")).backgroundColor;

    expect(container.querySelector(".nuv-attachment")).not.toBeNull();
    expect(
      contrast(style(one(".nuv-attachment__detail")).color, ground),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(style(one(".nuv-attachment__error")).color, ground),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(style(one(".nuv-attachment__remove")).color, ground),
    ).toBeGreaterThanOrEqual(3);
  });
});

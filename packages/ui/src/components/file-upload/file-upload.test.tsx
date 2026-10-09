import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import {
  expectNoViolations,
  hitAt,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { FileUpload } from "./file-upload";

function Labelled(props: ComponentProps<typeof FileUpload>) {
  return (
    <div style={{ display: "grid", gap: 8, padding: 40 }}>
      <label htmlFor="files">Attachments</label>
      <FileUpload id="files" {...props} />
    </div>
  );
}

const file = (name: string, size = 4, type = "text/plain") =>
  new File(["x".repeat(size)], name, { type, lastModified: 1 });

const input = () => page.getByLabelText("Attachments");
const element = () => input().element() as HTMLInputElement;
const zone = () => element().parentElement as HTMLElement;
const root = () => zone().parentElement as HTMLElement;
const listed = () =>
  [...root().querySelectorAll(".nuv-file-upload__name")].map(
    (name) => name.textContent,
  );
const held = () => [...(element().files ?? [])].map(({ name }) => name);
const remove = (name: string) =>
  page.getByRole("button", { name: `Remove ${name}` });

// What the browser sends while files are dragged over the page and let go.
function drag(
  type: "dragenter" | "dragover" | "dragleave" | "drop",
  files: File[] = [],
) {
  const transfer = new DataTransfer();
  for (const item of files) transfer.items.add(item);
  zone().dispatchEvent(
    new DragEvent(type, {
      dataTransfer: transfer,
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe("rendering", () => {
  test("is a file input, named by its label and described by the prompt", async () => {
    await render(<Labelled />);

    expect(element().type).toBe("file");
    await expect
      .element(input())
      .toHaveAccessibleDescription(
        "Drop files here, or choose them from your device",
      );
  });

  test("the prompt can be replaced, and a description of your own is kept", async () => {
    await render(
      <>
        <Labelled aria-describedby="limit">Drop a logo here</Labelled>
        <p id="limit">PNG or SVG.</p>
      </>,
    );

    await expect
      .element(input())
      .toHaveAccessibleDescription("PNG or SVG. Drop a logo here");
  });

  test("the input covers the whole area, so a click anywhere opens the picker", async () => {
    await render(<Labelled />);

    expect(hitAt(zone(), 0, 0)).toBe(element());
    expect(hitAt(zone(), -100, 40)).toBe(element());
    expect(getComputedStyle(element()).opacity).toBe("0");
  });

  test("the class name goes on the root, and the rest on the input", async () => {
    const ref = createRef<HTMLInputElement>();
    await render(
      <Labelled ref={ref} className="mine" name="docs" data-test="x" />,
    );

    expect(ref.current).toBe(element());
    expect(root().className).toBe("nuv-file-upload mine");
    expect(element().name).toBe("docs");
    expect(element().getAttribute("data-test")).toBe("x");
  });
});

describe("choosing files", () => {
  test("lists a chosen file with its size and tells you about it", async () => {
    const onFilesChange = vi.fn();
    const onChange = vi.fn();
    await render(
      <Labelled onFilesChange={onFilesChange} onChange={onChange} />,
    );

    await userEvent.upload(input(), file("notes.txt", 2048));

    await expect.poll(listed).toEqual(["notes.txt"]);
    expect(root().querySelector(".nuv-file-upload__size")?.textContent).toMatch(
      /^2\s?kB$/,
    );
    expect(onFilesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: "notes.txt" }),
    ]);
    expect(onChange).toHaveBeenCalledOnce();
  });

  test("without multiple, a new file takes the place of the last", async () => {
    await render(<Labelled />);

    await userEvent.upload(input(), file("a.txt"));
    await userEvent.upload(input(), file("b.txt"));

    await expect.poll(listed).toEqual(["b.txt"]);
    expect(held()).toEqual(["b.txt"]);
  });

  test("with multiple, files add up, and the input holds all of them", async () => {
    await render(<Labelled multiple />);

    await userEvent.upload(input(), [file("a.txt"), file("b.txt")]);
    await userEvent.upload(input(), file("c.txt"));

    await expect.poll(listed).toEqual(["a.txt", "b.txt", "c.txt"]);
    expect(held()).toEqual(["a.txt", "b.txt", "c.txt"]);
  });

  test("the same file chosen twice is listed once", async () => {
    const onReject = vi.fn();
    await render(<Labelled multiple onReject={onReject} />);

    // Dropped, because that keeps the date on the file. The same name,
    // size and date is what makes two files the same one.
    drag("drop", [file("a.txt")]);
    await expect.poll(listed).toEqual(["a.txt"]);
    drag("drop", [file("a.txt"), file("b.txt")]);

    await expect.poll(listed).toEqual(["a.txt", "b.txt"]);
    expect(onReject).not.toHaveBeenCalled();
  });

  test("the list can be left out", async () => {
    await render(<Labelled showList={false} />);

    await userEvent.upload(input(), file("a.txt"));

    await expect.poll(held).toEqual(["a.txt"]);
    expect(root().querySelector(".nuv-file-upload__list")).toBeNull();
  });

  test("the size can be written your own way", async () => {
    await render(<Labelled formatSize={(bytes) => `${bytes} bytes`} />);

    await userEvent.upload(input(), file("a.txt", 10));

    await expect.element(page.getByText("10 bytes")).toBeVisible();
  });
});

describe("dropping files", () => {
  test("a drop adds the files and fires the input's change event", async () => {
    const onChange = vi.fn();
    const onFilesChange = vi.fn();
    await render(
      <Labelled multiple onChange={onChange} onFilesChange={onFilesChange} />,
    );

    drag("drop", [file("a.txt"), file("b.txt")]);

    await expect.poll(listed).toEqual(["a.txt", "b.txt"]);
    expect(held()).toEqual(["a.txt", "b.txt"]);
    expect(onFilesChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledOnce();
    // What a form library reads off the event.
    expect(onChange.mock.calls[0]?.[0].target.files).toHaveLength(2);
  });

  test("the area is marked while files are over it", async () => {
    await render(<Labelled />);

    drag("dragenter");
    await expect.poll(() => zone().hasAttribute("data-dragging")).toBe(true);
    expect(getComputedStyle(zone()).borderTopStyle).toBe("solid");

    drag("dragleave");
    await expect.poll(() => zone().hasAttribute("data-dragging")).toBe(false);
    expect(getComputedStyle(zone()).borderTopStyle).toBe("dashed");

    drag("dragover");
    await expect.poll(() => zone().hasAttribute("data-dragging")).toBe(true);
    drag("drop", [file("a.txt")]);
    await expect.poll(() => zone().hasAttribute("data-dragging")).toBe(false);
  });

  test("a drop is the page's to handle, so the browser doesn't open the file", async () => {
    await render(<Labelled />);
    const event = new DragEvent("drop", {
      dataTransfer: new DataTransfer(),
      bubbles: true,
      cancelable: true,
    });

    zone().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  test("a file of the wrong type is turned away, with the reason", async () => {
    const onReject = vi.fn();
    await render(
      <Labelled multiple accept="image/*,.pdf,text/csv" onReject={onReject} />,
    );

    drag("drop", [
      file("photo.png", 4, "image/png"),
      file("Report.PDF", 4, "application/pdf"),
      file("rows.csv", 4, "text/csv"),
      file("notes.txt"),
    ]);

    await expect.poll(listed).toEqual(["photo.png", "Report.PDF", "rows.csv"]);
    expect(onReject).toHaveBeenCalledWith([
      { file: expect.objectContaining({ name: "notes.txt" }), reason: "type" },
    ]);
  });

  test("a file over maxSize is turned away", async () => {
    const onReject = vi.fn();
    await render(<Labelled multiple maxSize={10} onReject={onReject} />);

    drag("drop", [file("small.txt", 10), file("big.txt", 11)]);

    await expect.poll(listed).toEqual(["small.txt"]);
    expect(onReject.mock.calls[0]?.[0]).toMatchObject([{ reason: "size" }]);
  });

  test("files past maxFiles are turned away", async () => {
    const onReject = vi.fn();
    await render(<Labelled multiple maxFiles={2} onReject={onReject} />);

    drag("drop", [file("a.txt"), file("b.txt"), file("c.txt")]);

    await expect.poll(listed).toEqual(["a.txt", "b.txt"]);
    expect(onReject.mock.calls[0]?.[0]).toMatchObject([{ reason: "count" }]);
  });

  test("without multiple, only the first of several dropped files is kept", async () => {
    const onReject = vi.fn();
    await render(<Labelled onReject={onReject} />);
    await userEvent.upload(input(), file("old.txt"));

    drag("drop", [file("a.txt"), file("b.txt")]);

    await expect.poll(listed).toEqual(["a.txt"]);
    expect(onReject.mock.calls[0]?.[0]).toMatchObject([{ reason: "count" }]);
  });

  test("a drop that's all turned away leaves the chosen file alone", async () => {
    await render(<Labelled accept=".pdf" />);
    drag("drop", [file("a.pdf", 4, "application/pdf")]);
    await expect.poll(listed).toEqual(["a.pdf"]);

    drag("drop", [file("b.txt")]);

    expect(listed()).toEqual(["a.pdf"]);
    expect(held()).toEqual(["a.pdf"]);
  });
});

describe("taking a file out", () => {
  test("its button removes it from the list and from the input", async () => {
    const onFilesChange = vi.fn();
    const onChange = vi.fn();
    await render(
      <Labelled multiple onFilesChange={onFilesChange} onChange={onChange} />,
    );
    await userEvent.upload(input(), [file("a.txt"), file("b.txt")]);
    await expect.poll(listed).toEqual(["a.txt", "b.txt"]);

    await remove("a.txt").click();

    await expect.poll(listed).toEqual(["b.txt"]);
    expect(held()).toEqual(["b.txt"]);
    expect(onFilesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: "b.txt" }),
    ]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test("focus goes to the input, since the button is gone", async () => {
    await render(<Labelled />);
    await userEvent.upload(input(), file("a.txt"));

    remove("a.txt").element().focus();
    await userEvent.keyboard("{Enter}");

    await expect.poll(listed).toEqual([]);
    await expect.element(input()).toHaveFocus();
  });

  test("the button's name can be replaced", async () => {
    await render(<Labelled removeLabel={(name) => `${name} entfernen`} />);
    await userEvent.upload(input(), file("a.txt"));

    await expect
      .element(page.getByRole("button", { name: "a.txt entfernen" }))
      .toBeVisible();
  });
});

describe("in a form", () => {
  test("submits the files, dropped ones included", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Labelled name="docs" multiple />
        <button type="submit">Send</button>
      </form>,
    );
    await userEvent.upload(input(), file("a.txt"));
    drag("drop", [file("b.txt")]);
    await expect.poll(listed).toEqual(["a.txt", "b.txt"]);

    await page.getByRole("button", { name: "Send" }).click();

    expect(
      submitted?.getAll("docs").map((entry) => (entry as File).name),
    ).toEqual(["a.txt", "b.txt"]);
  });

  test("required blocks the form until a file is chosen", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Labelled name="docs" required />
      </form>,
    );
    const form = element().form;

    form?.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();

    drag("drop", [file("a.txt")]);
    await expect.poll(listed).toEqual(["a.txt"]);
    form?.requestSubmit();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test("a form reset empties the list", async () => {
    const onFilesChange = vi.fn();
    await render(
      <form>
        <Labelled onFilesChange={onFilesChange} />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.upload(input(), file("a.txt"));
    await expect.poll(listed).toEqual(["a.txt"]);

    await page.getByRole("button", { name: "Reset" }).click();

    await expect.poll(listed).toEqual([]);
    expect(onFilesChange).toHaveBeenLastCalledWith([]);
  });
});

describe("keyboard and states", () => {
  test("Tab focuses the input, and the ring goes around the area", async () => {
    await render(<Labelled />);

    await userEvent.keyboard("{Tab}");

    await expect.element(input()).toHaveFocus();
    expect(getComputedStyle(zone()).outlineStyle).toBe("solid");
  });

  test("Tab goes on to each file's button", async () => {
    await render(<Labelled />);
    await userEvent.upload(input(), file("a.txt"));
    await expect.poll(listed).toEqual(["a.txt"]);

    element().focus();
    await userEvent.keyboard("{Tab}");

    await expect.element(remove("a.txt")).toHaveFocus();
  });

  test("a disabled one takes no drops, fades and is skipped", async () => {
    await render(
      <>
        <Labelled disabled />
        <button type="button">Next</button>
      </>,
    );

    drag("dragenter");
    drag("drop", [file("a.txt")]);
    await userEvent.keyboard("{Tab}");

    expect(listed()).toEqual([]);
    expect(zone().hasAttribute("data-dragging")).toBe(false);
    expect(getComputedStyle(root()).opacity).toBe("0.5");
    await expect
      .element(page.getByRole("button", { name: "Next" }))
      .toHaveFocus();
  });

  test("an invalid one has a different edge", async () => {
    const screen = await render(
      <>
        <FileUpload aria-label="Plain" />
        <FileUpload aria-label="Wrong" aria-invalid />
      </>,
    );
    const [plain, wrong] = [
      ...screen.container.querySelectorAll(".nuv-file-upload__dropzone"),
    ] as [Element, Element];

    expect(getComputedStyle(wrong).borderTopColor).not.toBe(
      getComputedStyle(plain).borderTopColor,
    );
  });
});

describe("styles", () => {
  test("the area is at least 128px tall with a dashed edge", async () => {
    await render(<Labelled />);

    expect(zone().getBoundingClientRect().height).toBeGreaterThanOrEqual(128);
    expect(getComputedStyle(zone()).borderTopStyle).toBe("dashed");
  });

  test("a long file name is cut short and the button stays in the row", async () => {
    await render(
      <div style={{ inlineSize: 260 }}>
        <FileUpload aria-label="Attachments" />
      </div>,
    );
    await userEvent.upload(input(), file(`${"long-name-".repeat(12)}.txt`));
    await expect.poll(() => listed().length).toBe(1);
    const row = root().querySelector(".nuv-file-upload__item") as Element;
    const button = row.querySelector("button") as Element;

    expect(row.getBoundingClientRect().width).toBe(260);
    expect(row.getBoundingClientRect().height).toBe(40);
    expect(button.getBoundingClientRect().right).toBeLessThan(
      row.getBoundingClientRect().right,
    );
    expect(button.getBoundingClientRect().height).toBe(32);
  });

  test("a file's row turns around in a right-to-left layout", async () => {
    await render(
      <div dir="rtl" style={{ inlineSize: 260 }}>
        <FileUpload aria-label="Attachments" />
      </div>,
    );
    await userEvent.upload(input(), file("a.txt"));
    await expect.poll(() => listed().length).toBe(1);
    const row = root().querySelector(".nuv-file-upload__item") as Element;
    const name = row.querySelector(".nuv-file-upload__name") as Element;
    const button = row.querySelector("button") as Element;

    expect(button.getBoundingClientRect().right).toBeLessThan(
      name.getBoundingClientRect().left,
    );
  });

  test("variables change its look", async () => {
    await render(<Labelled />);
    root().style.setProperty("--nuv-file-upload-min-height", "240px");
    root().style.setProperty("--nuv-file-upload-radius", "0px");

    expect(zone().getBoundingClientRect().height).toBe(240);
    expect(getComputedStyle(zone()).borderRadius).toBe("0px");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe empty and with files listed", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="files">Attachments</label>
        <FileUpload id="files" multiple />
      </div>,
    );
    await userEvent.upload(input(), [file("a.txt"), file("b.txt", 4096)]);
    await expect.poll(listed).toEqual(["a.txt", "b.txt"]);

    await expectNoViolations(screen.container);
  });

  test("the area's edge and its mark while dragging can be seen", async () => {
    const screen = await renderThemed(
      theme,
      <FileUpload aria-label="Attachments" />,
    );
    const pageColor = getComputedStyle(
      screen.container.firstElementChild as Element,
    ).backgroundColor;

    expect(
      contrast(getComputedStyle(zone()).borderTopColor, pageColor),
    ).toBeGreaterThanOrEqual(3);

    drag("dragenter");
    await expect.poll(() => zone().hasAttribute("data-dragging")).toBe(true);
    await expect
      .poll(() => contrast(getComputedStyle(zone()).borderTopColor, pageColor))
      .toBeGreaterThanOrEqual(3);
  });
});

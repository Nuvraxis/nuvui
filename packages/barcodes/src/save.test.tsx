import "@nuvui/react/styles.css";
import "./styles/index.scss";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Barcode, codeToBlob, codeToSvg, QRCode, saveCode } from ".";

const code = () => {
  const found = document.querySelector<SVGSVGElement>("svg[role='img']");
  if (!found) throw new Error("no code on the page");
  return found;
};

// The file's text, read as a document of its own.
const parsed = (text: string) =>
  new DOMParser().parseFromString(text, "image/svg+xml").documentElement;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("as an SVG file", () => {
  test("it stands by itself: its colors and font are written into it, and no class is", async () => {
    await render(<Barcode value="Hello 123456" aria-label="Order 1042" />);

    const file = parsed(await codeToSvg(code()));

    expect(file.nodeName).toBe("svg");
    expect(file.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(file.querySelector("parsererror")).toBe(null);
    expect(file.querySelectorAll("[class]").length).toBe(0);
    expect(file.hasAttribute("class")).toBe(false);
    expect(file.querySelector("rect")?.getAttribute("fill")).toBe(
      "rgb(255, 255, 255)",
    );
    expect(file.querySelector("path")?.getAttribute("fill")).toBe(
      "rgb(0, 0, 0)",
    );
    expect(file.querySelector("text")?.getAttribute("font-family")).toMatch(
      /mono/i,
    );
    expect(file.querySelector("text")?.textContent).toBe("Hello 123456");
  });

  test("its name on the page is its title in the file", async () => {
    await render(<Barcode value="Hello 123456" aria-label="Order 1042" />);

    const file = parsed(await codeToSvg(code()));

    expect(file.firstElementChild?.nodeName).toBe("title");
    expect(file.firstElementChild?.textContent).toBe("Order 1042");
    expect(file.hasAttribute("role")).toBe(false);
    expect(file.hasAttribute("aria-label")).toBe(false);
  });

  test("it's the size it was made at, not the size the page squeezed it to", async () => {
    await render(
      <div style={{ width: 100 }}>
        <Barcode value="Hello 123456" />
      </div>,
    );
    expect(code().getBoundingClientRect().width).toBe(100);

    const file = parsed(await codeToSvg(code()));

    expect(file.getAttribute("width")).toBe("330");
    expect(file.getAttribute("height")).toBe("83.5");
    expect(file.getAttribute("viewBox")).toBe("0 0 330 83.5");
  });

  test("the code on the page is left as it was", async () => {
    await render(<QRCode value="https://nuvui.nuvraxis.com" />);
    const before = code().outerHTML;

    await codeToSvg(code());

    expect(code().outerHTML).toBe(before);
  });

  test("colors from variables are the ones written in", async () => {
    await render(
      <div style={{ "--nuv-qrcode-fg": "rgb(10, 20, 80)" } as never}>
        <QRCode value="https://nuvui.nuvraxis.com" />
      </div>,
    );

    const file = parsed(await codeToSvg(code()));

    expect(file.querySelector("path")?.getAttribute("fill")).toBe(
      "rgb(10, 20, 80)",
    );
  });

  test("a picture over a QR code goes into the file itself", async () => {
    const dot = new Blob(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>',
      ],
      { type: "image/svg+xml" },
    );
    const address = URL.createObjectURL(dot);
    await render(
      <QRCode
        value="https://nuvui.nuvraxis.com"
        overlay={<image href={address} width="100" height="100" />}
      />,
    );

    const file = parsed(await codeToSvg(code()));
    URL.revokeObjectURL(address);

    expect(file.querySelector("image")?.getAttribute("href")).toMatch(
      /^data:image\/svg\+xml;base64,/,
    );
    // And on the page it's still at its address.
    expect(code().querySelector("image")?.getAttribute("href")).toBe(address);
  });

  test("a picture that can't be fetched is left at its address", async () => {
    await render(
      <QRCode
        value="https://nuvui.nuvraxis.com"
        overlay={
          <image
            href="https://example.invalid/logo.png"
            width="100"
            height="100"
          />
        }
      />,
    );

    const file = parsed(await codeToSvg(code()));

    expect(file.querySelector("image")?.getAttribute("href")).toBe(
      "https://example.invalid/logo.png",
    );
  });
});

describe("as a file's contents", () => {
  test("an SVG by default", async () => {
    await render(<QRCode value="https://nuvui.nuvraxis.com" />);

    const blob = await codeToBlob(code());

    expect(blob.type).toBe("image/svg+xml;charset=utf-8");
    expect(parsed(await blob.text()).nodeName).toBe("svg");
  });

  test("a PNG four times the size, or as many times as you say", async () => {
    await render(<QRCode value="https://nuvui.nuvraxis.com" size={100} />);

    const usual = await codeToBlob(code(), { format: "png" });
    const picture = await createImageBitmap(usual);
    expect(usual.type).toBe("image/png");
    expect(picture.width).toBe(400);
    expect(picture.height).toBe(400);

    const small = await createImageBitmap(
      await codeToBlob(code(), { format: "png", scale: 1 }),
    );
    expect(small.width).toBe(100);
  });

  test("a PNG has the code's colors: a corner is white and the first square is black", async () => {
    await render(
      <QRCode value="https://nuvui.nuvraxis.com" size={290} quietZone={0} />,
    );

    const picture = await createImageBitmap(
      await codeToBlob(code(), { format: "png", scale: 1 }),
    );
    const canvas = document.createElement("canvas");
    canvas.width = picture.width;
    canvas.height = picture.height;
    const context = canvas.getContext("2d");
    context?.drawImage(picture, 0, 0);
    const at = (x: number, y: number) =>
      Array.from(context?.getImageData(x, y, 1, 1).data ?? []);

    // The corner square of the finder is dark, and the ring inside its
    // edge is light.
    expect(at(3, 3)).toEqual([0, 0, 0, 255]);
    const square = 290 / Number(code().getAttribute("viewBox")?.split(" ")[2]);
    expect(at(Math.round(square * 1.5), Math.round(square * 1.5))).toEqual([
      255, 255, 255, 255,
    ]);
  });
});

describe("saving", () => {
  test("is a download with the name and the ending for its format", async () => {
    await render(<Barcode value="Hello 123456" />);
    const pressed: Array<{ download: string; href: string }> = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      pressed.push({ download: this.download, href: this.href });
    });

    await saveCode(code(), { name: "order-1042", format: "png" });
    await saveCode(code());

    expect(pressed.map((link) => link.download)).toEqual([
      "order-1042.png",
      "code.svg",
    ]);
    expect(pressed.every((link) => link.href.startsWith("blob:"))).toBe(true);
    // The link it pressed isn't left on the page.
    expect(document.querySelector("a[download]")).toBe(null);
  });
});

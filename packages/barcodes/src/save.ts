export interface CodeFileOptions {
  /**
   * `"svg"` stays sharp at any size and is the one to print from. `"png"`
   * is for where an SVG isn't taken.
   * @default "svg"
   */
  format?: "svg" | "png";
  /**
   * How many pixels of a PNG there are to each pixel of the code on the
   * page. A code that's printed wants more than one that's shown.
   * @default 4
   */
  scale?: number;
}

export interface SaveCodeOptions extends CodeFileOptions {
  /**
   * The file's name, without its ending.
   * @default "code"
   */
  name?: string;
}

// What a code's stylesheet sets, which a file standing by itself has to
// carry in its own markup.
const carried = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "font-family",
  "font-size",
  "font-weight",
  "direction",
] as const;

function read(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// A picture laid over a QR code is at an address. A file can't count on
// that address being there, and a browser won't fetch it at all for an
// SVG that's drawn as an image, so the picture goes into the file itself.
// One that can't be fetched is left as it was.
async function embed(image: Element) {
  const address =
    image.getAttribute("href") ?? image.getAttribute("xlink:href") ?? "";
  if (address === "" || address.startsWith("data:")) return;
  try {
    const answer = await fetch(new URL(address, document.baseURI));
    if (!answer.ok) return;
    image.setAttribute("href", await read(await answer.blob()));
    image.removeAttribute("xlink:href");
  } catch {
    // Left as it was.
  }
}

/**
 * The text of an SVG file for a `Barcode` or a `QRCode` on the page, with
 * its colors and its font written into it.
 */
export function codeToSvg(code: SVGSVGElement): Promise<string> {
  return write(code, 1);
}

// The same, drawn `scale` times as large. A PNG is made from one that's
// already the size it's wanted at, so the browser draws the bars at that
// size and doesn't stretch a small picture of them.
async function write(code: SVGSVGElement, scale: number): Promise<string> {
  const copy = code.cloneNode(true) as SVGSVGElement;
  const drawn = [code, ...code.querySelectorAll("*")];
  const copied = [copy, ...copy.querySelectorAll("*")];

  for (const [index, element] of copied.entries()) {
    const from = drawn[index];
    if (!from) continue;
    const style = getComputedStyle(from);
    if (element !== copy) {
      for (const property of carried) {
        const value = style.getPropertyValue(property);
        if (value !== "") element.setAttribute(property, value);
      }
    }
    element.removeAttribute("class");
    element.removeAttribute("style");
  }

  await Promise.all(Array.from(copy.querySelectorAll("image"), embed));

  // The size it was made at, not the size the page squeezed it to.
  const box = code.viewBox.baseVal;
  const width = Number(code.getAttribute("width") ?? box.width);
  const height = Number(code.getAttribute("height") ?? box.height);
  copy.setAttribute("width", String(width * scale));
  copy.setAttribute("height", String(height * scale));
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.removeAttribute("role");
  const name = code.getAttribute("aria-label");
  copy.removeAttribute("aria-label");
  copy.removeAttribute("aria-labelledby");
  if (name) {
    const title = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title",
    );
    title.textContent = name;
    copy.prepend(title);
  }

  return new XMLSerializer().serializeToString(copy);
}

/**
 * A `Barcode` or a `QRCode` on the page as a file's contents: an SVG, or
 * a PNG at `scale` times the size.
 */
export async function codeToBlob(
  code: SVGSVGElement,
  { format = "svg", scale = 4 }: CodeFileOptions = {},
): Promise<Blob> {
  const svg = new Blob([await write(code, format === "svg" ? 1 : scale)], {
    type: "image/svg+xml;charset=utf-8",
  });
  if (format === "svg") return svg;

  const address = URL.createObjectURL(svg);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The code couldn't be drawn."));
      image.src = address;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width);
    canvas.height = Math.round(image.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The browser gave no canvas to draw on.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("The code couldn't be made into a PNG.")),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(address);
  }
}

/**
 * Saves a `Barcode` or a `QRCode` on the page as a file, the way a link
 * with `download` does. Call it from a press of a button.
 */
export async function saveCode(
  code: SVGSVGElement,
  { name = "code", format = "svg", scale }: SaveCodeOptions = {},
): Promise<void> {
  const address = URL.createObjectURL(
    await codeToBlob(code, { format, scale }),
  );
  const link = document.createElement("a");
  link.href = address;
  link.download = `${name}.${format}`;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // After the browser has had the address to start the download with.
  setTimeout(() => URL.revokeObjectURL(address), 1000);
}

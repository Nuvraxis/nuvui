import { describe, expect, test } from "vitest";
import { hexToHsv, hsvToHex, parseHex } from "./color";

describe("parseHex", () => {
  test("gives a color back as #rrggbb in lower case", () => {
    expect(parseHex("#2563eb")).toBe("#2563eb");
    expect(parseHex("#2563EB")).toBe("#2563eb");
  });

  test("takes it without the #, and with room round it", () => {
    expect(parseHex("2563eb")).toBe("#2563eb");
    expect(parseHex("  #2563eb ")).toBe("#2563eb");
  });

  test("reads three digits as six", () => {
    expect(parseHex("#fa0")).toBe("#ffaa00");
    expect(parseHex("FFF")).toBe("#ffffff");
  });

  test.each([
    "",
    "#",
    "blue",
    "#12",
    "#1234",
    "#12345",
    "#1234567",
    "#gggggg",
    "rgb(0, 0, 0)",
    "##2563eb",
  ])("says %j isn't a color", (text) => {
    expect(parseHex(text)).toBe(null);
  });
});

describe("hexToHsv", () => {
  test("knows the corners", () => {
    expect(hexToHsv("#000000")).toEqual({ h: 0, s: 0, v: 0 });
    expect(hexToHsv("#ffffff")).toEqual({ h: 0, s: 0, v: 100 });
    expect(hexToHsv("#ff0000")).toEqual({ h: 0, s: 100, v: 100 });
    expect(hexToHsv("#00ff00")).toEqual({ h: 120, s: 100, v: 100 });
    expect(hexToHsv("#0000ff")).toEqual({ h: 240, s: 100, v: 100 });
  });

  test("puts a hue past blue after it, not before red", () => {
    expect(hexToHsv("#ff00ff").h).toBe(300);
    expect(hexToHsv("#ff0080").h).toBeGreaterThan(300);
  });

  test("doesn't round, so no color is lost on the way back", () => {
    const { h, s, v } = hexToHsv("#2563eb");

    expect(Math.round(h)).toBe(221);
    expect(Math.round(s)).toBe(84);
    expect(Math.round(v)).toBe(92);
    expect(Number.isInteger(h)).toBe(false);
  });

  test("reads something that isn't a color as black", () => {
    expect(hexToHsv("blue")).toEqual({ h: 0, s: 0, v: 0 });
  });
});

describe("hsvToHex", () => {
  test("knows the corners", () => {
    expect(hsvToHex({ h: 0, s: 0, v: 0 })).toBe("#000000");
    expect(hsvToHex({ h: 0, s: 0, v: 100 })).toBe("#ffffff");
    expect(hsvToHex({ h: 0, s: 100, v: 100 })).toBe("#ff0000");
    expect(hsvToHex({ h: 60, s: 100, v: 100 })).toBe("#ffff00");
    expect(hsvToHex({ h: 120, s: 100, v: 100 })).toBe("#00ff00");
    expect(hsvToHex({ h: 180, s: 100, v: 100 })).toBe("#00ffff");
    expect(hsvToHex({ h: 240, s: 100, v: 100 })).toBe("#0000ff");
    expect(hsvToHex({ h: 300, s: 100, v: 100 })).toBe("#ff00ff");
  });

  test("goes round: 360 is red again, and so is 720, and -60 is 300", () => {
    expect(hsvToHex({ h: 360, s: 100, v: 100 })).toBe("#ff0000");
    expect(hsvToHex({ h: 720, s: 100, v: 100 })).toBe("#ff0000");
    expect(hsvToHex({ h: -60, s: 100, v: 100 })).toBe("#ff00ff");
  });

  test("keeps saturation and brightness to what they can be", () => {
    expect(hsvToHex({ h: 0, s: 150, v: 150 })).toBe("#ff0000");
    expect(hsvToHex({ h: 0, s: -10, v: -10 })).toBe("#000000");
  });
});

describe("there and back", () => {
  test("every color tried comes back as itself", () => {
    const wrong: string[] = [];
    // Not all sixteen million. Steps that don't divide 256, so every
    // channel is tried at values of every kind.
    for (let r = 0; r < 256; r += 15) {
      for (let g = 0; g < 256; g += 17) {
        for (let b = 0; b < 256; b += 13) {
          const hex = `#${[r, g, b]
            .map((channel) => channel.toString(16).padStart(2, "0"))
            .join("")}`;
          if (hsvToHex(hexToHsv(hex)) !== hex) wrong.push(hex);
        }
      }
    }

    expect(wrong).toEqual([]);
  });
});

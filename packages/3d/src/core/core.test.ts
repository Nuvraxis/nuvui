import { describe, expect, test } from "vitest";
import { ModelViewerError } from "./error";
import { fileFor, filesKey, mainFileOf, missingFiles } from "./files";
import {
  formatOfName,
  gltfJson,
  nameOfUrl,
  needsOf,
  referencesOf,
  sniffFormat,
} from "./format";
import {
  type Box,
  frameOf,
  orbitAt,
  orbitOf,
  positionOf,
  turned,
  zoomed,
  zoomRoom,
} from "./frame";
import { keyAction } from "./keys";
import { englishLabels, errorText } from "./labels";
import { rgbOf } from "./theme";

const bytesOf = (text: string) => new TextEncoder().encode(text).buffer;

/** A GLB holding `json` and no binary chunk. */
function glb(json: object): ArrayBuffer {
  const text = new TextEncoder().encode(JSON.stringify(json));
  const padded = Math.ceil(text.length / 4) * 4;
  const bytes = new Uint8Array(20 + padded).fill(0x20, 20);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, padded, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(text, 20);
  return bytes.buffer;
}

const file = (name: string, size = 1, path = "") => {
  const made = new File([new Uint8Array(size)], name, { lastModified: 5 });
  if (path) Object.defineProperty(made, "webkitRelativePath", { value: path });
  return made;
};

const degrees = (radians: number) => (radians * 180) / Math.PI;

describe("formats", () => {
  test("a name says its format by its extension, in any case", () => {
    expect(formatOfName("chair.glb")).toBe("glb");
    expect(formatOfName("Scene.GLTF")).toBe("gltf");
    expect(formatOfName("part.v2.stl")).toBe("stl");
    expect(formatOfName("model.obj")).toBeUndefined();
    expect(formatOfName("model")).toBeUndefined();
  });

  test("an address's name leaves out its query and decodes its letters", () => {
    expect(nameOfUrl("https://cdn.test/models/chair.glb?sig=abc#x")).toBe(
      "chair.glb",
    );
    expect(nameOfUrl("/models/office%20chair.gltf")).toBe("office chair.gltf");
    expect(nameOfUrl("https://cdn.test/models/")).toBe("");
  });

  test("the bytes say what they are when the name doesn't", () => {
    expect(sniffFormat(glb({ asset: { version: "2.0" } }))).toBe("glb");
    expect(sniffFormat(bytesOf('  {"asset":{"version":"2.0"}}'))).toBe("gltf");
    expect(sniffFormat(bytesOf("solid part\n facet normal 0 0 1\n"))).toBe(
      "stl",
    );
    // An 80-byte header, a count of 2, and 50 bytes for each.
    const stl = new Uint8Array(84 + 100);
    new DataView(stl.buffer).setUint32(80, 2, true);
    expect(sniffFormat(stl.buffer)).toBe("stl");
    expect(sniffFormat(bytesOf("hello, this is not a model"))).toBeUndefined();
  });

  test("a binary STL whose header starts with 'solid' is still binary", () => {
    const stl = new Uint8Array(84 + 50);
    stl.set(new TextEncoder().encode("solid made by some program"));
    new DataView(stl.buffer).setUint32(80, 1, true);
    expect(sniffFormat(stl.buffer)).toBe("stl");
  });

  test("the JSON of a glTF is read from a GLB and from a .gltf", () => {
    const json = { asset: { version: "2.0" }, extensionsUsed: ["A"] };
    expect(gltfJson(glb(json), "glb")).toEqual(json);
    expect(gltfJson(bytesOf(JSON.stringify(json)), "gltf")).toEqual(json);
    expect(gltfJson(bytesOf("not json"), "gltf")).toBeUndefined();
    expect(gltfJson(bytesOf('{"no":"asset"}'), "gltf")).toBeUndefined();
    expect(gltfJson(bytesOf("glTF but short"), "glb")).toBeUndefined();
  });

  test("the extensions say which decoders a glTF needs", () => {
    expect(needsOf({})).toEqual({ draco: false, meshopt: false, ktx2: false });
    expect(
      needsOf({
        extensionsUsed: ["EXT_meshopt_compression", "KHR_texture_basisu"],
        extensionsRequired: ["EXT_meshopt_compression"],
      }),
    ).toEqual({ draco: false, meshopt: "required", ktx2: "used" });
    expect(
      needsOf({ extensionsUsed: ["KHR_meshopt_compression"] }).meshopt,
    ).toBe("used");
    expect(
      needsOf({ extensionsUsed: ["KHR_draco_mesh_compression"] }).draco,
    ).toBe(true);
  });

  test("the files a glTF names are its buffers and images, once each, without data addresses", () => {
    expect(
      referencesOf({
        buffers: [
          { uri: "scene.bin" },
          { uri: "data:application/gltf-buffer;base64,AA==" },
          {},
        ],
        images: [
          { uri: "textures/wood.png" },
          { uri: "scene.bin" },
          { uri: "blob:x" },
        ],
      }),
    ).toEqual(["scene.bin", "textures/wood.png"]);
  });
});

describe("picked files", () => {
  test("the model among them is the glTF, then any model, then the only file", () => {
    const gltf = file("scene.gltf");
    const bin = file("scene.bin");
    expect(mainFileOf([bin, file("wood.png"), gltf])).toBe(gltf);
    const stl = file("part.STL");
    expect(mainFileOf([file("notes.txt"), stl])).toBe(stl);
    const lone = file("download");
    expect(mainFileOf([lone])).toBe(lone);
    expect(mainFileOf([file("a.png"), file("b.png")])).toBeUndefined();
  });

  test("a name in the glTF finds its file by path, and then by name alone", () => {
    const wood = file("wood.png", 1, "chair/textures/wood.png");
    const bin = file("chair.bin");
    const files = [wood, bin];
    expect(fileFor(files, "textures/wood.png")).toBe(wood);
    expect(fileFor(files, "./textures/wood.png")).toBe(wood);
    expect(fileFor(files, "chair.bin")).toBe(bin);
    expect(fileFor(files, "buffers/chair.bin")).toBe(bin);
    expect(fileFor([file("dark wood.png")], "dark%20wood.png")?.name).toBe(
      "dark wood.png",
    );
    expect(fileFor(files, "metal.png")).toBeUndefined();
  });

  test("the files that are missing are named by their names", () => {
    expect(
      missingFiles(
        [file("scene.bin")],
        ["scene.bin", "textures/oak%20top.png"],
      ),
    ).toEqual(["oak top.png"]);
  });

  test("a file named by a full address is never a picked one, and is named missing by its address", () => {
    const files = [file("scene.bin"), file("wood.png")];
    for (const uri of [
      "https://tracker.example/scene.bin",
      "//tracker.example/wood.png",
      "HTTP://tracker.example/wood.png",
      "file:///home/someone/wood.png",
    ]) {
      expect(fileFor(files, uri), uri).toBeUndefined();
    }
    expect(
      missingFiles(files, ["scene.bin", "https://tracker.example/wood.png"]),
    ).toEqual(["https://tracker.example/wood.png"]);
  });

  test("the same files picked again have the same key", () => {
    expect(filesKey([file("a.glb", 3)])).toBe(filesKey([file("a.glb", 3)]));
    expect(filesKey([file("a.glb", 3)])).not.toBe(filesKey([file("a.glb", 4)]));
  });
});

describe("framing", () => {
  const unit: Box = { min: [-1, -1, -1], max: [1, 1, 1] };

  test("the model's middle is moved to the origin, and the whole of it fits", () => {
    const framing = frameOf({ min: [10, 0, -4], max: [14, 2, 0] }, 40, 1);
    expect(framing.center).toEqual([12, 1, -2]);
    expect(framing.radius).toBeCloseTo(Math.hypot(4, 2, 4) / 2);
    // A ball of that radius fills the view at the fitting distance, with
    // a little room left round it.
    const half = (20 * Math.PI) / 180;
    expect(framing.radius / framing.fit).toBeLessThan(Math.sin(half));
    expect(framing.radius / framing.fit).toBeGreaterThan(Math.sin(half) * 0.85);
  });

  test("a millimeter part and a building fill the view the same", () => {
    const small = frameOf({ min: [0, 0, 0], max: [0.04, 0.02, 0.01] }, 40, 1.5);
    const large = frameOf({ min: [0, 0, 0], max: [40, 20, 10] }, 40, 1.5);
    expect(large.fit / small.fit).toBeCloseTo(1000);
    expect(large.near / small.near).toBeCloseTo(1000);
    expect(small.near).toBeLessThan(small.fit - small.radius);
    expect(small.far).toBeGreaterThan(small.maxRadius + small.radius);
  });

  test("a narrow viewer goes further back, since its width runs out first", () => {
    const wide = frameOf(unit, 40, 2);
    const narrow = frameOf(unit, 40, 0.5);
    expect(narrow.fit).toBeGreaterThan(wide.fit * 1.5);
  });

  test("a model that's a point still gets a view", () => {
    const framing = frameOf({ min: [3, 3, 3], max: [3, 3, 3] }, 40, 1);
    expect(framing.radius).toBe(1);
    expect(Number.isFinite(framing.fit)).toBe(true);
  });

  test("the camera prop is degrees round and up, and a share of the fitting distance", () => {
    const orbit = orbitOf(10, { azimuth: 90, elevation: 0, distance: 2 });
    expect(orbit.radius).toBe(20);
    const [x, y, z] = positionOf(orbit);
    // Round to the model's right, level with its middle.
    expect(x).toBeCloseTo(20);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
    // By default, a little round to the right and a little above.
    const start = orbitAt(positionOf(orbitOf(1)));
    expect(degrees(start.theta)).toBeCloseTo(30);
    expect(degrees(Math.PI / 2 - start.phi)).toBeCloseTo(15);
  });

  test("straight above and below are never quite reached", () => {
    expect(orbitOf(1, { elevation: 90 }).phi).toBeGreaterThan(0);
    expect(orbitOf(1, { elevation: -90 }).phi).toBeLessThan(Math.PI);
    const over = turned(orbitOf(1, { elevation: 80 }), 0, 45);
    expect(over.phi).toBeGreaterThan(0);
  });

  test("a place and its orbit go back and forth", () => {
    const orbit = { radius: 5, theta: 1.2, phi: 0.7 };
    const back = orbitAt(positionOf(orbit));
    expect(back.radius).toBeCloseTo(5);
    expect(back.theta).toBeCloseTo(1.2);
    expect(back.phi).toBeCloseTo(0.7);
  });

  test("turning right moves the camera to the left, and up moves it higher", () => {
    const orbit = orbitOf(1, { azimuth: 0, elevation: 0 });
    const right = turned(orbit, 15, 0);
    expect(degrees(right.theta)).toBeCloseTo(-15);
    expect(positionOf(right)[0]).toBeLessThan(0);
    const up = turned(orbit, 0, 15);
    expect(positionOf(up)[1]).toBeGreaterThan(0);
  });

  test("zooming stays between the nearest and the furthest", () => {
    const framing = frameOf(unit, 40, 1);
    const near = zoomed(framing.start, 0.001, framing);
    expect(near.radius).toBe(framing.minRadius);
    const far = zoomed(framing.start, 1000, framing);
    expect(far.radius).toBe(framing.maxRadius);
    expect(zoomRoom(near.radius, framing)).toEqual({ in: false, out: true });
    expect(zoomRoom(far.radius, framing)).toEqual({ in: true, out: false });
    expect(zoomRoom(framing.start.radius, framing)).toEqual({
      in: true,
      out: true,
    });
  });
});

describe("keys", () => {
  test("the arrows turn it the way they point, more with Shift", () => {
    expect(keyAction("ArrowRight")).toEqual({ type: "turn", right: 15, up: 0 });
    expect(keyAction("ArrowLeft")).toEqual({ type: "turn", right: -15, up: 0 });
    expect(keyAction("ArrowUp")).toEqual({ type: "turn", right: 0, up: 15 });
    expect(keyAction("ArrowDown", true)).toEqual({
      type: "turn",
      right: 0,
      up: -45,
    });
  });

  test("plus and minus zoom, Home resets, and other keys are left alone", () => {
    expect(keyAction("+")).toEqual({ type: "zoom", factor: 0.8 });
    expect(keyAction("=")).toEqual({ type: "zoom", factor: 0.8 });
    expect(keyAction("-")).toEqual({ type: "zoom", factor: 1.25 });
    expect(keyAction("Home")).toEqual({ type: "reset" });
    expect(keyAction("a")).toBeNull();
    expect(keyAction("Tab")).toBeNull();
    // With Ctrl or ⌘ they're the browser's, such as zooming the page.
    expect(keyAction("+", false, true)).toBeNull();
    expect(keyAction("ArrowLeft", false, true)).toBeNull();
  });
});

describe("words", () => {
  test("every error has its own words", () => {
    const codes = [
      "webgl",
      "network",
      "format",
      "parse",
      "missing-files",
      "draco",
      "meshopt",
      "ktx2",
      "context-lost",
    ] as const;
    const texts = codes.map((code) =>
      errorText(englishLabels, code, ["a.png"]),
    );
    expect(new Set(texts).size).toBe(codes.length);
    expect(
      errorText(englishLabels, "missing-files", ["a.png", "b.bin"]),
    ).toContain("a.png, b.bin");
  });

  test("an error carries its code and the missing files", () => {
    const error = new ModelViewerError("missing-files", "Missing", {
      files: ["a.png"],
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ModelViewerError");
    expect(error.code).toBe("missing-files");
    expect(error.files).toEqual(["a.png"]);
  });
});

describe("theme colors", () => {
  test("any CSS color is read as sRGB", () => {
    expect(rgbOf("rgb(255, 0, 0)", [0, 0, 0])).toEqual([1, 0, 0]);
    expect(rgbOf("#00ff00", [0, 0, 0])).toEqual([0, 1, 0]);
    const [r, g, b] = rgbOf("oklch(0.628 0.2577 29.23)", [0, 0, 0]);
    // oklch's red is sRGB's red.
    expect(r).toBeGreaterThan(0.95);
    expect(g).toBeLessThan(0.05);
    expect(b).toBeLessThan(0.05);
  });

  test("nothing, or what isn't a color, is the fallback", () => {
    expect(rgbOf("", [0.1, 0.2, 0.3])).toEqual([0.1, 0.2, 0.3]);
    // An unknown color leaves the canvas's black, which is drawn.
    expect(rgbOf("not-a-color", [0.1, 0.2, 0.3])).toEqual([0, 0, 0]);
  });
});

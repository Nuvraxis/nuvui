import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport, wheel } from "@nuvui/tooling/test/media";
import { type RootState, useThree } from "@react-three/fiber";
import { renderToString } from "react-dom/server";
import transcoder from "three/examples/jsm/libs/basis/basis_transcoder.js?url";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  type ModelInfo,
  ModelViewer,
  type ModelViewerError,
  type ModelViewerProps,
} from ".";

// The models are made by packages/3d/scripts/make-models.mjs.
const fixture = (path: string) =>
  new URL(`../../../test/fixtures/${path}`, import.meta.url).href;
// Where the KTX2 transcoder is served, as an app serves it from its site.
const basis = transcoder.slice(0, transcoder.lastIndexOf("/") + 1);

const webgl = (() => {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
})();

// The scene's own state, handed out by a child drawn in it.
const scene: { current: RootState | null } = { current: null };
function Spy() {
  scene.current = useThree();
  return null;
}

const three = () => scene.current as RootState;
const degrees = (radians: number) => (radians * 180) / Math.PI;
// Where the camera is round the model, which is at the origin.
const orbit = () => {
  const { x, y, z } = three().camera.position;
  const radius = Math.hypot(x, y, z);
  return {
    radius,
    azimuth: degrees(Math.atan2(x, z)),
    elevation: degrees(Math.asin(y / radius)),
  };
};

async function bytesOf(path: string) {
  return (await fetch(fixture(path))).arrayBuffer();
}

async function pick(...names: string[]) {
  return Promise.all(
    names.map(async (name) => new File([await bytesOf(name)], name)),
  );
}

async function show(props: Partial<ModelViewerProps> = {}) {
  const onLoad = vi.fn<(info: ModelInfo) => void>();
  const onError = vi.fn<(error: ModelViewerError) => void>();
  const screen = await render(
    <ModelViewer
      label="Box"
      src={fixture("box.glb")}
      onLoad={onLoad}
      onError={onError}
      {...props}
    >
      <Spy />
      {props.children}
    </ModelViewer>,
  );
  return { screen, onLoad, onError };
}

async function loaded(onLoad: ReturnType<typeof vi.fn>, times = 1) {
  await expect
    .poll(() => onLoad.mock.calls.length, { timeout: 45_000 })
    .toBe(times);
  return onLoad.mock.calls[times - 1]?.[0] as ModelInfo;
}

async function failed(onError: ReturnType<typeof vi.fn>) {
  await expect
    .poll(() => onError.mock.calls.length, { timeout: 45_000 })
    .toBe(1);
  return onError.mock.calls[0]?.[0] as ModelViewerError;
}

const root = () =>
  document.querySelector<HTMLElement>(".nuv-model-viewer") as HTMLElement;
const stage = () => page.getByRole("img", { name: "Box" });
const said = () => document.querySelector('[role="alert"]')?.textContent ?? "";

/** The color of a pixel of the drawing, from 0 to 255, at a share of its width and height. */
function pixel(x: number, y: number) {
  const { gl, scene: drawn, camera } = three();
  gl.render(drawn, camera);
  const context = gl.getContext();
  const out = new Uint8Array(4);
  context.readPixels(
    Math.floor(context.drawingBufferWidth * x),
    Math.floor(context.drawingBufferHeight * y),
    1,
    1,
    context.RGBA,
    context.UNSIGNED_BYTE,
    out,
  );
  return Array.from(out);
}

beforeEach(async () => {
  scene.current = null;
  await setViewport("desktop");
});

afterEach(async () => {
  vi.restoreAllMocks();
  await emulateMedia({ reducedMotion: null });
});

describe("on the server", () => {
  test("sends the name, the poster, the words while it loads and the buttons, and no canvas", () => {
    const html = renderToString(
      <ModelViewer
        label="Chair"
        description="A wooden chair with four legs"
        src="/models/chair.glb"
        poster="/models/chair.png"
      />,
    );
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Chair"');
    expect(html).toContain('aria-roledescription="3D model"');
    expect(html).toContain('src="/models/chair.png"');
    expect(html).toContain("Loading the model");
    expect(html).toContain("A wooden chair with four legs");
    expect(html).toContain('aria-label="Zoom in"');
    expect(html).not.toContain("<canvas");
  });
});

describe("where the browser can't draw WebGL", () => {
  test("keeps the poster, says why, and leaves the buttons off", async () => {
    const original = HTMLCanvasElement.prototype.getContext;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        if (kind.startsWith("webgl")) return null;
        return (original as (...args: unknown[]) => unknown).call(
          this,
          kind,
          ...rest,
        ) as RenderingContext;
      } as typeof original,
    );
    const { onError } = await show({ poster: fixture("crate.png") });

    expect((await failed(onError)).code).toBe("webgl");
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("This browser can't draw 3D models.");
    expect(root().querySelector(".nuv-model-viewer__poster")).not.toBeNull();
    expect(root().querySelector("canvas")).toBeNull();
    await expect
      .element(page.getByRole("button", { name: "Zoom in" }))
      .toBeDisabled();
    expect(root().dataset.state).toBe("error");
  });
});

describe("words", () => {
  test("the name, what it is, and how to turn it are read", async () => {
    await show({ description: "A box two units wide" });
    const element = stage().element();
    expect(element.getAttribute("aria-roledescription")).toBe("3D model");
    const described = (element.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual([
      "A box two units wide",
      "The arrow keys turn it, plus and minus zoom, and Home goes back to the first view.",
    ]);
    await expect
      .element(page.getByRole("group", { name: "Model controls" }))
      .toBeInTheDocument();
  });

  test("every word can be translated", async () => {
    await show({
      labels: {
        roleDescription: "3D-Modell",
        controls: "Steuerung",
        zoomIn: "Vergrößern",
        zoomOut: "Verkleinern",
        reset: "Ansicht zurücksetzen",
        loading: "Modell wird geladen",
      },
    });
    expect(stage().element().getAttribute("aria-roledescription")).toBe(
      "3D-Modell",
    );
    await expect
      .element(page.getByRole("group", { name: "Steuerung" }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "Vergrößern" }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "Ansicht zurücksetzen" }))
      .toBeInTheDocument();
  });

  test("a viewer that can't be turned has no keys, no buttons and no stop in the tab order", async () => {
    await show({ interactive: false });
    const element = stage().element();
    expect(element.hasAttribute("tabindex")).toBe(false);
    expect(element.getAttribute("aria-describedby")).toBeNull();
    expect(root().querySelector("fieldset")).toBeNull();
  });

  test("controls={false} leaves the buttons out and keeps the keys", async () => {
    await show({ controls: false });
    expect(root().querySelector("fieldset")).toBeNull();
    expect(stage().element().getAttribute("tabindex")).toBe("0");
  });
});

describe.skipIf(!webgl)("loading", () => {
  test("a GLB from an address, with what it's made of", async () => {
    const { onLoad } = await show();
    const info = await loaded(onLoad);

    expect(info).toMatchObject({
      format: "glb",
      triangles: 12,
      meshes: 1,
      materials: 1,
      textures: 0,
      compressions: [],
    });
    expect(info.size[0]).toBeCloseTo(2);
    expect(info.size[1]).toBeCloseTo(1);
    expect(info.size[2]).toBeCloseTo(0.5);
    expect(info.volume).toBeCloseTo(1);
    expect(info.bytes).toBe((await bytesOf("box.glb")).byteLength);
    expect(root().dataset.state).toBe("ready");
    // The canvas is a picture of what the name says, and is hidden.
    const canvas = root().querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.closest('[aria-hidden="true"]')).not.toBeNull();
    await expect
      .element(page.getByRole("button", { name: "Zoom in" }))
      .toBeEnabled();
  });

  test("draws the model in the middle in its own colors, and nothing round it", async () => {
    const { onLoad } = await show();
    await loaded(onLoad);

    const [red, green, blue, alpha] = pixel(0.5, 0.5);
    expect(alpha).toBe(255);
    // The paint is orange: more red than green, more green than blue.
    expect(red).toBeGreaterThan(green as number);
    expect(green).toBeGreaterThan(blue as number);
    expect(pixel(0.02, 0.02)[3]).toBe(0);
  });

  test("an STL, binary and as text, in millimeters, with the space inside it", async () => {
    for (const name of ["block.stl", "block-ascii.stl"]) {
      const { onLoad, screen } = await show({ src: fixture(name) });
      const info = await loaded(onLoad);
      expect(info).toMatchObject({
        format: "stl",
        triangles: 12,
        meshes: 1,
        materials: 0,
        textures: 0,
      });
      expect(info.size.map(Math.round)).toEqual([40, 10, 20]);
      expect(info.volume).toBeCloseTo(8000);
      await screen.unmount();
    }
  });

  test("a glTF with its buffer and texture beside it, and one with them written in", async () => {
    for (const name of ["crate.gltf", "crate-embedded.gltf"]) {
      const { onLoad, screen } = await show({ src: fixture(name) });
      expect(await loaded(onLoad)).toMatchObject({
        format: "gltf",
        triangles: 12,
        textures: 1,
      });
      await screen.unmount();
    }
  });

  test("an address with no extension is read by its bytes, or by format", async () => {
    const url = URL.createObjectURL(new Blob([await bytesOf("block.stl")]));
    const { onLoad, screen } = await show({ src: url });
    expect((await loaded(onLoad)).format).toBe("stl");
    await screen.unmount();

    // A name that says otherwise loses to format.
    const [wrong] = await pick("block.stl");
    const renamed = new File([wrong as File], "part.glb");
    const next = await show({ src: renamed, format: "stl" });
    expect((await loaded(next.onLoad)).format).toBe("stl");
    URL.revokeObjectURL(url);
  });

  test("a file the person picked", async () => {
    const [file] = await pick("box.glb");
    const { onLoad } = await show({ src: file });
    expect((await loaded(onLoad)).triangles).toBe(12);
  });

  test("a glTF picked with its files, which are found by name", async () => {
    const files = await pick("crate.gltf", "crate.bin", "crate.png");
    const { onLoad } = await show({ src: files });
    const info = await loaded(onLoad);
    expect(info.textures).toBe(1);
    expect(info.bytes).toBe(files.reduce((sum, file) => sum + file.size, 0));
  });

  test("the same files picked again, in a new list, aren't loaded again", async () => {
    const files = await pick("box.glb");
    const { onLoad, screen } = await show({ src: files });
    await loaded(onLoad);
    await screen.rerender(
      <ModelViewer label="Box" src={[...files]} onLoad={onLoad} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  test("a new model lets go of the one before", async () => {
    const { onLoad, screen } = await show();
    await loaded(onLoad);
    // Drawn here, as below: the scene draws on demand, and what's counted
    // is what has been drawn.
    three().gl.render(three().scene, three().camera);
    const geometries = three().gl.info.memory.geometries;
    await screen.rerender(
      <ModelViewer label="Box" src={fixture("block.stl")} onLoad={onLoad}>
        <Spy />
      </ModelViewer>,
    );
    expect((await loaded(onLoad, 2)).format).toBe("stl");
    three().gl.render(three().scene, three().camera);
    expect(three().gl.info.memory.geometries).toBe(geometries);
  });

  test("far down the page, it makes no drawing until it's scrolled near", async () => {
    const onLoad = vi.fn<(info: ModelInfo) => void>();
    await render(
      <div>
        <div style={{ blockSize: "4000px" }} />
        <ModelViewer label="Box" src={fixture("box.glb")} onLoad={onLoad} />
      </div>,
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(root().querySelector("canvas")).toBeNull();
    expect(root().dataset.state).toBe("loading");

    root().scrollIntoView();
    await loaded(onLoad);
    expect(root().querySelector("canvas")).not.toBeNull();
  });

  test("gives back the drawing when it's taken off the page", async () => {
    const { onLoad, screen } = await show();
    await loaded(onLoad);
    const context = three().gl.getContext();
    await screen.unmount();
    await expect.poll(() => context.isContextLost()).toBe(true);
  });

  test("your own react-three-fiber children are drawn with the model", async () => {
    const { onLoad } = await show({
      children: (
        <mesh name="Marker" position={[1, 0.5, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ),
    });
    await loaded(onLoad);
    expect(three().scene.getObjectByName("Marker")).toBeDefined();
  });
});

describe.skipIf(!webgl)("what it can't show, said in words", () => {
  test("a glTF picked without its files names the ones missing", async () => {
    const { onError } = await show({
      src: await pick("crate.gltf", "crate.bin"),
    });
    const error = await failed(onError);
    expect(error.code).toBe("missing-files");
    expect(error.files).toEqual(["crate.png"]);
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent(
        "Some of the model's files are missing: crate.png. Pick them together with the glTF.",
      );
    expect(root().querySelector("canvas")).toBeNull();
  });

  test("a picked glTF that names a file on the web is refused, and nothing is fetched", async () => {
    const fetched = vi.spyOn(window, "fetch");
    const gltf = JSON.parse(
      new TextDecoder().decode(await bytesOf("crate.gltf")),
    );
    gltf.images[0].uri = "https://tracker.example/opened.png";
    const files = [
      new File([JSON.stringify(gltf)], "crate.gltf"),
      ...(await pick("crate.bin", "crate.png")),
    ];
    const { onError } = await show({ src: files });

    const error = await failed(onError);
    expect(error.code).toBe("missing-files");
    expect(error.files).toEqual(["https://tracker.example/opened.png"]);
    expect(
      fetched.mock.calls.some(([input]) =>
        String(input).includes("tracker.example"),
      ),
    ).toBe(false);
  });

  test("Draco, which the viewer doesn't read", async () => {
    const { onError } = await show({ src: fixture("box-draco.gltf") });
    expect((await failed(onError)).code).toBe("draco");
    await expect.poll(said).toContain("Export it again with Meshopt.");
  });

  test("Meshopt and KTX2 while they're off", async () => {
    const meshopt = await show({ src: fixture("box-meshopt.glb") });
    expect((await failed(meshopt.onError)).code).toBe("meshopt");
    await expect
      .poll(said)
      .toBe(
        "This model is compressed with Meshopt, which isn't turned on here.",
      );
    await meshopt.screen.unmount();

    const ktx2 = await show({ src: fixture("crate-ktx2.glb") });
    expect((await failed(ktx2.onError)).code).toBe("ktx2");
    await expect
      .poll(said)
      .toBe("This model's textures are KTX2, which isn't turned on here.");
  });

  test("a file that isn't a model", async () => {
    const notes = new File(["Remember to order more screws."], "notes.txt");
    const { onError } = await show({ src: notes });
    expect((await failed(onError)).code).toBe("format");
    await expect.poll(said).toContain("It shows GLB, glTF and STL files.");
  });

  test("an address that isn't there", async () => {
    const { onError } = await show({ src: fixture("not-here.glb") });
    expect((await failed(onError)).code).toBe("network");
    await expect.poll(said).toBe("The model couldn't be loaded.");
  });

  test("an error over a poster is a band at its foot", async () => {
    const { onError } = await show({
      src: fixture("box-draco.gltf"),
      poster: fixture("crate.png"),
    });
    await failed(onError);
    await expect
      .element(page.getByRole("alert"))
      .toHaveClass("nuv-model-viewer__error--over");
    expect(root().querySelector(".nuv-model-viewer__poster")).not.toBeNull();
  });

  test("a new model after an error is loaded", async () => {
    const { onError, onLoad, screen } = await show({
      src: fixture("box-draco.gltf"),
    });
    await failed(onError);
    await screen.rerender(
      <ModelViewer label="Box" src={fixture("box.glb")} onLoad={onLoad} />,
    );
    await loaded(onLoad);
    expect(root().querySelector('[role="alert"]')).toBeNull();
  });
});

describe.skipIf(!webgl)("decoders", () => {
  test("Meshopt, with nothing to serve", async () => {
    const { onLoad } = await show({
      src: fixture("box-meshopt.glb"),
      decoders: { meshopt: true },
    });
    expect(await loaded(onLoad)).toMatchObject({
      triangles: 12,
      compressions: ["meshopt"],
    });
  });

  test("KTX2, with the transcoder served by the app", async () => {
    const { onLoad } = await show({
      src: fixture("crate-ktx2.glb"),
      decoders: { ktx2: basis },
    });
    expect(await loaded(onLoad)).toMatchObject({
      textures: 1,
      compressions: ["ktx2"],
    });
  });
});

describe.skipIf(!webgl)("turning and zooming", () => {
  test("starts a little round to the right and above, or where camera says", async () => {
    const first = await show();
    await loaded(first.onLoad);
    expect(orbit().azimuth).toBeCloseTo(30);
    expect(orbit().elevation).toBeCloseTo(15);
    await first.screen.unmount();

    const { onLoad, screen } = await show({
      camera: { azimuth: 90, elevation: 0 },
    });
    await loaded(onLoad);
    expect(orbit().azimuth).toBeCloseTo(90);
    expect(orbit().elevation).toBeCloseTo(0);
    const fit = orbit().radius;

    // A new camera prop moves the camera there.
    await screen.rerender(
      <ModelViewer
        label="Box"
        src={fixture("box.glb")}
        onLoad={onLoad}
        camera={{ azimuth: -45, elevation: 30, distance: 2 }}
      >
        <Spy />
      </ModelViewer>,
    );
    await expect.poll(() => orbit().azimuth).toBeCloseTo(-45);
    expect(orbit().elevation).toBeCloseTo(30);
    expect(orbit().radius).toBeCloseTo(fit * 2);
  });

  test("the arrows turn it, plus and minus zoom, and Home goes back", async () => {
    const { onLoad } = await show();
    await loaded(onLoad);
    const start = orbit();
    (stage().element() as HTMLElement).focus();

    await userEvent.keyboard("{ArrowRight}");
    // The model turns right, so the camera goes round to the left.
    expect(orbit().azimuth).toBeCloseTo(start.azimuth - 15);
    await userEvent.keyboard("{ArrowUp}");
    expect(orbit().elevation).toBeCloseTo(start.elevation + 15);
    await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(orbit().azimuth).toBeCloseTo(start.azimuth + 30);

    await userEvent.keyboard("+");
    expect(orbit().radius).toBeCloseTo(start.radius * 0.8);
    await userEvent.keyboard("-");
    expect(orbit().radius).toBeCloseTo(start.radius);

    await userEvent.keyboard("{Home}");
    expect(orbit().azimuth).toBeCloseTo(start.azimuth);
    expect(orbit().elevation).toBeCloseTo(start.elevation);
  });

  test("the arrows don't scroll the page", async () => {
    const { onLoad } = await show();
    await loaded(onLoad);
    (stage().element() as HTMLElement).focus();
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    stage().element().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test("the buttons zoom as far as there's room, and reset", async () => {
    const { onLoad } = await show();
    await loaded(onLoad);
    const start = orbit().radius;
    const zoomIn = page.getByRole("button", { name: "Zoom in" });
    for (let i = 0; i < 30; i++) {
      if ((zoomIn.element() as HTMLButtonElement).disabled) break;
      await zoomIn.click();
    }
    await expect.element(zoomIn).toBeDisabled();
    expect(orbit().radius).toBeLessThan(start);

    await page.getByRole("button", { name: "Reset the view" }).click();
    expect(orbit().radius).toBeCloseTo(start);
    await expect.element(zoomIn).toBeEnabled();

    const zoomOut = page.getByRole("button", { name: "Zoom out" });
    for (let i = 0; i < 30; i++) {
      if ((zoomOut.element() as HTMLButtonElement).disabled) break;
      await zoomOut.click();
    }
    await expect.element(zoomOut).toBeDisabled();
  });

  test("the wheel zooms only while the viewer has the focus", async () => {
    const { onLoad } = await show();
    await loaded(onLoad);
    const start = orbit().radius;

    await wheel(".nuv-model-viewer__stage", 300);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(orbit().radius).toBeCloseTo(start);

    (stage().element() as HTMLElement).focus();
    await wheel(".nuv-model-viewer__stage", 300);
    await expect.poll(() => orbit().radius).toBeGreaterThan(start);
  });

  test("a press on it gives it the focus", async () => {
    const { onLoad } = await show();
    await loaded(onLoad);
    await stage().click();
    expect(document.activeElement).toBe(stage().element());
  });
});

describe.skipIf(!webgl)("turning by itself", () => {
  test("turns slowly, and stops for good once it's pressed", async () => {
    // Asked for, since with nothing emulated WebKit on Linux reports that
    // less motion was asked for.
    await emulateMedia({ reducedMotion: "no-preference" });
    const { onLoad } = await show({ autoRotate: true });
    await loaded(onLoad);
    const start = orbit().azimuth;
    await expect
      .poll(() => Math.abs(orbit().azimuth - start), { timeout: 5000 })
      .toBeGreaterThan(2);

    stage()
      .element()
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    const stopped = orbit().azimuth;
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(orbit().azimuth).toBeCloseTo(stopped);
  });

  test("holds still for anyone who asked for less motion", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const { onLoad } = await show({ autoRotate: true });
    await loaded(onLoad);
    const start = orbit().azimuth;
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(orbit().azimuth).toBeCloseTo(start);
  });
});

describe.skipIf(!webgl)("the theme", () => {
  const plainColor = () => {
    let hex = "";
    three().scene.traverse((child) => {
      const material = (
        child as { material?: { color?: { getHexString(): string } } }
      ).material;
      if (child.type === "Mesh" && material?.color) {
        hex = material.color.getHexString();
      }
    });
    return hex;
  };

  test("an STL is drawn in the model color, and follows it when it changes", async () => {
    const holder = document.createElement("div");
    holder.style.setProperty("--nuv-model-viewer-model", "rgb(255, 0, 0)");
    document.body.append(holder);
    const onLoad = vi.fn();
    const screen = await render(
      <ModelViewer label="Block" src={fixture("block.stl")} onLoad={onLoad}>
        <Spy />
      </ModelViewer>,
      { container: holder },
    );
    await loaded(onLoad);
    expect(plainColor()).toBe("ff0000");

    holder.style.setProperty("--nuv-model-viewer-model", "rgb(0, 0, 255)");
    await expect.poll(plainColor).toBe("0000ff");
    await screen.unmount();
    holder.remove();
  });
});

describe.skipIf(!webgl)("accessibility", () => {
  test("has no axe violations once it's loaded", async () => {
    const { onLoad } = await show({ description: "A box" });
    await loaded(onLoad);
    expect((await axe(root())).violations).toEqual([]);
  });

  test("has no axe violations with an error", async () => {
    const { onError } = await show({ src: fixture("box-draco.gltf") });
    await failed(onError);
    expect((await axe(root())).violations).toEqual([]);
  });

  test("the focus ring is drawn inside the edge", async () => {
    const { onLoad } = await show();
    await loaded(onLoad);
    await userEvent.tab();
    expect(document.activeElement).toBe(stage().element());
    const style = getComputedStyle(stage().element());
    expect(style.outlineStyle).toBe("solid");
    expect(Number.parseFloat(style.outlineOffset)).toBeLessThan(0);
  });
});

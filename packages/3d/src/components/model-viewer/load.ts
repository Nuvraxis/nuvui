import {
  Box3,
  type BufferGeometry,
  Color,
  LoadingManager,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  SRGBColorSpace,
  type Texture,
  Vector3,
  type WebGLRenderer,
} from "three";
import { ModelViewerError } from "../../core/error";
import { fileFor, mainFileOf, missingFiles } from "../../core/files";
import {
  formatOfName,
  type GltfNeeds,
  gltfJson,
  type ModelCompression,
  type ModelFormat,
  nameOfUrl,
  needsOf,
  referencesOf,
  sniffFormat,
} from "../../core/format";
import type { Rgb } from "../../core/theme";
import type { ModelDecoders, ModelInfo, ModelSource } from "../../core/types";

export interface LoadOptions {
  source: ModelSource;
  format?: ModelFormat;
  decoders: ModelDecoders;
  renderer: WebGLRenderer;
  /** An STL's color. */
  color: Rgb;
  signal: AbortSignal;
  /** From 0 to 1, or null while how far along it is isn't known. */
  onProgress: (fraction: number | null) => void;
}

export interface LoadedModel {
  object: Object3D;
  info: ModelInfo;
  /** The material an STL is drawn in, to follow the theme. */
  plain?: MeshStandardMaterial;
  dispose(): void;
}

const aborted = (signal: AbortSignal) =>
  signal.aborted ? new DOMException("Aborted", "AbortError") : null;

async function fetchBytes(
  url: string,
  signal: AbortSignal,
  onProgress: (fraction: number | null) => void,
): Promise<ArrayBuffer> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    throw (
      aborted(signal) ??
      new ModelViewerError(
        "network",
        `The model at ${url} couldn't be fetched.`,
        {
          cause: error,
        },
      )
    );
  }
  if (!response.ok) {
    throw new ModelViewerError(
      "network",
      `The model at ${url} couldn't be fetched: ${response.status} ${response.statusText}`.trim(),
    );
  }
  // The length is of what was sent, which a compressed response is
  // smaller than. Past it, how far along isn't known.
  const total = Number(response.headers.get("content-length")) || 0;
  if (!response.body) return response.arrayBuffer();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  onProgress(total ? 0 : null);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    onProgress(total && received <= total ? received / total : null);
  }
  const bytes = new Uint8Array(received);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.byteLength;
  }
  return bytes.buffer;
}

// What every resource a picked glTF names is asked for under, so its
// address can be told from any other and handed its file.
const picked = "nuv-picked/";

/** Frees a scene's geometries, materials and textures. */
function disposeOf(object: Object3D) {
  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material)) {
        if ((value as Texture | null)?.isTexture) (value as Texture).dispose();
      }
      material.dispose();
    }
  });
}

const corner = new Vector3();
const a = new Vector3();
const b = new Vector3();
const c = new Vector3();

/** The space inside a mesh, as a sum of the tetrahedra its triangles make with the origin. */
function volumeOf(mesh: Mesh): number {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute("position");
  if (!position) return 0;
  const index = geometry.getIndex();
  const count = index ? index.count : position.count;
  let sum = 0;
  for (let i = 0; i + 2 < count; i += 3) {
    const at = (n: number) => (index ? index.getX(n) : n);
    a.fromBufferAttribute(position, at(i)).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(position, at(i + 1)).applyMatrix4(mesh.matrixWorld);
    c.fromBufferAttribute(position, at(i + 2)).applyMatrix4(mesh.matrixWorld);
    sum += a.dot(corner.crossVectors(b, c)) / 6;
  }
  return Math.abs(sum);
}

function infoOf(
  object: Object3D,
  format: ModelFormat,
  compressions: ModelCompression[],
  bytes: number,
  own: boolean,
): ModelInfo {
  object.updateMatrixWorld(true);
  const box = new Box3().setFromObject(object);
  const size = box.isEmpty() ? new Vector3() : box.getSize(new Vector3());
  const materials = new Set<string>();
  const textures = new Set<string>();
  let triangles = 0;
  let meshes = 0;
  let volume = 0;
  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    meshes += 1;
    const geometry = mesh.geometry;
    const index = geometry.getIndex();
    const position = geometry.getAttribute("position");
    triangles += Math.floor((index ? index.count : (position?.count ?? 0)) / 3);
    volume += volumeOf(mesh);
    if (!own) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of list) {
      if (!material) continue;
      materials.add(material.uuid);
      for (const value of Object.values(material)) {
        if ((value as Texture | null)?.isTexture) {
          textures.add((value as Texture).uuid);
        }
      }
    }
  });
  return {
    format,
    size: [size.x, size.y, size.z],
    triangles,
    meshes,
    materials: materials.size,
    textures: textures.size,
    volume,
    compressions,
    bytes,
  };
}

function checkNeeds(needs: GltfNeeds, decoders: ModelDecoders) {
  if (needs.draco) {
    throw new ModelViewerError(
      "draco",
      "The model is compressed with Draco, which the viewer doesn't read.",
    );
  }
  if (needs.meshopt === "required" && !decoders.meshopt) {
    throw new ModelViewerError(
      "meshopt",
      "The model is compressed with Meshopt. Pass decoders={{ meshopt: true }} to read it.",
    );
  }
  if (needs.ktx2 === "required" && !decoders.ktx2) {
    throw new ModelViewerError(
      "ktx2",
      'The model\'s textures are KTX2. Pass decoders={{ ktx2: "/path/to/basis/" }} to read them.',
    );
  }
}

/** Fetches or reads a model, and makes it into a scene to draw. */
export async function loadModel({
  source,
  format: given,
  decoders,
  renderer,
  color,
  signal,
  onProgress,
}: LoadOptions): Promise<LoadedModel> {
  let bytes: ArrayBuffer;
  let name: string;
  let total: number;
  // Where the files a glTF names are, relative to it.
  let path: string;
  const urls: string[] = [];
  const manager = new LoadingManager();

  if (source.kind === "url") {
    name = nameOfUrl(source.url);
    path = new URL(".", new URL(source.url, document.baseURI)).href;
    bytes = await fetchBytes(source.url, signal, onProgress);
    total = bytes.byteLength;
  } else {
    const main = mainFileOf(source.files);
    if (!main) {
      throw new ModelViewerError(
        "format",
        "None of the picked files is a GLB, glTF or STL file.",
      );
    }
    onProgress(null);
    name = main.name;
    path = picked;
    bytes = await main.arrayBuffer();
    total = source.files.reduce((sum, file) => sum + file.size, 0);
    const files = source.files;
    manager.setURLModifier((url) => {
      if (!url.startsWith(picked)) return url;
      const file = fileFor(files, url.slice(picked.length));
      if (!file) return url;
      const address = URL.createObjectURL(file);
      urls.push(address);
      return address;
    });
  }
  const stop = aborted(signal);
  if (stop) throw stop;
  onProgress(null);

  const format = given ?? formatOfName(name) ?? sniffFormat(bytes);
  if (!format) {
    throw new ModelViewerError(
      "format",
      `${name || "The file"} isn't a GLB, glTF or STL file.`,
    );
  }

  const revoke = () => {
    for (const url of urls.splice(0)) URL.revokeObjectURL(url);
  };

  if (format === "stl") {
    const { STLLoader } = await import("three/addons/loaders/STLLoader.js");
    let geometry: BufferGeometry;
    try {
      geometry = new STLLoader(manager).parse(bytes);
    } catch (error) {
      throw new ModelViewerError("parse", `${name} couldn't be read as STL.`, {
        cause: error,
      });
    }
    if (!geometry.getAttribute("position")?.count) {
      throw new ModelViewerError("parse", `${name} has no triangles in it.`);
    }
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    const plain = new MeshStandardMaterial({
      color: new Color().setRGB(...color, SRGBColorSpace),
      roughness: 0.55,
      metalness: 0.1,
      // A binary STL can carry a color for each triangle.
      vertexColors: Boolean(geometry.getAttribute("color")),
    });
    const mesh = new Mesh(geometry, plain);
    mesh.name = name;
    return {
      object: mesh,
      plain,
      info: infoOf(mesh, format, [], total, false),
      dispose: () => {
        geometry.dispose();
        plain.dispose();
      },
    };
  }

  const json = gltfJson(bytes, format);
  if (!json) {
    throw new ModelViewerError("format", `${name} isn't a glTF file.`);
  }
  const needs = needsOf(json);
  checkNeeds(needs, decoders);
  if (source.kind === "files") {
    const missing = missingFiles(source.files, referencesOf(json));
    if (missing.length > 0) {
      throw new ModelViewerError(
        "missing-files",
        `The glTF names files that weren't picked with it: ${missing.join(", ")}.`,
        { files: missing },
      );
    }
  }

  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const loader = new GLTFLoader(manager);
  const compressions: ModelCompression[] = [];
  let transcoder: { dispose(): unknown } | undefined;
  if (needs.meshopt && decoders.meshopt) {
    const { MeshoptDecoder } = await import(
      "three/addons/libs/meshopt_decoder.module.js"
    );
    loader.setMeshoptDecoder(MeshoptDecoder);
    compressions.push("meshopt");
  }
  if (needs.ktx2 && decoders.ktx2) {
    const { KTX2Loader } = await import("three/addons/loaders/KTX2Loader.js");
    const ktx2 = new KTX2Loader(manager)
      .setTranscoderPath(
        decoders.ktx2.endsWith("/") ? decoders.ktx2 : `${decoders.ktx2}/`,
      )
      .detectSupport(renderer);
    loader.setKTX2Loader(ktx2);
    transcoder = ktx2;
    compressions.push("ktx2");
  }

  try {
    const gltf = await loader.parseAsync(bytes, path);
    const stopped = aborted(signal);
    const object = gltf.scene ?? gltf.scenes[0];
    if (stopped || !object) {
      if (object) disposeOf(object);
      throw (
        stopped ?? new ModelViewerError("parse", `${name} has no scene in it.`)
      );
    }
    return {
      object,
      info: infoOf(object, format, compressions, total, true),
      dispose: () => disposeOf(object),
    };
  } catch (error) {
    if (error instanceof ModelViewerError || aborted(signal)) throw error;
    throw new ModelViewerError("parse", `${name} couldn't be read.`, {
      cause: error,
    });
  } finally {
    // The picked files and the transcoder's workers are let go once the
    // textures are made from them.
    revoke();
    transcoder?.dispose();
  }
}

/** The kinds of file a `ModelViewer` shows. */
export type ModelFormat = "glb" | "gltf" | "stl";

/** A way a glTF can be compressed that the viewer can read, once it's turned on. */
export type ModelCompression = "meshopt" | "ktx2";

/** The format a file's name says it is, if it says. */
export function formatOfName(name: string): ModelFormat | undefined {
  const extension = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase();
  return extension === "glb" || extension === "gltf" || extension === "stl"
    ? extension
    : undefined;
}

/** The last part of an address's path, without its query, such as "chair.glb". */
export function nameOfUrl(url: string): string {
  const path = url.split(/[?#]/)[0] ?? "";
  const last = path.slice(path.lastIndexOf("/") + 1);
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

const text = new TextDecoder();

/**
 * The format the bytes themselves say they are. For an address with no
 * extension, such as a signed one, and a file with none.
 */
export function sniffFormat(bytes: ArrayBuffer): ModelFormat | undefined {
  const view = new DataView(bytes);
  // A GLB starts with "glTF" and its version.
  if (bytes.byteLength >= 12 && view.getUint32(0, true) === 0x46546c67) {
    return "glb";
  }
  // A binary STL is an 80-byte header, a count, and 50 bytes a triangle.
  if (bytes.byteLength >= 84) {
    const count = view.getUint32(80, true);
    if (84 + count * 50 === bytes.byteLength) return "stl";
  }
  const start = text
    .decode(bytes.slice(0, Math.min(bytes.byteLength, 256)))
    .trimStart();
  if (start.startsWith("{")) return "gltf";
  if (/^solid\b/i.test(start)) return "stl";
  return undefined;
}

/** What the viewer reads of a glTF before it loads it. */
export interface GltfJson {
  asset?: { version?: string };
  extensionsUsed?: string[];
  extensionsRequired?: string[];
  buffers?: { uri?: string }[];
  images?: { uri?: string }[];
}

/**
 * The JSON part of a glTF: all of a `.gltf`, or the first chunk of a GLB.
 * Undefined when the bytes aren't a glTF at all.
 */
export function gltfJson(
  bytes: ArrayBuffer,
  format: "glb" | "gltf",
): GltfJson | undefined {
  try {
    let source: string;
    if (format === "glb") {
      const view = new DataView(bytes);
      if (bytes.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67) {
        return undefined;
      }
      const length = view.getUint32(12, true);
      // The first chunk is JSON, by its type.
      if (view.getUint32(16, true) !== 0x4e4f534a) return undefined;
      source = text.decode(new Uint8Array(bytes, 20, length));
    } else {
      source = text.decode(bytes);
    }
    const json: unknown = JSON.parse(source);
    if (typeof json !== "object" || json === null || !("asset" in json)) {
      return undefined;
    }
    return json as GltfJson;
  } catch {
    return undefined;
  }
}

/** What a glTF needs, by the extensions it names. */
export interface GltfNeeds {
  draco: boolean;
  /** Uses Meshopt, and can't be read without it. */
  meshopt: "required" | "used" | false;
  /** Has KTX2 textures, and has no others to fall back on. */
  ktx2: "required" | "used" | false;
}

export function needsOf(json: GltfJson): GltfNeeds {
  const used = new Set(json.extensionsUsed ?? []);
  const required = new Set(json.extensionsRequired ?? []);
  const need = (name: string) =>
    required.has(name) ? "required" : used.has(name) ? "used" : false;
  return {
    draco: used.has("KHR_draco_mesh_compression"),
    meshopt: need("EXT_meshopt_compression") || need("KHR_meshopt_compression"),
    ktx2: need("KHR_texture_basisu"),
  };
}

/**
 * The files a glTF names beside itself, as written in it: its buffers and
 * images, but not those written into it as `data:` addresses.
 */
export function referencesOf(json: GltfJson): string[] {
  const uris = [...(json.buffers ?? []), ...(json.images ?? [])]
    .map((item) => item.uri)
    .filter(
      (uri): uri is string =>
        typeof uri === "string" && !/^(data|blob):/i.test(uri),
    );
  return [...new Set(uris)];
}

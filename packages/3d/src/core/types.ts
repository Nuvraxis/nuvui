import type { ModelCompression, ModelFormat } from "./format";

/** What a model is made of, for `onLoad`. */
export interface ModelInfo {
  format: ModelFormat;
  /** Width, height and depth, in the model's own units. An STL's are often millimeters. */
  size: [width: number, height: number, depth: number];
  triangles: number;
  meshes: number;
  /** The model's own materials. An STL has none. */
  materials: number;
  textures: number;
  /**
   * The space inside the model's surfaces, in its own units cubed. Only
   * meaningful for a model whose surfaces are closed, as one to be printed is.
   */
  volume: number;
  /** The compressions it was read with. */
  compressions: ModelCompression[];
  /** The size of the file, or of all the picked files together, in bytes. */
  bytes: number;
}

/** Which decoders are turned on. Both are off by default. */
export interface ModelDecoders {
  /** Reads glTF compressed with Meshopt. Nothing to serve: it's in three. */
  meshopt?: boolean;
  /**
   * Reads KTX2 textures. The address of the folder where the app serves
   * `basis_transcoder.js` and `basis_transcoder.wasm`, copied from
   * `three/examples/jsm/libs/basis/` of the three it has installed.
   */
  ktx2?: string;
}

/** Where a model comes from, once the viewer has read `src`. */
export type ModelSource =
  | { kind: "url"; url: string }
  | { kind: "files"; files: readonly File[] };

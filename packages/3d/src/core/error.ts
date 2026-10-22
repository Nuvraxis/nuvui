/**
 * Why a model can't be shown.
 *
 * - `webgl`: the browser can't draw WebGL.
 * - `network`: the file couldn't be fetched.
 * - `format`: it isn't a GLB, glTF or STL file.
 * - `parse`: it is, and couldn't be read.
 * - `missing-files`: a picked glTF names files that weren't picked with it.
 * - `draco`: it's compressed with Draco, which the viewer doesn't read.
 * - `meshopt`, `ktx2`: it needs a decoder that `decoders` hasn't turned on.
 * - `context-lost`: the browser took the drawing away and didn't give it back.
 */
export type ModelErrorCode =
  | "webgl"
  | "network"
  | "format"
  | "parse"
  | "missing-files"
  | "draco"
  | "meshopt"
  | "ktx2"
  | "context-lost";

/** What `onError` is called with. */
export class ModelViewerError extends Error {
  readonly code: ModelErrorCode;
  /** For `missing-files`, the names of the files that are missing. */
  readonly files: string[];

  constructor(
    code: ModelErrorCode,
    message: string,
    options: { files?: string[]; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "ModelViewerError";
    this.code = code;
    this.files = options.files ?? [];
  }
}

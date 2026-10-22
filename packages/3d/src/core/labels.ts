import type { ModelErrorCode } from "./error";

/**
 * Every word the viewer shows or says. Pass some or all of them as
 * `labels` to translate it. The viewer's name is its `label`.
 */
export interface ModelViewerLabels {
  /** Said with the viewer's name, in place of "image". */
  roleDescription: string;
  /** How to turn it from the keyboard, said when it has the focus. */
  keys: string;
  /** The name of the group of buttons. */
  controls: string;
  zoomIn: string;
  zoomOut: string;
  /** The name of the button that goes back to the first view. */
  reset: string;
  /** Shown and said while the model is on its way. */
  loading: string;
  /** The loading bar's value, from 0 to 100. */
  progress: (percent: number) => string;
  errorWebgl: string;
  errorNetwork: string;
  errorFormat: string;
  errorParse: string;
  /** The names of the files a picked glTF names that weren't picked with it. */
  errorMissingFiles: (names: string[]) => string;
  errorDraco: string;
  errorMeshopt: string;
  errorKtx2: string;
  /** The browser took the drawing away and hasn't given it back. */
  errorContextLost: string;
}

export const englishLabels: ModelViewerLabels = {
  roleDescription: "3D model",
  keys: "The arrow keys turn it, plus and minus zoom, and Home goes back to the first view.",
  controls: "Model controls",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  reset: "Reset the view",
  loading: "Loading the model",
  progress: (percent) => `${percent}%`,
  errorWebgl: "This browser can't draw 3D models.",
  errorNetwork: "The model couldn't be loaded.",
  errorFormat:
    "This file isn't a model the viewer can show. It shows GLB, glTF and STL files.",
  errorParse: "The model couldn't be read.",
  errorMissingFiles: (names) =>
    `Some of the model's files are missing: ${names.join(", ")}. Pick them together with the glTF.`,
  errorDraco:
    "This model is compressed with Draco, which the viewer doesn't read. Export it again with Meshopt.",
  errorMeshopt:
    "This model is compressed with Meshopt, which isn't turned on here.",
  errorKtx2: "This model's textures are KTX2, which isn't turned on here.",
  errorContextLost: "The model can't be drawn right now.",
};

/** The words for an error, from its code. */
export function errorText(
  labels: ModelViewerLabels,
  code: ModelErrorCode,
  files: string[] = [],
): string {
  switch (code) {
    case "webgl":
      return labels.errorWebgl;
    case "network":
      return labels.errorNetwork;
    case "format":
      return labels.errorFormat;
    case "missing-files":
      return labels.errorMissingFiles(files);
    case "draco":
      return labels.errorDraco;
    case "meshopt":
      return labels.errorMeshopt;
    case "ktx2":
      return labels.errorKtx2;
    case "context-lost":
      return labels.errorContextLost;
    default:
      return labels.errorParse;
  }
}

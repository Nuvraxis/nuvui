import { formatOfName } from "./format";

/** The name a file is matched by: its path as picked, with forward slashes. */
const pathOf = (file: File) =>
  (file.webkitRelativePath || file.name).replace(/\\/g, "/");

const baseName = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/**
 * The model among picked files: the first one whose name is a model's,
 * or, failing that, the only one.
 */
export function mainFileOf(files: readonly File[]): File | undefined {
  return (
    files.find((file) => formatOfName(file.name) === "gltf") ??
    files.find((file) => formatOfName(file.name) !== undefined) ??
    (files.length === 1 ? files[0] : undefined)
  );
}

const decoded = (uri: string) => {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
};

/**
 * Whether a glTF names a file by a full address, such as one on the web,
 * and not by a path beside it. Beside picked files, such a file is never
 * fetched: opening a model of one's own would otherwise tell whoever made
 * it, and nothing a person picks is to leave the browser.
 */
export const isAddress = (uri: string) =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(uri.trim());

/**
 * The picked file a glTF means by `uri`, such as "textures/wood.png". A
 * file picked from a folder is matched by its path in it, and any other
 * by its name alone, since a picker gives no folders. A full address is
 * no picked file.
 */
export function fileFor(files: readonly File[], uri: string): File | undefined {
  if (isAddress(uri)) return undefined;
  const wanted = decoded(uri)
    .replace(/\\/g, "/")
    .replace(/^(\.\/)+/, "");
  return (
    files.find(
      (file) => pathOf(file) === wanted || pathOf(file).endsWith(`/${wanted}`),
    ) ?? files.find((file) => file.name === baseName(wanted))
  );
}

/**
 * The files a glTF names that weren't picked with it, by their names. One
 * named by a full address is always missing, and is named by the address,
 * so it's plain why.
 */
export function missingFiles(
  files: readonly File[],
  references: readonly string[],
): string[] {
  return references
    .filter((uri) => !fileFor(files, uri))
    .map((uri) => (isAddress(uri) ? uri : baseName(decoded(uri))));
}

/** A key that's the same for the same files picked again. */
export function filesKey(files: readonly File[]): string {
  return files
    .map((file) => `${pathOf(file)}:${file.size}:${file.lastModified}`)
    .join("|");
}

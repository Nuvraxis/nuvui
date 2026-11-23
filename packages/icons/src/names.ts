// `arrow-right` is `ArrowRightIcon`. The suffix is the only name an icon
// has: a bare `Map` or `Image` would hide JavaScript's own in any file that
// imports it. The fetch and the generator read this as well as the tests.

const kebab = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function componentName(name: string): string {
  if (!kebab.test(name)) {
    throw new Error(
      `"${name}" isn't lower case words joined by hyphens, starting with a letter`,
    );
  }
  const words = name
    .split("-")
    .map((word) => (word[0] ?? "").toUpperCase() + word.slice(1));
  return `${words.join("")}Icon`;
}

// A file type is named by its extension, and `ts` is `TsFileIcon`, so it
// can't be taken for an icon of the set.
// A file type's description is written into the comment of its generated
// module. One line of plain words and a few marks, so nothing in the
// Figma file can end that comment and write code into the package.
export const fileTypeDescription = /^[A-Za-z0-9 .,'()+#-]{1,80}$/;

export function fileTypeComponentName(extension: string): string {
  return componentName(extension).replace(/Icon$/, "FileIcon");
}

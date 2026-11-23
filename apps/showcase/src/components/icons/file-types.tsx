"use client";

import * as fileTypes from "@nuvui/icons/file-types";
import manifest from "@nuvui/icons/manifest.json";
import { VisuallyHidden } from "@nuvui/react/visually-hidden";
import { type ComponentType, useId, useState } from "react";

const icons = fileTypes as unknown as Record<
  string,
  ComponentType<fileTypes.FileTypeIconProps>
>;

/**
 * The file type icons from @nuvui/icons/file-types. Pressing one copies its
 * import. The list is the package's manifest, as the icon browser's is.
 */
export function FileTypes() {
  const id = useId();
  const [copied, setCopied] = useState("");

  async function copy(component: string) {
    const line = `import { ${component} } from "@nuvui/icons/file-types";`;
    try {
      await navigator.clipboard.writeText(line);
      setCopied(`Copied ${line}`);
    } catch {
      setCopied(`The browser didn't let the page copy. The import is ${line}`);
    }
  }

  return (
    <section className="site-file-types" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="site-file-types__heading">
        File types
      </h2>
      <p className="site-file-types__text">
        {manifest.fileTypes.length} icons for files by their extension, from
        @nuvui/icons/file-types: a page in the color of the text, with the
        extension on a colored tag. Press one to copy its import.
      </p>
      <VisuallyHidden aria-live="polite">{copied}</VisuallyHidden>
      <ul className="site-file-types__grid">
        {manifest.fileTypes.map((fileType) => {
          const Drawn = icons[fileType.component];
          if (!Drawn) return null;
          return (
            <li key={fileType.name}>
              <button
                type="button"
                className="site-file-types__tile"
                data-file-type={fileType.name}
                onClick={() => copy(fileType.component)}
              >
                <Drawn />
                <span className="site-file-types__name">
                  {fileType.component}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

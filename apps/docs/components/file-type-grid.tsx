"use client";

import * as fileTypes from "@nuvui/icons/file-types";
import manifest from "@nuvui/icons/manifest.json";
import type { ComponentType } from "react";
import { useState } from "react";

const icons = fileTypes as unknown as Record<
  string,
  ComponentType<fileTypes.FileTypeIconProps>
>;

/**
 * Every file type icon, to copy the import of. The list is the package's
 * manifest, as the icon grid's is.
 */
export function FileTypeGrid() {
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
    <div className="not-prose my-6 grid gap-4" data-file-type-grid>
      <p className="text-sm text-fd-muted-foreground">
        {manifest.fileTypes.length} file types. Press one to copy its import.
      </p>
      <p aria-live="polite" className="sr-only">
        {copied}
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
        {manifest.fileTypes.map((fileType) => {
          const Icon = icons[fileType.component];
          if (!Icon) return null;
          return (
            <li key={fileType.name}>
              <button
                type="button"
                data-file-type={fileType.name}
                onClick={() => copy(fileType.component)}
                className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border p-3 text-xs hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
              >
                <Icon />
                <span className="break-all">{fileType.component}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

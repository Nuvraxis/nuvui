"use client";

import * as standard from "@nuvui/icons";
import manifest from "@nuvui/icons/manifest.json";
import * as rounded from "@nuvui/icons/rounded";
import * as sharp from "@nuvui/icons/sharp";
import { Input, ToggleGroup, ToggleGroupItem } from "@nuvui/react";
import { type ComponentType, useId, useState } from "react";

type Style = standard.IconStyle;

const styles = manifest.styles as Style[];

const sets = { rounded, standard, sharp } as unknown as Record<
  Style,
  Record<string, ComponentType<standard.IconProps>>
>;

const entries: Record<Style, string> = {
  rounded: "@nuvui/icons/rounded",
  standard: "@nuvui/icons",
  sharp: "@nuvui/icons/sharp",
};

const titles: Record<Style, string> = {
  rounded: "Rounded",
  standard: "Standard",
  sharp: "Sharp",
};

// Every word typed has to be in the icon's name or its category, so
// "arrow down" finds arrow-down-left and the chevrons don't.
function find(query: string) {
  const words = query
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean);
  return manifest.icons.filter((icon) => {
    const text = `${icon.name} ${icon.category.toLowerCase()}`;
    return words.every((word) => text.includes(word));
  });
}

/**
 * Every icon in the set, to search by name and to copy the import of. The
 * list comes from the package's manifest, so it can't name an icon the
 * package doesn't have.
 */
export function IconGrid() {
  const id = useId();
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<Style>("standard");
  const [copied, setCopied] = useState("");

  const found = find(query);
  const categories = new Map<string, typeof found>();
  for (const icon of found) {
    categories.set(icon.category, [
      ...(categories.get(icon.category) ?? []),
      icon,
    ]);
  }

  async function copy(component: string) {
    const line = `import { ${component} } from "${entries[style]}";`;
    try {
      await navigator.clipboard.writeText(line);
      setCopied(`Copied ${line}`);
    } catch {
      setCopied(`The browser didn't let the page copy. The import is ${line}`);
    }
  }

  return (
    <div className="not-prose my-6 grid gap-4" data-icon-grid>
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid min-w-0 grow gap-1.5 sm:max-w-xs">
          <label htmlFor={`${id}-search`} className="text-sm font-medium">
            Find an icon
          </label>
          <Input
            id={`${id}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <span id={`${id}-style`} className="text-sm font-medium">
            Style
          </span>
          <ToggleGroup
            type="single"
            aria-labelledby={`${id}-style`}
            value={style}
            // Pressing the chosen style again would leave none chosen.
            onValueChange={(value) => value && setStyle(value as Style)}
          >
            {styles.map((name) => (
              <ToggleGroupItem key={name} value={name}>
                {titles[name]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <p role="status" className="text-sm text-fd-muted-foreground">
        {found.length === manifest.icons.length
          ? `${found.length} icons. Press one to copy its import.`
          : found.length === 0
            ? "No icon has that in its name or its category."
            : `${found.length} of ${manifest.icons.length} icons.`}
      </p>
      <p aria-live="polite" className="sr-only">
        {copied}
      </p>

      {[...categories].map(([category, icons], index) => (
        <section
          key={category}
          aria-labelledby={`${id}-category-${index}`}
          className="grid gap-2"
        >
          <h3 id={`${id}-category-${index}`} className="text-sm font-semibold">
            {category}
          </h3>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
            {icons.map((icon) => {
              const Icon = sets[style][icon.component];
              if (!Icon) return null;
              return (
                <li key={icon.name}>
                  <button
                    type="button"
                    data-icon={icon.name}
                    onClick={() => copy(icon.component)}
                    className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border p-3 text-xs hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
                  >
                    <Icon />
                    <span className="break-all">{icon.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

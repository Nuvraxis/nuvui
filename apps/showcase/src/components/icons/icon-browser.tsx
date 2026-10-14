"use client";

import * as standard from "@nuvui/icons";
import manifest from "@nuvui/icons/manifest.json";
import * as rounded from "@nuvui/icons/rounded";
import * as sharp from "@nuvui/icons/sharp";
import { Button } from "@nuvui/react/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@nuvui/react/dialog";
import { Input } from "@nuvui/react/input";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react/toggle-group";
import { VisuallyHidden } from "@nuvui/react/visually-hidden";
import { Check, Copy, Download, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type Style = standard.IconStyle;
type Icon = (typeof manifest.icons)[number];

const styles = manifest.styles as Style[];

const sets = { rounded, standard, sharp } as unknown as Record<
  Style,
  Record<string, standard.IconComponent>
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

// The sizes an icon is mostly used at: beside small text, beside body
// text, on its own, and in an empty state.
const sizes = [16, 20, 24, 32];

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

// The drawing as a file: what's on the page, without what React added for
// screen readers, at the grid's own size.
function svgOf(drawn: SVGSVGElement | null) {
  if (!drawn) return "";
  const copy = drawn.cloneNode(true) as SVGSVGElement;
  for (const name of ["aria-hidden", "class", "role"]) {
    copy.removeAttribute(name);
  }
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.setAttribute("width", "24");
  copy.setAttribute("height", "24");
  return new XMLSerializer().serializeToString(copy);
}

type Copied = "idle" | "copied" | "failed";

// A button that says what it copies, and then whether it did.
function CopyAction({ text, children }: { text: string; children: string }) {
  const [state, setState] = useState<Copied>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  };

  const Shown = state === "copied" ? Check : state === "failed" ? X : Copy;
  return (
    <>
      <Button intent="secondary" size="sm" data-state={state} onClick={copy}>
        <Shown aria-hidden="true" size={16} />
        {children}
      </Button>
      {/* The icon changing says nothing to a screen reader. This does. */}
      <VisuallyHidden role="status">
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Couldn't copy"
            : ""}
      </VisuallyHidden>
    </>
  );
}

/**
 * Every icon in @nuvui/icons, to search, to look at closely, and to copy as
 * an import or as SVG. The list is the package's manifest, so the page can't
 * offer an icon the package doesn't have.
 */
export function IconBrowser() {
  const id = useId();
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<Style>("standard");
  const [open, setOpen] = useState<Icon | null>(null);
  const [svg, setSvg] = useState("");
  // The tile that was pressed. The dialog has no trigger of its own, so it
  // can't give focus back by itself.
  const pressed = useRef<HTMLButtonElement | null>(null);
  // The SVG to copy is read from the drawing at 24 pixels. Another icon or
  // another style is another component, so the drawing is drawn again and
  // this runs again.
  const readSvg = useCallback((drawn: SVGSVGElement | null) => {
    if (drawn) setSvg(svgOf(drawn));
  }, []);

  const found = find(query);
  const categories = new Map<string, Icon[]>();
  for (const icon of found) {
    categories.set(icon.category, [
      ...(categories.get(icon.category) ?? []),
      icon,
    ]);
  }

  const code = open
    ? `import { ${open.component} } from "${entries[style]}";\n\n<${open.component} />`
    : "";
  const download = svg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    : undefined;

  return (
    <div className="site-icons">
      <div className="site-icons__toolbar">
        <div className="site-icons__field">
          <label htmlFor={`${id}-search`} className="site-icons__label">
            Find an icon
          </label>
          <Input
            id={`${id}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="site-icons__field">
          <span id={`${id}-style`} className="site-icons__label">
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

      <p role="status" className="site-icons__count">
        {found.length === manifest.icons.length
          ? `${found.length} icons`
          : found.length === 0
            ? "No icon has that in its name or its category."
            : `${found.length} of ${manifest.icons.length} icons`}
      </p>

      {[...categories].map(([category, icons], index) => (
        <section
          key={category}
          aria-labelledby={`${id}-category-${index}`}
          className="site-icons__category"
        >
          <h2 id={`${id}-category-${index}`} className="site-icons__heading">
            {category}
          </h2>
          <ul className="site-icons__grid">
            {icons.map((icon) => {
              const Drawn = sets[style][icon.component];
              if (!Drawn) return null;
              return (
                <li key={icon.name}>
                  <button
                    type="button"
                    className="site-icons__tile"
                    data-icon={icon.name}
                    aria-haspopup="dialog"
                    onClick={(event) => {
                      pressed.current = event.currentTarget;
                      setOpen(icon);
                    }}
                  >
                    <Drawn />
                    <span className="site-icons__name">{icon.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <Dialog
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) setOpen(null);
        }}
      >
        {open ? (
          <DialogContent
            size="lg"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              pressed.current?.focus();
            }}
          >
            <DialogHeader>
              <DialogTitle>{open.component}</DialogTitle>
              <DialogDescription>
                {open.name}, from {open.category}.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className="site-icons__detail">
                <div className="site-icons__styles">
                  {styles.map((name) => {
                    const Drawn = sets[name][open.component];
                    if (!Drawn) return null;
                    return (
                      <figure
                        key={name}
                        className="site-icons__style"
                        data-current={name === style ? "" : undefined}
                      >
                        <Drawn size={48} />
                        <figcaption className="site-icons__caption">
                          {titles[name]}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
                <div className="site-icons__sizes">
                  {sizes.map((size) => {
                    const Drawn = sets[style][open.component];
                    if (!Drawn) return null;
                    return (
                      <figure key={size} className="site-icons__size">
                        <Drawn
                          size={size}
                          ref={size === 24 ? readSvg : undefined}
                        />
                        <figcaption className="site-icons__caption">
                          {size} px
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
                <div className="site-code">
                  {/* It scrolls sideways on a phone, and the keyboard
                      scrolls it once it has focus. */}
                  <pre tabIndex={0}>
                    <code>{code}</code>
                  </pre>
                </div>
                <div className="site-icons__actions">
                  <CopyAction text={code}>Copy import</CopyAction>
                  <CopyAction text={svg}>Copy SVG</CopyAction>
                  <Button asChild intent="secondary" size="sm">
                    <a href={download} download={`${open.name}.svg`}>
                      <Download aria-hidden="true" size={16} />
                      Download SVG
                    </a>
                  </Button>
                </div>
              </div>
            </DialogBody>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

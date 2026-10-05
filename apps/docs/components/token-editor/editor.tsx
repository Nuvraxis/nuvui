"use client";

import {
  Button,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@nuvui/react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import {
  type CSSProperties,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { codeHighlight } from "@/lib/code-themes";
import { contrast, toHex } from "./color";
import { buildSnippet } from "./snippet";
import type { ColorToken, Edits, SizeToken, Theme } from "./types";

// The site's theme toggle sets data-theme on <html>. Watching the attribute
// keeps the editor in step with it without knowing how the toggle is built.
function watchTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function serverTheme(): Theme {
  return "light";
}

// WCAG AA asks for 4.5:1 for text, and 3:1 for the edge of a control and for
// a focus ring.
const pairs = [
  {
    label: "Text on primary",
    front: "--color-primary-foreground",
    back: "--color-primary",
    minimum: 4.5,
  },
  {
    label: "Text on the page",
    front: "--color-foreground",
    back: "--color-background",
    minimum: 4.5,
  },
  {
    label: "Text on danger",
    front: "--color-danger-foreground",
    back: "--color-danger",
    minimum: 4.5,
  },
  {
    label: "Control edges on the page",
    front: "--color-border-strong",
    back: "--color-background",
    minimum: 3,
  },
  {
    label: "Focus ring on the page",
    front: "--color-ring",
    back: "--color-background",
    minimum: 3,
  },
];

const noEdits: Edits = { sizes: {}, colors: { light: {}, dark: {} } };

interface EditorProps {
  colors: ColorToken[];
  sizes: SizeToken[];
}

export function Editor({ colors, sizes }: EditorProps) {
  const id = useId();
  const theme = useSyncExternalStore(watchTheme, readTheme, serverTheme);
  const [edits, setEdits] = useState(noEdits);
  // Kept in state, not a ref, so the select list can be told to render
  // inside it once it exists.
  const [scope, setScope] = useState<HTMLDivElement | null>(null);

  // What each color is on the page itself, where the editor changes nothing.
  // A color input needs a hex value to open on, and so does the contrast
  // formula. Stored with the theme it was read in, so a value from the other
  // theme is never shown for the moment between a switch and this running.
  const [read, setRead] = useState<{
    theme: Theme;
    hex: Record<string, string | undefined>;
  }>();
  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    setRead({
      theme,
      hex: Object.fromEntries(
        colors.map(({ name }) => [
          name,
          toHex(root.getPropertyValue(name).trim()),
        ]),
      ),
    });
  }, [theme, colors]);
  const defaults = read?.theme === theme ? read.hex : undefined;

  const colorEdits = edits.colors[theme];
  const colorOf = (name: string) => colorEdits[name] ?? defaults?.[name];

  function setColor(name: string, value: string) {
    setEdits((current) => ({
      ...current,
      colors: {
        ...current.colors,
        [theme]: { ...current.colors[theme], [name]: value },
      },
    }));
  }

  function setSize(token: SizeToken, value: number) {
    setEdits((current) => {
      const { [token.name]: _previous, ...others } = current.sizes;
      return {
        ...current,
        // Back on the default means there's nothing to override.
        sizes:
          value === token.initial ? others : { ...others, [token.name]: value },
      };
    });
  }

  // The overrides go on the preview box as inline custom properties. They
  // reach everything inside it and nothing else on the page.
  const scopeStyle = {
    padding: 24,
    backgroundColor: "var(--color-background)",
    color: "var(--color-foreground)",
    ...Object.fromEntries(
      Object.entries(edits.sizes).map(([name, value]) => [name, `${value}rem`]),
    ),
    ...colorEdits,
  } as CSSProperties;

  return (
    <div className="not-prose my-6" data-token-editor>
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own border and legend into the preview */}
      <div
        ref={setScope}
        role="group"
        aria-label="Preview"
        data-token-scope
        className="flex justify-center rounded-t-xl border border-b-0"
        style={scopeStyle}
      >
        <div className="grid w-full max-w-sm gap-5">
          <div>
            <p className="font-semibold">Email preferences</p>
            <p
              style={{
                color: "var(--color-muted-foreground)",
                fontSize: "var(--text-sm)",
                lineHeight: "var(--text-sm--line-height)",
              }}
            >
              Choose what we send you, and how often.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch id={`${id}-updates`} defaultChecked />
            <label htmlFor={`${id}-updates`}>Product updates</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`${id}-summary`} defaultChecked />
            <label htmlFor={`${id}-summary`}>
              Include a summary of the week
            </label>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor={`${id}-often`}>How often</label>
            <Select defaultValue="weekly">
              <SelectTrigger id={`${id}-often`}>
                <SelectValue />
              </SelectTrigger>
              {/* The list is normally added to the end of <body>, outside the
                  preview box, where the overrides wouldn't reach it. */}
              <SelectContent container={scope ?? undefined}>
                <SelectItem value="daily">Every day</SelectItem>
                <SelectItem value="weekly">Once a week</SelectItem>
                <SelectItem value="monthly">Once a month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button>Save</Button>
            <Button intent="secondary">Cancel</Button>
            <Button intent="danger">Unsubscribe</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 border border-b-0 p-4 text-sm">
        {/* biome-ignore lint/a11y/useSemanticElements: a legend can't be laid out in a grid with the controls */}
        <div role="group" aria-labelledby={`${id}-colors`}>
          <p id={`${id}-colors`} className="mb-3 font-medium">
            Colors in the {theme} theme
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {colors.map((token) => (
              <ColorControl
                key={token.name}
                name={token.name}
                edited={colorEdits[token.name]}
                declared={token[theme]}
                opensOn={defaults?.[token.name]}
                onChange={(value) => setColor(token.name, value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p id={`${id}-contrast`} className="mb-2 font-medium">
            Contrast
          </p>
          <ul
            aria-labelledby={`${id}-contrast`}
            className="grid gap-x-8 gap-y-1 sm:grid-cols-2"
          >
            {pairs.map((pair) => {
              const front = colorOf(pair.front);
              const back = colorOf(pair.back);
              // Rounded down, so 4.496 never reads as a passing 4.50.
              const ratio =
                front && back
                  ? Math.floor(contrast(front, back) * 100) / 100
                  : undefined;
              const low = ratio !== undefined && ratio < pair.minimum;

              return (
                <li
                  key={pair.label}
                  className="flex justify-between gap-4"
                  data-contrast={pair.front}
                >
                  <span>{pair.label}</span>
                  <span
                    className={
                      low
                        ? "font-semibold"
                        : "text-fd-muted-foreground tabular-nums"
                    }
                  >
                    {ratio === undefined ? " " : `${ratio.toFixed(2)}:1`}
                    {low && `, below ${pair.minimum}:1`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* biome-ignore lint/a11y/useSemanticElements: same as the colors above */}
        <div role="group" aria-labelledby={`${id}-sizes`}>
          <p id={`${id}-sizes`} className="mb-3 font-medium">
            Sizes
          </p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {sizes.map((token) => (
              <SizeControl
                key={token.name}
                token={token}
                value={edits.sizes[token.name] ?? token.initial}
                onChange={(value) => setSize(token, value)}
              />
            ))}
          </div>
        </div>

        <div>
          <Button
            intent="secondary"
            size="sm"
            onClick={() => setEdits(noEdits)}
          >
            Reset all
          </Button>
        </div>
      </div>

      <DynamicCodeBlock
        lang="css"
        code={buildSnippet(edits, colors, sizes)}
        options={codeHighlight}
        codeblock={{ className: "my-0 rounded-t-none" }}
      />
    </div>
  );
}

interface ColorControlProps {
  name: string;
  /** The value picked in the editor, if there is one. */
  edited: string | undefined;
  /** What tokens.css sets it to in this theme. */
  declared: string;
  /** The declared value as hex, for the picker to open on. */
  opensOn: string | undefined;
  onChange: (value: string) => void;
}

function ColorControl({
  name,
  edited,
  declared,
  opensOn,
  onChange,
}: ColorControlProps) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      {/* The swatch is painted by CSS from the token itself, so it's right
          before any script has run. The real input sits on top of it,
          invisible, and still takes the click and the keyboard. */}
      <span
        className="relative size-11 shrink-0 rounded-md border has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-fd-primary"
        style={{ backgroundColor: edited ?? `var(${name})` }}
      >
        <input
          id={id}
          type="color"
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          value={edited ?? opensOn ?? "#000000"}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
      <div className="min-w-0">
        <label htmlFor={id} className="font-medium">
          <code>{name}</code>
        </label>
        <div className="truncate text-fd-muted-foreground">
          <code>{edited ?? declared}</code>
        </div>
      </div>
    </div>
  );
}

interface SizeControlProps {
  token: SizeToken;
  value: number;
  onChange: (value: number) => void;
}

function SizeControl({ token, value, onChange }: SizeControlProps) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-medium">
          <code>{token.name}</code>
        </label>
        <code className="text-fd-muted-foreground tabular-nums">
          {value}rem
        </code>
      </div>
      <input
        id={id}
        type="range"
        className="h-11 w-full accent-fd-primary"
        min={token.min}
        max={token.max}
        step={token.step}
        value={value}
        aria-valuetext={`${value}rem`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

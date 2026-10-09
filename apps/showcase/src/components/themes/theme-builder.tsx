"use client";

import { Button } from "@nuvui/react/button";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@nuvui/react/field";
import { Input } from "@nuvui/react/input";
import { Label } from "@nuvui/react/label";
import { NativeSelect } from "@nuvui/react/native-select";
import { Toggle } from "@nuvui/react/toggle";
import { VisuallyHidden } from "@nuvui/react/visually-hidden";
import {
  bases,
  brands,
  contrasts,
  createTheme,
  defaultChoice,
  densities,
  encodeChoice,
  isHex,
  radii,
  resolveChoice,
  type ThemeChoice,
  toHex,
} from "@nuvui/theme";
import { Link2, Lock, LockOpen, RotateCcw, Shuffle } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import * as siteTheme from "@/lib/site-theme";
import {
  type Axis,
  fromCode,
  type Locks,
  labels,
  linkTo,
  nameOf,
  noLocks,
  presetCss,
  shuffle,
  starts,
} from "@/lib/theme-builder";
import { ContrastReport } from "./contrast-report";
import { Preview, previewPreset } from "./preview";
import { TokensDialog } from "./tokens-dialog";

const custom = "custom";
// Where a color of your own starts: Tailwind's violet 600, as a hex.
const firstCustom = "#7c3aed";

const lists: Record<Exclude<Axis, "brand">, readonly string[]> = {
  base: bases,
  radius: radii,
  density: densities,
  contrast: contrasts,
};

const describe = (choice: ThemeChoice) =>
  [
    isHex(choice.brand) ? choice.brand : nameOf(choice.brand),
    nameOf(choice.base),
    `${nameOf(choice.radius).toLowerCase()} radius`,
    `${nameOf(choice.density).toLowerCase()} density`,
    choice.contrast === "high" ? "high contrast" : "standard contrast",
  ].join(", ");

export function ThemeBuilder() {
  const id = useId();
  const [choice, setChoice] = useState<ThemeChoice>(defaultChoice);
  const [locks, setLocks] = useState<Locks>(noLocks);
  const [font, setFont] = useState("");
  const [fontError, setFontError] = useState("");
  const [said, setSaid] = useState("");
  // The address isn't read until the page is in the browser, and isn't
  // written before it's been read.
  const [ready, setReady] = useState(false);

  // A theme in the address comes first: it's what a shared link is. Without
  // one, the builder starts from the theme the site has, if it has one.
  useEffect(() => {
    const start =
      fromCode(new URLSearchParams(window.location.search).get("preset")) ??
      fromCode(siteTheme.read());
    if (start) {
      setChoice(start);
      setFont(start.font ?? "");
    }
    setReady(true);
  }, []);

  const code = useMemo(() => encodeChoice(choice), [choice]);
  const theme = useMemo(() => createTheme(choice), [choice]);
  const css = useMemo(() => presetCss(choice, previewPreset), [choice]);

  // The address always holds the theme on the screen, so it can be copied
  // from the address bar as well as with the button. It's replaced, not
  // added to: a hundred changes shouldn't be a hundred steps back.
  useEffect(() => {
    if (!ready) return;
    const address =
      code === encodeChoice(defaultChoice)
        ? window.location.pathname
        : `${window.location.pathname}?preset=${code}`;
    window.history.replaceState(null, "", address);
  }, [ready, code]);

  const onSite = useSyncExternalStore(
    siteTheme.subscribe,
    siteTheme.read,
    () => null,
  );

  const set = (axis: Axis, value: string) =>
    setChoice((current) => ({ ...current, [axis]: value }) as ThemeChoice);

  const changeFont = (text: string) => {
    setFont(text);
    const name = text.trim();
    try {
      const { font: _, ...rest } = choice;
      setChoice(resolveChoice(name ? { ...rest, font: name } : rest));
      setFontError("");
    } catch {
      setFontError(
        "Use letters, digits, spaces, hyphens and underscores, up to 64 characters.",
      );
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        linkTo(choice, window.location.origin),
      );
      setSaid("Link copied.");
    } catch {
      setSaid("The link couldn't be copied. It's in the address bar.");
    }
  };

  const lock = (axis: Axis) => (
    <Toggle
      size="sm"
      variant="outline"
      className="site-builder__lock"
      pressed={locks[axis]}
      onPressedChange={(pressed) =>
        setLocks((current) => ({ ...current, [axis]: pressed }))
      }
      aria-label={`Lock ${labels[axis].toLowerCase()}`}
    >
      {locks[axis] ? (
        <Lock aria-hidden="true" size={16} />
      ) : (
        <LockOpen aria-hidden="true" size={16} />
      )}
    </Toggle>
  );

  const ownBrand = isHex(choice.brand);

  return (
    <div className="site-builder">
      {/* The theme being made, as a preset for the previews. The text is
          the generator's own output, with nothing from outside in it but a
          font name the generator has checked. */}
      <style data-builder-theme="" dangerouslySetInnerHTML={{ __html: css }} />
      <div className="site-builder__panel">
        <section aria-labelledby={`${id}-start`}>
          <h2 id={`${id}-start`} className="site-builder__heading">
            Start from
          </h2>
          <div className="site-builder__starts">
            {starts.map((start) => (
              <Button
                key={start.name}
                intent="secondary"
                size="sm"
                aria-pressed={encodeChoice(start.choice) === code}
                onClick={() => {
                  setChoice(start.choice);
                  setFont("");
                  setFontError("");
                  setSaid(`${start.label}: ${describe(start.choice)}.`);
                }}
              >
                {start.label}
              </Button>
            ))}
          </div>
        </section>

        <section
          className="site-builder__controls"
          aria-labelledby={`${id}-controls`}
        >
          <h2 id={`${id}-controls`} className="site-builder__heading">
            Theme
          </h2>

          <div className="site-builder__control">
            <Label htmlFor={`${id}-brand`}>{labels.brand}</Label>
            <div className="site-builder__row">
              <span
                className="site-builder__swatch"
                style={{ backgroundColor: theme.light["--color-primary"] }}
                aria-hidden="true"
              />
              <NativeSelect
                id={`${id}-brand`}
                value={ownBrand ? custom : choice.brand}
                onChange={(event) =>
                  set(
                    "brand",
                    event.target.value === custom
                      ? firstCustom
                      : event.target.value,
                  )
                }
              >
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {nameOf(brand)}
                  </option>
                ))}
                <option value={custom}>Your own</option>
              </NativeSelect>
              {lock("brand")}
            </div>
            {ownBrand ? (
              <div className="site-builder__row">
                <Label htmlFor={`${id}-own`}>Your color</Label>
                <input
                  id={`${id}-own`}
                  type="color"
                  className="site-builder__color"
                  value={toHex(choice.brand)}
                  onChange={(event) => set("brand", event.target.value)}
                />
                <code className="site-builder__hex">{toHex(choice.brand)}</code>
              </div>
            ) : null}
          </div>

          {(Object.keys(lists) as (keyof typeof lists)[]).map((axis) => (
            <div key={axis} className="site-builder__control">
              <Label htmlFor={`${id}-${axis}`}>{labels[axis]}</Label>
              <div className="site-builder__row">
                <NativeSelect
                  id={`${id}-${axis}`}
                  value={choice[axis]}
                  onChange={(event) => set(axis, event.target.value)}
                >
                  {lists[axis].map((value) => (
                    <option key={value} value={value}>
                      {nameOf(value)}
                    </option>
                  ))}
                </NativeSelect>
                {lock(axis)}
              </div>
            </div>
          ))}

          <Field invalid={fontError !== ""}>
            <FieldLabel>Font</FieldLabel>
            <FieldControl>
              <Input
                value={font}
                placeholder="The system's font"
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => changeFont(event.target.value)}
              />
            </FieldControl>
            <FieldDescription>
              A family name, put in front of the system fonts. Loading the font
              is your page's job, so the preview only shows it if this device
              has it.
            </FieldDescription>
            {fontError ? <FieldError>{fontError}</FieldError> : null}
          </Field>

          <div className="site-builder__actions">
            <Button
              intent="secondary"
              onClick={() => {
                const next = shuffle(choice, locks);
                setChoice(next);
                setSaid(`Shuffled: ${describe(next)}.`);
              }}
            >
              <Shuffle aria-hidden="true" size={16} />
              Shuffle
            </Button>
            <Button
              intent="ghost"
              onClick={() => {
                setChoice(defaultChoice);
                setLocks(noLocks);
                setFont("");
                setFontError("");
                setSaid("Back to the default theme.");
              }}
            >
              <RotateCcw aria-hidden="true" size={16} />
              Reset
            </Button>
          </div>
        </section>

        <section aria-labelledby={`${id}-use`}>
          <h2 id={`${id}-use`} className="site-builder__heading">
            Use it
          </h2>
          <div className="site-builder__actions">
            <TokensDialog theme={theme} />
            <Button intent="secondary" onClick={copyLink}>
              <Link2 aria-hidden="true" size={16} />
              Copy link
            </Button>
          </div>
          <p className="site-builder__code">
            Its code is <code>{code}</code>
          </p>
          <div className="site-builder__actions">
            {onSite === code ? (
              <p className="site-builder__note">
                This theme is on the whole site.
              </p>
            ) : (
              <Button
                intent="secondary"
                onClick={() => {
                  siteTheme.apply({
                    code,
                    css: presetCss(choice, siteTheme.sitePreset),
                  });
                  setSaid("The theme is on the whole site, and will stay.");
                }}
              >
                Put it on the whole site
              </Button>
            )}
            {onSite !== null ? (
              <Button
                intent="ghost"
                onClick={() => {
                  siteTheme.clear();
                  setSaid("The site is back to the default theme.");
                }}
              >
                Take it off the site
              </Button>
            ) : null}
          </div>
        </section>

        <ContrastReport theme={theme} />
        <VisuallyHidden role="status" data-builder-status="">
          {said}
        </VisuallyHidden>
      </div>
      <Preview />
    </div>
  );
}

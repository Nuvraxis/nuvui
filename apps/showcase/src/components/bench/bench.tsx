"use client";

import { GridBackground } from "@nuvui/backgrounds/grid-background";
import { AnimatedNumber } from "@nuvui/react/animated-number";
import { Badge } from "@nuvui/react/badge";
import { Button } from "@nuvui/react/button";
import { Field, FieldControl, FieldLabel } from "@nuvui/react/field";
import { Input } from "@nuvui/react/input";
import { Switch } from "@nuvui/react/switch";
import { toast } from "@nuvui/react/toast";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react/toggle-group";
import { VisuallyHidden } from "@nuvui/react/visually-hidden";
import { contrast } from "@nuvui/theme";
import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const presets = [
  { value: "site", label: "Nuvui" },
  { value: "ink", label: "Ink" },
  { value: "ledger", label: "Ledger" },
  { value: "meadow", label: "Meadow" },
  { value: "ember", label: "Ember" },
  { value: "high-contrast", label: "High contrast" },
];

const densities = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "comfortable", label: "Comfortable" },
];

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Reading {
  specimen: Box;
  field: Box;
  action: Box;
  touch: number;
  radius: number;
  contrast: number;
}

// How far outside the form the calipers stand, in pixels.
const standoff = 28;

function boxOf(element: Element, origin: DOMRect): Box {
  const { top, left, width, height } = element.getBoundingClientRect();
  return { top: top - origin.top, left: left - origin.left, width, height };
}

// A browser may report a color in oklch or as color(srgb ...), whichever the
// theme wrote. A canvas takes any of them and gives back the pixel.
function hexOf(color: string, pixel: CanvasRenderingContext2D) {
  pixel.fillStyle = color;
  pixel.fillRect(0, 0, 1, 1);
  const channels = [...pixel.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

interface CaliperProps {
  side: "top" | "start" | "end";
  style: CSSProperties;
  value: number;
}

function Caliper({ side, style, value }: CaliperProps) {
  return (
    <span
      className={`site-bench__caliper site-bench__caliper--${side}`}
      style={style}
    >
      <span className="site-bench__caliper-label">
        {Math.round(value)}
        <span className="site-bench__caliper-unit"> px</span>
      </span>
    </span>
  );
}

interface ReadoutProps {
  name: string;
  id: string;
  value: number | undefined;
  unit?: string;
  ratio?: boolean;
}

function Readout({ name, id, value, unit, ratio = false }: ReadoutProps) {
  return (
    <div className="site-bench__reading">
      <dt className="site-bench__name">{name}</dt>
      <dd
        className="site-bench__value"
        data-reading={id}
        data-value={value ?? ""}
      >
        {value === undefined ? (
          "..."
        ) : (
          <>
            <AnimatedNumber
              value={value}
              minimumFractionDigits={ratio ? 1 : 0}
              maximumFractionDigits={1}
            />
            {ratio ? ":1" : unit ? ` ${unit}` : null}
          </>
        )}
      </dd>
    </div>
  );
}

/**
 * The home page's hero: a small form at its real size, with calipers on it
 * and what they read beside it. Every figure comes from the elements on the
 * page, in the browser of the person looking. Nothing here is written down,
 * so a change to the library, a theme or a density shows up by itself.
 */
export function Bench() {
  const [preset, setPreset] = useState("site");
  const [density, setDensity] = useState("default");
  const [reading, setReading] = useState<Reading | null>(null);
  const [changed, setChanged] = useState(false);
  const switchId = useId();
  const stage = useRef<HTMLDivElement>(null);
  const specimen = useRef<HTMLFormElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const action = useRef<HTMLButtonElement>(null);

  // The choice goes on the page around the bench, so the rest of the page
  // shows it too. These are the attributes an app would set.
  useEffect(() => {
    const home = stage.current?.closest(".site-home");
    if (!home) return;
    if (preset === "site") home.removeAttribute("data-preset");
    else home.setAttribute("data-preset", preset);
    home.setAttribute("data-density", density);
  }, [preset, density]);

  useEffect(() => {
    const parts = [
      stage.current,
      specimen.current,
      field.current,
      action.current,
    ];
    const pixel = document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true });

    const measure = () => {
      if (!stage.current || !specimen.current) return;
      if (!field.current || !action.current || !pixel) return;
      const origin = stage.current.getBoundingClientRect();
      const style = getComputedStyle(action.current);
      const rem = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      setReading({
        specimen: boxOf(specimen.current, origin),
        field: boxOf(field.current, origin),
        action: boxOf(action.current, origin),
        touch: Math.round(
          Number.parseFloat(style.getPropertyValue("--nuv-touch-size")) * rem,
        ),
        radius: Math.round(Number.parseFloat(style.borderTopLeftRadius)),
        // Rounded down: a ratio shown as 4.5 has to be at least that.
        contrast:
          Math.floor(
            contrast(
              hexOf(style.color, pixel),
              hexOf(style.backgroundColor, pixel),
            ) * 10,
          ) / 10,
      });
    };

    const sizes = new ResizeObserver(measure);
    for (const part of parts) if (part) sizes.observe(part);

    const options = {
      attributes: true,
      attributeFilter: ["data-theme", "data-preset", "data-density"],
    };
    const attributes = new MutationObserver(measure);
    attributes.observe(document.documentElement, options);
    const home = stage.current?.closest(".site-home");
    if (home) attributes.observe(home, options);

    // Colors ease from one to the next, and a reading taken as a theme
    // changes catches them on the way.
    const area = stage.current;
    area?.addEventListener("transitionend", measure);

    const media = [
      window.matchMedia("(prefers-color-scheme: dark)"),
      window.matchMedia("(pointer: fine)"),
    ];
    for (const query of media) query.addEventListener("change", measure);

    return () => {
      sizes.disconnect();
      attributes.disconnect();
      area?.removeEventListener("transitionend", measure);
      for (const query of media) query.removeEventListener("change", measure);
    };
  }, []);

  const choose = (set: (value: string) => void) => (value: string) => {
    // A press on the one that's chosen says nothing new.
    if (!value) return;
    set(value);
    setChanged(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    toast("Invoice approved", { intent: "success" });
  };

  return (
    <div className="site-bench">
      <div className="site-bench__controls">
        <div className="site-bench__control">
          <span className="site-bench__control-name" aria-hidden="true">
            Preset
          </span>
          <ToggleGroup
            type="single"
            size="sm"
            className="site-bench__choices"
            aria-label="Preset"
            value={preset}
            onValueChange={choose(setPreset)}
          >
            {presets.map(({ value, label }) => (
              <ToggleGroupItem key={value} value={value}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="site-bench__control">
          <span className="site-bench__control-name" aria-hidden="true">
            Density
          </span>
          <ToggleGroup
            type="single"
            size="sm"
            className="site-bench__choices"
            aria-label="Density"
            value={density}
            onValueChange={choose(setDensity)}
          >
            {densities.map(({ value, label }) => (
              <ToggleGroupItem key={value} value={value}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <GridBackground className="site-bench__grid">
        <div ref={stage} className="site-bench__stage">
          <form
            ref={specimen}
            className="site-bench__specimen"
            aria-label="An example form, to measure"
            onSubmit={submit}
          >
            <div className="site-bench__heading">
              <p className="site-bench__title">Approve invoice</p>
              <Badge intent="warning" variant="outline">
                Due Friday
              </Badge>
            </div>
            <Field>
              <FieldLabel>Invoice number</FieldLabel>
              <FieldControl>
                <Input ref={field} name="invoice" defaultValue="INV-20417" />
              </FieldControl>
            </Field>
            <div className="site-bench__switch">
              <Switch id={switchId} defaultChecked />
              <label htmlFor={switchId}>Tell the supplier</label>
            </div>
            <div className="site-bench__actions">
              <Button
                type="button"
                intent="secondary"
                onClick={() => toast("Invoice held")}
              >
                Hold
              </Button>
              <Button ref={action} type="submit">
                Approve
              </Button>
            </div>
          </form>

          {/* Drawn for the eye. The same figures are in the list beside it. */}
          {reading ? (
            <div aria-hidden="true">
              <Caliper
                side="top"
                value={reading.specimen.width}
                style={
                  {
                    top: reading.specimen.top - standoff,
                    left: reading.specimen.left,
                    inlineSize: reading.specimen.width,
                    "--site-reach": `${standoff}px`,
                  } as CSSProperties
                }
              />
              <Caliper
                side="start"
                value={reading.field.height}
                style={
                  {
                    top: reading.field.top,
                    left: reading.specimen.left - standoff,
                    blockSize: reading.field.height,
                    "--site-reach": `${reading.field.left - reading.specimen.left + standoff}px`,
                  } as CSSProperties
                }
              />
              <Caliper
                side="end"
                value={reading.action.height}
                style={
                  {
                    top: reading.action.top,
                    left:
                      reading.specimen.left + reading.specimen.width + standoff,
                    blockSize: reading.action.height,
                    "--site-reach": `${reading.specimen.left + reading.specimen.width - reading.action.left - reading.action.width + standoff}px`,
                  } as CSSProperties
                }
              />
            </div>
          ) : null}
        </div>
      </GridBackground>

      <div className="site-bench__readout">
        <dl className="site-bench__readings">
          <Readout
            name="Button height"
            id="button"
            value={reading?.action.height}
            unit="px"
          />
          <Readout
            name="Field height"
            id="field"
            value={reading?.field.height}
            unit="px"
          />
          <Readout
            name="Touch size"
            id="touch"
            value={reading?.touch}
            unit="px"
          />
          <Readout
            name="Corner radius"
            id="radius"
            value={reading?.radius}
            unit="px"
          />
          <Readout
            name="Button text contrast"
            id="contrast"
            value={reading?.contrast}
            ratio
          />
        </dl>
        <p className="site-bench__note">
          Read from the form on this page, in your browser. With a mouse,
          density sets the height. On a touch screen a control is never smaller
          than the touch size.
        </p>
      </div>

      {/* The numbers moving say nothing to a screen reader. This does. */}
      <VisuallyHidden role="status">
        {changed && reading
          ? `Button height ${reading.action.height} pixels, text contrast ${reading.contrast} to 1.`
          : ""}
      </VisuallyHidden>
    </div>
  );
}

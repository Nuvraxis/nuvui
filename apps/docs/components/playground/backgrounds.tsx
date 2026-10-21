"use client";

import { FireworksBackground } from "@nuvui/backgrounds/fireworks-background";
import { GlyphBackground } from "@nuvui/backgrounds/glyph-background";
import { GradientBackground } from "@nuvui/backgrounds/gradient-background";
import { GridBackground } from "@nuvui/backgrounds/grid-background";
import { HexagonBackground } from "@nuvui/backgrounds/hexagon-background";
import { HoleBackground } from "@nuvui/backgrounds/hole-background";
import { StarsBackground } from "@nuvui/backgrounds/stars-background";
import { TopographyBackground } from "@nuvui/backgrounds/topography-background";
import { type ComponentType, type ReactNode, useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

const scrims = ["none", "soft", "strong"] as const;
const amounts = ["0.5", "1", "2"] as const;
type Scrim = (typeof scrims)[number];
type Amount = (typeof amounts)[number];

// What's laid on every background here, so the scrim can be judged.
function Content() {
  return (
    <div className="grid max-w-md gap-2 text-center">
      <p className="m-0 text-2xl font-semibold">
        Plan the quarter in one place
      </p>
      <p className="m-0" style={{ color: "var(--color-muted-foreground)" }}>
        Goals, owners and dates, where the whole team can see them.
      </p>
    </div>
  );
}

const frame = "grid min-h-72 w-full place-items-center rounded-lg p-8";

const code = (name: string, props: (string | false)[]) => {
  const lines = props.filter(Boolean);
  return `<${name}${lines.length > 0 ? `\n${lines.map((line) => `  ${line}`).join("\n")}\n` : ""}>\n  <Hero />\n</${name}>`;
};

interface CanvasProps {
  children?: ReactNode;
  className?: string;
  scrim?: Scrim;
  paused?: boolean;
  interactive?: boolean;
  speed?: number;
  density?: number;
}

// The controls every background on a canvas has, and what's around it.
function CanvasPlayground({
  name,
  Component,
  extra,
  extraCode = [],
  extraControls,
}: {
  name: string;
  Component: ComponentType<CanvasProps & Record<string, unknown>>;
  extra?: Record<string, unknown>;
  extraCode?: (string | false)[];
  extraControls?: ReactNode;
}) {
  const [scrim, setScrim] = useState<Scrim>("soft");
  const [paused, setPaused] = useState(false);
  const [interactive, setInteractive] = useState(true);
  const [speed, setSpeed] = useState<Amount>("1");
  const [density, setDensity] = useState<Amount>("1");

  return (
    <Playground
      code={code(name, [
        scrim !== "none" && `scrim="${scrim}"`,
        paused && "paused",
        !interactive && "interactive={false}",
        speed !== "1" && `speed={${speed}}`,
        density !== "1" && `density={${density}}`,
        ...extraCode,
      ])}
      controls={
        <>
          <SelectControl
            label="scrim"
            value={scrim}
            options={scrims}
            onChange={setScrim}
          />
          <SelectControl
            label="speed"
            value={speed}
            options={amounts}
            onChange={setSpeed}
          />
          <SelectControl
            label="density"
            value={density}
            options={amounts}
            onChange={setDensity}
          />
          <CheckboxControl
            label="paused"
            checked={paused}
            onChange={setPaused}
          />
          <CheckboxControl
            label="interactive"
            checked={interactive}
            onChange={setInteractive}
          />
          {extraControls}
        </>
      }
    >
      <Component
        className={frame}
        scrim={scrim}
        paused={paused}
        interactive={interactive}
        speed={Number(speed)}
        density={Number(density)}
        {...extra}
      >
        <Content />
      </Component>
    </Playground>
  );
}

export function StarsBackgroundPlayground() {
  return (
    <CanvasPlayground name="StarsBackground" Component={StarsBackground} />
  );
}

export function TopographyBackgroundPlayground() {
  return (
    <CanvasPlayground
      name="TopographyBackground"
      Component={TopographyBackground}
    />
  );
}

export function HexagonBackgroundPlayground() {
  return (
    <CanvasPlayground name="HexagonBackground" Component={HexagonBackground} />
  );
}

export function FireworksBackgroundPlayground() {
  return (
    <CanvasPlayground
      name="FireworksBackground"
      Component={FireworksBackground}
    />
  );
}

export function HoleBackgroundPlayground() {
  return <CanvasPlayground name="HoleBackground" Component={HoleBackground} />;
}

export function GlyphBackgroundPlayground() {
  const [glyphs, setGlyphs] = useState("0123456789abcdef");
  return (
    <CanvasPlayground
      name="GlyphBackground"
      Component={GlyphBackground}
      extra={{ glyphs }}
      extraCode={[glyphs !== "0123456789abcdef" && `glyphs="${glyphs}"`]}
      extraControls={
        <TextControl label="glyphs" value={glyphs} onChange={setGlyphs} />
      }
    />
  );
}

export function GradientBackgroundPlayground() {
  const [scrim, setScrim] = useState<Scrim>("soft");
  const [paused, setPaused] = useState(false);
  return (
    <Playground
      code={code("GradientBackground", [
        scrim !== "none" && `scrim="${scrim}"`,
        paused && "paused",
      ])}
      controls={
        <>
          <SelectControl
            label="scrim"
            value={scrim}
            options={scrims}
            onChange={setScrim}
          />
          <CheckboxControl
            label="paused"
            checked={paused}
            onChange={setPaused}
          />
        </>
      }
    >
      <GradientBackground className={frame} scrim={scrim} paused={paused}>
        <Content />
      </GradientBackground>
    </Playground>
  );
}

const variants = ["lines", "dots"] as const;

export function GridBackgroundPlayground() {
  const [scrim, setScrim] = useState<Scrim>("none");
  const [variant, setVariant] = useState<(typeof variants)[number]>("lines");
  const [fade, setFade] = useState(true);
  const [interactive, setInteractive] = useState(true);
  return (
    <Playground
      code={code("GridBackground", [
        variant !== "lines" && `variant="${variant}"`,
        scrim !== "none" && `scrim="${scrim}"`,
        !fade && "fade={false}",
        !interactive && "interactive={false}",
      ])}
      controls={
        <>
          <SelectControl
            label="variant"
            value={variant}
            options={variants}
            onChange={setVariant}
          />
          <SelectControl
            label="scrim"
            value={scrim}
            options={scrims}
            onChange={setScrim}
          />
          <CheckboxControl label="fade" checked={fade} onChange={setFade} />
          <CheckboxControl
            label="interactive"
            checked={interactive}
            onChange={setInteractive}
          />
        </>
      }
    >
      <GridBackground
        className={frame}
        variant={variant}
        scrim={scrim}
        fade={fade}
        interactive={interactive}
      >
        <Content />
      </GridBackground>
    </Playground>
  );
}

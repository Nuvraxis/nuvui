"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nuvui/react/tabs";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react/toggle-group";
import { type ReactNode, useState } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { ComponentsPreview } from "./preview-components";
import { FormsPreview } from "./preview-forms";

/** The name of the preset the previews are drawn in. */
export const previewPreset = "builder";

const modes = ["light", "dark"] as const;
type Mode = (typeof modes)[number];
type Shown = Mode | "both";

const isShown = (value: string): value is Shown =>
  value === "both" || modes.includes(value as Mode);

// One box for each mode shown. A box sets data-theme, and the preset around
// them all supplies the colors, so the two are the same theme in its two
// modes, whatever mode the site itself is in.
function Frames({ shown, children }: { shown: Shown; children: ReactNode }) {
  return (
    <div className="site-preview__frames" data-shown={shown}>
      {modes
        .filter((mode) => shown === "both" || shown === mode)
        .map((mode) => (
          <section
            key={mode}
            className="site-preview__frame"
            data-theme={mode}
            aria-label={`Preview in ${mode}`}
          >
            {children}
          </section>
        ))}
    </div>
  );
}

const views = [
  { value: "dashboard", label: "Dashboard", content: <Dashboard /> },
  { value: "forms", label: "Forms", content: <FormsPreview /> },
  { value: "components", label: "Components", content: <ComponentsPreview /> },
];

export function Preview() {
  const [shown, setShown] = useState<Shown>("both");

  return (
    <Tabs
      defaultValue="dashboard"
      className="site-preview"
      data-preset={previewPreset}
    >
      <div className="site-preview__bar">
        <TabsList aria-label="What the preview shows">
          {views.map((view) => (
            <TabsTrigger key={view.value} value={view.value}>
              {view.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <ToggleGroup
          type="single"
          size="sm"
          aria-label="Modes shown"
          value={shown}
          // A group of this kind lets its one pressed item be released. Here
          // something is always shown.
          onValueChange={(value) => {
            if (isShown(value)) setShown(value);
          }}
        >
          <ToggleGroupItem value="light">Light</ToggleGroupItem>
          <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          <ToggleGroupItem value="both">Both</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {views.map((view) => (
        <TabsContent key={view.value} value={view.value}>
          <Frames shown={shown}>{view.content}</Frames>
        </TabsContent>
      ))}
    </Tabs>
  );
}

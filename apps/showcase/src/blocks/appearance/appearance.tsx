"use client";

import {
  Button,
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@nuvui/react";
import { type CSSProperties, type FormEvent, useId, useState } from "react";
import "./appearance.scss";

// What a workspace can color, and what it starts with.
const settings = [
  {
    id: "brand",
    title: "Brand color",
    about: "Buttons and links. White text sits on it.",
    start: "#2563eb",
  },
  {
    id: "sidebar",
    title: "Sidebar color",
    about: "Behind the navigation. White text sits on it.",
    start: "#1e293b",
  },
] as const;

type Setting = (typeof settings)[number]["id"];

const presets = [
  { value: "#dc2626", name: "Red" },
  { value: "#c2410c", name: "Orange" },
  { value: "#15803d", name: "Green" },
  { value: "#0f766e", name: "Teal" },
  { value: "#2563eb", name: "Blue" },
  { value: "#7c3aed", name: "Violet" },
  { value: "#1e293b", name: "Slate" },
];

const starts = Object.fromEntries(
  settings.map((setting) => [setting.id, setting.start]),
) as Record<Setting, string>;

// How far apart white and a color are, as WCAG measures it: 1 for white on
// white, 21 for white on black. Text needs 4.5.
function againstWhite(hex: string) {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const channel = Number.parseInt(hex.slice(at, at + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
}

export default function Appearance() {
  const [colors, setColors] = useState(starts);
  const [said, setSaid] = useState("");
  const id = useId();

  const set = (setting: Setting, color: string) => {
    setColors((before) => ({ ...before, [setting]: color }));
    setSaid("");
  };
  const low = settings.filter(
    (setting) => againstWhite(colors[setting.id]) < 4.5,
  );

  // This would send the colors to your server.
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaid("Saved.");
  }

  return (
    <main className="appearance">
      <header className="appearance__head">
        <h1 className="appearance__title">Appearance</h1>
        <p className="appearance__text">
          The colors of your workspace, for everyone in it.
        </p>
      </header>

      <form className="appearance__form" onSubmit={save}>
        <ItemGroup variant="outline">
          {settings.map((setting) => (
            <Item key={setting.id}>
              <ItemContent>
                <ItemTitle id={`${id}-${setting.id}`}>
                  {setting.title}
                </ItemTitle>
                <ItemDescription id={`${id}-${setting.id}-about`}>
                  {setting.about}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <ColorPicker
                  name={setting.id}
                  value={colors[setting.id]}
                  onValueChange={(color) => set(setting.id, color)}
                >
                  <ColorPickerTrigger
                    aria-labelledby={`${id}-${setting.id}`}
                    aria-describedby={`${id}-${setting.id}-about`}
                  />
                  <ColorPickerContent align="end">
                    <ColorPickerArea />
                    <ColorPickerHue />
                    <ColorPickerInput />
                    <ColorPickerSwatches aria-label="Presets">
                      {presets.map((preset) => (
                        <ColorPickerSwatch
                          key={preset.value}
                          value={preset.value}
                          aria-label={preset.name}
                        />
                      ))}
                    </ColorPickerSwatches>
                  </ColorPickerContent>
                </ColorPicker>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>

        {/* What the colors look like in use. A picture of an app, not one:
            nothing in it can be pressed. */}
        <div
          className="appearance__preview"
          aria-hidden="true"
          style={
            {
              "--appearance-brand": colors.brand,
              "--appearance-sidebar": colors.sidebar,
            } as CSSProperties
          }
        >
          <div className="appearance__sidebar">
            <span>Home</span>
            <span>Invoices</span>
            <span>Team</span>
          </div>
          <div className="appearance__page">
            <span className="appearance__button">New invoice</span>
          </div>
        </div>

        {/* The picker takes any color. Whether text can be read on it is
            for the page to say. In the page from the start, so a screen
            reader hears each change. */}
        <p role="status" className="appearance__note">
          {low.length > 0
            ? `White text is hard to read on the ${low
                .map((setting) => setting.title.toLowerCase())
                .join(" and the ")}. Choose a darker one.`
            : said}
        </p>

        <div className="appearance__actions">
          <Button type="submit" disabled={low.length > 0}>
            Save
          </Button>
          <Button
            type="button"
            intent="secondary"
            onClick={() => {
              setColors(starts);
              setSaid("Put back to the colors it came with.");
            }}
          >
            Reset
          </Button>
        </div>
      </form>
    </main>
  );
}

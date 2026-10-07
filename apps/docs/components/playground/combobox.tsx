"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

const fruits = ["Apple", "Banana", "Cherry", "Grape", "Mango", "Orange"];

export function ComboboxPlayground() {
  const [multiple, setMultiple] = useState(false);
  const [loop, setLoop] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [placeholder, setPlaceholder] = useState("Pick a fruit");

  const root = [multiple && "multiple", disabled && "disabled"].filter(Boolean);
  const code = `<Combobox${root.map((prop) => ` ${prop}`).join("")}>
  <ComboboxTrigger aria-label="Fruit">
    <ComboboxValue placeholder="${placeholder}" />
  </ComboboxTrigger>
  <ComboboxContent label="Search fruit"${loop ? " loop" : ""}>
    <ComboboxEmpty>No fruit found.</ComboboxEmpty>
    ...
  </ComboboxContent>
</Combobox>`;

  const parts = (
    <>
      <ComboboxTrigger aria-label="Fruit">
        <ComboboxValue placeholder={placeholder} />
      </ComboboxTrigger>
      <ComboboxContent
        label="Search fruit"
        searchPlaceholder="Search"
        loop={loop}
      >
        <ComboboxEmpty>No fruit found.</ComboboxEmpty>
        {fruits.map((fruit) => (
          <ComboboxItem key={fruit} value={fruit}>
            {fruit}
          </ComboboxItem>
        ))}
      </ComboboxContent>
    </>
  );

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl
            label="multiple"
            checked={multiple}
            onChange={setMultiple}
          />
          <CheckboxControl label="loop" checked={loop} onChange={setLoop} />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <TextControl
            label="placeholder"
            value={placeholder}
            onChange={setPlaceholder}
          />
        </>
      }
    >
      {/* Two comboboxes and not one with a prop that changes: the value is
          a list in one and a string in the other. */}
      {multiple ? (
        <Combobox key="multiple" multiple disabled={disabled}>
          {parts}
        </Combobox>
      ) : (
        <Combobox key="single" disabled={disabled}>
          {parts}
        </Combobox>
      )}
    </Playground>
  );
}

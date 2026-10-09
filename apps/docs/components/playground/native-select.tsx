"use client";

import { NativeSelect } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground } from "./controls";

export function NativeSelectPlayground() {
  const [disabled, setDisabled] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [multiple, setMultiple] = useState(false);

  const props = [
    disabled && "disabled",
    invalid && "aria-invalid",
    multiple && "multiple",
  ].filter(Boolean);
  const code = `<NativeSelect aria-label="Fruit"${props.map((prop) => ` ${prop}`).join("")}>
  <option>Apple</option>
  <option>Banana</option>
  <option>Cherry</option>
</NativeSelect>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <CheckboxControl
            label="aria-invalid"
            checked={invalid}
            onChange={setInvalid}
          />
          <CheckboxControl
            label="multiple"
            checked={multiple}
            onChange={setMultiple}
          />
        </>
      }
    >
      <div style={{ inlineSize: "100%", maxInlineSize: 320 }}>
        <NativeSelect
          // A select can't change between one value and several in place.
          key={String(multiple)}
          aria-label="Fruit"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          multiple={multiple}
        >
          <option>Apple</option>
          <option>Banana</option>
          <option>Cherry</option>
        </NativeSelect>
      </div>
    </Playground>
  );
}

"use client";

import { PasswordInput } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function PasswordInputPlayground() {
  const [visible, setVisible] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [showLabel, setShowLabel] = useState("Show password");

  const props = [
    visible && "visible",
    showLabel !== "Show password" && `showLabel="${showLabel}"`,
    disabled && "disabled",
    invalid && "aria-invalid",
  ].filter(Boolean);
  const code = `<PasswordInput aria-label="Password"${props.map((prop) => ` ${prop}`).join("")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl
            label="showLabel"
            value={showLabel}
            onChange={setShowLabel}
          />
          <CheckboxControl
            label="visible"
            checked={visible}
            onChange={setVisible}
          />
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
        </>
      }
    >
      <div style={{ inlineSize: "100%", maxInlineSize: 320 }}>
        <PasswordInput
          aria-label="Password"
          defaultValue="correct horse"
          visible={visible}
          onVisibilityChange={setVisible}
          showLabel={showLabel}
          disabled={disabled}
          aria-invalid={invalid || undefined}
        />
      </div>
    </Playground>
  );
}

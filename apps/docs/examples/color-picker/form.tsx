"use client";

import {
  Button,
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerTrigger,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [sent, setSent] = useState("");

  return (
    <form
      style={{ display: "grid", gap: 16, justifyItems: "start" }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSent(`Sent accent=${String(data.get("accent"))}`);
      }}
    >
      <Field>
        <FieldLabel>Accent color</FieldLabel>
        <ColorPicker name="accent" defaultValue="#7c3aed">
          <FieldControl>
            <ColorPickerTrigger />
          </FieldControl>
          <ColorPickerContent>
            <ColorPickerArea />
            <ColorPickerHue />
            <ColorPickerInput />
          </ColorPickerContent>
        </ColorPicker>
        <FieldDescription>Used for links and buttons.</FieldDescription>
      </Field>
      <Button type="submit">Save</Button>
      <p role="status" style={{ margin: 0, minBlockSize: 20, fontSize: 14 }}>
        {sent}
      </p>
    </form>
  );
}

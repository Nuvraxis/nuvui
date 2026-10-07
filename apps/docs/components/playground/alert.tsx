"use client";

import {
  Alert,
  AlertDescription,
  type AlertProps,
  AlertTitle,
} from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Intent = NonNullable<AlertProps["intent"]>;

const intents = Object.keys({
  info: true,
  success: true,
  warning: true,
  danger: true,
} satisfies Record<Intent, true>) as Intent[];

export function AlertPlayground() {
  const [intent, setIntent] = useState<Intent>("info");
  const [title, setTitle] = useState("Maintenance on Saturday");
  const [description, setDescription] = useState(
    "Reports will be read-only from 22:00 to midnight.",
  );
  const [icon, setIcon] = useState(true);

  const props = [
    intent !== "info" && `intent="${intent}"`,
    !icon && "icon={null}",
  ].filter(Boolean);
  const code = `<Alert${props.map((prop) => ` ${prop}`).join("")}>
  <AlertTitle>${title}</AlertTitle>
  <AlertDescription>${description}</AlertDescription>
</Alert>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="intent"
            value={intent}
            options={intents}
            onChange={setIntent}
          />
          <TextControl label="title" value={title} onChange={setTitle} />
          <TextControl
            label="description"
            value={description}
            onChange={setDescription}
          />
          <CheckboxControl label="icon" checked={icon} onChange={setIcon} />
        </>
      }
    >
      {/* A fixed role, so that changing a control here doesn't make a screen
          reader read the alert out. */}
      <Alert
        intent={intent}
        icon={icon ? undefined : null}
        role="note"
        style={{ width: "100%", maxWidth: 480 }}
      >
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
    </Playground>
  );
}

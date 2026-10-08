"use client";

import { Button, type ToastOptions, toast } from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Intent = NonNullable<ToastOptions["intent"]>;

const intents = Object.keys({
  neutral: true,
  info: true,
  success: true,
  warning: true,
  danger: true,
} satisfies Record<Intent, true>) as Intent[];

export function ToastPlayground() {
  const [title, setTitle] = useState("Changes saved");
  const [description, setDescription] = useState("");
  const [intent, setIntent] = useState<Intent>("neutral");
  const [withAction, setWithAction] = useState(false);

  const options = [
    intent !== "neutral" && `intent: "${intent}"`,
    description && `description: "${description}"`,
    withAction &&
      'action: { label: "Undo", altText: "Undo with Ctrl+Z", onClick: undo }',
  ].filter(Boolean);
  const code =
    options.length === 0
      ? `toast("${title}");`
      : `toast("${title}", {\n${options.map((option) => `  ${option},`).join("\n")}\n});`;

  function show() {
    toast(title, {
      intent,
      description: description || undefined,
      action: withAction
        ? { label: "Undo", altText: "Undo with Ctrl+Z", onClick() {} }
        : undefined,
    });
  }

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="title" value={title} onChange={setTitle} />
          <TextControl
            label="description"
            value={description}
            onChange={setDescription}
          />
          <SelectControl
            label="intent"
            value={intent}
            options={intents}
            onChange={setIntent}
          />
          <CheckboxControl
            label="action"
            checked={withAction}
            onChange={setWithAction}
          />
        </>
      }
    >
      <Button onClick={show}>Show this toast</Button>
    </Playground>
  );
}

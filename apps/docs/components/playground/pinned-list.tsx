"use client";

import { PinnedList, PinnedListItem } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

const people: Record<string, string> = {
  ana: "Ana Lima",
  sam: "Sam Okafor",
  lee: "Lee Chen",
  rui: "Rui Costa",
};

export function PinnedListPlayground() {
  const [pinnedLabel, setPinnedLabel] = useState("Pinned");
  const [restLabel, setRestLabel] = useState("Everything else");
  const [disabled, setDisabled] = useState(false);

  const props = [
    "items={ids}",
    'defaultPinned={["sam"]}',
    pinnedLabel === "Pinned"
      ? null
      : `pinnedLabel=${JSON.stringify(pinnedLabel)}`,
    restLabel === "Everything else"
      ? null
      : `restLabel=${JSON.stringify(restLabel)}`,
    disabled ? "disabled" : null,
  ].filter(Boolean);
  const code = `<PinnedList
  ${props.join("\n  ")}
>
  {(id) => (
    <PinnedListItem value={id} label={names[id]}>
      {names[id]}
    </PinnedListItem>
  )}
</PinnedList>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl
            label="pinnedLabel"
            value={pinnedLabel}
            onChange={setPinnedLabel}
          />
          <TextControl
            label="restLabel"
            value={restLabel}
            onChange={setRestLabel}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <PinnedList
        items={Object.keys(people)}
        defaultPinned={["sam"]}
        pinnedLabel={pinnedLabel}
        restLabel={restLabel}
        disabled={disabled}
        style={{ inlineSize: "100%", maxInlineSize: 360 }}
      >
        {(id) => (
          <PinnedListItem value={id} label={people[id] ?? id}>
            {people[id]}
          </PinnedListItem>
        )}
      </PinnedList>
    </Playground>
  );
}

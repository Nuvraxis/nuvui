"use client";

import { PinnedList, PinnedListItem } from "@nuvui/react";
import { useState } from "react";

const projects: Record<string, string> = {
  atlas: "Atlas",
  beacon: "Beacon",
  cobalt: "Cobalt",
  delta: "Delta",
};

export default function Example() {
  // Kept here, where it would be saved for the next visit.
  const [pinned, setPinned] = useState(["cobalt"]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 400,
      }}
    >
      <PinnedList
        items={Object.keys(projects)}
        pinned={pinned}
        onPinnedChange={setPinned}
        pinnedLabel="Pinned projects"
        restLabel="All projects"
      >
        {(id) => (
          <PinnedListItem value={id} label={projects[id] ?? id}>
            <a href={`#${id}`}>{projects[id]}</a>
          </PinnedListItem>
        )}
      </PinnedList>
      <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
        {pinned.length} pinned
      </p>
    </div>
  );
}

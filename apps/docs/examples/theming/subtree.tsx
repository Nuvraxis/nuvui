"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";
import { useId, useState } from "react";

export default function Example() {
  // State, not a ref, so the select re-renders once the section exists.
  const [section, setSection] = useState<HTMLElement | null>(null);
  const id = useId();

  return (
    <section
      ref={setSection}
      data-theme="dark"
      style={{
        display: "grid",
        gap: 6,
        padding: 24,
        borderRadius: 12,
        backgroundColor: "var(--color-background)",
        color: "var(--color-foreground)",
      }}
    >
      <label htmlFor={id}>Density</label>
      <Select defaultValue="comfortable">
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={section ?? undefined}>
          <SelectItem value="compact">Compact</SelectItem>
          <SelectItem value="comfortable">Comfortable</SelectItem>
          <SelectItem value="spacious">Spacious</SelectItem>
        </SelectContent>
      </Select>
    </section>
  );
}

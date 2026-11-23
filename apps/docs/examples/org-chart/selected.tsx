"use client";

import { OrgChart } from "@nuvui/org-chart";
import { useState } from "react";
import { people } from "./people";

export default function Selected() {
  const [selected, setSelected] = useState<string | null>("3");
  const person = people.find((each) => each.id === selected);
  const manager = people.find((each) => each.id === person?.managerId);
  const reports = people.filter((each) => each.managerId === selected);

  return (
    <div>
      <OrgChart
        aria-label="Torphy LLC"
        people={people}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <p aria-live="polite">
        {person
          ? `${person.name ?? "Open position"}, ${person.title}. ${
              manager ? `Reports to ${manager.name}.` : "At the top."
            } ${reports.length} direct ${reports.length === 1 ? "report" : "reports"}.`
          : "No one is chosen. Click a card, or press Enter on one."}
      </p>
    </div>
  );
}

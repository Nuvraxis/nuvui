"use client";

import { OrgChart } from "@nuvui/org-chart";
import { people } from "./people";

// Smaller cards, with the name and the department and nothing else.
export default function CustomCard() {
  return (
    <OrgChart
      aria-label="Torphy LLC"
      people={people}
      cardSize={{ width: 200, height: 52 }}
      renderCard={(person) => (
        <span>
          <strong>{person.name ?? "Open position"}</strong>
          <br />
          {person.department}
        </span>
      )}
    />
  );
}

import { OrgChart } from "@nuvui/org-chart";
import { people } from "./people";

export default function Horizontal() {
  return (
    <OrgChart
      aria-label="Torphy LLC"
      people={people}
      orientation="horizontal"
    />
  );
}

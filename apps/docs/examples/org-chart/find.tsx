import { OrgChart } from "@nuvui/org-chart";
import { people } from "./people";

// Only the chief executive's team is open. Finding someone further down
// opens the way to them.
export default function Find() {
  return (
    <OrgChart aria-label="Torphy LLC" people={people} defaultExpanded={["1"]} />
  );
}

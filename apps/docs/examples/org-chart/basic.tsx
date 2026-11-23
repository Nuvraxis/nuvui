import { OrgChart } from "@nuvui/org-chart";
import { people } from "./people";

export default function Basic() {
  return <OrgChart aria-label="Torphy LLC" people={people} />;
}

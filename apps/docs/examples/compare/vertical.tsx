import { Compare } from "@nuvui/react";
import { dashboardAfter, dashboardBefore } from "./pictures";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <Compare
        orientation="vertical"
        beforeLabel="Old"
        afterLabel="New"
        dividerLabel="Old and new dashboard"
        before={<img src={dashboardBefore} alt="The old dashboard, a table" />}
        after={
          <img
            src={dashboardAfter}
            alt="The new dashboard, with three figures and a bar chart"
          />
        }
      />
    </div>
  );
}

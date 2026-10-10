import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nuvui/react/card";
import { Stat, StatDescription, StatLabel, StatValue } from "@nuvui/react/stat";
import { Trend } from "@nuvui/react/trend";
import { ChannelsChart, RevenueChart } from "./charts";
import { figures } from "./data";
import { OrdersTable } from "./orders";

// A dashboard for a made-up shop, built from the library and nothing else:
// figures, cards, two charts and a data table. It isn't a picture of one. It
// takes its colors from the page's theme like any other part of the page.
export function Dashboard() {
  return (
    <div className="site-dashboard">
      <ul className="site-dashboard__figures">
        {figures.map((figure) => (
          <li key={figure.label}>
            <Stat className="site-dashboard__figure">
              <StatLabel>{figure.label}</StatLabel>
              <StatValue>{figure.value}</StatValue>
              <StatDescription>
                <Trend value={figure.change} good={figure.good}>
                  {figure.said}
                </Trend>{" "}
                {figure.note}
              </StatDescription>
            </Stat>
          </li>
        ))}
      </ul>
      <div className="site-dashboard__charts">
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h3>Revenue</h3>
            </CardTitle>
            <CardDescription>Each month against its target.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h3>Channels</h3>
            </CardTitle>
            <CardDescription>Orders and returns in October.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChannelsChart />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h3>Recent orders</h3>
          </CardTitle>
          <CardDescription>
            Sort by a heading, search, or choose the columns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersTable />
        </CardContent>
      </Card>
    </div>
  );
}

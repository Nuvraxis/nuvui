"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  PinnedList,
  PinnedListItem,
} from "@nuvui/react";
import { ChartColumn, Ellipsis } from "lucide-react";
import { useState } from "react";
import "./pinned-reports.scss";

interface Report {
  name: string;
  owner: string;
  updated: string;
}

const reports: Record<string, Report> = {
  revenue: { name: "Revenue by month", owner: "Finance", updated: "Today" },
  churn: {
    name: "Churn by plan",
    owner: "Customer success",
    updated: "Yesterday",
  },
  pipeline: { name: "Sales pipeline", owner: "Sales", updated: "Today" },
  hiring: { name: "Hiring plan", owner: "People", updated: "3 days ago" },
  seats: { name: "Seats in use", owner: "Product", updated: "Last week" },
  tickets: {
    name: "Support tickets by topic",
    owner: "Support",
    updated: "Yesterday",
  },
};

export default function PinnedReports() {
  // In an app this is saved with the person's settings, for their next
  // visit.
  const [pinned, setPinned] = useState(["pipeline", "revenue"]);

  return (
    <main className="pinned-reports">
      <header className="pinned-reports__header">
        <div>
          <h1 className="pinned-reports__title">Reports</h1>
          <p className="pinned-reports__lead">
            Pin the ones you use most, and they stay at the top.
          </p>
        </div>
        <Button>New report</Button>
      </header>
      <PinnedList
        items={Object.keys(reports)}
        pinned={pinned}
        onPinnedChange={setPinned}
        pinnedLabel="Pinned reports"
        restLabel="All reports"
        className="pinned-reports__list"
      >
        {(id) => {
          const report = reports[id] as Report;
          return (
            <PinnedListItem value={id} label={report.name}>
              <div className="pinned-reports__item">
                <span className="pinned-reports__icon">
                  <ChartColumn aria-hidden="true" size={16} />
                </span>
                <div className="pinned-reports__text">
                  <a href={`#${id}`} className="pinned-reports__name">
                    {report.name}
                  </a>
                  <span className="pinned-reports__meta">
                    {report.owner}, updated {report.updated.toLowerCase()}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      intent="ghost"
                      size="sm"
                      className="pinned-reports__menu"
                      aria-label={`More for ${report.name}`}
                    >
                      <Ellipsis aria-hidden="true" size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </PinnedListItem>
          );
        }}
      </PinnedList>
    </main>
  );
}

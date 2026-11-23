"use client";

import { OrgChart, type OrgChartHandle } from "@nuvui/org-chart";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
} from "@nuvui/react";
import { useMemo, useRef, useState } from "react";
import { company, type Employee, people } from "./people";
import "./company-chart.scss";

const kinds: Record<string, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contractor: "Contractor",
  intern: "Intern",
};

const joined = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});

const nameOf = (person: Employee) => person.name ?? "Open position";

const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

export default function CompanyChart() {
  const chart = useRef<OrgChartHandle>(null);
  const top = people.find((person) => !person.managerId);
  const [selected, setSelected] = useState<string | null>(top?.id ?? null);
  const byId = useMemo(
    () => new Map(people.map((person) => [person.id, person])),
    [],
  );
  const person = selected ? byId.get(selected) : undefined;
  const manager = person?.managerId ? byId.get(person.managerId) : undefined;
  const reports = people.filter((each) => each.managerId === selected);
  const open = people.filter((each) => each.vacant).length;

  // Chooses someone from the panel, and shows them in the chart.
  const go = (id: string) => {
    setSelected(id);
    chart.current?.reveal(id);
  };

  return (
    <div className="company-chart">
      <header className="company-chart__head">
        <h1 className="company-chart__title">{company.name}</h1>
        <p className="company-chart__text">
          {company.industry}. {people.length - open} people and {open} open{" "}
          {open === 1 ? "position" : "positions"}. Find someone by name, title
          or department, or choose a card to see who they report to.
        </p>
      </header>
      <div className="company-chart__body">
        <OrgChart
          aria-label={`${company.name}, who reports to whom`}
          className="company-chart__chart"
          people={people}
          defaultExpanded={top ? [top.id] : []}
          selected={selected}
          onSelectedChange={setSelected}
          handleRef={chart}
        />
        {person ? (
          <section
            className="company-chart__panel"
            aria-labelledby="company-chart-person"
          >
            <div className="company-chart__person">
              {person.vacant ? null : (
                <Avatar size="lg">
                  {person.avatar && <AvatarImage src={person.avatar} alt="" />}
                  <AvatarFallback>{initials(nameOf(person))}</AvatarFallback>
                </Avatar>
              )}
              <div>
                <h2 id="company-chart-person" className="company-chart__name">
                  {nameOf(person)}
                </h2>
                <p className="company-chart__role">{person.title}</p>
              </div>
            </div>
            {person.badge || person.vacant ? (
              <p className="company-chart__status">
                <Badge intent={person.vacant ? "primary" : "warning"}>
                  {person.vacant ? "Hiring" : person.badge}
                </Badge>
              </p>
            ) : null}
            <dl className="company-chart__facts">
              <dt>Department</dt>
              <dd>{person.department}</dd>
              <dt>Reports to</dt>
              <dd>
                {manager ? (
                  <Button
                    intent="ghost"
                    size="sm"
                    className="company-chart__link"
                    onClick={() => go(manager.id)}
                  >
                    {nameOf(manager)}
                  </Button>
                ) : (
                  "No one, at the top"
                )}
              </dd>
              {person.employmentType ? (
                <>
                  <dt>Works</dt>
                  <dd>{kinds[person.employmentType]}</dd>
                </>
              ) : null}
              {person.hireDate ? (
                <>
                  <dt>Joined</dt>
                  <dd>{joined.format(new Date(person.hireDate))}</dd>
                </>
              ) : null}
              {person.email ? (
                <>
                  <dt>Email</dt>
                  <dd className="company-chart__email">{person.email}</dd>
                </>
              ) : null}
            </dl>
            {reports.length > 0 ? (
              <div className="company-chart__reports">
                <h3 className="company-chart__subtitle">
                  {reports.length} direct{" "}
                  {reports.length === 1 ? "report" : "reports"}
                </h3>
                <ul className="company-chart__list">
                  {reports.map((report) => (
                    <li key={report.id}>
                      <Button
                        intent="ghost"
                        size="sm"
                        className="company-chart__link"
                        onClick={() => go(report.id)}
                      >
                        {nameOf(report)}
                      </Button>
                      <span className="company-chart__muted">
                        {report.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : (
          <p className="company-chart__panel company-chart__muted">
            No one is chosen. Choose a card, or press Enter on one.
          </p>
        )}
      </div>
    </div>
  );
}

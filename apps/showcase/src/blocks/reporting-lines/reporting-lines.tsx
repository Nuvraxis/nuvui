"use client";

import { OrgChart } from "@nuvui/org-chart";
import { Button, NativeSelect } from "@nuvui/react";
import { useId, useMemo, useState } from "react";
import { companies } from "./companies";
import "./reporting-lines.scss";

const managersIn = (people: (typeof companies)[number]["people"]) => [
  ...new Set(
    people.flatMap((person) => (person.managerId ? [person.managerId] : [])),
  ),
];

export default function ReportingLines() {
  const selectId = useId();
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const company =
    companies.find((each) => each.id === companyId) ?? companies[0];
  const people = company?.people ?? [];
  const managers = useMemo(() => managersIn(people), [people]);
  const top = people.find((person) => !person.managerId)?.id;
  // Kept here, so that the buttons can open and close every team at once,
  // and a new company starts with only its top team open.
  const [expanded, setExpanded] = useState<string[]>(top ? [top] : []);

  const choose = (id: string) => {
    setCompanyId(id);
    const next = companies.find((each) => each.id === id);
    const head = next?.people.find((person) => !person.managerId)?.id;
    setExpanded(head ? [head] : []);
  };

  return (
    <div className="reporting-lines">
      <header className="reporting-lines__head">
        <div>
          <h1 className="reporting-lines__title">Reporting lines</h1>
          <p className="reporting-lines__text">
            Who reports to whom in each company of the group, from the left.
            Open a team with its button, or with the right arrow.
          </p>
        </div>
        <div className="reporting-lines__tools">
          <label className="reporting-lines__label" htmlFor={selectId}>
            Company
          </label>
          <NativeSelect
            id={selectId}
            value={companyId}
            onChange={(event) => choose(event.target.value)}
          >
            {companies.map((each) => (
              <option key={each.id} value={each.id}>
                {each.name}
              </option>
            ))}
          </NativeSelect>
          <Button
            intent="secondary"
            size="sm"
            disabled={expanded.length === managers.length}
            onClick={() => setExpanded(managers)}
          >
            Open every team
          </Button>
          <Button
            intent="secondary"
            size="sm"
            disabled={expanded.length === 0}
            onClick={() => setExpanded([])}
          >
            Close every team
          </Button>
        </div>
      </header>
      <OrgChart
        // A new company is a new chart, fitted again.
        key={company?.id}
        aria-label={`${company?.name ?? ""}, who reports to whom`}
        className="reporting-lines__chart"
        people={people}
        orientation="horizontal"
        expanded={expanded}
        onExpandedChange={setExpanded}
      />
      <p className="reporting-lines__note">
        {company?.industry}. {people.length} people,{" "}
        {people.filter((person) => person.badge).length} of them on leave.
      </p>
    </div>
  );
}

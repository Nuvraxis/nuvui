"use client";

import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
  ToggleGroup,
  ToggleGroupItem,
  VisuallyHidden,
} from "@nuvui/react";
import { FolderOpen, Plus } from "lucide-react";
import { useState } from "react";
import "./page-states.scss";

// Made-up projects. Nothing here is real data.
const projects = [
  { id: "website", name: "Website redesign", about: "14 tasks, 3 overdue" },
  { id: "billing", name: "Billing migration", about: "8 tasks, none overdue" },
  { id: "handbook", name: "Team handbook", about: "22 tasks, 1 overdue" },
];

const states = ["Loaded", "Loading", "Empty", "Error"] as const;
type State = (typeof states)[number];

const said = {
  Loaded: "3 projects",
  Loading: "Loading the projects",
  Empty: "No projects",
  Error: "",
} as const satisfies Record<State, string>;

export default function PageStates() {
  // In an app this comes from the request for the projects. The buttons
  // are here to show each state.
  const [state, setState] = useState<State>("Loading");

  return (
    <main className="page-states">
      <header className="page-states__head">
        <h1 className="page-states__title">Projects</h1>
        <ToggleGroup
          type="single"
          aria-label="State to show"
          value={state}
          onValueChange={(value) => value && setState(value as State)}
        >
          {states.map((name) => (
            <ToggleGroupItem key={name} value={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </header>
      <section
        className="page-states__body"
        aria-label="Projects"
        aria-busy={state === "Loading"}
      >
        {state === "Loaded" ? (
          <ul className="page-states__list">
            {projects.map((project) => (
              <li key={project.id} className="page-states__item">
                <a className="page-states__link" href={`#${project.id}`}>
                  {project.name}
                </a>
                <span className="page-states__about">{project.about}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {/* As many placeholders as a first screen of rows, each the shape
            of a row. They're hidden from screen readers, and the status
            below says what's going on. */}
        {state === "Loading" ? (
          <ul className="page-states__list">
            {projects.map((project) => (
              <li key={project.id} className="page-states__item">
                <Skeleton shape="text" className="page-states__bone" />
                <Skeleton
                  shape="text"
                  className="page-states__bone page-states__bone--short"
                />
              </li>
            ))}
          </ul>
        ) : null}
        {state === "Empty" ? (
          <Empty className="page-states__empty">
            <EmptyMedia>
              <FolderOpen aria-hidden="true" size={24} />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              A project holds the tasks, files and people for one piece of work.
            </EmptyDescription>
            <EmptyActions>
              <Button>
                <Plus aria-hidden="true" size={16} />
                New project
              </Button>
              <Button intent="secondary">Import from a file</Button>
            </EmptyActions>
          </Empty>
        ) : null}
        {/* An alert is read out when it appears, so the status below has
            nothing to add. */}
        {state === "Error" ? (
          <Alert intent="danger">
            <AlertTitle>The projects couldn't be loaded</AlertTitle>
            <AlertDescription>
              The server didn't answer. Nothing has been lost, and trying again
              is safe.
            </AlertDescription>
            <AlertActions>
              <Button size="sm" onClick={() => setState("Loading")}>
                Try again
              </Button>
              <Button size="sm" intent="ghost" asChild>
                <a href="#status">Service status</a>
              </Button>
            </AlertActions>
          </Alert>
        ) : null}
      </section>
      <VisuallyHidden role="status">{said[state]}</VisuallyHidden>
    </main>
  );
}

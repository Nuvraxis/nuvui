"use client";

import { HexagonBackground } from "@nuvui/backgrounds/hexagon-background";
import { Button } from "@nuvui/react";
import { FolderPlus, Pause, Play, Upload } from "lucide-react";
import { useState } from "react";
import "./empty-projects.scss";

export default function EmptyProjects() {
  // Anything that moves for more than five seconds needs a way to stop it.
  const [paused, setPaused] = useState(false);

  return (
    <main className="empty-projects">
      <header className="empty-projects__header">
        <h1 className="empty-projects__title">Projects</h1>
      </header>
      <HexagonBackground
        className="empty-projects__empty"
        scrim="soft"
        paused={paused}
      >
        <div className="empty-projects__inner">
          <span className="empty-projects__icon">
            <FolderPlus aria-hidden="true" size={24} />
          </span>
          <h2 className="empty-projects__heading">No projects yet</h2>
          <p className="empty-projects__text">
            A project holds its tasks, files and the people working on it. Start
            one, or bring them over from a spreadsheet.
          </p>
          <div className="empty-projects__actions">
            <Button>
              <FolderPlus aria-hidden="true" size={16} />
              New project
            </Button>
            <Button intent="secondary">
              <Upload aria-hidden="true" size={16} />
              Import
            </Button>
          </div>
        </div>
        <Button
          intent="ghost"
          size="sm"
          className="empty-projects__pause"
          aria-pressed={paused}
          onClick={() => setPaused((now) => !now)}
        >
          {paused ? (
            <Play aria-hidden="true" size={16} />
          ) : (
            <Pause aria-hidden="true" size={16} />
          )}
          Pause the background
        </Button>
      </HexagonBackground>
    </main>
  );
}

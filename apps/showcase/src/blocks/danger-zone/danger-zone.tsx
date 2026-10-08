"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Field,
  FieldControl,
  FieldLabel,
  Input,
} from "@nuvui/react";
import { useState } from "react";
import "./danger-zone.scss";

// What has to be typed. It's the workspace's own name, so it can't be
// typed by habit.
const workspace = "acme-production";

export default function DangerZone() {
  const [archived, setArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleted, setDeleted] = useState(false);

  return (
    <main className="danger-zone">
      <header className="danger-zone__head">
        <h1 className="danger-zone__title">Danger zone</h1>
        <p className="danger-zone__text">
          What's here changes the workspace for everyone in it.
        </p>
      </header>
      <ul className="danger-zone__list">
        <li className="danger-zone__item">
          <div className="danger-zone__about">
            <h2 className="danger-zone__name">
              {archived ? "Restore this workspace" : "Archive this workspace"}
            </h2>
            <p className="danger-zone__hint">
              {archived
                ? "It's read-only now. Restoring it lets people change it again."
                : "Makes it read-only. Nothing is removed, and it can be restored."}
            </p>
          </div>
          {/* Archive or restore it from here. */}
          <Button
            intent="secondary"
            disabled={deleted}
            onClick={() => setArchived((value) => !value)}
          >
            {archived ? "Restore" : "Archive"}
          </Button>
        </li>
        <li className="danger-zone__item">
          <div className="danger-zone__about">
            <h2 className="danger-zone__name">Delete this workspace</h2>
            <p className="danger-zone__hint">
              Removes its projects, files and members for good. This can't be
              undone.
            </p>
          </div>
          <AlertDialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              // Whatever was typed is gone the next time it opens.
              setTyped("");
            }}
          >
            <AlertDialogTrigger asChild>
              <Button intent="danger" disabled={deleted}>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete {workspace}?</AlertDialogTitle>
              <AlertDialogDescription>
                Its 14 projects and 312 files will be removed, and its 18
                members will lose access. This can't be undone.
              </AlertDialogDescription>
              <Field className="danger-zone__confirm">
                <FieldLabel>
                  Type <span className="danger-zone__code">{workspace}</span> to
                  confirm
                </FieldLabel>
                <FieldControl>
                  <Input
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </FieldControl>
              </Field>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep the workspace</AlertDialogCancel>
                {/* Delete it from here. */}
                <AlertDialogAction
                  intent="danger"
                  disabled={typed !== workspace}
                  onClick={() => setDeleted(true)}
                >
                  Delete the workspace
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </li>
      </ul>
      {/* Always in the page, so that what's put in it is read out. */}
      <p className="danger-zone__status" role="status">
        {deleted ? `${workspace} has been deleted.` : null}
      </p>
    </main>
  );
}

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
} from "@nuvui/react";
import { type MouseEvent, useRef, useState } from "react";

// Stands in for a request to your server. So that both endings can be
// seen, the first one fails and the next goes through.
let tried = 0;
async function revokeAccess() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  tried += 1;
  if (tried === 1) throw new Error("The server didn't answer.");
}

export default function Example() {
  const [open, setOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [problem, setProblem] = useState("");
  const status = useRef<HTMLParagraphElement>(null);

  async function revoke(event: MouseEvent) {
    // Keeps the dialog open. It closes below, once the request is through.
    event.preventDefault();
    setRevoking(true);
    setProblem("");
    try {
      await revokeAccess();
      setRevoked(true);
      setOpen(false);
    } catch {
      // It didn't go through, so the dialog stays, says so, and can be
      // tried again or left.
      setProblem("Access couldn't be revoked. Try again.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setProblem("");
        }}
      >
        <AlertDialogTrigger asChild>
          <Button intent="secondary" disabled={revoked}>
            Revoke access
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent
          size="sm"
          onCloseAutoFocus={(event) => {
            // Once it's done, the button that opened this is disabled and
            // can't take the focus back. The line that says what happened
            // takes it.
            if (!revoked) return;
            event.preventDefault();
            status.current?.focus();
          }}
        >
          <AlertDialogTitle>Revoke Sam's access?</AlertDialogTitle>
          <AlertDialogDescription>
            Sam will be signed out and won't be able to open the workspace.
          </AlertDialogDescription>
          {problem && (
            <p role="alert" style={{ margin: 0, color: "var(--color-danger)" }}>
              {problem}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>
              Keep access
            </AlertDialogCancel>
            <AlertDialogAction
              intent="danger"
              disabled={revoking}
              onClick={revoke}
            >
              {revoking ? "Revoking" : "Revoke access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p ref={status} tabIndex={-1} style={{ margin: 0, fontSize: 14 }}>
        {revoked ? "Sam no longer has access." : "Sam has access."}
      </p>
    </div>
  );
}

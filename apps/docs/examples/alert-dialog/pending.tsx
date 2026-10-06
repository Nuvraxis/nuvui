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
import { type MouseEvent, useState } from "react";

export default function Example() {
  const [open, setOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);

  async function revoke(event: MouseEvent) {
    // Keeps the dialog open. It closes below, once the request is through.
    event.preventDefault();
    setRevoking(true);
    // Stands in for a request to your server.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setRevoking(false);
    setRevoked(true);
    setOpen(false);
  }

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button intent="secondary" disabled={revoked}>
            Revoke access
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogTitle>Revoke Sam's access?</AlertDialogTitle>
          <AlertDialogDescription>
            Sam will be signed out and won't be able to open the workspace.
          </AlertDialogDescription>
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
      <p style={{ margin: 0, fontSize: 14 }}>
        {revoked ? "Sam no longer has access." : "Sam has access."}
      </p>
    </div>
  );
}

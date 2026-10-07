"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nuvui/react";
import { useRef, useState } from "react";

export default function Example() {
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={menuButton} intent="secondary" disabled={deleted}>
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            intent="danger"
            onSelect={() => setConfirming(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Next to the menu, not inside the item. The menu takes its items off
          the page when it closes, and the dialog would go with them. */}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent
          size="sm"
          // The dialog would put focus back where it was when it opened,
          // which is the menu item, and that's gone. Send it to the button.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            menuButton.current?.focus();
          }}
        >
          <AlertDialogTitle>Delete report.pdf?</AlertDialogTitle>
          <AlertDialogDescription>
            It goes to the trash, and is removed for good after 30 days.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction intent="danger" onClick={() => setDeleted(true)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p style={{ margin: 0, fontSize: 14 }}>
        {deleted ? "report.pdf is in the trash." : "report.pdf"}
      </p>
    </div>
  );
}

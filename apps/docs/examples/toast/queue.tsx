"use client";

import { Button, toast } from "@nuvui/react";

const messages = [
  "Draft saved",
  "Link copied",
  "Invitation sent",
  "Export ready",
  "Comment posted",
];

export default function Example() {
  function send() {
    for (const message of messages) toast(message);
  }

  return <Button onClick={send}>Send five toasts</Button>;
}

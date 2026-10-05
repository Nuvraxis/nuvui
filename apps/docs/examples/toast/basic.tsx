"use client";

import { Button, toast } from "@nuvui/react";

export default function Example() {
  return <Button onClick={() => toast("Changes saved")}>Save changes</Button>;
}

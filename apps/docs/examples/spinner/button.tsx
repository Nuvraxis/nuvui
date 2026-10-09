"use client";

import { Button, Spinner } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    setTimeout(() => setSaving(false), 2000);
  }

  return (
    // aria-disabled keeps the button in the tab order while it works, so
    // focus isn't thrown back to the top of the page.
    <Button aria-disabled={saving} onClick={saving ? undefined : save}>
      {saving ? <Spinner size="sm" label="Saving" /> : null}
      Save changes
    </Button>
  );
}

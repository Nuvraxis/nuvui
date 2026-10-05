"use client";

import { Button, toast } from "@nuvui/react";

export default function Example() {
  function upload() {
    // Stays until the same id is used again below.
    const id = toast("Uploading photo.jpg", { duration: Infinity });

    setTimeout(() => {
      toast("photo.jpg uploaded", { id, intent: "success" });
    }, 2000);
  }

  return <Button onClick={upload}>Upload a photo</Button>;
}

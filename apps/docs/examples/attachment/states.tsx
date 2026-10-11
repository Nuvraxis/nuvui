"use client";

import { Attachment, Attachments } from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useState } from "react";

const all = [
  { name: "contract-draft.docx", size: 48_200 },
  { name: "site-photos.zip", size: 18_400_000, uploading: true },
  {
    name: "scan-0042.tiff",
    size: 61_000_000,
    error: "Too large. The limit is 25 MB.",
  },
];

export default function Example() {
  const [files, setFiles] = useState(all);

  return (
    <div style={{ display: "grid", gap: "0.75rem", justifyItems: "start" }}>
      <Attachments aria-label="Files to send">
        {files.map((file) => (
          <Attachment
            key={file.name}
            {...file}
            onRemove={() =>
              setFiles((now) => now.filter((other) => other !== file))
            }
          />
        ))}
      </Attachments>
      <p role="status" style={{ margin: 0 }}>
        {files.length} of 3 files left.
      </p>
      <Button intent="secondary" size="sm" onClick={() => setFiles(all)}>
        Put them back
      </Button>
    </div>
  );
}

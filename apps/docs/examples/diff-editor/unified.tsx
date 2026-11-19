"use client";

import { DiffEditor } from "@nuvui/editor/code";

const before = `{
  "name": "harbor-dashboard",
  "version": "2.3.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
`;

const after = `{
  "name": "harbor-dashboard",
  "version": "2.4.0",
  "scripts": {
    "dev": "vite --port 4100",
    "build": "vite build",
    "preview": "vite preview"
  }
}
`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <DiffEditor
        aria-label="Changes to package.json"
        original={before}
        defaultModified={after}
        language="json"
        defaultLayout="unified"
      />
    </div>
  );
}

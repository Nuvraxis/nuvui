"use client";

import { Checkbox } from "@nuvui/react";
import { useState } from "react";

const files = ["invoice.pdf", "notes.txt", "photo.jpg"];
const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  const [selected, setSelected] = useState<string[]>(["notes.txt"]);

  const all = selected.length === files.length;
  const some = selected.length > 0 && !all;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={row}>
        <Checkbox
          id="files-all"
          checked={some ? "indeterminate" : all}
          onCheckedChange={(checked) => setSelected(checked ? files : [])}
        />
        <label htmlFor="files-all">Select all</label>
      </div>
      {files.map((file) => (
        <div key={file} style={{ ...row, paddingInlineStart: 28 }}>
          <Checkbox
            id={`file-${file}`}
            checked={selected.includes(file)}
            onCheckedChange={(checked) =>
              setSelected(
                checked
                  ? [...selected, file]
                  : selected.filter((name) => name !== file),
              )
            }
          />
          <label htmlFor={`file-${file}`}>{file}</label>
        </div>
      ))}
    </div>
  );
}

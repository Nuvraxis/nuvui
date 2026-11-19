"use client";

import { CodeEditor } from "@nuvui/editor/code";
import { useState } from "react";

const start = `def restock(stock, threshold=12):
    """The items that have run low, most urgent first."""
    low = [item for item in stock if item["count"] < threshold]
    return sorted(low, key=lambda item: item["count"])
`;

export default function Example() {
  const [language, setLanguage] = useState("python");

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 720,
      }}
    >
      <CodeEditor
        aria-label="Restock helper"
        language={language}
        onLanguageChange={setLanguage}
        defaultValue={start}
      />
      <p style={{ margin: 0, fontSize: 14 }}>
        Colored as {language || "plain text"}. Pick another in the toolbar.
      </p>
    </div>
  );
}

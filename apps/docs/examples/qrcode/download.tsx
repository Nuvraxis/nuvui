"use client";

import { QRCode, saveCode } from "@nuvui/barcodes";
import { Button } from "@nuvui/react";
import { useRef } from "react";

export default function Example() {
  const code = useRef<SVGSVGElement>(null);

  function save(format: "svg" | "png") {
    if (code.current) saveCode(code.current, { name: "nuvui-docs", format });
  }

  return (
    <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
      <QRCode
        ref={code}
        value="https://nuvui.nuvraxis.com/docs"
        aria-label="Open the nuvui docs"
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <Button intent="secondary" onClick={() => save("svg")}>
          Save as SVG
        </Button>
        <Button intent="secondary" onClick={() => save("png")}>
          Save as PNG
        </Button>
      </div>
    </div>
  );
}

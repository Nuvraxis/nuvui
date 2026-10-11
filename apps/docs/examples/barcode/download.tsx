"use client";

import { Barcode, saveCode } from "@nuvui/barcodes";
import { Button } from "@nuvui/react";
import { useRef } from "react";

export default function Example() {
  const code = useRef<SVGSVGElement>(null);

  function save(format: "svg" | "png") {
    if (code.current) saveCode(code.current, { name: "parcel-7781", format });
  }

  return (
    <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
      <Barcode ref={code} value="PARCEL-7781" aria-label="Parcel 7781" />
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

"use client";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarTrigger,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [ruler, setRuler] = useState(true);
  const [zoom, setZoom] = useState("100");

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <Menubar aria-label="Document">
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked={ruler} onCheckedChange={setRuler}>
              Show ruler
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
              <MenubarLabel>Zoom</MenubarLabel>
              <MenubarRadioItem value="50">50%</MenubarRadioItem>
              <MenubarRadioItem value="100">100%</MenubarRadioItem>
              <MenubarRadioItem value="200">200%</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p style={{ margin: 0, fontSize: 14 }}>
        Zoom {zoom}%, ruler {ruler ? "shown" : "hidden"}
      </p>
    </div>
  );
}

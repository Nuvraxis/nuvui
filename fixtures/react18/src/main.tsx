import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "@nuvui/table/styles.css";
import "@nuvui/charts/styles.css";
import "@nuvui/barcodes/styles.css";
import "@nuvui/chat/styles.css";
import "@nuvui/kanban/styles.css";
import "@nuvui/editor/styles.css";
import "@nuvui/emoji/styles.css";
import "@nuvui/map/styles.css";
import "@nuvui/flow/styles.css";
import { setMapWorkerUrl } from "@nuvui/map/map";
import { DirectionProvider } from "@nuvui/react/direction";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { StrictMode } from "react";
// React 18's way in, which React 19 keeps.
import { createRoot } from "react-dom/client";
import { App } from "./app";

setMapWorkerUrl(mapWorkerUrl);

const root = document.getElementById("root");
if (!root) throw new Error("no #root element");
createRoot(root).render(
  <StrictMode>
    <DirectionProvider dir="ltr">
      <App />
    </DirectionProvider>
  </StrictMode>,
);

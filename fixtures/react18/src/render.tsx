// The app as HTML, rendered by React 18's own server renderer. Every
// component's render runs here on React 18: a hook or an API that only
// React 19 has fails the render, and the build alone wouldn't show it.
import { DirectionProvider } from "@nuvui/react/direction";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./app";

export function render() {
  return renderToString(
    <StrictMode>
      <DirectionProvider dir="ltr">
        <App />
      </DirectionProvider>
    </StrictMode>,
  );
}

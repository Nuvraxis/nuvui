import { server } from "vitest/browser";

// Whether the Tab key stops at links. In Safari it only stops at fields and
// buttons, unless "Press Tab to highlight each item on a webpage" is turned
// on in its settings, and WebKit here behaves the same. That's the browser's
// choice and not something a component can change, so the tests that walk
// through links with Tab only run where Tab does that.
export const tabsToLinks = server.browser !== "webkit";

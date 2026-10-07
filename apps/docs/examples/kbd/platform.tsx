import { Kbd } from "@nuvui/react";

export default function Example() {
  return (
    <p style={{ margin: 0 }}>
      Save with{" "}
      <Kbd>
        <abbr title="Command" style={{ textDecoration: "none" }}>
          ⌘
        </abbr>
      </Kbd>{" "}
      + <Kbd>S</Kbd> on a Mac, and <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd> elsewhere.
    </p>
  );
}

import { Separator } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 320, fontSize: 14 }}>
      <p style={{ margin: 0 }}>The order was packed on Monday.</p>
      <Separator decorative={false} style={{ marginBlock: 12 }} />
      <p style={{ margin: 0 }}>A week later, nothing had arrived.</p>
    </div>
  );
}

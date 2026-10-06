import "@nuvui/react/themes/ink.css";
import "@nuvui/react/themes/ledger.css";
import "@nuvui/react/themes/meadow.css";
import "@nuvui/react/themes/ember.css";
import "@nuvui/react/themes/high-contrast.css";
import { Button, Checkbox, Switch } from "@nuvui/react";

const presets = ["ink", "ledger", "meadow", "ember", "high-contrast"];

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      {presets.map((preset) => (
        <section
          key={preset}
          data-preset={preset}
          aria-label={preset}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            padding: 16,
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--color-background)",
            color: "var(--color-foreground)",
          }}
        >
          <code style={{ inlineSize: "7.5rem" }}>{preset}</code>
          <Button>Save</Button>
          <Button intent="secondary">Cancel</Button>
          <Checkbox aria-label={`A checkbox in ${preset}`} defaultChecked />
          <Switch aria-label={`A switch in ${preset}`} defaultChecked />
        </section>
      ))}
    </div>
  );
}

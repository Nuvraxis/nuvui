import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
} from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 24,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Field>
        <FieldLabel>Role</FieldLabel>
        <Select defaultValue="editor">
          {/* The control is the trigger, so that's what gets wrapped. */}
          <FieldControl>
            <SelectTrigger style={{ "--nuv-select-width": "100%" } as never}>
              <SelectValue />
            </SelectTrigger>
          </FieldControl>
          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>
          Editors can change pages and not settings.
        </FieldDescription>
      </Field>

      <Field>
        {/* A group isn't something a <label> can point at. */}
        <FieldLabel asChild>
          <span>Billing period</span>
        </FieldLabel>
        <FieldControl>
          <RadioGroup defaultValue="year">
            <div style={row}>
              <RadioGroupItem value="month" id="field-month" />
              <label htmlFor="field-month">Monthly</label>
            </div>
            <div style={row}>
              <RadioGroupItem value="year" id="field-year" />
              <label htmlFor="field-year">Yearly</label>
            </div>
          </RadioGroup>
        </FieldControl>
      </Field>

      <Field>
        <FieldLabel>Storage limit</FieldLabel>
        <FieldControl>
          <Slider defaultValue={[40]} step={10} />
        </FieldControl>
        <FieldDescription>In gigabytes, from 0 to 100.</FieldDescription>
      </Field>
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";

const field = { display: "grid", gap: 6 };

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={field}>
        <label htmlFor="plan-disabled">Disabled</label>
        <Select disabled defaultValue="free">
          <SelectTrigger id="plan-disabled">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div style={field}>
        <label htmlFor="plan-invalid">Invalid</label>
        <Select>
          <SelectTrigger
            id="plan-invalid"
            aria-invalid
            aria-describedby="plan-error"
          >
            <SelectValue placeholder="Pick a plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="team">Team</SelectItem>
          </SelectContent>
        </Select>
        <span id="plan-error" style={{ color: "var(--color-danger)" }}>
          Pick a plan to continue.
        </span>
      </div>
    </div>
  );
}

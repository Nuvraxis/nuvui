import { Label, Textarea } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 400,
      }}
    >
      <Label htmlFor="textarea-reply">Reply</Label>
      <Textarea
        id="textarea-reply"
        autoResize
        rows={2}
        defaultValue="Thanks for the report. We found the cause and a fix is on its way."
        style={
          {
            "--nuv-textarea-min-height": "0px",
            "--nuv-textarea-max-height": "12rem",
          } as never
        }
      />
    </div>
  );
}

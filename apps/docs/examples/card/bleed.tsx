import {
  AspectRatio,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Card
      style={{
        width: "100%",
        maxWidth: 320,
        paddingBlockStart: 0,
        overflow: "hidden",
      }}
    >
      <AspectRatio ratio={16 / 9}>
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary), var(--color-success))",
          }}
        />
      </AspectRatio>
      <CardHeader>
        <CardTitle asChild>
          <h4>Quarterly report</h4>
        </CardTitle>
        <CardDescription>Updated on 4 July</CardDescription>
      </CardHeader>
    </Card>
  );
}

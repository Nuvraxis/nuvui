import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Card style={{ width: "100%", maxWidth: 380 }}>
      <CardHeader>
        <CardTitle>Production</CardTitle>
        <CardDescription>eu-west, deployed 12 minutes ago</CardDescription>
        <CardAction>
          <Badge intent="success">Healthy</Badge>
          <Button intent="ghost" size="sm">
            Logs
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        All 14 checks passed on the last deploy. The next one is scheduled for
        tonight.
      </CardContent>
    </Card>
  );
}

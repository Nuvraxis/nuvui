import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Card style={{ width: "100%", maxWidth: 380 }}>
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Billed once a year, on 1 March.</CardDescription>
      </CardHeader>
      <CardContent>
        Twelve seats, four of them in use. Seats you don't use aren't charged
        until someone is invited to them.
      </CardContent>
      <CardFooter>
        <Button intent="secondary">Change plan</Button>
        <Button>Add seats</Button>
      </CardFooter>
    </Card>
  );
}

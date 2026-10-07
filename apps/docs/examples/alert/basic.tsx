import { Alert, AlertDescription, AlertTitle } from "@nuvui/react";

export default function Example() {
  return (
    <Alert style={{ width: "100%", maxWidth: 480 }}>
      <AlertTitle>Maintenance on Saturday</AlertTitle>
      <AlertDescription>
        Reports will be read-only from 22:00 to midnight while the database is
        moved.
      </AlertDescription>
    </Alert>
  );
}

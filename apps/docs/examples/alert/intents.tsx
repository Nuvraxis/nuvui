import { Alert, AlertDescription, AlertTitle } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        width: "100%",
        maxWidth: 480,
      }}
    >
      <Alert intent="info">
        <AlertTitle>A new version is ready</AlertTitle>
        <AlertDescription>Reload the page to get it.</AlertDescription>
      </Alert>
      <Alert intent="success">
        <AlertTitle>Invoice sent</AlertTitle>
        <AlertDescription>
          Northwind Traders will get it by email.
        </AlertDescription>
      </Alert>
      <Alert intent="warning">
        <AlertTitle>Your trial ends in three days</AlertTitle>
        <AlertDescription>
          Add a card to keep the projects you've made.
        </AlertDescription>
      </Alert>
      <Alert intent="danger">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>
          The card ending in 4242 was declined.
        </AlertDescription>
      </Alert>
    </div>
  );
}

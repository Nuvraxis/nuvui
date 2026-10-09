import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
  Button,
} from "@nuvui/react";

export default function Example() {
  return (
    <Alert intent="danger" style={{ width: "100%", maxWidth: 480 }}>
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        The card ending in 4242 was declined. The plan stays active until 1
        March.
      </AlertDescription>
      <AlertActions>
        <Button size="sm">Update the card</Button>
        <Button size="sm" intent="ghost">
          Contact support
        </Button>
      </AlertActions>
    </Alert>
  );
}

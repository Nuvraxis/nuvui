import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormattedNumber,
  Stat,
  StatDescription,
  StatGroup,
  StatLabel,
  StatValue,
} from "@nuvui/react";

export default function Example() {
  return (
    <Card style={{ inlineSize: "100%" }}>
      <CardHeader>
        <CardTitle>This billing period</CardTitle>
      </CardHeader>
      <CardContent>
        <StatGroup>
          <Stat variant="plain">
            <StatLabel>Seats in use</StatLabel>
            <StatValue>
              <FormattedNumber value={42} />
            </StatValue>
            <StatDescription>of 50 on the plan</StatDescription>
          </Stat>
          <Stat variant="plain">
            <StatLabel>Next invoice</StatLabel>
            <StatValue>
              <FormattedNumber value={1260} currency="USD" />
            </StatValue>
            <StatDescription>on 1 November</StatDescription>
          </Stat>
        </StatGroup>
      </CardContent>
    </Card>
  );
}

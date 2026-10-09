import {
  FormattedNumber,
  Stat,
  StatDescription,
  StatGroup,
  StatLabel,
  StatValue,
  Trend,
} from "@nuvui/react";

export default function Example() {
  return (
    <StatGroup style={{ inlineSize: "100%" }}>
      <Stat>
        <StatLabel>Revenue</StatLabel>
        <StatValue>
          <FormattedNumber
            value={48250}
            currency="USD"
            maximumFractionDigits={0}
          />
        </StatValue>
        <StatDescription>
          <Trend value={0.125} /> against last month
        </StatDescription>
      </Stat>
      <Stat>
        <StatLabel>New customers</StatLabel>
        <StatValue>
          <FormattedNumber value={1284} />
        </StatValue>
        <StatDescription>
          <Trend value={-0.032} /> against last month
        </StatDescription>
      </Stat>
      <Stat>
        <StatLabel>Failed payments</StatLabel>
        <StatValue>
          <FormattedNumber value={17} />
        </StatValue>
        <StatDescription>
          <Trend value={-0.31} good="down" /> against last month
        </StatDescription>
      </Stat>
    </StatGroup>
  );
}

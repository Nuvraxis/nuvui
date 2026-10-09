import { Button, VisuallyHidden } from "@nuvui/react";

const rows = [
  ["Northwind Traders", "Paid"],
  ["Contoso", "Overdue"],
];

export default function Example() {
  return (
    <table style={{ borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr>
          <th style={{ padding: 8, textAlign: "start" }}>Customer</th>
          <th style={{ padding: 8, textAlign: "start" }}>Status</th>
          <th style={{ padding: 8 }}>
            <VisuallyHidden>Actions</VisuallyHidden>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([customer, status]) => (
          <tr key={customer}>
            <td style={{ padding: 8 }}>{customer}</td>
            <td style={{ padding: 8 }}>{status}</td>
            <td style={{ padding: 8 }}>
              <Button size="sm" intent="ghost">
                Open
                <VisuallyHidden> {customer}</VisuallyHidden>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@nuvui/table";

const invoices = [
  { id: "INV-001", customer: "Acme", status: "Paid", total: "$250.00" },
  { id: "INV-002", customer: "Globex", status: "Pending", total: "$1,150.00" },
  { id: "INV-003", customer: "Initech", status: "Overdue", total: "$350.00" },
  { id: "INV-004", customer: "Umbrella", status: "Paid", total: "$450.00" },
];

export default function Example() {
  return (
    <TableContainer>
      <Table>
        <TableCaption>Invoices sent in October</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="end">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell rowHeader>{invoice.id}</TableCell>
              <TableCell>{invoice.customer}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell align="end">{invoice.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell align="end">$2,200.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}

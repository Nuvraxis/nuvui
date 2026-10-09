import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@nuvui/table";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const regions = [
  "Austria",
  "Belgium",
  "Croatia",
  "Denmark",
  "Estonia",
  "Finland",
  "Germany",
  "Hungary",
  "Ireland",
  "Latvia",
];

export default function Example() {
  return (
    <TableContainer
      aria-label="Orders by country and month"
      style={{ maxBlockSize: "16rem" }}
    >
      <Table stickyHeader aria-label="Orders by country and month">
        <TableHeader>
          <TableRow>
            <TableHead pinned="start" pinnedEdge>
              Country
            </TableHead>
            {months.map((month) => (
              <TableHead key={month} align="end">
                {month}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {regions.map((region, row) => (
            <TableRow key={region}>
              <TableCell rowHeader pinned="start" pinnedEdge>
                {region}
              </TableCell>
              {months.map((month, column) => (
                <TableCell key={month} align="end">
                  {(1200 + row * 310 + column * 127).toLocaleString("en-US")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

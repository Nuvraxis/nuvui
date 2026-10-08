"use client";

import { Button } from "@nuvui/react/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@nuvui/react/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@nuvui/table";
import { audit, type Theme } from "@nuvui/theme";
import { useMemo } from "react";

const short = (token: string) => token.replace("--color-", "");

// Every pair of colors the components put on top of each other, measured.
// The generator picks each color by measuring, and moves along the scale
// until the pair passes, so there's nothing here to fix: this is the proof,
// and it says where the closest call is.
export function ContrastReport({ theme }: { theme: Theme }) {
  const results = useMemo(() => audit(theme), [theme]);
  const failures = results.filter((result) => result.ratio < result.needed);
  const closest = results.reduce((least, result) =>
    result.ratio / result.needed < least.ratio / least.needed ? result : least,
  );

  return (
    <section className="site-contrast" aria-labelledby="contrast-heading">
      <h2 id="contrast-heading" className="site-builder__heading">
        Contrast
      </h2>
      <p className="site-contrast__summary" data-failures={failures.length}>
        {failures.length === 0
          ? `All ${results.length} pairs pass, in light and in dark.`
          : `${failures.length} of ${results.length} pairs fall short.`}
      </p>
      <p className="site-contrast__closest">
        The closest is {short(closest.token)} on {short(closest.against)} in{" "}
        {closest.mode}: {closest.ratio.toFixed(2)}:1, and it needs{" "}
        {closest.needed}:1.
      </p>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button intent="secondary" size="sm">
            Every pair
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <TableContainer className="site-contrast__table">
            <Table aria-label="Contrast of every pair of colors">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Mode</TableHead>
                  <TableHead scope="col">Color</TableHead>
                  <TableHead scope="col">On</TableHead>
                  <TableHead scope="col">Ratio</TableHead>
                  <TableHead scope="col">Needs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow
                    key={`${result.mode}-${result.token}-${result.against}`}
                  >
                    <TableCell>{result.mode}</TableCell>
                    <TableCell>{short(result.token)}</TableCell>
                    <TableCell>{short(result.against)}</TableCell>
                    <TableCell>{result.ratio.toFixed(2)}</TableCell>
                    <TableCell>{result.needed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}

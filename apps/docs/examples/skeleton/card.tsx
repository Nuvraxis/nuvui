"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  VisuallyHidden,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [loading, setLoading] = useState(true);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        justifyItems: "start",
        width: "100%",
        maxWidth: 360,
      }}
    >
      <Button intent="secondary" onClick={() => setLoading((value) => !value)}>
        {loading ? "Finish loading" : "Load again"}
      </Button>
      <Card aria-busy={loading} style={{ width: "100%" }}>
        {loading ? (
          <>
            <CardHeader>
              <Skeleton shape="text" style={{ width: "45%" }} />
              <Skeleton shape="text" style={{ width: "70%" }} />
            </CardHeader>
            <CardContent>
              <Skeleton style={{ height: 64 }} />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Northwind Traders</CardTitle>
              <CardDescription>Customer since March 2021</CardDescription>
            </CardHeader>
            <CardContent>
              Fourteen orders this year, the last one on 4 July. Nothing is
              overdue.
            </CardContent>
          </>
        )}
      </Card>
      {/* Says when the content has arrived. The skeletons themselves are
          hidden from screen readers. */}
      <VisuallyHidden role="status">
        {loading ? "Loading the customer" : "The customer has loaded"}
      </VisuallyHidden>
    </div>
  );
}

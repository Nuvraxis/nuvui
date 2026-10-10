"use client";

import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHandle,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";
import { useState } from "react";

const stops = [0.35, 0.9];

const orders = Array.from({ length: 24 }, (_, index) => ({
  id: `ORD-${7231 - index}`,
  total: 40 + ((index * 37) % 260),
}));

export default function Example() {
  const [stop, setStop] = useState(stops[0]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button intent="secondary">Recent orders</Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        stops={stops}
        stop={stop}
        onStopChange={setStop}
        aria-describedby={undefined}
      >
        <SheetHandle />
        <SheetHeader>
          <SheetTitle>Recent orders</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {orders.map((order) => (
              <li
                key={order.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBlock: 8,
                }}
              >
                <span>{order.id}</span>
                <span>${order.total}.00</span>
              </li>
            ))}
          </ul>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

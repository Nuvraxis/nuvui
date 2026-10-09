import { Button } from "@nuvui/react";
import Link from "next/link";

export default function Example() {
  return (
    <Button asChild intent="secondary">
      <Link href="/">Read the docs</Link>
    </Button>
  );
}

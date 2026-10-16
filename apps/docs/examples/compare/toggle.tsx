import { Compare } from "@nuvui/react";
import { kitchenAfter, kitchenBefore } from "./pictures";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <Compare
        mode="toggle"
        switchLabel="Show the kitchen"
        before={
          <img src={kitchenBefore} alt="The kitchen with its old cabinets" />
        }
        after={
          <img src={kitchenAfter} alt="The kitchen with new wooden cabinets" />
        }
      />
    </div>
  );
}

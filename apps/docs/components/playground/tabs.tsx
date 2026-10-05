"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  type TabsProps,
  TabsTrigger,
} from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Orientation = NonNullable<TabsProps["orientation"]>;
type ActivationMode = NonNullable<TabsProps["activationMode"]>;

const orientations = Object.keys({
  horizontal: true,
  vertical: true,
} satisfies Record<Orientation, true>) as Orientation[];

const activationModes = Object.keys({
  automatic: true,
  manual: true,
} satisfies Record<ActivationMode, true>) as ActivationMode[];

export function TabsPlayground() {
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [activationMode, setActivationMode] =
    useState<ActivationMode>("automatic");

  const props = [
    orientation !== "horizontal" && `orientation="${orientation}"`,
    activationMode !== "automatic" && `activationMode="${activationMode}"`,
  ].filter(Boolean);
  const code = `<Tabs defaultValue="account"${props.map((prop) => ` ${prop}`).join("")}>
  ...
</Tabs>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="orientation"
            value={orientation}
            options={orientations}
            onChange={setOrientation}
          />
          <SelectControl
            label="activationMode"
            value={activationMode}
            options={activationModes}
            onChange={setActivationMode}
          />
        </>
      }
    >
      <Tabs
        defaultValue="account"
        orientation={orientation}
        activationMode={activationMode}
        style={{ inlineSize: "100%" }}
      >
        <TabsList aria-label="Settings">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          Your name, email and password.
        </TabsContent>
        <TabsContent value="team">
          The people who can see this project.
        </TabsContent>
        <TabsContent value="billing">Your plan and past invoices.</TabsContent>
      </Tabs>
    </Playground>
  );
}

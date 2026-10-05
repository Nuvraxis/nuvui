import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <Tabs defaultValue="account" style={{ inlineSize: "100%" }}>
      <TabsList aria-label="Settings">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Your name, email and password.</TabsContent>
      <TabsContent value="team">
        The people who can see this project.
      </TabsContent>
      <TabsContent value="billing">Your plan and past invoices.</TabsContent>
    </Tabs>
  );
}

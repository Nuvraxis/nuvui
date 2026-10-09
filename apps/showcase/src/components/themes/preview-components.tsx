"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@nuvui/react/accordion";
import { Alert, AlertDescription, AlertTitle } from "@nuvui/react/alert";
import { Avatar, AvatarFallback } from "@nuvui/react/avatar";
import { Badge } from "@nuvui/react/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@nuvui/react/breadcrumb";
import { Button } from "@nuvui/react/button";
import { ButtonGroup } from "@nuvui/react/button-group";
import { Kbd } from "@nuvui/react/kbd";
import { Progress } from "@nuvui/react/progress";
import { Separator } from "@nuvui/react/separator";
import { Skeleton } from "@nuvui/react/skeleton";
import { Spinner } from "@nuvui/react/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nuvui/react/tabs";
import { Toggle } from "@nuvui/react/toggle";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react/toggle-group";
import type { ReactNode } from "react";

function Part({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section className="site-preview__part">
      <h3 className="site-preview__part-name">{name}</h3>
      <div className="site-preview__part-body">{children}</div>
    </section>
  );
}

const intents = ["primary", "secondary", "ghost", "danger"] as const;
const badges = ["neutral", "primary", "success", "warning", "danger"] as const;
const alerts = [
  {
    intent: "info",
    title: "Maintenance on Saturday",
    text: "Reports are read-only from 22:00 to midnight.",
  },
  {
    intent: "success",
    title: "Export finished",
    text: "The file is in your downloads.",
  },
  {
    intent: "warning",
    title: "Three seats left",
    text: "Add seats before you invite anyone else.",
  },
  {
    intent: "danger",
    title: "Payment failed",
    text: "The card on file was declined.",
  },
] as const;

const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

// The parts of the library that sit in a page, one after another, so a
// theme can be seen on all of them at once. The ones that open over the
// page, such as a dialog, aren't here: they're drawn outside this box, and
// would show the site's theme and not the one being made.
export function ComponentsPreview() {
  return (
    <div className="site-preview__parts">
      <Part name="Button">
        {intents.map((intent) => (
          <Button key={intent} intent={intent}>
            {cap(intent)}
          </Button>
        ))}
        <Button disabled>Disabled</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <ButtonGroup aria-label="Pages">
          <Button intent="secondary">Previous</Button>
          <Button intent="secondary">Next</Button>
        </ButtonGroup>
      </Part>
      <Part name="Badge">
        {badges.map((intent) => (
          <Badge key={intent} intent={intent}>
            {cap(intent)}
          </Badge>
        ))}
        {badges.map((intent) => (
          <Badge key={intent} intent={intent} variant="outline">
            {cap(intent)}
          </Badge>
        ))}
      </Part>
      <Part name="Alert">
        <div className="site-preview__stack">
          {alerts.map((alert) => (
            <Alert key={alert.intent} intent={alert.intent}>
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.text}</AlertDescription>
            </Alert>
          ))}
        </div>
      </Part>
      <Part name="Tabs">
        <Tabs defaultValue="account" className="site-preview__wide">
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
          <TabsContent value="billing">
            Your plan and past invoices.
          </TabsContent>
        </Tabs>
      </Part>
      <Part name="Accordion">
        <Accordion type="single" collapsible className="site-preview__wide">
          <AccordionItem value="shipping">
            <AccordionTrigger>How long does shipping take?</AccordionTrigger>
            <AccordionContent>
              Orders leave within two working days.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="returns">
            <AccordionTrigger>Can I send something back?</AccordionTrigger>
            <AccordionContent>Yes, within 30 days.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Part>
      <Part name="Toggle and ToggleGroup">
        <Toggle variant="outline">Show archived</Toggle>
        <ToggleGroup type="single" aria-label="View" defaultValue="list">
          <ToggleGroupItem value="list">List</ToggleGroupItem>
          <ToggleGroupItem value="board">Board</ToggleGroupItem>
          <ToggleGroupItem value="calendar">Calendar</ToggleGroupItem>
        </ToggleGroup>
      </Part>
      <Part name="Progress, Spinner and Skeleton">
        <div className="site-preview__stack">
          <Progress aria-label="Storage used" value={64} />
          <div className="site-preview__line">
            <Spinner size="sm" />
            <Spinner />
            <Spinner size="lg" />
          </div>
          <div className="site-preview__line" aria-busy="true">
            <Skeleton shape="circle" />
            <div className="site-preview__wide">
              <Skeleton shape="text" style={{ inlineSize: "60%" }} />
              <Skeleton shape="text" />
            </div>
          </div>
        </div>
      </Part>
      <Part name="Avatar, Kbd and Separator">
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <Separator orientation="vertical" className="site-preview__rule" />
        <p className="site-preview__text">
          Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to search.
        </p>
      </Part>
      <Part name="Breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#workspaces">Workspaces</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#northwind">Northwind</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Billing</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Part>
    </div>
  );
}

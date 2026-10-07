"use client";

import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function CardPlayground() {
  const [title, setTitle] = useState("Team plan");
  const [description, setDescription] = useState("Billed once a year.");
  const [action, setAction] = useState(false);
  const [footer, setFooter] = useState(true);

  const code = `<Card>
  <CardHeader>
    <CardTitle>${title}</CardTitle>
    <CardDescription>${description}</CardDescription>${
      action
        ? `
    <CardAction>
      <Button intent="ghost" size="sm">Edit</Button>
    </CardAction>`
        : ""
    }
  </CardHeader>
  <CardContent>Twelve seats, four of them in use.</CardContent>${
    footer
      ? `
  <CardFooter>
    <Button intent="secondary">Change plan</Button>
    <Button>Add seats</Button>
  </CardFooter>`
      : ""
  }
</Card>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="title" value={title} onChange={setTitle} />
          <TextControl
            label="description"
            value={description}
            onChange={setDescription}
          />
          <CheckboxControl
            label="with CardAction"
            checked={action}
            onChange={setAction}
          />
          <CheckboxControl
            label="with CardFooter"
            checked={footer}
            onChange={setFooter}
          />
        </>
      }
    >
      <Card style={{ width: "100%", maxWidth: 380 }}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {action ? (
            <CardAction>
              <Button intent="ghost" size="sm">
                Edit
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>Twelve seats, four of them in use.</CardContent>
        {footer ? (
          <CardFooter>
            <Button intent="secondary">Change plan</Button>
            <Button>Add seats</Button>
          </CardFooter>
        ) : null}
      </Card>
    </Playground>
  );
}

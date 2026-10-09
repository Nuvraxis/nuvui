"use client";

import {
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function EmptyPlayground() {
  const [title, setTitle] = useState("No invoices yet");
  const [description, setDescription] = useState(
    "Invoices show up here once you send the first one.",
  );
  const [media, setMedia] = useState(true);
  const [actions, setActions] = useState(true);

  const code = `<Empty>${
    media
      ? `
  <EmptyMedia>
    <InvoiceIcon />
  </EmptyMedia>`
      : ""
  }
  <EmptyTitle>${title}</EmptyTitle>
  <EmptyDescription>${description}</EmptyDescription>${
    actions
      ? `
  <EmptyActions>
    <Button>New invoice</Button>
  </EmptyActions>`
      : ""
  }
</Empty>`;

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
            label="with EmptyMedia"
            checked={media}
            onChange={setMedia}
          />
          <CheckboxControl
            label="with EmptyActions"
            checked={actions}
            onChange={setActions}
          />
        </>
      }
    >
      <Empty style={{ width: "100%" }}>
        {media ? (
          <EmptyMedia>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" />
            </svg>
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
        {actions ? (
          <EmptyActions>
            <Button>New invoice</Button>
          </EmptyActions>
        ) : null}
      </Empty>
    </Playground>
  );
}

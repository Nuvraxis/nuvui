"use client";

import { Button } from "@nuvui/react/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nuvui/react/tabs";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react/toggle-group";
import { ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";
import { type CSSProperties, useId, useState } from "react";
import { CopyButton } from "@/components/charts/copy-button";

const widths = [
  { value: "phone", label: "Phone width", Icon: Smartphone },
  { value: "tablet", label: "Tablet width", Icon: Tablet },
  { value: "desktop", label: "Full width", Icon: Monitor },
] as const;

type Width = (typeof widths)[number]["value"];

const isWidth = (value: string): value is Width =>
  widths.some((width) => width.value === value);

export interface BlockFile {
  name: string;
  /** The file's text, for the clipboard. */
  code: string;
  /** The same text as highlighted HTML, made when the site was built. */
  html: string;
}

interface BlockPreviewProps {
  name: string;
  title: string;
  description: string;
  /** The address of the block alone on a page. */
  view: string;
  /** How tall the frame is, in pixels. */
  height: number;
  install: string[];
  files: BlockFile[];
  level: 2 | 3;
}

export function BlockPreview({
  name,
  title,
  description,
  view,
  height,
  install,
  files,
  level,
}: BlockPreviewProps) {
  const [width, setWidth] = useState<Width>("desktop");
  const heading = useId();
  const Heading = level === 2 ? "h2" : "h3";
  const command = `pnpm add ${install.join(" ")}`;

  return (
    <Tabs asChild defaultValue="preview">
      <article
        className="site-block"
        data-block={name}
        aria-labelledby={heading}
      >
        <header className="site-block__head">
          <div className="site-block__about">
            <Heading id={heading} className="site-block__title">
              {title}
            </Heading>
            <p className="site-block__text">{description}</p>
          </div>
          <div className="site-block__tools">
            <TabsList aria-label={`${title}: preview or code`}>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
            <ToggleGroup
              type="single"
              size="sm"
              className="site-block__widths"
              aria-label={`Width of the ${title} preview`}
              value={width}
              // A group of this kind lets its one pressed item be released.
              // Here the preview always has a width.
              onValueChange={(value) => {
                if (isWidth(value)) setWidth(value);
              }}
            >
              {widths.map(({ value, label, Icon }) => (
                <ToggleGroupItem key={value} value={value} aria-label={label}>
                  <Icon aria-hidden="true" size={16} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button asChild intent="secondary" size="sm">
              <a href={view} target="_blank" rel="noreferrer">
                Open in a new tab
                <ExternalLink aria-hidden="true" size={14} />
              </a>
            </Button>
          </div>
        </header>
        {/* Kept in the page while the code is read, so the preview isn't
            loaded again on the way back. */}
        <TabsContent value="preview" forceMount className="site-block__stage">
          <iframe
            className="site-block__frame"
            data-width={width}
            style={{ "--site-block-height": `${height}px` } as CSSProperties}
            src={view}
            title={`Preview of ${title}`}
            loading="lazy"
          />
        </TabsContent>
        <TabsContent value="code" className="site-block__code">
          <div className="site-block__install">
            <p className="site-block__note">
              The files import from these packages:
            </p>
            <code className="site-block__command">{command}</code>
            <CopyButton
              code={command}
              label={`Copy the install command for ${title}`}
            />
          </div>
          <Tabs defaultValue={files[0]?.name}>
            <TabsList aria-label={`Files of ${title}`}>
              {files.map((file) => (
                <TabsTrigger key={file.name} value={file.name}>
                  {file.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {files.map((file) => (
              <TabsContent
                key={file.name}
                value={file.name}
                className="site-block__file"
              >
                <div className="site-block__copy">
                  <CopyButton
                    code={file.code}
                    label={`Copy ${file.name} of ${title}`}
                    text
                  />
                </div>
                <div
                  className="site-code site-code--tall"
                  // The HTML is Shiki's, made at build time from a file of
                  // this repository. Nothing from outside is in it.
                  dangerouslySetInnerHTML={{ __html: file.html }}
                />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </article>
    </Tabs>
  );
}

"use client";

import { Button } from "@nuvui/react/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react/dialog";
import { Code } from "lucide-react";
import { CopyButton } from "./copy-button";

interface ChartCodeProps {
  /** The chart's title, which the buttons are named after. */
  title: string;
  /** The file, as it's named in the repository. */
  file: string;
  /** The file's text, for the clipboard. */
  code: string;
  /** The same text as highlighted HTML, made when the site was built. */
  html: string;
}

// The two things to do with a chart's code: copy it, or read it first.
export function ChartCode({ title, file, code, html }: ChartCodeProps) {
  return (
    <>
      <CopyButton code={code} label={`Copy the code for ${title}`} />
      <Dialog>
        <DialogTrigger asChild>
          <Button intent="secondary" size="sm" aria-label={`Code for ${title}`}>
            <Code aria-hidden="true" size={16} />
            Code
          </Button>
        </DialogTrigger>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              The file this chart is drawn from, <code>{file}</code>.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div
              className="site-code"
              // The HTML is Shiki's, made at build time from a file of this
              // repository. Nothing from outside is in it.
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </DialogBody>
          <DialogFooter>
            <CopyButton code={code} label={`Copy the code for ${title}`} text />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

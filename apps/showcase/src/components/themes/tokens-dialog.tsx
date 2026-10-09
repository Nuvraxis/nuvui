"use client";

import { Button } from "@nuvui/react/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nuvui/react/tabs";
import { type Theme, toCss, toScss, toTailwind } from "@nuvui/theme";
import { Download } from "lucide-react";
import { useMemo } from "react";
import { CopyButton } from "@/components/charts/copy-button";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // The click has started the download by now.
  URL.revokeObjectURL(url);
}

// The theme as text to paste. There's nothing to install: a theme is a set
// of values for the library's tokens and nothing else.
export function TokensDialog({ theme }: { theme: Theme }) {
  const formats = useMemo(
    () => [
      {
        value: "css",
        label: "CSS",
        file: "nuvui-theme.css",
        where:
          "Paste it into a stylesheet that loads after the library's, or save it as a file and import that.",
        code: toCss(theme),
      },
      {
        value: "scss",
        label: "SCSS",
        file: "_nuvui-theme.scss",
        where:
          "For a project that compiles Sass. It uses the library's dark mixin, so the two dark blocks are written for you.",
        code: toScss(theme),
      },
      {
        value: "tailwind",
        label: "Tailwind v4",
        file: "nuvui-theme.tailwind.css",
        where:
          "Paste it into the stylesheet that has your Tailwind import. The radius goes in @theme, so Tailwind's utilities change with the components.",
        code: toTailwind(theme),
      },
    ],
    [theme],
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Get tokens</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Tokens for this theme</DialogTitle>
          <DialogDescription>
            Values for the library's CSS variables, in light and in dark.
            There's nothing to install.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Tabs defaultValue="css">
            <TabsList aria-label="Format">
              {formats.map((format) => (
                <TabsTrigger key={format.value} value={format.value}>
                  {format.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {formats.map((format) => (
              <TabsContent
                key={format.value}
                value={format.value}
                className="site-tokens"
              >
                <p className="site-tokens__where">{format.where}</p>
                <div className="site-tokens__actions">
                  <CopyButton
                    code={format.code}
                    label={`Copy the ${format.label}`}
                    text
                  />
                  <Button
                    intent="secondary"
                    size="sm"
                    onClick={() => download(format.file, format.code)}
                  >
                    <Download aria-hidden="true" size={16} />
                    Download {format.file}
                  </Button>
                </div>
                <div className="site-code">
                  {/* It scrolls, so it takes focus, for the arrow keys. */}
                  {/* biome-ignore lint/a11y/noNoninteractiveTabindex: see above */}
                  <pre tabIndex={0}>
                    <code>{format.code}</code>
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

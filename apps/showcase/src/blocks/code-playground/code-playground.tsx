"use client";

import {
  CodeEditor,
  CodeEditorContent,
  type CodeEditorDiagnostic,
  CodeEditorStatus,
  CodeEditorToolbar,
} from "@nuvui/editor/code";
import {
  Button,
  Resizable,
  ResizableHandle,
  ResizablePanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tree,
  TreeItem,
} from "@nuvui/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import "./code-playground.scss";

const start: Record<string, string> = {
  "index.html": `<main class="banner">
  <h1>Harbor Street Bakery</h1>
  <p class="hours">Open from 7 until 4</p>
  <button type="button" id="order">Order for pickup</button>
</main>
`,
  "styles.css": `.banner {
  display: grid;
  gap: 0.75rem;
  padding: 2rem;
  font-family: system-ui, sans-serif;
}

.hours {
  color: #2f6f62;
  font-weight: 600;
}
`,
  "app.js": `const button = document.querySelector("#order");
var orders = 0;

button.addEventListener("click", () => {
  orders += 1;
  console.log("Orders today:", orders);
});

console.info("The banner is ready");
`,
};

const order = ["index.html", "styles.css", "app.js"];

// A check of the block's own, as an app would run a linter: brackets
// that don't close, and a `var` where `let` or `const` would do.
function check(path: string, code: string): CodeEditorDiagnostic[] {
  const found: CodeEditorDiagnostic[] = [];
  if (path.endsWith(".js") || path.endsWith(".css")) {
    const open: number[] = [];
    for (let at = 0; at < code.length; at += 1) {
      if (code[at] === "{") open.push(at);
      if (code[at] === "}" && open.pop() === undefined) {
        found.push({
          from: at,
          to: at + 1,
          severity: "error",
          message: "This closes a block that was never opened.",
          source: "Playground",
        });
      }
    }
    for (const at of open) {
      found.push({
        from: at,
        to: at + 1,
        severity: "error",
        message: "This block is never closed.",
        source: "Playground",
      });
    }
  }
  if (path.endsWith(".js")) {
    for (const match of code.matchAll(/\bvar\b/g)) {
      found.push({
        from: match.index,
        to: match.index + 3,
        severity: "warning",
        message: "Use let or const. A var is seen outside the block it's in.",
        source: "Playground",
      });
    }
  }
  return found;
}

// A small formatter of the block's own: each line indented by how many
// blocks it's in, and nothing left at the end of a line. An app would give
// Prettier here.
function format(code: string) {
  let depth = 0;
  const lines = code.split("\n").map((raw) => {
    const line = raw.trim();
    if (line.startsWith("}")) depth = Math.max(0, depth - 1);
    const out = line ? `${"  ".repeat(depth)}${line}` : "";
    const opens = (line.match(/{/g) ?? []).length;
    const closes =
      (line.match(/}/g) ?? []).length - (line.startsWith("}") ? 1 : 0);
    depth = Math.max(0, depth + opens - closes);
    return out;
  });
  return `${lines.join("\n").trimEnd()}\n`;
}

// What the frame says, sent to the page. The frame has no origin of its
// own, so it can't read the page, and the page only listens to it.
const consoleScript = `<script>
(() => {
  const send = (kind, values) => parent.postMessage({
    from: "code-playground",
    kind,
    text: values.map((value) => {
      if (typeof value === "string") return value;
      try { return JSON.stringify(value); } catch { return String(value); }
    }).join(" "),
  }, "*");
  for (const kind of ["log", "info", "warn", "error"]) {
    const original = console[kind];
    console[kind] = (...values) => { send(kind, values); original.apply(console, values); };
  }
  addEventListener("error", (event) => send("error", [event.message]));
})();
</script>`;

const page = (files: Record<string, string>) => {
  const html = files["index.html"] ?? "";
  const css = files["styles.css"] ?? "";
  // A script can't end the one it's written into.
  const js = (files["app.js"] ?? "").replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><head><meta charset="utf-8">${consoleScript}<style>${css}</style></head><body>${html}<script>${js}</script></body></html>`;
};

interface Line {
  id: number;
  kind: "log" | "info" | "warn" | "error";
  text: string;
}

const wide = "(min-width: 48rem)";
function useWide() {
  return useSyncExternalStore(
    (changed) => {
      const query = matchMedia(wide);
      query.addEventListener("change", changed);
      return () => query.removeEventListener("change", changed);
    },
    () => matchMedia(wide).matches,
    () => true,
  );
}

export default function CodePlayground() {
  const [files, setFiles] = useState(start);
  const [tabs, setTabs] = useState(["index.html", "app.js"]);
  const [active, setActive] = useState("app.js");
  // Nothing is loaded in the frame until the page listens to it, or what
  // it says first would be lost.
  const [shown, setShown] = useState<string | null>(null);
  const shownRef = useRef<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);
  const next = useRef(0);
  const isWide = useWide();

  const open = useCallback((path: string) => {
    setTabs((before) => (before.includes(path) ? before : [...before, path]));
    setActive(path);
  }, []);

  // The preview is drawn again a moment after typing stops, not on every
  // key, and what it said before is cleared.
  useEffect(() => {
    const timer = setTimeout(() => {
      const drawn = page(files);
      // The same page isn't loaded again, so what it said stays.
      if (drawn === shownRef.current) return;
      shownRef.current = drawn;
      setLines([]);
      setShown(drawn);
    }, 600);
    return () => clearTimeout(timer);
  }, [files]);

  useEffect(() => {
    function heard(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as Partial<Line> & { from?: string };
      if (data?.from !== "code-playground" || typeof data.text !== "string") {
        return;
      }
      next.current += 1;
      const line: Line = {
        id: next.current,
        kind: data.kind ?? "log",
        text: data.text,
      };
      setLines((before) => [...before.slice(-49), line]);
    }
    window.addEventListener("message", heard);
    const first = page(start);
    shownRef.current = first;
    setShown(first);
    return () => window.removeEventListener("message", heard);
  }, []);

  const diagnostics = useMemo(
    () => check(active, files[active] ?? ""),
    [active, files],
  );

  const panes = (
    <Resizable orientation={isWide ? "horizontal" : "vertical"}>
      <ResizablePanel
        defaultSize={isWide ? "18%" : "22%"}
        minSize="12%"
        className="code-playground__pane"
      >
        <Tree
          aria-label="Files"
          selectionMode="single"
          value={[active]}
          onValueChange={(value) => {
            const [path] = value;
            if (path) open(path);
          }}
          defaultExpanded={["site"]}
          className="code-playground__files"
        >
          <TreeItem value="site" label="site">
            {order.map((path) => (
              <TreeItem key={path} value={path} label={path} />
            ))}
          </TreeItem>
        </Tree>
      </ResizablePanel>
      <ResizableHandle withGrip aria-label="Resize the files" />
      <ResizablePanel
        defaultSize={isWide ? "47%" : "45%"}
        minSize="25%"
        className="code-playground__pane"
      >
        <Tabs
          value={active}
          onValueChange={setActive}
          className="code-playground__tabs"
        >
          <TabsList aria-label="Open files">
            {tabs.map((path) => (
              <TabsTrigger key={path} value={path}>
                {path}
              </TabsTrigger>
            ))}
          </TabsList>
          {/* One panel, whose value follows the tab, so the one editor in it
              stays and only its file changes. */}
          <TabsContent value={active} className="code-playground__panel">
            <CodeEditor
              aria-label={active}
              path={active}
              value={files[active]}
              onValueChange={(code) =>
                setFiles((before) => ({ ...before, [active]: code }))
              }
              diagnostics={diagnostics}
              format={format}
              minLines={12}
              className="code-playground__editor"
            >
              <CodeEditorToolbar />
              <CodeEditorContent className="code-playground__code" />
              <CodeEditorStatus />
            </CodeEditor>
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withGrip aria-label="Resize the preview" />
      <ResizablePanel minSize="20%" className="code-playground__pane">
        <section aria-label="Preview" className="code-playground__preview">
          <iframe
            ref={frame}
            title="Preview of the page"
            // Scripts run, in a frame with no origin of its own: they can't
            // reach this page, its storage or its cookies.
            sandbox="allow-scripts"
            srcDoc={shown ?? ""}
            className="code-playground__frame"
          />
          <div className="code-playground__console-head">
            <h2 className="code-playground__console-title">Console</h2>
            <Button
              intent="ghost"
              size="sm"
              onClick={() => setLines([])}
              disabled={lines.length === 0}
            >
              Clear
            </Button>
          </div>
          <ol
            aria-label="Console"
            aria-live="polite"
            className="code-playground__console"
          >
            {lines.length === 0 ? (
              <li className="code-playground__empty">
                Nothing yet. Press the button in the preview.
              </li>
            ) : (
              lines.map((line) => (
                <li
                  key={line.id}
                  data-kind={line.kind}
                  className="code-playground__line"
                >
                  {line.kind === "log" ? null : (
                    <span className="code-playground__kind">{line.kind}</span>
                  )}
                  {line.text}
                </li>
              ))
            )}
          </ol>
        </section>
      </ResizablePanel>
    </Resizable>
  );

  return (
    <div className="code-playground">
      <header className="code-playground__head">
        <h1 className="code-playground__title">Bakery banner</h1>
        <p className="code-playground__meta">
          Three files, shown in the preview a moment after you stop typing. Each
          keeps its own undo history.
        </p>
      </header>
      <div className="code-playground__body">{panes}</div>
    </div>
  );
}

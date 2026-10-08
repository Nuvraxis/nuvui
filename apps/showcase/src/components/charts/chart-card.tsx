import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nuvui/react/card";
import type { ComponentType } from "react";
import type { ChartEntry, ChartFamily } from "@/lib/charts";
import { highlight } from "@/lib/highlight";
import { ChartCode } from "./chart-code";

const chartsDir = path.join(process.cwd(), "src", "charts");

interface ChartCardProps {
  family: ChartFamily;
  chart: ChartEntry;
}

// Draws a chart and offers the file it came from. The code on offer is the
// code that's running, because it's the same file: read here when the site
// is built, and imported here too.
export async function ChartCard({ family, chart }: ChartCardProps) {
  const file = `${family.slug}/${chart.name}.tsx`;
  const [module, source] = await Promise.all([
    import(`@/charts/${family.slug}/${chart.name}.tsx`) as Promise<{
      default: ComponentType;
    }>,
    readFile(path.join(chartsDir, family.slug, `${chart.name}.tsx`), "utf8"),
  ]);
  const Chart = module.default;
  const code = source.trim();

  return (
    <Card className="site-chart" data-chart={file}>
      <CardHeader>
        <CardTitle asChild>
          <h2>{chart.title}</h2>
        </CardTitle>
        <CardDescription>{chart.description}</CardDescription>
        <CardAction>
          <ChartCode
            title={chart.title}
            file={`apps/showcase/src/charts/${file}`}
            code={code}
            html={await highlight(code, "tsx")}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="site-chart__frame">
        <Chart />
      </CardContent>
    </Card>
  );
}

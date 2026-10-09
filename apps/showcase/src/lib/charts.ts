export interface ChartEntry {
  /** The file's name under `src/charts/<family>`, without the extension. */
  name: string;
  title: string;
  description: string;
}

export interface ChartFamily {
  /** The folder under `src/charts`, and the last part of the page's address. */
  slug: string;
  /** In the list of families. */
  label: string;
  /** The page's heading. */
  title: string;
  description: string;
  charts: ChartEntry[];
}

// Every chart on the charts pages. A chart is one file, and what's listed
// here is what the page says about it. The page draws the file and prints
// it, so the code shown is the code running.
export const families: ChartFamily[] = [
  {
    slug: "area",
    label: "Area",
    title: "Area charts",
    description:
      "A line with the space under it filled. For a quantity over time, and for how parts add up to a whole.",
    charts: [
      {
        name: "basic",
        title: "Area",
        description: "One series, with a smooth line.",
      },
      {
        name: "stacked",
        title: "Stacked",
        description: "Two series, one on top of the other, with a legend.",
      },
      {
        name: "gradient",
        title: "Gradient",
        description: "The fill fades toward the axis.",
      },
      {
        name: "step",
        title: "Step",
        description: "For a count that holds until it changes.",
      },
      {
        name: "percent",
        title: "Shares",
        description: "Each point stretched to the full height.",
      },
    ],
  },
  {
    slug: "bar",
    label: "Bar",
    title: "Bar charts",
    description:
      "A bar for each category. For comparing amounts, side by side or stacked.",
    charts: [
      {
        name: "basic",
        title: "Bar",
        description: "One series.",
      },
      {
        name: "grouped",
        title: "Grouped",
        description: "Two series side by side, with a legend.",
      },
      {
        name: "stacked",
        title: "Stacked",
        description: "Three series in one bar, with an axis for the total.",
      },
      {
        name: "horizontal",
        title: "Horizontal",
        description: "For long category names, with each value at its bar.",
      },
      {
        name: "negative",
        title: "Above and below zero",
        description: "Each bar is named and filled by its sign.",
      },
    ],
  },
  {
    slug: "line",
    label: "Line",
    title: "Line charts",
    description:
      "A line through each series' points. For a trend, and for comparing several.",
    charts: [
      {
        name: "basic",
        title: "Line",
        description: "One series, with a smooth line.",
      },
      {
        name: "multiple",
        title: "Several lines",
        description: "Each line has dashes of its own as well as a color.",
      },
      {
        name: "dots",
        title: "Dots",
        description: "A dot at each point, for a handful of points.",
      },
      {
        name: "step",
        title: "Step",
        description: "For a value that holds until it changes.",
      },
      {
        name: "forecast",
        title: "Actual and forecast",
        description:
          "The forecast is dashed, and starts where the actual ends.",
      },
    ],
  },
  {
    slug: "pie",
    label: "Pie",
    title: "Pie charts",
    description:
      "A circle cut into shares. For a few parts of one whole, not for comparing close values.",
    charts: [
      {
        name: "basic",
        title: "Pie",
        description: "A slice for each row, with a legend.",
      },
      {
        name: "donut",
        title: "Donut",
        description: "With the total in the middle.",
      },
      {
        name: "labels",
        title: "Labels",
        description: "Each slice is named where it is.",
      },
      {
        name: "patterns",
        title: "Patterns",
        description: "Slices that can be told apart without color.",
      },
    ],
  },
  {
    slug: "radar",
    label: "Radar",
    title: "Radar charts",
    description:
      "A spoke for each category. For the shape of several scores, and for one shape against another.",
    charts: [
      {
        name: "basic",
        title: "Radar",
        description: "One series.",
      },
      {
        name: "multiple",
        title: "Two series",
        description: "This year's shape over last year's.",
      },
      {
        name: "lines",
        title: "Lines only",
        description: "No fill, so neither shape hides the other.",
      },
      {
        name: "circle",
        title: "Round grid",
        description: "With a scale along one spoke.",
      },
    ],
  },
  {
    slug: "radial",
    label: "Radial",
    title: "Radial charts",
    description:
      "Bars bent around a center. For a few values, or for one value against its limit.",
    charts: [
      {
        name: "basic",
        title: "Radial bars",
        description: "A ring for each row, with a legend.",
      },
      {
        name: "progress",
        title: "Progress",
        description:
          "One value out of a hundred, with the number in the middle.",
      },
      {
        name: "gauge",
        title: "Half ring",
        description: "A score out of a hundred, on half a ring.",
      },
    ],
  },
  {
    slug: "tooltip",
    label: "Tooltips",
    title: "Tooltips",
    description:
      "What a chart shows for the point under the pointer, or the one the arrow keys have moved to.",
    charts: [
      {
        name: "default",
        title: "Default",
        description: "The point's name, then each series.",
      },
      {
        name: "line",
        title: "Line samples",
        description: "Each sample is a line, dashed where the series is.",
      },
      {
        name: "no-label",
        title: "No heading",
        description: "For rows that already say which they are.",
      },
      {
        name: "format",
        title: "Formatted",
        description: "Values as money, and the month with its year.",
      },
    ],
  },
  {
    slug: "composed",
    label: "Composed",
    title: "Composed charts",
    description:
      "Bars, lines and areas in one chart. For two measures of the same thing.",
    charts: [
      {
        name: "bar-line",
        title: "Bars and a line",
        description: "Two units, with an axis on each side.",
      },
      {
        name: "area-line",
        title: "Area and a line",
        description: "What was spent against what was planned.",
      },
      {
        name: "stacked-line",
        title: "Stacked bars and a line",
        description: "Counts in the bars, a rate in the line.",
      },
    ],
  },
  {
    slug: "scatter",
    label: "Scatter",
    title: "Scatter charts",
    description:
      "A dot for each row, placed by two of its values. For how one measure moves with another.",
    charts: [
      {
        name: "basic",
        title: "Scatter",
        description: "One group of points.",
      },
      {
        name: "groups",
        title: "Groups",
        description: "Two groups, each with a shape of its own.",
      },
      {
        name: "bubble",
        title: "Bubbles",
        description: "A third value is the size of the dot.",
      },
    ],
  },
  {
    slug: "dashboard",
    label: "Dashboard",
    title: "Dashboard charts",
    description:
      "Three charts an admin screen tends to need: a figure with its trend, a stack with its totals, and bars against a target.",
    charts: [
      {
        name: "sparkline",
        title: "Figure with a sparkline",
        description: "The number, and a small line for its shape.",
      },
      {
        name: "stacked-totals",
        title: "Stacked bars with totals",
        description: "The sum is written on top of each stack.",
      },
      {
        name: "target",
        title: "Bars against a target",
        description: "A line across the chart, named in the chart's label.",
      },
    ],
  },
];

export const chartsHome = "/charts";

export const familyPath = (family: ChartFamily) =>
  `${chartsHome}/${family.slug}`;

export const chartCount = families.reduce(
  (count, family) => count + family.charts.length,
  0,
);

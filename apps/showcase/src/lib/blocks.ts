import activity from "@/blocks/activity/block.json" with { type: "json" };
import dashboard from "@/blocks/dashboard/block.json" with { type: "json" };
import figures from "@/blocks/figures/block.json" with { type: "json" };
import forgotPassword from "@/blocks/forgot-password/block.json" with {
  type: "json",
};
import pageHeader from "@/blocks/page-header/block.json" with { type: "json" };
import sidebarIcons from "@/blocks/sidebar-icons/block.json" with {
  type: "json",
};
import sidebarNested from "@/blocks/sidebar-nested/block.json" with {
  type: "json",
};
import signIn from "@/blocks/sign-in/block.json" with { type: "json" };
import signInSso from "@/blocks/sign-in-sso/block.json" with { type: "json" };
import signUp from "@/blocks/sign-up/block.json" with { type: "json" };
import topBar from "@/blocks/top-bar/block.json" with { type: "json" };
import verifyCode from "@/blocks/verify-code/block.json" with { type: "json" };

/** A block's `block.json`, the file that says what the block is. */
export interface BlockManifest {
  /** The folder under `src/blocks`, and the name of its two main files. */
  name: string;
  title: string;
  description: string;
  /** The slug of one of the categories below. */
  category: string;
  /** The files to copy, in the order they're shown. */
  files: string[];
  /** The packages the files import from. */
  install: string[];
  /** How tall the preview is, in pixels. */
  height: number;
}

export interface BlockCategory {
  /** The last part of the page's address. */
  slug: string;
  /** In the list of categories. */
  label: string;
  /** The page's heading. */
  title: string;
  description: string;
}

export const blocksHome = "/blocks";

export const categories: BlockCategory[] = [
  {
    slug: "accounts",
    label: "Accounts",
    title: "Sign in and accounts",
    description:
      "The screens in front of an app: signing in with a password or a company account, signing up, a forgotten password, and a code sent by email.",
  },
  {
    slug: "layout",
    label: "App layout",
    title: "App layout",
    description:
      "What goes around every screen of an app: a sidebar that folds down to icons, one with sections that open, a top bar with search, and a page header.",
  },
  {
    slug: "dashboard",
    label: "Dashboard",
    title: "Dashboard",
    description:
      "A whole dashboard with a sidebar, figures, a chart and a table, and two of its parts on their own: figures with trends, and a list of recent activity.",
  },
];

// Every block, in the order its category's page shows it. A block is a
// folder, and what's listed here is read from the manifest in it. A test
// checks this list against the folders.
export const blocks: BlockManifest[] = [
  signIn,
  signInSso,
  signUp,
  forgotPassword,
  verifyCode,
  sidebarIcons,
  sidebarNested,
  topBar,
  pageHeader,
  dashboard,
  figures,
  activity,
];

export const categoryPath = (category: BlockCategory) =>
  `${blocksHome}/${category.slug}`;

/** The block alone on a page, which is what a preview's frame shows. */
export const viewPath = (block: BlockManifest) =>
  `${blocksHome}/view/${block.name}`;

export const blocksIn = (category: BlockCategory) =>
  blocks.filter((block) => block.category === category.slug);

export const blockCount = blocks.length;

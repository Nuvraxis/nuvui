import activity from "@/blocks/activity/block.json" with { type: "json" };
import approvals from "@/blocks/approvals/block.json" with { type: "json" };
import article from "@/blocks/article/block.json" with { type: "json" };
import askPanel from "@/blocks/ask-panel/block.json" with { type: "json" };
import auditLog from "@/blocks/audit-log/block.json" with { type: "json" };
import billing from "@/blocks/billing/block.json" with { type: "json" };
import dangerZone from "@/blocks/danger-zone/block.json" with { type: "json" };
import dashboard from "@/blocks/dashboard/block.json" with { type: "json" };
import detailPanel from "@/blocks/detail-panel/block.json" with {
  type: "json",
};
import faq from "@/blocks/faq/block.json" with { type: "json" };
import featureGrid from "@/blocks/feature-grid/block.json" with {
  type: "json",
};
import figures from "@/blocks/figures/block.json" with { type: "json" };
import fileBrowser from "@/blocks/file-browser/block.json" with {
  type: "json",
};
import filterSheet from "@/blocks/filter-sheet/block.json" with {
  type: "json",
};
import footer from "@/blocks/footer/block.json" with { type: "json" };
import forgotPassword from "@/blocks/forgot-password/block.json" with {
  type: "json",
};
import hero from "@/blocks/hero/block.json" with { type: "json" };
import inbox from "@/blocks/inbox/block.json" with { type: "json" };
import navBar from "@/blocks/nav-bar/block.json" with { type: "json" };
import notifications from "@/blocks/notifications/block.json" with {
  type: "json",
};
import onboarding from "@/blocks/onboarding/block.json" with { type: "json" };
import pageHeader from "@/blocks/page-header/block.json" with { type: "json" };
import pageStates from "@/blocks/page-states/block.json" with { type: "json" };
import pricing from "@/blocks/pricing/block.json" with { type: "json" };
import profileForm from "@/blocks/profile-form/block.json" with {
  type: "json",
};
import reviews from "@/blocks/reviews/block.json" with { type: "json" };
import sidebarIcons from "@/blocks/sidebar-icons/block.json" with {
  type: "json",
};
import sidebarNested from "@/blocks/sidebar-nested/block.json" with {
  type: "json",
};
import signIn from "@/blocks/sign-in/block.json" with { type: "json" };
import signInSso from "@/blocks/sign-in-sso/block.json" with { type: "json" };
import signUp from "@/blocks/sign-up/block.json" with { type: "json" };
import tableToolbar from "@/blocks/table-toolbar/block.json" with {
  type: "json",
};
import teamMembers from "@/blocks/team-members/block.json" with {
  type: "json",
};
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
      "The screens in front of an app: signing in with a password or a company account, signing up, a forgotten password, a code sent by email, and setting up in steps.",
  },
  {
    slug: "layout",
    label: "App layout",
    title: "App layout",
    description:
      "What goes around every screen of an app: a sidebar that folds down to icons, one with sections that open, a top bar with search, a page header, and a long page with a list of its headings.",
  },
  {
    slug: "dashboard",
    label: "Dashboard",
    title: "Dashboard",
    description:
      "A whole dashboard with a sidebar, figures, a chart and a table, two of its parts on their own, figures with trends and a list of recent activity, and a panel to ask a question in.",
  },
  {
    slug: "data",
    label: "Data",
    title: "Data",
    description:
      "Rows to work with: a table with search, a filter, a column chooser and actions for several rows, a list with a bar of actions for the ticked rows, requests to approve with buttons in every row, a list filtered from a sentence and a sheet, folders and files in a tree, a panel that opens beside a list, and a page in each state it can be in.",
  },
  {
    slug: "settings",
    label: "Settings",
    title: "Settings and admin",
    description:
      "The pages behind an account: a profile, notification preferences, team members and invitations, billing, the actions that can't be taken back, and an audit log.",
  },
  {
    slug: "marketing",
    label: "Marketing",
    title: "Marketing pages",
    description:
      "A product's public pages in seven parts: a navigation bar, a hero, a grid of features, a pricing table, reviews, questions and answers, and a footer.",
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
  onboarding,
  sidebarIcons,
  sidebarNested,
  topBar,
  pageHeader,
  article,
  dashboard,
  figures,
  activity,
  askPanel,
  tableToolbar,
  inbox,
  approvals,
  filterSheet,
  fileBrowser,
  detailPanel,
  pageStates,
  profileForm,
  notifications,
  teamMembers,
  billing,
  dangerZone,
  auditLog,
  navBar,
  hero,
  featureGrid,
  pricing,
  reviews,
  faq,
  footer,
];

export const categoryPath = (category: BlockCategory) =>
  `${blocksHome}/${category.slug}`;

/** The block alone on a page, which is what a preview's frame shows. */
export const viewPath = (block: BlockManifest) =>
  `${blocksHome}/view/${block.name}`;

/**
 * The block as an item in the registry that shadcn's command line tool
 * reads. scripts/add-registry.mjs writes the file when the site is built.
 */
export const registryPath = (block: BlockManifest) => `/r/${block.name}.json`;

export const blocksIn = (category: BlockCategory) =>
  blocks.filter((block) => block.category === category.slug);

export const blockCount = blocks.length;

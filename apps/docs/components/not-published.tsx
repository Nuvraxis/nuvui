import { readFileSync } from "node:fs";
import path from "node:path";
import { Callout } from "fumadocs-ui/components/callout";
import { type Addon, packageOf } from "@/lib/library";

// What a package's version is before Changesets has cut one.
const neverReleased = "0.0.0";

interface NotPublishedProps {
  /** The add-on package the page is about. Left out, it's the core. */
  package?: Addon;
}

/**
 * A warning that the install command won't find the package, for as long
 * as that's true. Once the package has a version, this renders nothing, so
 * the page doesn't have to be edited on the day of the first release.
 *
 * It reads the version in the repository, which Changesets sets in the pull
 * request that the release is published from.
 */
export function NotPublished({ package: addon }: NotPublishedProps) {
  const source = packageOf(addon);
  const { version } = JSON.parse(
    readFileSync(path.join(source.dir, "package.json"), "utf8"),
  ) as { version: string };
  if (version !== neverReleased) return null;

  return (
    <Callout type="warn" title="Not published yet">
      <code>{source.name}</code> isn't on the registry yet, so the install
      command below won't find it.
    </Callout>
  );
}

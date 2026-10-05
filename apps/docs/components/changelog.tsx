import { createMarkdownRenderer } from "fumadocs-core/content/md";
import { remarkGfm } from "fumadocs-core/mdx-plugins/remark-gfm";
import { remarkHeading } from "fumadocs-core/mdx-plugins/remark-heading";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  bumpHeadings,
  bumps,
  readChangelog,
  unreleased,
} from "@/lib/changelog";
import { site } from "@/lib/site";

const { MarkdownServer } = createMarkdownRenderer({
  remarkPlugins: [remarkGfm, remarkHeading],
});

// Headings get the same anchors as the rest of the docs, and links to pull
// requests open the way other external links do.
const components = {
  a: defaultMdxComponents.a,
  h2: defaultMdxComponents.h2,
  h3: defaultMdxComponents.h3,
  h4: defaultMdxComponents.h4,
};

export async function Changelog() {
  const { released, pending } = await readChangelog();
  const H2 = defaultMdxComponents.h2;
  const H3 = defaultMdxComponents.h3;

  return (
    <div data-changelog={released ? "released" : "unreleased"}>
      {!released && (
        <p>
          No version of <code>{site.packageName}</code> has been published yet.
        </p>
      )}

      {pending.length > 0 && (
        <>
          <H2 id={unreleased.id}>{unreleased.heading}</H2>
          <p>
            These changes are in the repository and go out with the next
            version.
          </p>
          {bumps.map((bump) => {
            const notes = pending.filter((note) => note.bump === bump);
            if (notes.length === 0) return null;
            return (
              <section key={bump} data-pending={bump}>
                <H3 id={`${unreleased.id}-${bump}`}>{bumpHeadings[bump]}</H3>
                <ul>
                  {notes.map((note) => (
                    <li key={note.file}>
                      <MarkdownServer components={components}>
                        {note.body}
                      </MarkdownServer>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}

      {released && (
        <MarkdownServer components={components}>{released}</MarkdownServer>
      )}
    </div>
  );
}

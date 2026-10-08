"use client";

import { Button } from "@nuvui/react/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@nuvui/react/command";
import { Kbd } from "@nuvui/react/kbd";
import { useDocsSearch } from "fumadocs-core/search/client";
import { staticClient } from "fumadocs-core/search/client/orama-static";
import { Search } from "lucide-react";
import {
  Fragment,
  type ReactNode,
  useState,
  useSyncExternalStore,
} from "react";
import { docs, pages } from "@/lib/site";

const never = () => () => {};

// Command on a Mac, Ctrl everywhere else. The server can't tell, and draws
// Ctrl.
function useModifier() {
  return useSyncExternalStore(
    never,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}

// The docs' index marks what matched with <mark>. It's text from our own
// pages, but it's still read as text here and not set as HTML.
function marked(text: string): ReactNode {
  return text.split(/<\/?mark>/).map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="site-search__match">
        {part}
      </mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

const plain = (text: string) => text.replace(/<\/?mark>/g, "");

// One search for the whole site. This app's own pages are few and listed
// here. The docs' come from the index the docs app writes at build time, a
// file that's downloaded the first time someone searches and searched in the
// browser. There's no search server.
export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const modifier = useModifier();
  const { search, setSearch, query } = useDocsSearch({
    client: staticClient({ from: docs.search }),
  });

  const words = search.trim().toLowerCase();
  const own = pages.filter(
    (page) =>
      words === "" ||
      page.title.toLowerCase().includes(words) ||
      page.description.toLowerCase().includes(words),
  );
  const found = Array.isArray(query.data) ? query.data : [];

  // A plain navigation. A docs page isn't one of this app's, so the router
  // has nothing to do with it, and for the few pages that are, a full load
  // is no loss.
  const go = (href: string) => {
    setOpen(false);
    window.location.assign(href);
  };

  return (
    <>
      <Button
        intent="secondary"
        size="sm"
        className="site-search"
        onClick={() => setOpen(true)}
        // The word is hidden on a narrow screen, where the button is its icon.
        aria-label="Search"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search aria-hidden="true" size={16} />
        <span className="site-search__label">Search</span>
        <span className="site-search__keys" aria-hidden="true">
          <Kbd>{modifier}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        shortcut="k"
        title="Search the site"
        label="Search"
        // The docs' index does the matching and the ranking.
        shouldFilter={false}
      >
        <CommandInput
          placeholder="Search the docs"
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {query.isLoading ? <CommandLoading>Searching</CommandLoading> : null}
          {query.error ? (
            <p className="site-search__problem" role="alert">
              The docs' search index couldn't be loaded.
            </p>
          ) : null}
          {!query.isLoading ? (
            <CommandEmpty>Nothing found.</CommandEmpty>
          ) : null}
          {own.length > 0 ? (
            <CommandGroup heading="Site">
              {own.map((page) => (
                <CommandItem
                  key={page.path}
                  value={`site ${page.path}`}
                  onSelect={() => go(page.path)}
                >
                  {page.title}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {found.length > 0 ? (
            <CommandGroup heading="Docs">
              {found.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`docs ${result.id}`}
                  className={
                    result.type === "page"
                      ? undefined
                      : "site-search__result--within"
                  }
                  onSelect={() => go(`${docs.home}${result.url}`)}
                  aria-label={plain(result.content)}
                >
                  {marked(result.content)}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}

import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

export const revalidate = false;

// staticGET writes the whole index out once at build time, as a file.
export const { staticGET: GET } = createFromSource(source, {
  language: "english",
});

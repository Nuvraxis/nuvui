import { createGenerator, type Generator } from "fumadocs-typescript";
import { AutoTypeTable } from "fumadocs-typescript/ui";
import { codeHighlight } from "@/lib/code-themes";
import { library } from "@/lib/library";

const generator = createGenerator({ tsconfigPath: library.tsconfig });

interface PropsTableProps {
  /** Folder name of the component, such as `button`. */
  component: string;
  /** Exported type to document, such as `ButtonOwnProps`. */
  name: string;
  /**
   * A type to document in place of an export, written as it would be inside
   * the component's file. `name` is then only a label for it.
   */
  type?: string;
  /**
   * Limits the table to these props, in this order, with these descriptions.
   * For types that are mostly what Radix and the DOM element accept, where
   * the full list would bury the few worth reading about.
   */
  props?: Record<string, string>;
}

// The types in the table still come from the source. Only the choice of rows
// and their wording are written by hand, and the build fails if one of them
// names a prop the type no longer has.
function only(props: Record<string, string>, name: string): Generator {
  return {
    ...generator,
    async generateTypeTable(table, options) {
      const docs = await generator.generateTypeTable(table, options);
      return docs.map((doc) => ({
        ...doc,
        entries: Object.entries(props).map(([prop, description]) => {
          const entry = doc.entries.find((item) => item.name === prop);
          if (!entry) {
            throw new Error(
              `"${prop}" is documented for ${name}, but the type has no such prop.`,
            );
          }
          return { ...entry, description };
        }),
      }));
    },
  };
}

// Built from the component's TypeScript types and their doc comments at build
// time, so the table can't fall behind the code.
export function PropsTable({ component, name, type, props }: PropsTableProps) {
  return (
    <AutoTypeTable
      generator={props ? only(props, name) : generator}
      path={library.source(component)}
      name={name}
      type={type}
      shiki={codeHighlight}
      options={{
        // The collapsed row would otherwise say "union" for most props. The
        // real type is short enough to show, and says a lot more.
        transform(entry) {
          const type = entry.type.replace(/ \| undefined$/, "");
          if (type.length <= 64) entry.simplifiedType = type;
        },
      }}
    />
  );
}

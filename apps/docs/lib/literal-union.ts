// A prop whose type is a name for a few values, such as Radix's
// `Orientation`, shows in a props table as the name, which tells a reader
// nothing they can type. The site's tables and the agent skill's both write
// such a type out as its values. The skill's script is run by Node, which
// strips the types itself, so this file uses only syntax that can be erased.
import type { DocEntry } from "fumadocs-typescript";
import { type Checker, type Type, TypeFlags } from "typescript/unstable/sync";

const literal =
  TypeFlags.StringLiteral | TypeFlags.NumberLiteral | TypeFlags.EnumLiteral;

/**
 * The values of a union of literals, such as `"horizontal" | "vertical"`,
 * or undefined for any other type. `undefined` is left out, and `true` and
 * `false` together are written `boolean`.
 */
export function literalUnion(type: Type, checker: Checker) {
  if (!type.isUnionType()) return undefined;
  const parts: string[] = [];
  let booleans = 0;
  for (const member of type.getTypes()) {
    if (member.flags & TypeFlags.Undefined) continue;
    if (member.flags & TypeFlags.BooleanLiteral) {
      booleans += 1;
      continue;
    }
    if (!(member.flags & literal)) return undefined;
    parts.push(checker.typeToString(member));
  }
  // Only one of the two is a type that says something of its own.
  if (booleans === 1) return undefined;
  if (booleans === 2) parts.push("boolean");
  return parts.length > 0 ? parts.join(" | ") : undefined;
}

// A type written as a name alone. One that's already written out, such as
// `"sm" | "md"`, or a generic, such as `Date[]`, is left as it is.
const bareName = /^[A-Z][A-Za-z0-9]*$/;

/**
 * An entry's type, written out when it's a name for a few values. For the
 * `transform` option of fumadocs-typescript, which calls it with the
 * generator's context as `this`.
 */
export function writeOutLiterals(
  this: { checker: Checker },
  entry: DocEntry,
  type: Type,
) {
  const written = entry.type.replace(/ \| undefined$/, "");
  if (!bareName.test(written)) return;
  const values = literalUnion(type, this.checker);
  if (values) entry.type = values;
}

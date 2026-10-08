import { bemConfig } from "@nuvui/tooling/stylelint";

// The library's rules, with the website's own prefix. A class with `nuv` in
// front is the library's, and nothing here should be mistaken for one.
export default bemConfig("site");

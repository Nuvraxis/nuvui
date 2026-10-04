import { expect } from "vitest";
import { axeMatchers } from "./axe";

expect.extend(axeMatchers);

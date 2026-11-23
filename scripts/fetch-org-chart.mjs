// Writes the people in the org chart examples and blocks, from FakerJson's
// employees (https://fakerjson.com, MIT licensed). Its data is made up and
// the same on every request for a seed, so running this again changes
// nothing unless the service does. The files it writes are committed: the
// docs and the website never call the service.
//
//   pnpm org-chart:fetch
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const api = "https://fakerjson.com/v1";
const seed = 100;

// Faker's portraits, which are drawn by a model and CC0 licensed. They're
// 512 pixels by default, and a card shows one at 40, so the 128 pixel copy
// is asked for.
const portrait =
  /^https:\/\/cdn\.jsdelivr\.net\/gh\/faker-js\/assets-person-portrait\/(female|male)\/512\/(\d{1,3})\.jpg$/;

const text = (value, field) => {
  if (typeof value !== "string" || value.length === 0 || value.length > 80) {
    throw new Error(`${field} is ${JSON.stringify(value)}`);
  }
  return value;
};

/**
 * An employee as FakerJson has them, as a person in an org chart. Someone
 * who has left is an open position, with their title and department and no
 * name, and someone on leave has a badge that says so.
 */
export function toPerson(employee, { details = false } = {}) {
  const id = String(employee.id);
  const managerId =
    employee.managerId === null ? null : String(employee.managerId);
  const title = text(employee.jobTitle, `employee ${id}'s jobTitle`);
  const department = text(employee.department, `employee ${id}'s department`);

  if (employee.status === "terminated") {
    return { id, managerId, vacant: true, title, department };
  }

  const name = `${text(employee.firstName, `employee ${id}'s firstName`)} ${text(employee.lastName, `employee ${id}'s lastName`)}`;
  const person = { id, managerId, name, title, department };
  const photo = portrait.exec(employee.avatar ?? "");
  if (photo) {
    person.avatar = `https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/${photo[1]}/128/${photo[2]}.jpg`;
  }
  if (employee.status === "on_leave") person.badge = "On leave";
  if (details) {
    // Every address is under example.com, which is kept for examples.
    if (!/^[a-z0-9._-]+@[a-z0-9.-]+\.example\.com$/.test(employee.email)) {
      throw new Error(`employee ${id}'s email is ${employee.email}`);
    }
    person.email = employee.email;
    person.hireDate = text(employee.hireDate, `employee ${id}'s hireDate`);
    person.employmentType = text(
      employee.employmentType,
      `employee ${id}'s employmentType`,
    );
  }
  return person;
}

async function get(path) {
  const response = await fetch(
    `${api}${path}${path.includes("?") ? "&" : "?"}seed=${seed}`,
  );
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

async function company(id, options) {
  const about = await get(`/companies/${id}`);
  const { data } = await get(`/companies/${id}/employees?limit=100`);
  return {
    id: String(id),
    name: text(about.name, `company ${id}'s name`),
    industry: text(about.industry, `company ${id}'s industry`),
    people: data.map((employee) => toPerson(employee, options)),
  };
}

// The comment at the top of each file, wrapped as the repository's
// comments are.
function header(companies) {
  const words =
    `Written by scripts/fetch-org-chart.mjs from FakerJson's employees (https://fakerjson.com, seed ${seed}), for ${companies}. Everyone in it is made up, and so is every photo, which is drawn by a model.`.split(
      " ",
    );
  const lines = ["//"];
  for (const word of words) {
    const last = lines.length - 1;
    if (lines[last].length + word.length + 1 > 76) lines.push(`// ${word}`);
    else lines[last] += ` ${word}`;
  }
  return lines.join("\n");
}

function write(file, source) {
  const path = `${root}${file}`;
  writeFileSync(path, source);
  // Biome's own script, run by this Node, so no shell is needed on Windows.
  execFileSync(
    process.execPath,
    [`${root}node_modules/@biomejs/biome/bin/biome`, "format", "--write", path],
    { cwd: root, stdio: "inherit" },
  );
  console.log(`org-chart:fetch: wrote ${file}`);
}

async function main() {
  const torphy = await company(1);
  write(
    "apps/docs/examples/org-chart/people.ts",
    `${header(`its company 1, ${torphy.name}`)}
import type { OrgChartPerson } from "@nuvui/org-chart";

export const people: OrgChartPerson[] = ${JSON.stringify(torphy.people, null, 2)};
`,
  );

  const energy = await company(11, { details: true });
  write(
    "apps/showcase/src/blocks/company-chart/people.ts",
    `${header(`its company 11, ${energy.name}`)}
import type { OrgChartPerson } from "@nuvui/org-chart";

export interface Employee extends OrgChartPerson {
  email?: string;
  hireDate?: string;
  employmentType?: string;
}

export const company = ${JSON.stringify({ name: energy.name, industry: energy.industry })};

export const people: Employee[] = ${JSON.stringify(energy.people, null, 2)};
`,
  );

  const three = await Promise.all([9, 10, 12].map((id) => company(id)));
  write(
    "apps/showcase/src/blocks/reporting-lines/companies.ts",
    `${header("its companies 9, 10 and 12")}
import type { OrgChartPerson } from "@nuvui/org-chart";

export interface Company {
  id: string;
  name: string;
  industry: string;
  people: OrgChartPerson[];
}

export const companies: Company[] = ${JSON.stringify(three, null, 2)};
`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}

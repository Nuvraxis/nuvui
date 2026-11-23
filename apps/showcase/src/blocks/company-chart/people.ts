// Written by scripts/fetch-org-chart.mjs from FakerJson's employees
// (https://fakerjson.com, seed 100), for its company 11, Rolfson, Fritsch
// and Maggio. Everyone in it is made up, and so is every photo, which is
// drawn by a model.
import type { OrgChartPerson } from "@nuvui/org-chart";

export interface Employee extends OrgChartPerson {
  email?: string;
  hireDate?: string;
  employmentType?: string;
}

export const company = {
  name: "Rolfson, Fritsch and Maggio",
  industry: "Energy",
};

export const people: Employee[] = [
  {
    id: "201",
    managerId: null,
    name: "Erma Rutherford",
    title: "Chief Executive Officer",
    department: "Operations",
    email: "erma.rutherford93@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2020-03-17",
    employmentType: "full_time",
  },
  {
    id: "202",
    managerId: "201",
    name: "Elyssa Bahringer",
    title: "Head of Legal",
    department: "Legal",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/14.jpg",
    email: "elyssa_bahringer@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2022-06-02",
    employmentType: "full_time",
  },
  {
    id: "203",
    managerId: "201",
    name: "Julio Rodriguez",
    title: "Head of Sales",
    department: "Sales",
    email: "julio.rodriguez13@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2020-01-07",
    employmentType: "full_time",
  },
  {
    id: "204",
    managerId: "201",
    name: "Josiane Hintz",
    title: "Head of Design",
    department: "Design",
    badge: "On leave",
    email: "josiane.hintz@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2021-12-26",
    employmentType: "full_time",
  },
  {
    id: "205",
    managerId: "201",
    name: "Brionna Koelpin",
    title: "Head of Marketing",
    department: "Marketing",
    email: "brionna.koelpin81@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2019-05-20",
    employmentType: "full_time",
  },
  {
    id: "206",
    managerId: "203",
    vacant: true,
    title: "Forward Optimization Administrator",
    department: "Engineering",
  },
  {
    id: "207",
    managerId: "204",
    name: "Schuyler Klein",
    title: "Investor Functionality Liaison",
    department: "Sales",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/13.jpg",
    email: "schuyler_klein@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2015-05-31",
    employmentType: "full_time",
  },
  {
    id: "208",
    managerId: "205",
    name: "Jacinthe Herman",
    title: "Central Functionality Engineer",
    department: "Sales",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/31.jpg",
    email: "jacinthe.herman82@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2014-08-28",
    employmentType: "contractor",
  },
  {
    id: "209",
    managerId: "202",
    name: "Marcella Olson",
    title: "Dynamic Implementation Executive",
    department: "Marketing",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/59.jpg",
    email: "marcella_olson@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2023-07-03",
    employmentType: "full_time",
  },
  {
    id: "210",
    managerId: "203",
    name: "Camylle Gorczany",
    title: "Forward Group Facilitator",
    department: "People",
    email: "camylle_gorczany@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2024-09-08",
    employmentType: "full_time",
  },
  {
    id: "211",
    managerId: "204",
    name: "Katelin Dare",
    title: "Global Intranet Representative",
    department: "Operations",
    email: "katelin_dare@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2022-02-06",
    employmentType: "full_time",
  },
  {
    id: "212",
    managerId: "205",
    name: "Madaline Daugherty",
    title: "Future Group Associate",
    department: "Design",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/98.jpg",
    email: "madaline.daugherty77@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2022-11-16",
    employmentType: "part_time",
  },
  {
    id: "213",
    managerId: "202",
    name: "Albina Swift",
    title: "Senior Interactions Analyst",
    department: "Sales",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/65.jpg",
    badge: "On leave",
    email: "albina.swift@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2014-12-19",
    employmentType: "full_time",
  },
  {
    id: "214",
    managerId: "203",
    name: "Hudson Sanford",
    title: "Global Usability Developer",
    department: "Sales",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/60.jpg",
    email: "hudson.sanford49@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2025-06-09",
    employmentType: "full_time",
  },
  {
    id: "215",
    managerId: "204",
    name: "Erich Kiehn",
    title: "Internal Implementation Orchestrator",
    department: "Support",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/69.jpg",
    email: "erich_kiehn@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2023-01-26",
    employmentType: "contractor",
  },
  {
    id: "216",
    managerId: "205",
    vacant: true,
    title: "Corporate Functionality Strategist",
    department: "Sales",
  },
  {
    id: "217",
    managerId: "202",
    name: "Jaydon Effertz",
    title: "Global Assurance Architect",
    department: "Support",
    badge: "On leave",
    email: "jaydon.effertz@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2017-12-07",
    employmentType: "full_time",
  },
  {
    id: "218",
    managerId: "203",
    name: "Xzavier Morissette",
    title: "Corporate Web Assistant",
    department: "Finance",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/44.jpg",
    email: "xzavier.morissette90@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2022-07-08",
    employmentType: "full_time",
  },
  {
    id: "219",
    managerId: "204",
    name: "Mavis Littel",
    title: "Legacy Accounts Officer",
    department: "Finance",
    email: "mavis.littel@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2022-02-16",
    employmentType: "full_time",
  },
  {
    id: "220",
    managerId: "205",
    name: "Ahmad Reynolds",
    title: "Forward Configuration Administrator",
    department: "Operations",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/41.jpg",
    email: "ahmad_reynolds@rolfson-fritsch-and-maggio.example.com",
    hireDate: "2015-07-26",
    employmentType: "full_time",
  },
];

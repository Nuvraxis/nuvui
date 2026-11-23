// Written by scripts/fetch-org-chart.mjs from FakerJson's employees
// (https://fakerjson.com, seed 100), for its company 1, Torphy LLC.
// Everyone in it is made up, and so is every photo, which is drawn by a
// model.
import type { OrgChartPerson } from "@nuvui/org-chart";

export const people: OrgChartPerson[] = [
  {
    id: "1",
    managerId: null,
    name: "Emmanuelle Muller",
    title: "Chief Executive Officer",
    department: "Operations",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/23.jpg",
  },
  {
    id: "2",
    managerId: "1",
    name: "Rodger Huel",
    title: "Head of Marketing",
    department: "Marketing",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/12.jpg",
    badge: "On leave",
  },
  {
    id: "3",
    managerId: "1",
    name: "Audrey Jast",
    title: "Head of Operations",
    department: "Operations",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/94.jpg",
  },
  {
    id: "4",
    managerId: "1",
    name: "Leatha Effertz",
    title: "Head of Design",
    department: "Design",
  },
  {
    id: "5",
    managerId: "1",
    name: "Gabe Hessel",
    title: "Head of Support",
    department: "Support",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/21.jpg",
    badge: "On leave",
  },
  {
    id: "6",
    managerId: "3",
    name: "Loy Cummings",
    title: "National Web Assistant",
    department: "Product",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/26.jpg",
  },
  {
    id: "7",
    managerId: "4",
    name: "Elisha Larson",
    title: "Internal Optimization Manager",
    department: "Finance",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/67.jpg",
  },
  {
    id: "8",
    managerId: "5",
    vacant: true,
    title: "Investor Response Strategist",
    department: "Finance",
  },
  {
    id: "9",
    managerId: "2",
    name: "Jayme Mosciski",
    title: "Internal Research Executive",
    department: "Design",
  },
  {
    id: "10",
    managerId: "3",
    name: "Linda Simonis",
    title: "Internal Program Facilitator",
    department: "Engineering",
  },
  {
    id: "11",
    managerId: "4",
    name: "Margot Deckow",
    title: "Legacy Directives Administrator",
    department: "Legal",
  },
  {
    id: "12",
    managerId: "5",
    name: "Darrel Schmeler",
    title: "Lead Intranet Executive",
    department: "Marketing",
  },
  {
    id: "13",
    managerId: "2",
    name: "Jan Hirthe",
    title: "Principal Optimization Analyst",
    department: "Design",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/20.jpg",
    badge: "On leave",
  },
  {
    id: "14",
    managerId: "3",
    name: "Lane Hettinger",
    title: "International Operations Technician",
    department: "People",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/15.jpg",
  },
  {
    id: "15",
    managerId: "4",
    name: "Chadrick Jast",
    title: "Internal Division Executive",
    department: "Operations",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/26.jpg",
  },
  {
    id: "16",
    managerId: "5",
    name: "Hortense Ullrich",
    title: "Central Web Coordinator",
    department: "Product",
  },
  {
    id: "17",
    managerId: "2",
    name: "Kaela Jaskolski",
    title: "Corporate Quality Associate",
    department: "Operations",
  },
  {
    id: "18",
    managerId: "3",
    name: "Valentine Collier",
    title: "International Intranet Orchestrator",
    department: "Support",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/54.jpg",
    badge: "On leave",
  },
  {
    id: "19",
    managerId: "4",
    name: "Reinhold Hoeger",
    title: "District Security Coordinator",
    department: "People",
  },
  {
    id: "20",
    managerId: "5",
    name: "James Hyatt-Buckridge",
    title: "Human Quality Planner",
    department: "Support",
  },
];

// Written by scripts/fetch-org-chart.mjs from FakerJson's employees
// (https://fakerjson.com, seed 100), for its companies 9, 10 and 12.
// Everyone in it is made up, and so is every photo, which is drawn by a
// model.
import type { OrgChartPerson } from "@nuvui/org-chart";

export interface Company {
  id: string;
  name: string;
  industry: string;
  people: OrgChartPerson[];
}

export const companies: Company[] = [
  {
    id: "9",
    name: "Beahan, Lang-Welch and Miller",
    industry: "Consulting",
    people: [
      {
        id: "161",
        managerId: null,
        name: "Terry Hansen",
        title: "Chief Executive Officer",
        department: "Operations",
      },
      {
        id: "162",
        managerId: "161",
        name: "Kelton Schmeler",
        title: "Head of Engineering",
        department: "Engineering",
      },
      {
        id: "163",
        managerId: "161",
        name: "Lorena Casper",
        title: "Head of Marketing",
        department: "Marketing",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/15.jpg",
      },
      {
        id: "164",
        managerId: "161",
        name: "Lambert Johns",
        title: "Head of People",
        department: "People",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/92.jpg",
        badge: "On leave",
      },
      {
        id: "165",
        managerId: "161",
        name: "Cordell Lindgren",
        title: "Head of Operations",
        department: "Operations",
      },
      {
        id: "166",
        managerId: "163",
        name: "Arden Davis",
        title: "Forward Web Designer",
        department: "People",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/38.jpg",
      },
      {
        id: "167",
        managerId: "164",
        name: "Sheldon Blick",
        title: "Lead Data Coordinator",
        department: "Legal",
      },
      {
        id: "168",
        managerId: "165",
        name: "Joaquin Metz",
        title: "Internal Branding Assistant",
        department: "People",
      },
      {
        id: "169",
        managerId: "162",
        name: "Garett Schuster",
        title: "Internal Interactions Liaison",
        department: "Marketing",
      },
      {
        id: "170",
        managerId: "163",
        name: "Vivien Lowe",
        title: "Human Web Engineer",
        department: "Operations",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/29.jpg",
      },
      {
        id: "171",
        managerId: "164",
        name: "Lucius Watsica-Littel",
        title: "Global Factors Strategist",
        department: "People",
      },
      {
        id: "172",
        managerId: "165",
        name: "Flavio Lehner",
        title: "Product Accounts Consultant",
        department: "Legal",
      },
      {
        id: "173",
        managerId: "162",
        name: "Ole Fisher",
        title: "Lead Usability Coordinator",
        department: "Design",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/1.jpg",
      },
      {
        id: "174",
        managerId: "163",
        name: "Kaleb Littel",
        title: "District Paradigm Supervisor",
        department: "Marketing",
        badge: "On leave",
      },
      {
        id: "175",
        managerId: "164",
        name: "Carey Thompson",
        title: "Chief Accounts Assistant",
        department: "Product",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/67.jpg",
        badge: "On leave",
      },
      {
        id: "176",
        managerId: "165",
        name: "Felton Okuneva",
        title: "Direct Division Director",
        department: "Operations",
      },
      {
        id: "177",
        managerId: "162",
        name: "Willard Mante",
        title: "Senior Infrastructure Specialist",
        department: "Legal",
        badge: "On leave",
      },
      {
        id: "178",
        managerId: "163",
        name: "Alyce Vandervort",
        title: "Investor Security Strategist",
        department: "Product",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/65.jpg",
      },
      {
        id: "179",
        managerId: "164",
        name: "Zackary Lubowitz",
        title: "Investor Program Strategist",
        department: "Support",
      },
      {
        id: "180",
        managerId: "165",
        name: "Orie Conn",
        title: "Customer Mobility Officer",
        department: "Design",
      },
    ],
  },
  {
    id: "10",
    name: "Rice, Klocko and Windler",
    industry: "Software",
    people: [
      {
        id: "181",
        managerId: null,
        name: "Sergio Koss",
        title: "Chief Executive Officer",
        department: "Operations",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/61.jpg",
      },
      {
        id: "182",
        managerId: "181",
        name: "Rupert Farrell",
        title: "Head of Design",
        department: "Design",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/68.jpg",
      },
      {
        id: "183",
        managerId: "181",
        name: "Lorna Schimmel",
        title: "Head of Product",
        department: "Product",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/46.jpg",
      },
      {
        id: "184",
        managerId: "181",
        name: "Yasmeen Haley",
        title: "Head of Sales",
        department: "Sales",
      },
      {
        id: "185",
        managerId: "181",
        name: "Raina Rosenbaum",
        title: "Head of Product",
        department: "Product",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/68.jpg",
      },
      {
        id: "186",
        managerId: "183",
        name: "Cristian Johnson",
        title: "Direct Group Liaison",
        department: "Finance",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/37.jpg",
      },
      {
        id: "187",
        managerId: "184",
        name: "Anabelle Padberg-Leannon",
        title: "Human Optimization Analyst",
        department: "People",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/39.jpg",
      },
      {
        id: "188",
        managerId: "185",
        name: "Roosevelt Thompson-Williamson",
        title: "Corporate Research Officer",
        department: "Support",
      },
      {
        id: "189",
        managerId: "182",
        name: "Ollie Stokes",
        title: "Corporate Web Analyst",
        department: "Design",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/56.jpg",
      },
      {
        id: "190",
        managerId: "183",
        name: "Ottis Gulgowski-Robel",
        title: "Customer Data Representative",
        department: "Marketing",
      },
      {
        id: "191",
        managerId: "184",
        name: "Alexis Cronin",
        title: "Product Brand Officer",
        department: "Engineering",
      },
      {
        id: "192",
        managerId: "185",
        name: "Talon Fay",
        title: "International Intranet Representative",
        department: "Product",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/19.jpg",
      },
      {
        id: "193",
        managerId: "182",
        name: "Audra Cartwright",
        title: "National Paradigm Representative",
        department: "Marketing",
      },
      {
        id: "194",
        managerId: "183",
        name: "Audie Carroll",
        title: "Legacy Tactics Producer",
        department: "Marketing",
      },
      {
        id: "195",
        managerId: "184",
        name: "Allie Monahan",
        title: "Product Assurance Director",
        department: "Sales",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/18.jpg",
      },
      {
        id: "196",
        managerId: "185",
        name: "Jack Muller",
        title: "Corporate Factors Agent",
        department: "Support",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/50.jpg",
      },
      {
        id: "197",
        managerId: "182",
        name: "Shaina Quitzon",
        title: "Internal Functionality Analyst",
        department: "Engineering",
      },
      {
        id: "198",
        managerId: "183",
        name: "Scottie Olson",
        title: "Future Applications Planner",
        department: "Design",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/33.jpg",
      },
      {
        id: "199",
        managerId: "184",
        name: "Allan Parker",
        title: "Customer Usability Officer",
        department: "People",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/75.jpg",
      },
      {
        id: "200",
        managerId: "185",
        name: "Dulce Pfannerstill",
        title: "Chief Response Liaison",
        department: "Marketing",
      },
    ],
  },
  {
    id: "12",
    name: "Williamson - Nicolas",
    industry: "Real Estate",
    people: [
      {
        id: "221",
        managerId: null,
        name: "Marcel Wolff",
        title: "Chief Executive Officer",
        department: "Operations",
      },
      {
        id: "222",
        managerId: "221",
        name: "Vladimir Bernier",
        title: "Head of People",
        department: "People",
      },
      {
        id: "223",
        managerId: "221",
        name: "Loretta Marks",
        title: "Head of Product",
        department: "Product",
      },
      {
        id: "224",
        managerId: "221",
        name: "Peggy Fay",
        title: "Head of Product",
        department: "Product",
      },
      {
        id: "225",
        managerId: "221",
        name: "Derrick Bogan",
        title: "Head of Engineering",
        department: "Engineering",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/98.jpg",
      },
      {
        id: "226",
        managerId: "223",
        name: "Evan Franey",
        title: "Principal Branding Facilitator",
        department: "Support",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/37.jpg",
        badge: "On leave",
      },
      {
        id: "227",
        managerId: "224",
        name: "Matilde Bechtelar",
        title: "Product Mobility Associate",
        department: "Product",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/81.jpg",
      },
      {
        id: "228",
        managerId: "225",
        name: "Mateo Bradtke",
        title: "Corporate Configuration Director",
        department: "Sales",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/63.jpg",
      },
      {
        id: "229",
        managerId: "222",
        name: "Tristian Mertz",
        title: "Principal Response Liaison",
        department: "Sales",
      },
      {
        id: "230",
        managerId: "223",
        name: "Alexzander Collier",
        title: "Internal Usability Assistant",
        department: "People",
      },
      {
        id: "231",
        managerId: "224",
        name: "Sincere Dicki",
        title: "Investor Accounts Liaison",
        department: "Finance",
      },
      {
        id: "232",
        managerId: "225",
        name: "Nina Nicolas",
        title: "Chief Optimization Strategist",
        department: "Design",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/128/35.jpg",
      },
      {
        id: "233",
        managerId: "222",
        name: "Donna Glover",
        title: "Forward Accountability Producer",
        department: "Support",
      },
      {
        id: "234",
        managerId: "223",
        name: "Marisol Feest",
        title: "Legacy Integration Director",
        department: "Product",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/26.jpg",
        badge: "On leave",
      },
      {
        id: "235",
        managerId: "224",
        name: "Chesley Dickens",
        title: "Legacy Implementation Engineer",
        department: "People",
      },
      {
        id: "236",
        managerId: "225",
        name: "Jerald Considine",
        title: "Dynamic Security Developer",
        department: "Sales",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/30.jpg",
      },
      {
        id: "237",
        managerId: "222",
        name: "Shyanne Okuneva",
        title: "Global Integration Executive",
        department: "Support",
        badge: "On leave",
      },
      {
        id: "238",
        managerId: "223",
        name: "Trystan Becker",
        title: "Product Assurance Consultant",
        department: "Marketing",
      },
      {
        id: "239",
        managerId: "224",
        name: "Maryann Becker",
        title: "International Infrastructure Developer",
        department: "Support",
      },
      {
        id: "240",
        managerId: "225",
        name: "Violet Ortiz",
        title: "Product Integration Developer",
        department: "Legal",
        avatar:
          "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/64.jpg",
        badge: "On leave",
      },
    ],
  },
];

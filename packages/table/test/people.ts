// The rows every test of the data table uses.
export interface Person {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  age: number;
  team?: Person[];
}

const names = [
  "Cleo Park",
  "Ada Lovelace",
  "Bo Jensen",
  "Dana Scully",
  "Emeka Obi",
  "Fatima Zahra",
  "Goran Ilic",
  "Hana Sato",
  "Ivo Petrov",
  "Juno Reyes",
  "Kofi Mensah",
  "Lena Braun",
];
const roles = ["Admin", "Editor", "Viewer"] as const;

export const people: Person[] = names.map((name, index) => ({
  id: `p${index + 1}`,
  name,
  email: `${name.split(" ")[0]?.toLowerCase()}@example.com`,
  role: roles[index % 3] ?? "Viewer",
  age: 28 + ((index * 7) % 30),
}));

// Enough rows to need a window over them.
export const many = (count: number): Person[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `m${index + 1}`,
    name: `Person ${index + 1}`,
    email: `person${index + 1}@example.com`,
    role: roles[index % 3] ?? "Viewer",
    age: 20 + (index % 50),
  }));

export const tree: Person[] = [
  {
    ...(people[0] as Person),
    team: [
      people[1] as Person,
      { ...(people[2] as Person), team: [people[3] as Person] },
    ],
  },
  people[4] as Person,
];

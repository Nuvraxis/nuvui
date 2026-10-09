// The rows the data table examples share.
export interface Person {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  team: string;
  joined: string;
  seats: number;
}

const names = [
  "Ada Lovelace",
  "Bo Jensen",
  "Cleo Park",
  "Dana Scully",
  "Emeka Obi",
  "Fatima Zahra",
  "Goran Ilic",
  "Hana Sato",
  "Ivo Petrov",
  "Juno Reyes",
  "Kofi Mensah",
  "Lena Braun",
  "Mira Nair",
  "Noor Haddad",
  "Otto Lind",
  "Priya Patel",
  "Quinn Avery",
  "Rosa Diaz",
  "Sven Olsen",
  "Tariq Aziz",
  "Uma Rao",
  "Vera Novak",
  "Wen Li",
  "Yara Costa",
];
const roles = ["Admin", "Editor", "Viewer"] as const;
const teams = ["Design", "Engineering", "Finance", "Support"];

export const people: Person[] = names.map((name, index) => ({
  id: `person-${index + 1}`,
  name,
  email: `${name.split(" ")[0]?.toLowerCase()}@example.com`,
  role: roles[index % roles.length] ?? "Viewer",
  team: teams[index % teams.length] ?? "Support",
  joined: `202${index % 6}-${String((index % 12) + 1).padStart(2, "0")}-15`,
  seats: ((index * 7) % 19) + 1,
}));

/** Any number of rows, for the examples that need thousands. */
export function manyPeople(count: number): Person[] {
  return Array.from({ length: count }, (_, index) => {
    const person = people[index % people.length] as Person;
    return {
      ...person,
      id: `person-${index + 1}`,
      name: `${person.name} ${Math.floor(index / people.length) + 1}`,
    };
  });
}

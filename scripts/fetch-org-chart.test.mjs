// Run with `pnpm test:scripts`.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { toPerson } from "./fetch-org-chart.mjs";

// An employee as FakerJson sends them, with the fields the script reads.
const employee = {
  id: 7,
  companyId: 1,
  managerId: 3,
  firstName: "Audrey",
  lastName: "Jast",
  email: "audrey.jast46@torphy-llc.example.com",
  phone: "+14929702671",
  jobTitle: "Head of Operations",
  department: "Operations",
  employmentType: "full_time",
  salary: 186000,
  hireDate: "2015-12-14",
  status: "active",
  avatar:
    "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/94.jpg",
};

describe("toPerson", () => {
  test("ids are strings, and the photo is the 128 pixel one", () => {
    assert.deepEqual(toPerson(employee), {
      id: "7",
      managerId: "3",
      name: "Audrey Jast",
      title: "Head of Operations",
      department: "Operations",
      avatar:
        "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/94.jpg".replace(
          "/512/",
          "/128/",
        ),
    });
  });

  test("the top of the chart has no manager", () => {
    assert.equal(toPerson({ ...employee, managerId: null }).managerId, null);
  });

  test("someone on leave has a badge that says so", () => {
    assert.equal(
      toPerson({ ...employee, status: "on_leave" }).badge,
      "On leave",
    );
  });

  test("someone who has left is an open position, with no name or photo", () => {
    assert.deepEqual(toPerson({ ...employee, status: "terminated" }), {
      id: "7",
      managerId: "3",
      vacant: true,
      title: "Head of Operations",
      department: "Operations",
    });
  });

  test("a photo from anywhere else is left out", () => {
    const person = toPerson({
      ...employee,
      avatar: "https://avatars.githubusercontent.com/u/24219963",
    });
    assert.equal("avatar" in person, false);
  });

  test("salary and phone are never kept, and details only when asked for", () => {
    const plain = toPerson(employee);
    const detailed = toPerson(employee, { details: true });
    for (const person of [plain, detailed]) {
      assert.equal("salary" in person, false);
      assert.equal("phone" in person, false);
    }
    assert.equal("email" in plain, false);
    assert.equal(detailed.email, employee.email);
    assert.equal(detailed.hireDate, "2015-12-14");
    assert.equal(detailed.employmentType, "full_time");
  });

  test("an address outside example.com, or a field that isn't a short string, stops it", () => {
    assert.throws(() =>
      toPerson({ ...employee, email: "someone@mail.com" }, { details: true }),
    );
    assert.throws(() => toPerson({ ...employee, jobTitle: "" }));
    assert.throws(() => toPerson({ ...employee, lastName: 42 }));
  });
});

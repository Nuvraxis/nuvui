"use client";

import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";
import { DataTable, DataTableToolbar } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { UserPlus } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import "./team-members.scss";

// Made-up people. Nothing here is real data.

const roles = ["Admin", "Member", "Viewer"] as const;
type Role = (typeof roles)[number];

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role | "Owner";
  invited: boolean;
}

const team: Member[] = [
  {
    id: "ada",
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "Owner",
    invited: false,
  },
  {
    id: "grace",
    name: "Grace Hopper",
    email: "grace@example.com",
    role: "Admin",
    invited: false,
  },
  {
    id: "alan",
    name: "Alan Turing",
    email: "alan@example.com",
    role: "Member",
    invited: false,
  },
  {
    id: "katherine",
    name: "Katherine Johnson",
    email: "katherine@example.com",
    role: "Member",
    invited: false,
  },
  {
    id: "dorothy",
    name: "dorothy@example.com",
    email: "dorothy@example.com",
    role: "Viewer",
    invited: true,
  },
];

const helper = createColumnHelper<Member>();

export default function TeamMembers() {
  const [members, setMembers] = useState(team);
  const [inviting, setInviting] = useState(false);
  const [said, setSaid] = useState("");

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("name", {
          header: "Person",
          cell: ({ row }) => (
            <span className="team-members__person">
              <span className="team-members__name">{row.original.name}</span>
              {row.original.invited ? null : (
                <span className="team-members__email">
                  {row.original.email}
                </span>
              )}
            </span>
          ),
        }),
        helper.accessor("role", {
          header: "Role",
          enableSorting: false,
          cell: ({ row }) =>
            // There's one owner, and the role is given away, not changed.
            row.original.role === "Owner" ? (
              "Owner"
            ) : (
              <Select
                value={row.original.role}
                // Change the role on your server from here.
                onValueChange={(role) =>
                  setMembers((current) =>
                    current.map((member) =>
                      member.id === row.original.id
                        ? { ...member, role: role as Role }
                        : member,
                    ),
                  )
                }
              >
                <SelectTrigger
                  aria-label={`Role of ${row.original.name}`}
                  className="team-members__role"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
        }),
        helper.accessor("invited", {
          header: "Status",
          enableGlobalFilter: false,
          cell: ({ row }) =>
            row.original.invited ? (
              <span className="team-members__invited">
                <Badge intent="warning" variant="outline">
                  Invited
                </Badge>
                <Button
                  size="sm"
                  intent="ghost"
                  aria-label={`Cancel the invitation to ${row.original.email}`}
                  onClick={() => {
                    setMembers((current) =>
                      current.filter((member) => member.id !== row.original.id),
                    );
                    setSaid(
                      `The invitation to ${row.original.email} was cancelled.`,
                    );
                  }}
                >
                  Cancel
                </Button>
              </span>
            ) : (
              <Badge intent="success" variant="outline">
                Active
              </Badge>
            ),
        }),
      ]),
    [],
  );

  const table = useDataTable({
    columns,
    data: members,
    getRowId: (member) => member.id,
  });

  // Send the invitation from here.
  const invite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    setMembers((current) => [
      ...current,
      {
        id: email,
        name: email,
        email,
        role: (data.get("role") as Role | null) ?? "Member",
        invited: true,
      },
    ]);
    setSaid(`An invitation was sent to ${email}.`);
    setInviting(false);
  };

  return (
    <main className="team-members">
      <header className="team-members__head">
        <div className="team-members__about">
          <h1 className="team-members__title">Team</h1>
          <p className="team-members__text">
            Who can open this workspace, and what each of them can do.
          </p>
        </div>
        <Dialog open={inviting} onOpenChange={setInviting}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus aria-hidden="true" size={16} />
              Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite someone</DialogTitle>
              <DialogDescription>
                They get an email with a link that's good for seven days.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <form
                id="team-members-invite"
                className="team-members__form"
                onSubmit={invite}
              >
                <Field required>
                  <FieldLabel>Email</FieldLabel>
                  <FieldControl>
                    <Input type="email" name="email" autoComplete="off" />
                  </FieldControl>
                </Field>
                <Field>
                  <FieldLabel>Role</FieldLabel>
                  <Select name="role" defaultValue="Member">
                    <FieldControl>
                      <SelectTrigger className="team-members__role team-members__role--wide">
                        <SelectValue />
                      </SelectTrigger>
                    </FieldControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    A member can change what's in the workspace, and a viewer
                    can only read it.
                  </FieldDescription>
                </Field>
              </form>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button intent="secondary">Cancel</Button>
              </DialogClose>
              {/* Outside the form in the page, and so tied to it by id. */}
              <Button type="submit" form="team-members-invite">
                Send the invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>
      <DataTable
        table={table}
        aria-label="Team"
        rowHeader="name"
        pagination={false}
        toolbar={
          <DataTableToolbar>
            <table.Filter />
          </DataTableToolbar>
        }
      />
      {/* Always in the page, so that what's put in it is read out. */}
      <p className="team-members__status" role="status">
        {said}
      </p>
    </main>
  );
}

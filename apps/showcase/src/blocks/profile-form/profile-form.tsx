"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  type FileRejection,
  FileUpload,
  Input,
  Textarea,
} from "@nuvui/react";
import { type FormEvent, useEffect, useState } from "react";
import "./profile-form.scss";

const megabyte = 1024 * 1024;

const reasons = {
  type: "isn't a PNG or JPEG image",
  size: "is over 2 MB",
  count: "is one more than the one allowed",
};

export default function ProfileForm() {
  const [picture, setPicture] = useState<string>();
  const [rejected, setRejected] = useState<FileRejection[]>([]);
  const [saved, setSaved] = useState(false);

  // The address made for a chosen picture holds the file in memory until
  // it's let go.
  useEffect(() => {
    if (!picture) return;
    return () => URL.revokeObjectURL(picture);
  }, [picture]);

  // Save the profile from here.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <main className="profile-form">
      <header className="profile-form__head">
        <h1 className="profile-form__title">Profile</h1>
        <p className="profile-form__text">
          How you appear to the people you work with.
        </p>
      </header>
      <form
        className="profile-form__form"
        onSubmit={submit}
        onChange={() => setSaved(false)}
      >
        <div className="profile-form__picture">
          <Avatar size="lg" className="profile-form__avatar">
            {picture ? <AvatarImage src={picture} alt="" /> : null}
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <Field>
            <FieldLabel>Picture</FieldLabel>
            <FieldControl>
              <FileUpload
                name="picture"
                accept="image/png,image/jpeg"
                maxSize={2 * megabyte}
                onReject={setRejected}
                onFilesChange={(files) => {
                  setRejected([]);
                  setPicture(
                    files[0] ? URL.createObjectURL(files[0]) : undefined,
                  );
                }}
              >
                Drop a picture here, or choose one from your device
              </FileUpload>
            </FieldControl>
            <FieldDescription>PNG or JPEG, up to 2 MB.</FieldDescription>
            <FieldError>
              {rejected.length > 0
                ? rejected
                    .map(
                      ({ file, reason }) => `${file.name} ${reasons[reason]}.`,
                    )
                    .join(" ")
                : null}
            </FieldError>
          </Field>
        </div>
        <div className="profile-form__pair">
          <Field required>
            <FieldLabel>First name</FieldLabel>
            <FieldControl>
              <Input
                name="first-name"
                autoComplete="given-name"
                defaultValue="Ada"
              />
            </FieldControl>
          </Field>
          <Field required>
            <FieldLabel>Last name</FieldLabel>
            <FieldControl>
              <Input
                name="last-name"
                autoComplete="family-name"
                defaultValue="Lovelace"
              />
            </FieldControl>
          </Field>
        </div>
        <Field required>
          <FieldLabel>Email</FieldLabel>
          <FieldControl>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              defaultValue="ada@example.com"
            />
          </FieldControl>
          <FieldDescription>
            Changing it sends a link to the new address to confirm it.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Job title</FieldLabel>
          <FieldControl>
            <Input
              name="title"
              autoComplete="organization-title"
              defaultValue="Head of finance"
            />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel>About</FieldLabel>
          <FieldControl>
            <Textarea
              name="about"
              rows={4}
              maxLength={280}
              defaultValue="I look after invoices and the month's close."
            />
          </FieldControl>
          <FieldDescription>Up to 280 characters.</FieldDescription>
        </Field>
        <div className="profile-form__actions">
          <Button type="submit">Save changes</Button>
          <Button type="reset" intent="secondary">
            Reset
          </Button>
          {/* Always in the page, so that what's put in it is read out. */}
          <p className="profile-form__status" role="status">
            {saved ? "Saved." : null}
          </p>
        </div>
      </form>
    </main>
  );
}

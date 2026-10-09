"use client";

import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  type FileRejection,
  FileUpload,
} from "@nuvui/react";
import { useState } from "react";

const megabyte = 1024 * 1024;

const reasons = {
  type: "isn't a PNG or JPEG image",
  size: "is over 2 MB",
  count: "is one more than the three allowed",
};

export default function Example() {
  const [rejected, setRejected] = useState<FileRejection[]>([]);

  return (
    <Field style={{ inlineSize: "100%", maxInlineSize: 420 }}>
      <FieldLabel>Product photos</FieldLabel>
      <FieldControl>
        <FileUpload
          multiple
          accept="image/png,image/jpeg"
          maxSize={2 * megabyte}
          maxFiles={3}
          onReject={setRejected}
          // A change that goes through clears the last complaint.
          onFilesChange={() => setRejected([])}
        >
          Drop up to three photos here, or choose them from your device
        </FileUpload>
      </FieldControl>
      <FieldDescription>PNG or JPEG, up to 2 MB each.</FieldDescription>
      <FieldError>
        {rejected.length > 0
          ? rejected
              .map(({ file, reason }) => `${file.name} ${reasons[reason]}.`)
              .join(" ")
          : null}
      </FieldError>
    </Field>
  );
}

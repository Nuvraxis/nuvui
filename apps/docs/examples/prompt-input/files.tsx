"use client";

import {
  PromptInput,
  PromptInputAttach,
  PromptInputAttachments,
  type PromptInputFileRejection,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@nuvui/chat";
import { useState } from "react";

const megabyte = 1024 * 1024;

const reasons = {
  type: "isn't a picture or a PDF",
  size: "is over 5 MB",
  count: "is one more than three",
};

export default function Example() {
  const [sent, setSent] = useState("Nothing sent yet.");
  const [refused, setRefused] = useState("");

  function refuse(rejections: PromptInputFileRejection[]) {
    setRefused(
      rejections
        .map(({ file, reason }) => `${file.name} ${reasons[reason]}.`)
        .join(" "),
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <PromptInput
        accept="image/*,.pdf"
        maxFiles={3}
        maxFileSize={5 * megabyte}
        onFilesChange={() => setRefused("")}
        onFilesReject={refuse}
        onSubmit={(text, { files }) =>
          setSent(
            `Sent "${text}" with ${files.length === 1 ? "1 file" : `${files.length} files`}.`,
          )
        }
      >
        <PromptInputAttachments />
        <PromptInputTextarea
          aria-label="Message"
          placeholder="Ask about a file"
        />
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputAttach />
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
      <p role="alert" style={{ margin: 0, minBlockSize: "1.5em" }}>
        {refused}
      </p>
      <p role="status" style={{ margin: 0 }}>
        {sent}
      </p>
    </div>
  );
}

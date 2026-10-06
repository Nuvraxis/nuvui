"use client";

import { FileUpload } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, TextControl } from "./controls";

export function FileUploadPlayground() {
  const [multiple, setMultiple] = useState(true);
  const [showList, setShowList] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [prompt, setPrompt] = useState("Drop files here, or choose them");

  const props = [
    multiple && "multiple",
    !showList && "showList={false}",
    disabled && "disabled",
  ].filter(Boolean);
  const code = `<FileUpload aria-label="Attachments"${props.map((prop) => ` ${prop}`).join("")}>
  ${prompt}
</FileUpload>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="children" value={prompt} onChange={setPrompt} />
          <CheckboxControl
            label="multiple"
            checked={multiple}
            onChange={setMultiple}
          />
          <CheckboxControl
            label="showList"
            checked={showList}
            onChange={setShowList}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <div style={{ inlineSize: "100%", maxInlineSize: 420 }}>
        <FileUpload
          aria-label="Attachments"
          multiple={multiple}
          showList={showList}
          disabled={disabled}
        >
          {prompt}
        </FileUpload>
      </div>
    </Playground>
  );
}

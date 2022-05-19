import { Action, ActionPanel, environment, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { readdirSync, rmSync, writeFileSync } from "fs";
import { useState } from "react";
import Snippet from "../types/snippet";

export default (props: { snippet: Snippet; onUpdate: (val: Snippet) => void }) => {
  return (
    <Action.Push
      icon={Icon.Pencil}
      title="Edit Snippet"
      shortcut={{ modifiers: ["cmd"], key: "e" }}
      target={<EditFrom snippet={props.snippet} onUpdate={props.onUpdate} />}
    />
  );
};

function EditFrom(props: { snippet: Snippet; onUpdate: (val: Snippet) => void }) {
  const { pop } = useNavigation();
  const [snippet, setSnippet] = useState<Snippet>(props.snippet);

  async function submit(value: Snippet) {
    // if name changed
    if (props.snippet.name !== value.name) {
      // check duplicate
      const files = readdirSync(environment.supportPath);
      let duplicated = false;
      files.forEach((file) => {
        if (file === value.name) {
          duplicated = true;
          return;
        }
      });
      if (duplicated) {
        await showToast({ title: "Snippet Duplicated", style: Toast.Style.Failure });
        return;
      }
      // remove old file
      rmSync(`${environment.supportPath}/${props.snippet.name}`);
    }

    // write file
    writeFileSync(`${environment.supportPath}/${value.name}`, JSON.stringify(value));

    // handle event
    props.onUpdate(value);
    await showToast({ title: "Snippet updated" });
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Snippet" onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Name"
        value={snippet.name}
        onChange={(val: string) => {
          setSnippet((prev) => ({ ...prev, name: val }));
        }}
      />
      <Form.TextArea
        id="content"
        title="Snippet"
        value={snippet.content}
        onChange={(val: string) => {
          setSnippet((prev) => ({ ...prev, content: val }));
        }}
      />
      <Form.Checkbox
        id="hidden"
        label="Invisible"
        value={snippet.hidden}
        onChange={(val: boolean) => {
          setSnippet((prev) => ({ ...prev, hidden: val }));
        }}
      />
    </Form>
  );
}

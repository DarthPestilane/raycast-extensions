import { Action, ActionPanel, environment, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { readdirSync, writeFileSync } from "fs";
import Snippet from "../types/snippet";

export default (props: { onCreate: (val: Snippet) => void }) => {
  return (
    <Action.Push
      icon={Icon.Plus}
      title="Create New Snippet"
      shortcut={{ modifiers: ["cmd"], key: "n" }}
      target={<CreateFrom onCreate={props.onCreate} />}
    />
  );
};

function CreateFrom(props: { onCreate: (val: Snippet) => void }) {
  const { pop } = useNavigation();

  async function submit(value: Snippet) {
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

    // write file
    writeFileSync(`${environment.supportPath}/${value.name}`, JSON.stringify(value));

    // handle event
    props.onCreate(value);
    await showToast({ title: "Snippet created" });
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Snippet" onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Name" />
      <Form.TextArea id="content" title="Snippet" />
      <Form.Checkbox id="hidden" label="Invisible" />
    </Form>
  );
}

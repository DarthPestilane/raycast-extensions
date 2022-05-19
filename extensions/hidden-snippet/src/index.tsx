import { Action, ActionPanel, environment, Icon, List, trash } from "@raycast/api";
import { readdirSync, readFileSync } from "fs";
import { emptyDirSync } from "fs-extra";
import { useCallback, useState } from "react";
import CreateAction from "./components/CreateAction";
import EditAction from "./components/EditAction";
import Snippet from "./types/snippet";

const hiddenMark = "\\*\\*\\*\\*\\* (hidden)";

interface State {
  loading: boolean;
  selected: string;
  snippets: Snippet[];
}

function fetch(): Snippet[] {
  const files = readdirSync(environment.supportPath);
  const initSnippets: Snippet[] = [];
  files.forEach((file) => {
    try {
      const rawData = readFileSync(`${environment.supportPath}/${file}`, "utf-8");
      const obj = JSON.parse(rawData);
      initSnippets.push({ name: obj.name, content: obj.content, hidden: obj.hidden });
    } catch (err) {
      console.debug("fetch err:", err);
    }
  });
  return initSnippets;
}

export default () => {
  const [state, setState] = useState<State>({ loading: false, selected: "", snippets: fetch() });

  const onCreate = (val: Snippet) => {
    const newList = [...state.snippets, val];
    setState((prev) => ({ ...prev, snippets: newList }));
  };

  const onDelete = useCallback(
    async (idx: number) => {
      const snippet = state.snippets[idx];

      // remove file
      await trash(`${environment.supportPath}/${snippet.name}`);

      // update state
      const newList = [...state.snippets];
      newList.splice(idx, 1);
      setState((prev) => ({ ...prev, snippets: newList }));
    },
    [state.snippets, setState]
  );

  const onUpdate = useCallback(
    async (idx: number, val: Snippet) => {
      state.snippets[idx] = val;
      setState((prev) => ({ ...prev, snippets: state.snippets }));
    },
    [state.snippets, setState]
  );

  const onPurge = () => {
    // remove all files
    emptyDirSync(environment.supportPath);
    // reset state
    setState({ loading: false, selected: "", snippets: [] });
  };

  return (
    <List
      isShowingDetail={true}
      actions={
        <ActionPanel>
          <CreateAction onCreate={onCreate} />
        </ActionPanel>
      }
      searchBarPlaceholder="Filter by snippet name"
      isLoading={state.loading}
      selectedItemId={state.selected}
      onSelectionChange={(id?: string) => {
        setState((prev) => ({ ...prev, selected: id || "" }));
      }}
    >
      {state.snippets.map((snippet, idx) => {
        return (
          <List.Item
            id={`${idx}`}
            key={snippet.name}
            title={snippet.name}
            detail={<List.Item.Detail markdown={snippet.hidden ? hiddenMark : snippet.content} />}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action.Paste content={snippet.content} />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <EditAction snippet={snippet} onUpdate={(val) => onUpdate(idx, val)} />
                  <Action
                    title="Delete"
                    icon={Icon.Trash}
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={() => onDelete(idx)}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <CreateAction onCreate={onCreate} />
                  <Action title="Purge" icon={Icon.XmarkCircle} onAction={onPurge} />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
};

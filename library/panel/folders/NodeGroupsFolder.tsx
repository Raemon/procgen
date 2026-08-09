import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import type { NodeTemplate } from '../../../procgen/templates/nodeTemplate';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';

export function NodeGroupsFolder() {
  const { templates } = useAppRuntime();
  const saved = useSyncExternalStore(
    (listener) => templates.onChange(listener),
    () => templates.savedTemplates(),
  );
  const builtIn = templates.builtIn();
  const groups = [...builtIn, ...saved.filter((group) => !isNamedLike(builtIn, group))];
  return (
    <LibraryFolder folder="groups" label="node groups" tip={FOLDER_TIPS.groups} count={groups.length}>
      {groups.map((group) => (
        <LibraryRow
          key={group.name}
          folder="groups"
          entryKey={group.name}
          name={group.name}
          note={`${group.nodes.length}`}
          tip={{ title: group.name, body: summaryOf(group) }}
        />
      ))}
    </LibraryFolder>
  );
}

function isNamedLike(builtIn: readonly NodeTemplate[], group: NodeTemplate): boolean {
  return builtIn.some((each) => each.name === group.name);
}

function summaryOf(group: NodeTemplate): string {
  return `${group.nodes.map((node) => node.label).join(' → ')} — ${group.description}`;
}

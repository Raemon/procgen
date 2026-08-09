import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import type { NodeTemplate } from '../../../procgen/templates/nodeTemplate';
import { NodeGroupIcon } from '../icons/NodeGroupIcon';
import type { LibraryEntry } from './libraryEntry';

export function useNodeGroupEntries(): LibraryEntry[] {
  const { templates, perform } = useAppRuntime();
  const saved = useSyncExternalStore(
    (listener) => templates.onChange(listener),
    () => templates.savedTemplates(),
  );
  const builtIn = templates.builtIn();
  const groups = [...builtIn, ...saved.filter((group) => !isNamedLike(builtIn, group))];
  return groups.map((group) => ({
    key: group.name,
    name: group.name,
    icon: <NodeGroupIcon />,
    tip: { title: group.name, body: summaryOf(group) },
    duplicate: () => perform('duplicate_template', { name: group.name }),
    remove: isNamedLike(builtIn, group)
      ? undefined
      : () => perform('delete_template', { name: group.name }),
  }));
}

function isNamedLike(builtIn: readonly NodeTemplate[], group: NodeTemplate): boolean {
  return builtIn.some((each) => each.name === group.name);
}

function summaryOf(group: NodeTemplate): string {
  return `${group.nodes.map((node) => node.label).join(' → ')} — ${group.description}`;
}

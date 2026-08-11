import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import type { NodeTemplate } from '../../../procgen/templates/nodeTemplate';
import { NodeGroupIcon } from '../icons/NodeGroupIcon';
import type { LibraryEntry } from './libraryEntry';

export function useNodeGroupEntries(): LibraryEntry[] {
  const { templates, perform } = useAppRuntime();
  const groups = useSyncExternalStore(
    (listener) => templates.onChange(listener),
    () => templates.all(),
  );
  const saved = templates.savedTemplates();
  return groups.map((group) => ({
    key: group.name,
    name: group.name,
    icon: <NodeGroupIcon />,
    tip: { title: group.name, body: summaryOf(group) },
    duplicate: () => perform('duplicate_template', { name: group.name }),
    remove: saved.some((each) => each.name === group.name)
      ? () => perform('delete_template', { name: group.name })
      : undefined,
  }));
}

function summaryOf(group: NodeTemplate): string {
  return `${group.nodes.map((node) => node.label).join(' → ')} — ${group.description}`;
}

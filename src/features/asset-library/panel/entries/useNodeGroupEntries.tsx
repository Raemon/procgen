import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { NodeTemplate } from '@/features/asset-library/node-groups/nodeTemplate';
import { NodeGroupIcon } from '../icons/NodeGroupIcon';
import { useFollowRenamedRow } from './useFollowRenamedRow';
import type { LibraryEntry } from './libraryEntry';

export function useNodeGroupEntries(): LibraryEntry[] {
  const { templates, perform } = useAppRuntime();
  const followRenamed = useFollowRenamedRow('groups');
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
    rename: (name: string) => {
      if (perform('rename_template', { name: group.name, new_name: name }).ok) {
        followRenamed(group.name, name);
      }
    },
    duplicate: () => perform('duplicate_template', { name: group.name }),
    remove: saved.some((each) => each.name === group.name)
      ? () => perform('delete_template', { name: group.name })
      : undefined,
  }));
}

function summaryOf(group: NodeTemplate): string {
  return `${group.nodes.map((node) => node.label).join(' → ')} — ${group.description}`;
}

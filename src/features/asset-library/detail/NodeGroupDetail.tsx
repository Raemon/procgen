import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { PanelHint } from '@/features/app-shell/help/PanelHint';
import { classes } from '@/features/app-shell/controls/classes';
import { HINT_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { AddNodeMenu } from '@/features/asset-library/detail/worldSeeds/AddNodeMenu';
import {
  EditedPipelineProvider,
  useEditedPipeline,
  useRerenderOnEditedPipelineChange,
} from '@/features/asset-library/detail/worldSeeds/editing/editedPipelineContext';
import { NodeList } from '@/features/asset-library/detail/worldSeeds/NodeList';
import { scrollNodeCardIntoView } from '@/features/asset-library/detail/worldSeeds/scrollNodeCardIntoView';
import type { NodeTemplate } from '@/features/asset-library/node-groups/nodeTemplate';
import { NothingHere } from './NothingHere';
import { NodeGroupActionsRow } from './NodeGroupActionsRow';

export function NodeGroupDetail({ name }: { name: string }) {
  const { editing, templates } = useAppRuntime();
  const known = useSyncExternalStore(
    (listener) => templates.onChange(listener),
    () => templates.all(),
  );
  const group = known.find((each) => each.name === name);
  const pipeline = editing.group(name);
  if (!group || !pipeline) return <NothingHere what="node group" />;
  return (
    <EditedPipelineProvider pipeline={pipeline}>
      <NodeGroupEditor group={group} />
    </EditedPipelineProvider>
  );
}

function NodeGroupEditor({ group }: { group: NodeTemplate }) {
  const { store, perform } = useEditedPipeline();
  useRerenderOnEditedPipelineChange();

  function addNodeAndReveal(type: string): void {
    const added = perform('add_node', { type });
    const node = added.ok ? store.nodes().at(-1) : undefined;
    if (node) scrollNodeCardIntoView(node.id);
  }

  return (
    <>
      <h3 className="mb-1 text-sm text-ink">{group.name}</h3>
      <p className={classes(HINT_CLASSES, 'mb-2')}>{group.description}</p>
      <NodeGroupActionsRow name={group.name} />
      <NodeList />
      <AddNodeMenu onPick={addNodeAndReveal} />
      <PanelHint className="mt-2">
        A node group is a run of wired nodes kept for reuse, and it edits exactly like a world seed does —
        every knob you turn here is saved into the group, not into any world seed. Stamping copies these
        nodes into the running world under a folder band of their own; wires that pointed outside the
        group are left open for you to fill.
      </PanelHint>
    </>
  );
}

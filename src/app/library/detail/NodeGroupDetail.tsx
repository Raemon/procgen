import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { classes } from '../../../frontend/controls/classes';
import { HINT_CLASSES } from '../../../frontend/controls/fieldClasses';
import { AddNodeMenu } from '../../../procgen/panel/AddNodeMenu';
import {
  EditedPipelineProvider,
  useEditedPipeline,
  useRerenderOnEditedPipelineChange,
} from '../../../procgen/panel/editing/editedPipelineContext';
import { NodeList } from '../../../procgen/panel/NodeList';
import { scrollNodeCardIntoView } from '../../../procgen/panel/scrollNodeCardIntoView';
import type { NodeTemplate } from '../../../procgen/templates/nodeTemplate';
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
        A node group is a run of wired nodes kept for reuse, and it edits exactly like a world does —
        every knob you turn here is saved into the group, not into any world. Stamping copies these
        nodes into the running world under a folder band of their own; wires that pointed outside the
        group are left open for you to fill.
      </PanelHint>
    </>
  );
}

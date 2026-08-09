import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { Button } from '../../frontend/controls/Button';
import { classes } from '../../frontend/controls/classes';
import { HINT_CLASSES } from '../../frontend/controls/fieldClasses';
import { PanelHint } from '../../frontend/help/PanelHint';
import type { NodeTemplate } from '../../procgen/templates/nodeTemplate';
import { scrollNodeCardIntoView } from '../../procgen/panel/scrollNodeCardIntoView';
import { forgetGroupTip, stampGroupTip } from '../help/libraryTips';
import { WORLD_SELECTED } from '../librarySelection';
import { useLibrarySelection } from '../useLibrarySelection';
import { NothingHere } from './NothingHere';

export function NodeGroupDetail({ name }: { name: string }) {
  const { templates, store, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
  const saved = useSyncExternalStore(
    (listener) => templates.onChange(listener),
    () => templates.savedTemplates(),
  );
  const group = templates.byName(name);
  if (!group) return <NothingHere what="node group" />;

  function stampIntoTheWorld(): void {
    const before = store.nodes().map((node) => node.id);
    perform('stamp_template', { name });
    select(WORLD_SELECTED.folder, WORLD_SELECTED.key);
    const added = store.nodes().find((node) => !before.includes(node.id));
    if (added) scrollNodeCardIntoView(added.id);
  }

  return (
    <>
      <h3 className="mb-1 text-sm text-ink">{name}</h3>
      <p className={classes(HINT_CLASSES, 'mb-2')}>{group.description}</p>
      <NodeChain group={group} />
      <div className="mt-2 flex gap-1.5">
        <Button className="flex-1" tip={stampGroupTip(name)} onClick={stampIntoTheWorld}>
          stamp into this world
        </Button>
        {saved.some((each) => each.name === name) && (
          <Button
            className="hover:border-danger-edge hover:text-danger-ink"
            tip={forgetGroupTip(name)}
            onClick={() => perform('delete_template', { name })}
          >
            ✕
          </Button>
        )}
      </div>
      <PanelHint className="mt-2">
        Stamping inserts these nodes at the end of the world you are editing, wiring between them
        already made, filed under a folder band of its own. Wires that pointed outside the group are
        left open for you to fill.
      </PanelHint>
    </>
  );
}

function NodeChain({ group }: { group: NodeTemplate }) {
  return (
    <ol className="flex flex-col gap-1">
      {group.nodes.map((node) => (
        <li
          key={node.id}
          className="rounded border border-panel-edge bg-field px-1.5 py-1 text-xs text-ink"
        >
          <span>{node.label}</span>
          <span className="ml-1.5 text-[10px] text-ink-dim">{node.type}</span>
        </li>
      ))}
    </ol>
  );
}

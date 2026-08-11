import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { useEditedPipeline } from './editing/editedPipelineContext';
import { nodeTypeOf } from '@/features/asset-library/worlds/nodeRegistry';
import { outputKindOf } from '@/features/asset-library/worlds/nodeType';
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { classes } from '@/features/app-shell/controls/classes';
import { ROW_HOVER_GROUP } from '@/features/app-shell/controls/revealOnRowHover';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiSet } from '@/features/app-shell/state/usePersistedUiSet';
import { DisplaySection } from './DisplaySection';
import { NodeCardHeader } from './NodeCardHeader';
import { NodeNotesRows } from './NodeNotesRows';
import { DROP_INDEX_ATTRIBUTE } from './nodeInsertionIndex';
import { ErrorNote, NodeError } from './NodeError';
import { ParamRow } from './ParamRow';
import { highlightedWireSource, subscribeToWireHighlight } from './wireHighlight';
import { WiringRow } from './WiringRow';

export type DropMarker = 'before' | 'after' | null;

export function NodeCard({
  node,
  index,
  dropMarker,
}: {
  node: NodeInstance;
  index: number;
  dropMarker: DropMarker;
}) {
  const { perform } = useEditedPipeline();
  const { tileAssets } = useAppRuntime();
  const collapsedCards = usePersistedUiSet(PERSISTED_UI_KEYS.collapsedNodeCards);
  const collapsed = collapsedCards.has(node.id);
  const def = nodeTypeOf(node.type);
  const highlighted = useSyncExternalStore(
    subscribeToWireHighlight,
    highlightedWireSource,
    highlightedWireSource,
  );

  return (
    <section
      data-node-id={node.id}
      {...{ [DROP_INDEX_ATTRIBUTE]: index }}
      className={classes(
        ROW_HOVER_GROUP,
        'rounded-md border bg-field',
        collapsed ? 'w-fit p-1' : 'p-2',
        highlighted === node.id ? 'border-accent' : 'border-panel-edge',
        !node.enabled && 'opacity-45',
        dropMarkerClasses(dropMarker),
      )}
    >
      {!def ? (
        <ErrorNote message={`unknown node type: ${node.type}`} />
      ) : (
        <>
          <NodeCardHeader
            node={node}
            typeTitle={def.title}
            collapsed={collapsed}
            onToggleCollapsed={() => collapsedCards.toggle(node.id)}
          />
          <NodeError nodeId={node.id} />
          {!collapsed && (
            <>
              <NodeNotesRows node={node} />
              {Object.entries(def.inputs).map(([name, spec]) => (
                <WiringRow key={name} node={node} inputName={name} spec={spec} />
              ))}
              {Object.entries(def.params).map(([name, spec]) => (
                <ParamRow
                  key={name}
                  spec={spec}
                  tileAssets={tileAssets}
                  value={node.params[name]!}
                  onChange={(value) => perform('set_param', { node_id: node.id, param: name, value })}
                />
              ))}
              <DisplaySection node={node} kind={outputKindOf(def, node.params)} />
            </>
          )}
        </>
      )}
    </section>
  );
}

function dropMarkerClasses(dropMarker: DropMarker): string | false {
  if (dropMarker === 'before') return 'shadow-[0_-6px_0_-2px_var(--color-accent)]';
  return dropMarker === 'after' && 'shadow-[0_6px_0_-2px_var(--color-accent)]';
}

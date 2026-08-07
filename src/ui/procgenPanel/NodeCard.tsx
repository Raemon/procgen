import { useState, useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { nodeTypeOf } from '../../procgen/nodeRegistry';
import { outputKindOf } from '../../procgen/nodeType';
import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import { classes } from '../controls/classes';
import { DisplaySection } from './DisplaySection';
import { NodeCardHeader } from './NodeCardHeader';
import { NodeCommentRow } from './NodeCommentRow';
import { NodeFolderRow } from './NodeFolderRow';
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
  const { perform, tileset } = useAppRuntime();
  const [collapsed, setCollapsed] = useState(false);
  const def = nodeTypeOf(node.type);
  const highlighted = useSyncExternalStore(subscribeToWireHighlight, highlightedWireSource);

  return (
    <section
      data-node-id={node.id}
      {...{ [DROP_INDEX_ATTRIBUTE]: index }}
      className={classes(
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
            onToggleCollapsed={() => setCollapsed(!collapsed)}
          />
          <NodeError nodeId={node.id} />
          {!collapsed && (
            <>
              <NodeCommentRow node={node} />
              <NodeFolderRow node={node} />
              {Object.entries(def.inputs).map(([name, spec]) => (
                <WiringRow key={name} node={node} inputName={name} spec={spec} />
              ))}
              {Object.entries(def.params).map(([name, spec]) => (
                <ParamRow
                  key={name}
                  spec={spec}
                  tileset={tileset}
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

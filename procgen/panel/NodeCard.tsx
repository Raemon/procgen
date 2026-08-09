import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { nodeTypeOf } from '../nodeRegistry';
import { outputKindOf } from '../nodeType';
import type { NodeInstance } from '../pipeline/pipelineState';
import { classes } from '../../frontend/controls/classes';
import { ROW_HOVER_GROUP } from '../../frontend/controls/revealOnRowHover';
import { DisplaySection } from './DisplaySection';
import { NodeCardHeader } from './NodeCardHeader';
import { NodeNotesRows } from './NodeNotesRows';
import { ErrorNote, NodeError } from './NodeError';
import { ParamRow } from './ParamRow';
import { WiringRow } from './WiringRow';

export function NodeCard({ node }: { node: NodeInstance }) {
  const { perform, tileAssets } = useAppRuntime();
  const def = nodeTypeOf(node.type);
  if (!def) return <ErrorNote message={`unknown node type: ${node.type}`} />;
  return (
    <section
      className={classes(
        ROW_HOVER_GROUP,
        'rounded-md border border-panel-edge bg-field p-2',
        !node.enabled && 'opacity-45',
      )}
    >
      <NodeCardHeader node={node} typeTitle={def.title} />
      <NodeError nodeId={node.id} />
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
    </section>
  );
}

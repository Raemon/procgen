import { useState } from 'react';
import { nodeTypesByCategory } from '../../../procgen/nodeRegistry';
import type { NodeTypeDef } from '../../../procgen/nodeType';
import { Button } from '../../../ui/controls/Button';
import { tooltipHandlers } from '../../../ui/tooltips/tooltipHandlers';
import { nodeTypeTooltip } from './nodeTypeTooltip';

export function AddNodeMenu({ onPick }: { onPick(type: string): void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button className="w-full" onClick={() => setOpen(!open)}>
        + add node
      </Button>
      {open && <NodeTypeList onPick={onPick} />}
    </div>
  );
}

function NodeTypeList({ onPick }: { onPick(type: string): void }) {
  return (
    <div className="mt-1.5 rounded-md border border-panel-edge bg-field p-1.5">
      {[...nodeTypesByCategory()].map(([category, defs]) => (
        <div key={category}>
          <div className="mx-1 mt-1.5 mb-[3px] text-[10px] tracking-[0.1em] uppercase text-ink-dim">
            {category}
          </div>
          {defs.map((def) => (
            <NodeTypeItem key={def.type} def={def} onPick={onPick} />
          ))}
        </div>
      ))}
    </div>
  );
}

function NodeTypeItem({ def, onPick }: { def: NodeTypeDef; onPick(type: string): void }) {
  return (
    <button
      type="button"
      className="block w-full cursor-pointer rounded border-none bg-transparent px-2 py-[5px] text-left text-xs text-ink hover:bg-procgen"
      onClick={() => onPick(def.type)}
      {...tooltipHandlers(nodeTypeTooltip(def))}
    >
      {def.title}
    </button>
  );
}

import { useState, type KeyboardEvent } from 'react';
import type { NodeTypeDef } from '@/features/asset-library/worlds/nodeType';
import { Button } from '@/features/app-shell/controls/Button';
import { classes } from '@/features/app-shell/controls/classes';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { nodeTypeTooltip } from './help/nodeTypeTooltip';
import { ADD_NODE_TIP, NODE_TYPE_FILTER_TIP } from './help/pipelineTips';
import { firstNodeTypeIn, nodeTypesMatching } from './nodeTypeSearch';

export function AddNodeMenu({ onPick }: { onPick(type: string): void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  function close(): void {
    setOpen(false);
    setQuery('');
  }

  function pickAndClose(type: string): void {
    onPick(type);
    close();
  }

  return (
    <div>
      <Button className="w-full" tip={ADD_NODE_TIP} onClick={() => (open ? close() : setOpen(true))}>
        + add node
      </Button>
      {open && (
        <NodeTypeList query={query} onQuery={setQuery} onPick={pickAndClose} onClose={close} />
      )}
    </div>
  );
}

function NodeTypeList({
  query,
  onQuery,
  onPick,
  onClose,
}: {
  query: string;
  onQuery(query: string): void;
  onPick(type: string): void;
  onClose(): void;
}) {
  const matches = nodeTypesMatching(query);
  return (
    <div className="mt-1.5 rounded-md border border-panel-edge bg-field p-1.5">
      <input
        autoFocus
        type="text"
        placeholder="filter: noise, points, tiles…"
        aria-label="filter node types"
        className={classes(FIELD_CLASSES, 'mb-1.5 w-full')}
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        onKeyDown={(event) => steerFromFilter(event, matches, onPick, onClose)}
        {...tooltipHandlers(NODE_TYPE_FILTER_TIP)}
      />
      {[...matches].map(([category, defs]) => (
        <div key={category}>
          <div className="mx-1 mt-1.5 mb-[3px] text-[10px] tracking-[0.1em] uppercase text-ink-dim">
            {category}
          </div>
          {defs.map((def) => (
            <NodeTypeItem key={def.type} def={def} onPick={onPick} />
          ))}
        </div>
      ))}
      {matches.size === 0 && (
        <p className="px-2 py-1 text-[11px] text-ink-dim italic">nothing matches “{query}”</p>
      )}
    </div>
  );
}

function steerFromFilter(
  event: KeyboardEvent<HTMLInputElement>,
  matches: Map<string, NodeTypeDef[]>,
  onPick: (type: string) => void,
  onClose: () => void,
): void {
  if (event.key === 'Escape') return onClose();
  if (event.key !== 'Enter') return;
  const first = firstNodeTypeIn(matches);
  if (first) onPick(first.type);
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

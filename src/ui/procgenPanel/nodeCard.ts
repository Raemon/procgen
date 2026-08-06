import { nodeTypeOf } from '../../procgen/nodeRegistry';
import { outputKindOf } from '../../procgen/nodeType';
import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import { isNodeCollapsed } from './collapsedNodeIds';
import { displaySection } from './displaySection';
import { nodeCardHeader } from './nodeCardHeader';
import { nodeCommentRow } from './nodeCommentRow';
import type { PanelDeps } from './panelDeps';
import { paramRow } from './paramRows';
import { wiringRow } from './wiringSection';

export function nodeCard(deps: PanelDeps, node: NodeInstance): HTMLElement {
  const def = nodeTypeOf(node.type);
  const card = document.createElement('section');
  card.className = 'node-card';
  card.dataset.nodeId = node.id;
  if (!node.enabled) card.classList.add('node-disabled');
  if (isNodeCollapsed(node.id)) card.classList.add('node-collapsed');
  if (!def) {
    card.append(unknownTypeNote(node.type));
    return card;
  }
  card.append(
    nodeCardHeader(deps.store, node, def.title),
    nodeCommentRow(deps.store, node),
    errorNote(node.id),
    ...wiringRows(deps, node),
    ...paramRowsFor(deps, node),
    displaySection(deps.store, deps.tileset, node, outputKindOf(def, node.params)),
  );
  return card;
}

export function refreshCardError(card: HTMLElement, message: string | null): void {
  const note = card.querySelector('.node-error');
  if (!note) return;
  note.textContent = message ?? '';
  note.classList.toggle('hidden', message === null);
}

function errorNote(nodeId: string): HTMLElement {
  const note = document.createElement('div');
  note.className = 'node-error hidden';
  note.dataset.nodeId = nodeId;
  return note;
}

function wiringRows(deps: PanelDeps, node: NodeInstance): HTMLElement[] {
  const def = nodeTypeOf(node.type);
  if (!def) return [];
  return Object.entries(def.inputs).map(([name, spec]) =>
    wiringRow(deps.store, node, name, spec),
  );
}

function paramRowsFor(deps: PanelDeps, node: NodeInstance): HTMLElement[] {
  const def = nodeTypeOf(node.type);
  if (!def) return [];
  return Object.entries(def.params).map(([name, spec]) =>
    paramRow(spec, {
      tileset: deps.tileset,
      value: node.params[name]!,
      onChange: (value) => deps.store.setParam(node.id, name, value),
    }),
  );
}

function unknownTypeNote(type: string): HTMLElement {
  const note = document.createElement('div');
  note.className = 'node-error';
  note.textContent = `unknown node type: ${type}`;
  return note;
}

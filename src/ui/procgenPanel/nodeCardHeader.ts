import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { isNodeCollapsed, toggleNodeCollapsed } from './collapsedNodeIds';
import { nodeDragHandle } from './nodeDragReorder';

export function nodeCardHeader(
  store: PipelineStore,
  node: NodeInstance,
  typeTitle: string,
): HTMLElement {
  const header = document.createElement('div');
  header.className = 'node-header';
  header.append(
    nodeDragHandle(),
    collapseToggle(node),
    enabledToggle(store, node),
    labelInput(store, node),
    typeTag(typeTitle),
    duplicateButton(store, node),
    deleteButton(store, node),
  );
  return header;
}

function collapseToggle(node: NodeInstance): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'node-collapse-toggle';
  button.textContent = isNodeCollapsed(node.id) ? '▸' : '▾';
  button.title = 'collapse / expand';
  button.addEventListener('click', () => {
    const collapsed = toggleNodeCollapsed(node.id);
    button.textContent = collapsed ? '▸' : '▾';
    button.closest('.node-card')?.classList.toggle('node-collapsed', collapsed);
  });
  return button;
}

function enabledToggle(store: PipelineStore, node: NodeInstance): HTMLElement {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.title = 'enabled';
  checkbox.checked = node.enabled;
  checkbox.addEventListener('change', () => store.setEnabled(node.id, checkbox.checked));
  return checkbox;
}

function labelInput(store: PipelineStore, node: NodeInstance): HTMLElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'node-label';
  input.value = node.label;
  input.addEventListener('change', () => {
    if (input.value.trim()) store.setLabel(node.id, input.value.trim());
  });
  return input;
}

function typeTag(typeTitle: string): HTMLElement {
  const tag = document.createElement('span');
  tag.className = 'node-type-tag';
  tag.textContent = typeTitle;
  return tag;
}

function duplicateButton(store: PipelineStore, node: NodeInstance): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn node-btn';
  button.textContent = '⧉';
  button.title = 'duplicate node';
  button.addEventListener('click', () => store.duplicateNode(node.id));
  return button;
}

function deleteButton(store: PipelineStore, node: NodeInstance): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn node-btn node-delete';
  button.textContent = '✕';
  button.title = 'delete node';
  button.addEventListener('click', () => store.removeNode(node.id));
  return button;
}

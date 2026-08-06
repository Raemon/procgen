import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';

export function nodeCardHeader(
  store: PipelineStore,
  node: NodeInstance,
  typeTitle: string,
): HTMLElement {
  const header = document.createElement('div');
  header.className = 'node-header';
  header.append(
    enabledToggle(store, node),
    labelInput(store, node),
    typeTag(typeTitle),
    moveButton(store, node, -1, '↑'),
    moveButton(store, node, 1, '↓'),
    deleteButton(store, node),
  );
  return header;
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

function moveButton(
  store: PipelineStore,
  node: NodeInstance,
  delta: -1 | 1,
  arrow: string,
): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn node-btn';
  button.textContent = arrow;
  button.title = delta < 0 ? 'move up' : 'move down';
  button.addEventListener('click', () => store.moveNode(node.id, delta));
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

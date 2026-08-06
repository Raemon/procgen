import { nodeTypesByCategory } from '../../procgen/nodeRegistry';
import type { NodeTypeDef } from '../../procgen/nodeType';
import { attachTooltip } from '../tooltips/floatingTooltip';
import { nodeTypeTooltip } from './help/nodeTypeTooltip';

export function addNodeMenu(onPick: (type: string) => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'add-node';
  const menu = menuElement(onPick);
  wrap.append(toggleButton(menu), menu);
  return wrap;
}

function toggleButton(menu: HTMLElement): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn add-node-btn';
  button.textContent = '+ add node';
  button.addEventListener('click', () => menu.classList.toggle('hidden'));
  return button;
}

function menuElement(onPick: (type: string) => void): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'add-node-menu hidden';
  for (const [category, defs] of nodeTypesByCategory()) {
    menu.appendChild(categoryHeader(category));
    for (const def of defs) menu.appendChild(menuItem(def, onPick));
  }
  return menu;
}

function categoryHeader(category: string): HTMLElement {
  const header = document.createElement('div');
  header.className = 'add-node-category';
  header.textContent = category;
  return header;
}

function menuItem(def: NodeTypeDef, onPick: (type: string) => void): HTMLElement {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'add-node-item';
  item.textContent = def.title;
  attachTooltip(item, nodeTypeTooltip(def));
  item.addEventListener('click', () => onPick(def.type));
  return item;
}

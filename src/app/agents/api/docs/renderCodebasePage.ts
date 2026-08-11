import '../../abilities/index';
import '../../procgen/nodes/index';
import { allAbilities } from '../../abilities/abilityRegistry';
import { allNodeTypes } from '../../procgen/nodeRegistry';
import { everyRegisteredRoute } from '../agent/everyRoute';
import { folderMap, TOP_LEVEL_FOLDERS, type FolderEntry } from './folderMap';
import { PAGE_STYLE } from './pageStyle';

export function renderCodebasePage(): string {
  return [
    '<!doctype html><html lang="en"><head><meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<title>procgen — how the codebase is put together</title>',
    `<style>${PAGE_STYLE}</style></head><body>`,
    '<h1>procgen</h1>',
    '<p class="lede">Every word below is read out of the code at request time — the folder tree, the exported names, and the ability, route and node-type registries. Nothing here is written twice, and nothing here is prose someone remembered to update.</p>',
    section('The eleven folders', topLevelTable()),
    section('Abilities', abilitiesTable()),
    section('Endpoints', routesTable()),
    section('Node types', nodeTypesTable()),
    section('Every folder, and what it exports', folderList()),
    '</body></html>',
  ].join('\n');
}

function section(heading: string, body: string): string {
  return `<section><h2>${escapeHtml(heading)}</h2>${body}</section>`;
}

function topLevelTable(): string {
  const rows = TOP_LEVEL_FOLDERS.map(
    (folder) => `<tr><td><code>${folder.name}/</code></td><td>${escapeHtml(folder.role)}</td></tr>`,
  );
  return table(['folder', 'what lives here'], rows);
}

function abilitiesTable(): string {
  const rows = allAbilities().map(
    (spec) =>
      `<tr><td><code>${spec.action}</code></td><td>${spec.mode}</td><td>${spec.group}</td><td>${escapeHtml(spec.description)}</td><td>${escapeHtml(spec.humanControl)}</td></tr>`,
  );
  return table(['action', 'mode', 'group', 'what it does', 'the human control'], rows);
}

function routesTable(): string {
  const rows = everyRegisteredRoute().map(
    (route) =>
      `<tr><td><code>${route.method} /api/v1${escapeHtml(route.path)}</code></td><td>${escapeHtml(route.summary)}</td></tr>`,
  );
  return table(['method and path', 'what it does'], rows);
}

function nodeTypesTable(): string {
  const rows = allNodeTypes().map(
    (def) =>
      `<tr><td><code>${escapeHtml(def.type)}</code></td><td>${def.category}</td><td>${typeof def.output === 'function' ? 'depends on params' : def.output}</td><td>${escapeHtml(def.whenToUse)}</td></tr>`,
  );
  return table(['type', 'category', 'output', 'when to use'], rows);
}

function folderList(): string {
  return TOP_LEVEL_FOLDERS.map((folder) => folderBlock(folderMap(folder.name))).join('');
}

function folderBlock(folders: readonly FolderEntry[]): string {
  const first = folders[0];
  if (!first) return '';
  const body = folders
    .map(
      (folder) =>
        `<div class="folder"><h4><code>${escapeHtml(folder.path)}/</code></h4>${filesTable(folder)}</div>`,
    )
    .join('');
  return `<details><summary><code>${escapeHtml(first.path)}/</code> <span class="count">${folders.length} folders</span></summary>${body}</details>`;
}

function filesTable(folder: FolderEntry): string {
  const rows = folder.files.map(
    (file) =>
      `<tr><td><code>${escapeHtml(file.name)}</code></td><td>${file.exports
        .map((name) => `<code class="sym">${escapeHtml(name)}</code>`)
        .join(' ')}</td></tr>`,
  );
  return table(['file', 'exports'], rows);
}

function table(headings: readonly string[], rows: readonly string[]): string {
  return `<div class="scroll"><table><thead><tr>${headings
    .map((heading) => `<th>${escapeHtml(heading)}</th>`)
    .join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
